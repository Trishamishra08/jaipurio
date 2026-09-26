const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const { sendNotificationToUser } = require('../utils/pushNotificationHelper');
const { computeOrderQuote } = require('../utils/pricing');
const { nextOrderNumber, serializeOrder } = require('../utils/marketplace');
const { canAccessOrder } = require('./orderFlowController');
const { logTransaction } = require('./paymentTransactionController');
const PaymentMethod = require('../models/paymentMethodModel');
const { decryptConfig } = require('./paymentMethodController');
const { getGateway } = require('../services/paymentGateways');

const getEnabledMethodConfig = async (code) => {
  const method = await PaymentMethod.findOne({ code, isEnabled: true, status: 'Published' });
  if (!method) return null;
  return decryptConfig(method);
};

const quoteItemsPayload = (items = []) => items.map((item) => ({
  product: item.product || item._id,
  quantity: item.quantity || item.qty || 1,
  size: item.size || item.selectedSize || null,
  image: item.image
}));

const savePricedOrder = async ({ userId, quote, shippingAddress, paymentMethod, paymentResult, isPaid }) => {
  const orderItems = quote.items.map((item) => ({
    product: item.product,
    name: item.name,
    qty: item.quantity,
    price: item.price,
    lineTotal: item.lineTotal,
    image: item.image || '',
    vendor: item.vendor,
    admin: item.admin,
    status: 'Processing'
  }));

  const order = await Order.create({
    user: userId || undefined,
    guest: !userId,
    customerName: shippingAddress?.name || shippingAddress?.fullName || '',
    customerPhone: shippingAddress?.phone || '',
    customerEmail: shippingAddress?.email || '',
    orderNumber: await nextOrderNumber(Order),
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    itemsPrice: quote.subtotal,
    taxPrice: quote.taxAmount,
    shippingPrice: quote.shippingAmount,
    totalPrice: quote.total,
    couponCode: quote.coupon?.code || '',
    discountAmount: quote.discountAmount || 0,
    taxRate: quote.taxRate || 0,
    isPaid: Boolean(isPaid),
    paidAt: isPaid ? Date.now() : undefined,
    paymentStatus: isPaid ? 'Paid' : 'Unpaid',
    orderStatus: isPaid ? 'Payment Confirmed' : 'Order Placed',
    paidAmount: isPaid ? quote.total : 0,
    shipment: { status: 'Not created' },
  });

  if (quote.coupon?.code) {
    await Coupon.updateOne({ code: quote.coupon.code }, { $inc: { usedCount: 1 } });
  }

  logTransaction({
    order: order._id,
    orderNumber: order.orderNumber,
    gateway: paymentMethod === 'Online' ? 'razorpay' : paymentMethod === 'COD' ? 'cod' : 'other',
    gatewayPaymentId: paymentResult?.id || '',
    amount: quote.total,
    status: isPaid ? 'success' : 'initiated',
  }).catch(() => {});

  return order;
};

