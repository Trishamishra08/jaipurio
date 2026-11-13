const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Affiliate = require('../models/affiliateModel');
const { notify, orderRef, orderVendorIds } = require('../services/notify');
const { notifyOrderCreated } = require('../services/orderNotifications');
const { computeOrderQuote } = require('../utils/pricing');
const { nextOrderNumber, serializeOrder } = require('../utils/marketplace');
const { canAccessOrder, ensureEarnings } = require('./orderFlowController');
const { logTransaction } = require('./paymentTransactionController');
const PaymentMethod = require('../models/paymentMethodModel');
const PaymentTransaction = require('../models/paymentTransactionModel');
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

const savePricedOrder = async ({ userId, quote, shippingAddress, paymentMethod, paymentResult, isPaid, referralCode, skipTransactionLog = false }) => {
  // Affiliate attribution — resolved here rather than via computeOrderQuote
  // like couponCode, since a referral doesn't change pricing at all, only
  // who gets credited. Only an Approved affiliate's code counts.
  let affiliate = null;
  if (referralCode) {
    const cleanRef = String(referralCode).trim();
    // Escaped: the code comes from a URL, and characters like ( or [ must not break the lookup.
    const exactCode = new RegExp('^' + cleanRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    affiliate = await Affiliate.findOne({
      referralCode: { $regex: exactCode },
      status: 'Approved'
    });
    if (!affiliate) {
      affiliate = await Affiliate.findOne({ referralCode: cleanRef, status: 'Approved' });
    }
    if (!affiliate) {
      // An admin changed this affiliate's code after the link was shared — the old link still counts.
      affiliate = await Affiliate.findOne({ previousCodes: { $regex: exactCode }, status: 'Approved' });
    }
  }

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
    affiliate: affiliate?._id || null,
    affiliateCommissionRate: affiliate?.commissionRate || 0,
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

  // Create initial ledger records (vendor earnings & affiliate earnings as Pending)
  try {
    await ensureEarnings(order);
  } catch (err) {
    console.error('Error creating initial earnings for order:', err);
  }

  if (!skipTransactionLog) logTransaction({
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
    const { items, shippingAddress, couponCode, referralCode } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }
    // Unpaid orders are cash on delivery only — online orders are created by the gateway verify routes.
    if (req.body.paymentMethod && req.body.paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Online payments must be completed through the payment window.' });
    }
    const paymentMethod = 'COD';

    const codConfig = await getEnabledMethodConfig('cod');
    if (codConfig === null) {
      return res.status(400).json({ success: false, message: 'Cash on delivery is currently unavailable.' });
    }

    const quote = await computeOrderQuote({
      items: quoteItemsPayload(items),
      couponCode,
      paymentMethod
    });

    const createdOrder = await savePricedOrder({
      userId: req.user._id,
      quote,
      shippingAddress,
      paymentMethod,
      isPaid: false,
      referralCode
    });

    // Customer, sellers and admins are told about the new (COD) order.
    notifyOrderCreated(createdOrder, { paid: false });

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

    if (mock) console.warn('Razorpay not configured. Returning mock order id (development only).');
    // Remember exactly what was asked of the gateway: verification later must match this user and amount.
    await PaymentTransaction.create({
      user: req.user._id,
      gateway: 'razorpay',
      gatewayOrderId: order.id,
      amount: quote.total,
      status: 'initiated',
    });
    res.status(200).json({ success: true, data: { order, quote, keyId } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** Already completed (double click, retry, refresh) → the same order, never another. Returns true when it answered. */
const respondIfAlreadyPaid = async (txn, res) => {
  if (txn.status !== 'success' || !txn.order) return false;
  const existing = await Order.findById(txn.order);
  if (!existing) return false;
  res.status(200).json({
    success: true,
    message: 'Payment already verified',
    data: { order: { orderId: existing._id, ...existing._doc } },
  });
  return true;
};

/**
 * Shared final step for every online gateway, once the gateway has confirmed the payment:
 * re-price the order, check it equals what was paid, claim the transaction atomically,
 * save the order, then notify customer and vendors.
 */
const completePaidOrder = async (req, res, { txn, paymentId, orderDetails, gatewayLabel, method = '' }) => {
  const { items, shippingAddress, couponCode, referralCode } = orderDetails || {};
  const quote = await computeOrderQuote({
    items: quoteItemsPayload(items || []),
    couponCode,
    paymentMethod: 'paynow'
  });

  // The amount the customer actually paid must equal the order being created.
  if (Math.abs(Number(txn.amount) - Number(quote.total)) > 0.01) {
    await PaymentTransaction.updateOne(
      { _id: txn._id, status: { $ne: 'success' } },
      { $set: { status: 'failed', gatewayPaymentId: paymentId, errorMessage: `Amount mismatch: paid ${txn.amount}, order ${quote.total}` } }
    );
    return res.status(400).json({
      success: false,
      message: 'The order total no longer matches the amount paid. Please contact support — your payment is safe.',
    });
  }

  // Claim this payment atomically so two parallel requests cannot both create an order.
  const claimed = await PaymentTransaction.findOneAndUpdate(
    { _id: txn._id, status: 'initiated' },
    { $set: { status: 'processing', gatewayPaymentId: paymentId, method } }
  );
  if (!claimed) {
    return res.status(409).json({ success: false, message: 'This payment is already being processed. Please check My Orders.' });
  }

  let createdOrder;
  try {
    createdOrder = await savePricedOrder({
      userId: req.user._id,
      quote,
      shippingAddress,
      paymentMethod: 'Online',
      paymentResult: {
        id: paymentId,
        status: 'completed',
        update_time: new Date().toISOString()
      },
      isPaid: true,
      referralCode,
      skipTransactionLog: true
    });
  } catch (saveErr) {
    await PaymentTransaction.updateOne(
      { _id: txn._id },
      { $set: { status: 'failed', errorMessage: `Order could not be saved: ${saveErr.message}` } }
    );
    throw saveErr;
  }
  await PaymentTransaction.updateOne(
    { _id: txn._id },
    { $set: { status: 'success', order: createdOrder._id, orderNumber: createdOrder.orderNumber, gatewayPaymentId: paymentId } }
  );

  // Customer, sellers and admins are told about the new paid order.
  notifyOrderCreated(createdOrder, { paid: true });

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    data: {
      order: {
        orderId: createdOrder._id,
        ...createdOrder._doc
      }
    }
  });
};

// @desc    Verify Razorpay Payment and Save Order
// @route   POST /api/orders/razorpay/verify
// @access  Private
const verifyRazorpayOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details.' });
    }

    const config = await getEnabledMethodConfig('razorpay');
    if (config === null) {
      return res.status(400).json({ success: false, message: 'Online payment is currently unavailable.' });
    }

    // The payment must be one WE started, for THIS customer.
    const txn = await PaymentTransaction.findOne({
      gateway: 'razorpay',
      gatewayOrderId: razorpay_order_id,
      user: req.user._id,
    });
    if (!txn) {
      return res.status(400).json({ success: false, message: 'Unknown payment. Please start the payment again.' });
    }

    if (await respondIfAlreadyPaid(txn, res)) return;

    const gateway = getGateway('razorpay');
    if (!gateway.verifySignature(config, { razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      await PaymentTransaction.updateOne(
        { _id: txn._id, status: { $ne: 'success' } },
        { $set: { status: 'failed', gatewayPaymentId: razorpay_payment_id, errorMessage: 'Signature verification failed' } }
      );
      notify({ event: 'payment.failed', to: { userId: req.user._id }, data: { total: txn.amount } });
      notify({ event: 'admin.payment_issue', to: { admins: true }, data: { gateway: 'Razorpay', gatewayOrderId: razorpay_order_id, reason: 'Signature verification failed' } });
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }

    return completePaidOrder(req, res, { txn, paymentId: razorpay_payment_id, orderDetails, gatewayLabel: 'Razorpay' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Cashfree Order (returns a payment session for Cashfree's checkout)
// @route   POST /api/orders/cashfree/create
// @access  Private
const createCashfreeOrder = async (req, res) => {
  try {
    const quote = await computeOrderQuote({
      items: quoteItemsPayload(req.body.items || []),
      couponCode: req.body.couponCode,
      paymentMethod: 'paynow'
    });

    const config = await getEnabledMethodConfig('cashfree');
    if (config === null) {
      return res.status(400).json({ success: false, message: 'Online payment is currently unavailable.' });
    }

    // Cashfree requires a 10-digit customer phone.
    const customer = req.body.customer || {};
    const phone = String(customer.phone || req.user.mobile || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number for payment.' });
    }

    // After a redirect-based payment (some UPI / bank flows), Cashfree sends the customer back here.
    const origin = req.get('origin') || process.env.FRONTEND_URL || '';
    const returnUrl = origin.startsWith('https://') ? `${origin}/checkout?cf_order_id={order_id}` : undefined;

    const gateway = getGateway('cashfree');
    const { mock, order, mode } = await gateway.createOrder(config, {
      amount: quote.total,
      receipt: `jp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customer: { id: String(req.user._id), name: customer.name || req.user.name, email: customer.email || req.user.email, phone },
      returnUrl,
    });

    if (mock) console.warn('Cashfree not configured. Returning mock order id (development only).');
    // Remember exactly what was asked of the gateway: verification later must match this user and amount.
    await PaymentTransaction.create({
      user: req.user._id,
      gateway: 'cashfree',
      gatewayOrderId: order.id,
      amount: quote.total,
      status: 'initiated',
    });
    res.status(200).json({ success: true, data: { order, quote, mode } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Verify Cashfree Payment (asked of Cashfree server-side) and Save Order
// @route   POST /api/orders/cashfree/verify
// @access  Private
const verifyCashfreeOrder = async (req, res) => {
  try {
    const { orderId, orderDetails } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details.' });
    }

    const config = await getEnabledMethodConfig('cashfree');
    if (config === null) {
      return res.status(400).json({ success: false, message: 'Online payment is currently unavailable.' });
    }

    // The payment must be one WE started, for THIS customer.
    const txn = await PaymentTransaction.findOne({ gateway: 'cashfree', gatewayOrderId: orderId, user: req.user._id });
    if (!txn) {
      return res.status(400).json({ success: false, message: 'Unknown payment. Please start the payment again.' });
    }
    if (await respondIfAlreadyPaid(txn, res)) return;

    const result = await getGateway('cashfree').verifyPayment(config, { orderId });
    if (!result.paid) {
      // ACTIVE = not paid yet (closed, or a UPI payment still pending) — keep it open so a late payment can still complete.
      const final = ['EXPIRED', 'TERMINATED'].includes(result.status);
      await PaymentTransaction.updateOne(
        { _id: txn._id, status: 'initiated' },
        { $set: { ...(final ? { status: 'failed' } : {}), errorMessage: `Cashfree order status: ${result.status || 'not paid'}` } }
      );
      if (final) notify({ event: 'payment.failed', to: { userId: req.user._id }, data: { total: txn.amount } });
      return res.status(400).json({ success: false, message: 'Payment was not completed. No money has been taken — please try again.' });
    }
    // What Cashfree collected must be what we asked for.
    if (result.amount !== null && Math.abs(Number(result.amount) - Number(txn.amount)) > 0.01) {
      await PaymentTransaction.updateOne(
        { _id: txn._id, status: { $ne: 'success' } },
        { $set: { status: 'failed', gatewayPaymentId: result.paymentId, errorMessage: `Amount mismatch: Cashfree ${result.amount}, expected ${txn.amount}` } }
      );
      notify({ event: 'admin.payment_issue', to: { admins: true }, data: { gateway: 'Cashfree', gatewayOrderId: orderId, reason: `Amount mismatch: collected ${result.amount}, expected ${txn.amount}` } });
      return res.status(400).json({ success: false, message: 'The paid amount does not match. Please contact support — your payment is safe.' });
    }

    return completePaidOrder(req, res, {
      txn,
      paymentId: result.paymentId || orderId,
      orderDetails,
      gatewayLabel: 'Cashfree',
      method: String(result.method || '').toLowerCase(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data?.message || error.message });
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

    if (status) {
      notify({
        event: 'order.item_status',
        to: { userId: order.user },
        data: { orderNumber: orderRef(order), itemName: item.name, status },
        relatedId: order._id,
        relatedModel: 'Order',
      });
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

    // Sellers who fulfilled the order and admins are told about the return.
    {
      const returnData = { orderNumber: orderRef(order), kind: order.returnAction, reason: order.returnReason };
      for (const vendorId of orderVendorIds(order)) {
        notify({ event: 'vendor.return_requested', to: { vendorId }, data: returnData, relatedId: order._id, relatedModel: 'Order' });
      }
      notify({ event: 'admin.return_requested', to: { admins: true }, data: returnData, relatedId: order._id, relatedModel: 'Order' });
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

    notify({
      event: 'return.updated',
      to: { userId: order.user },
      data: { orderNumber: orderRef(order), kind: order.returnAction || 'return', status: returnStatus },
      relatedId: order._id,
      relatedModel: 'Order',
    });

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
  createCashfreeOrder,
  verifyCashfreeOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  getAdminOrders,
  updateOrderItemStatus,
  requestReturn,
  updateRefundDetails,
  adminUpdateReturn
};