const quoteOrder = async (req, res) => {
  try {
    const quote = await computeOrderQuote({
      items: quoteItemsPayload(req.body.items),
      couponCode: req.body.couponCode,
      paymentMethod: req.body.paymentMethod
    });
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if ((paymentMethod || 'COD') === 'COD') {
      const codConfig = await getEnabledMethodConfig('cod');
      if (codConfig === null) {
        return res.status(400).json({ success: false, message: 'Cash on delivery is currently unavailable.' });
      }
    }

    const quote = await computeOrderQuote({
      items: quoteItemsPayload(items),
      couponCode,
      paymentMethod: paymentMethod || 'COD'
    });

    const createdOrder = await savePricedOrder({
      userId: req.user._id,
      quote,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      isPaid: false
    });

    // Trigger push notifications
    try {
      await sendNotificationToUser(
        createdOrder.user,
        'user',
        {
          title: 'Order Placed Successfully',
          body: `Thank you! Your order #${createdOrder._id} of ₹${createdOrder.totalPrice} has been placed and is being processed.`
        },
        'success'
      );

      const uniqueVendors = [...new Set(createdOrder.orderItems.map(item => item.vendor?.toString()).filter(Boolean))];
      for (const vendorId of uniqueVendors) {
        await sendNotificationToUser(
          vendorId,
          'vendor',
          {
            title: 'New Order Received',
            body: `You received a new order #${createdOrder._id}. Please review and prepare the items for delivery.`
          },
          'success'
        );
      }
    } catch (notifErr) {
      console.error('FCM: Error sending order creation notifications:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: {
        order: {
          orderId: createdOrder._id,
          ...createdOrder._doc
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/orders/razorpay/create
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const quote = await computeOrderQuote({
      items: quoteItemsPayload(req.body.items || []),
      couponCode: req.body.couponCode,
      paymentMethod: 'paynow'
    });

    const config = await getEnabledMethodConfig('razorpay');
    if (config === null) {
      return res.status(400).json({ success: false, message: 'Online payment is currently unavailable.' });
    }
    const gateway = getGateway('razorpay');
    const { mock, order, keyId } = await gateway.createOrder(config, {
      amount: quote.total,
      receipt: 'receipt_order_' + Date.now(),
    });

    if (mock) console.warn('Razorpay not configured. Returning mock order id.');
    res.status(200).json({ success: true, data: { order, quote, keyId } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment and Save Order
// @route   POST /api/orders/razorpay/verify
// @access  Private
const verifyRazorpayOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;

    const config = await getEnabledMethodConfig('razorpay');
    if (config === null) {
      return res.status(400).json({ success: false, message: 'Online payment is currently unavailable.' });
    }
    const gateway = getGateway('razorpay');
    if (!gateway.verifySignature(config, { razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      logTransaction({
        gateway: 'razorpay',
        gatewayOrderId: razorpay_order_id || '',
        gatewayPaymentId: razorpay_payment_id || '',
        status: 'failed',
        errorMessage: 'Signature verification failed',
      }).catch(() => {});
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }

    const { items, shippingAddress, couponCode } = orderDetails || {};
    const quote = await computeOrderQuote({
      items: quoteItemsPayload(items || []),
      couponCode,
      paymentMethod: 'paynow'
    });

    const createdOrder = await savePricedOrder({
      userId: req.user._id,
      quote,
      shippingAddress,
      paymentMethod: 'Online',
      paymentResult: {
        id: razorpay_payment_id,
        status: 'completed',
        update_time: new Date().toISOString()
      },
      isPaid: true
    });

    // Trigger push notifications
    try {
      await sendNotificationToUser(
        createdOrder.user,
        'user',
        {
          title: 'Order Paid & Placed Successfully',
          body: `Thank you! Your payment of ₹${createdOrder.totalPrice} is verified and Order #${createdOrder._id} has been placed.`
        },
        'success'
      );

      const uniqueVendors = [...new Set(createdOrder.orderItems.map(item => item.vendor?.toString()).filter(Boolean))];
      for (const vendorId of uniqueVendors) {
        await sendNotificationToUser(
          vendorId,
          'vendor',
          {
            title: 'New Order Received',
            body: `You received a new paid order #${createdOrder._id}. Please review and prepare the items for delivery.`
          },
          'success'
        );
      }
    } catch (notifErr) {
      console.error('FCM: Error sending Razorpay order notifications:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        order: {
          orderId: createdOrder._id,
          ...createdOrder._doc
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      if (!canAccessOrder(req, order)) {
        return res.status(401).json({ success: false, message: 'Not authorized to view this order' });
      }
      return res.status(200).json({ success: true, data: serializeOrder(order) });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders containing items from the logged-in vendor
// @route   GET /api/orders/vendor
// @access  Private (Vendor)
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Find orders that have at least one item belonging to this vendor
    const orders = await Order.find({ 'orderItems.vendor': vendorId })
      .populate('user', 'name email')
      .sort('-createdAt')
      .lean(); // Use lean to easily modify the items array

    // Filter the items array in each order so the vendor ONLY sees their own products
    const filteredOrders = orders.map(order => {
      order.orderItems = order.orderItems
        .filter((item) => item.vendor && item.vendor.toString() === vendorId.toString())
        .map((item) => ({
          ...item,
          lineTotal: item.lineTotal != null ? item.lineTotal : item.price * item.qty
        }));
      order.vendorAmount = order.orderItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
      return order;
    });

    res.status(200).json({
      success: true,
      data: filteredOrders.map((order) => ({
        ...serializeOrder(order),
        orderItems: order.orderItems,
        vendorAmount: order.vendorAmount,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for the platform
// @route   GET /api/orders/admin
// @access  Private (Admin)
const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('orderItems.vendor', 'storeName fullName')
      .populate('orderItems.admin', 'name')
      .sort('-createdAt')
      .lean();

    const withTotals = orders.map((order) => ({
      ...order,
      orderItems: (order.orderItems || []).map((item) => ({
        ...item,
        lineTotal: item.lineTotal != null ? item.lineTotal : item.price * item.qty
      }))
    }));

    res.status(200).json({
      success: true,
      data: withTotals.map((order) => serializeOrder(order)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update the status of a specific item within an order
// @route   PUT /api/orders/:orderId/item/:itemId/status
// @access  Private (Admin or Vendor)
const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Find the specific item
    const item = order.orderItems.find(i => i._id.toString() === itemId.toString());
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in order' });
    }

    // Authorization check
    if (req.user.role === 'vendor' && (!item.vendor || item.vendor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
    }

    // Update fields
    if (status) item.status = status;
    if (trackingNumber !== undefined) item.trackingNumber = trackingNumber;

    await order.save();

    // Trigger push notification to user
    try {
      await sendNotificationToUser(
        order.user,
        'user',
        {
          title: 'Order Status Update',
          body: `The status of your item "${item.name}" from Order #${order._id} has been updated to "${status}".`
        },
        'info'
      );
    } catch (notifErr) {
      console.error('FCM: Error sending order item status notification:', notifErr);
    }

    res.status(200).json({ success: true, message: 'Item status updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a return or replacement
// @route   PATCH /api/orders/:id/request-return
// @access  Private
const requestReturn = async (req, res) => {
  try {
    const { returnReason, returnAction, returnImages, refundAccountDetails } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const allDelivered = order.orderItems.length > 0 && order.orderItems.every(item => item.status === 'Delivered');
    if (!allDelivered) {
      return res.status(400).json({ success: false, message: 'Can only request return for fully delivered orders' });
    }

    order.returnStatus = returnAction === 'Replace' ? 'Replace Requested' : 'Return Requested';
    order.returnReason = returnReason;
    order.returnAction = returnAction;
    order.returnImages = returnImages;
    if (refundAccountDetails) order.refundAccountDetails = refundAccountDetails;

    await order.save();

    try {
      const ReturnRequest = require('../models/returnRequestModel');
      const { nextRmaNumber } = require('../utils/marketplace');
      await ReturnRequest.create({
        rmaNumber: await nextRmaNumber(ReturnRequest),
        order: order._id,
        vendor: order.orderItems.find((i) => i.vendor)?.vendor,
        user: order.user,
        customer: order.customerName || '',
        reason: returnReason,
        photos: (returnImages || []).length,
        photoUrls: returnImages || [],
        status: 'Vendor Review',
      });
    } catch (rmaErr) {
      console.error('Return request record:', rmaErr.message);
    }

    // Trigger push notification to vendors
    try {
      const uniqueVendors = [...new Set(order.orderItems.map(item => item.vendor?.toString()).filter(Boolean))];
      for (const vendorId of uniqueVendors) {
        await sendNotificationToUser(
          vendorId,
          'vendor',
          {
            title: `${order.returnAction} Requested`,
            body: `A customer has requested a ${order.returnAction.toLowerCase()} for Order #${order._id}. Reason: ${order.returnReason}`
          },
          'warning'
        );
      }
    } catch (notifErr) {
      console.error('FCM: Error sending return request notification:', notifErr);
    }

    res.status(200).json({ success: true, message: 'Return/Replacement requested successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update refund details
// @route   PATCH /api/orders/:id/update-refund-details
// @access  Private
const updateRefundDetails = async (req, res) => {
  try {
    const { refundAccountDetails } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    order.refundAccountDetails = refundAccountDetails;
    await order.save();

    res.status(200).json({ success: true, message: 'Refund details updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin update return/replacement status
// @route   PATCH /api/orders/:id/admin-update-return
// @access  Private (Admin)
const adminUpdateReturn = async (req, res) => {
  try {
    const { returnStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.returnStatus = returnStatus;
    await order.save();

    // Trigger push notification to user
    try {
      await sendNotificationToUser(
        order.user,
        'user',
        {
          title: 'Return Status Update',
          body: `Your return/replacement status for Order #${order._id} has been updated to "${returnStatus}".`
        },
        'info'
      );
    } catch (notifErr) {
      console.error('FCM: Error sending return status update notification:', notifErr);
    }

    res.status(200).json({ success: true, message: `Return status updated to ${returnStatus}`, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  quoteOrder,
  createOrder,
  createRazorpayOrder,
  verifyRazorpayOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  getAdminOrders,
  updateOrderItemStatus,
  requestReturn,
  updateRefundDetails,
  adminUpdateReturn
};
