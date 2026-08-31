const Order = require('../models/orderModel');
const Earning = require('../models/earningModel');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const { ORDER_STATUS, SHIPMENT_STATUS } = require('../constants/flow');
const {
  serializeOrder,
  commissionForVendor,
  returnWindowDate,
} = require('../utils/marketplace');
const { processShiprocketOrder } = require('./shipping.controller');
const { sendNotificationToUser } = require('../utils/pushNotificationHelper');

const canAccessOrder = (req, order) => {
  if (!order) return false;
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'vendor') {
    return order.orderItems.some((item) => item.vendor && item.vendor.toString() === req.user._id.toString());
  }
  return order.user && order.user.toString() === req.user._id.toString();
};

const ensureEarnings = async (order) => {
  const existing = await Earning.find({ order: order._id });
  if (existing.length) return existing;

  const created = [];
  for (const item of order.orderItems) {
    if (!item.vendor) continue;
    const vendor = await Vendor.findById(item.vendor);
    const rate = commissionForVendor(vendor);
    const itemTotal = item.lineTotal != null ? item.lineTotal : item.price * item.qty;
    const product = item.product ? await Product.findById(item.product).select('costPerItem') : null;
    const commissionAmount = (itemTotal * rate) / 100;
    created.push(await Earning.create({
      vendor: item.vendor,
      order: order._id,
      orderItem: item._id,
      productName: item.name,
      totalAmount: itemTotal,
      costPerItem: product?.costPerItem || 0,
      commissionRate: rate,
      commissionAmount,
      netEarning: itemTotal - commissionAmount,
      status: 'Pending',
    }));
  }
  return created;
};

const releaseAvailableIfReady = async (order) => {
  if (order.orderStatus !== 'Completed') return;
  const closeAt = order.returnWindowClosesAt || returnWindowDate(order.completedAt || order.updatedAt);
  if (closeAt > new Date()) return;
  await Earning.updateMany(
    { order: order._id, status: 'Pending' },
    { $set: { status: 'Available', availableAt: new Date() } }
  );
};

const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canAccessOrder(req, order)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (order.orderStatus !== 'Payment Confirmed' && order.orderStatus !== 'Order Placed') {
      return res.status(400).json({ success: false, message: `Cannot accept from ${order.orderStatus}` });
    }
    if (order.paymentStatus !== 'Paid' && !order.isPaid && order.paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Payment is not confirmed yet' });
    }

    order.orderStatus = 'Processing';
    order.shipment = {
      number: order.shipment?.number || `SHP-${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
      method: order.shipment?.method || 'Default',
      status: 'Processing',
      note: order.shipment?.note || '',
    };
    await order.save();
    await ensureEarnings(order);

    processShiprocketOrder(order._id).catch((err) => {
      console.error('Shiprocket after vendor accept:', err.message);
    });

    try {
      await sendNotificationToUser(order.user, 'user', {
        title: 'Order accepted',
        body: `Vendor accepted order #${order.orderNumber || order._id}. Shipment created.`,
      }, 'info');
    } catch { /* ignore */ }

    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderTrack = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canAccessOrder(req, order)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { orderStatus, note } = req.body;
    if (note !== undefined) order.note = note;
    if (orderStatus) {
      if (!ORDER_STATUS.includes(orderStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid order status' });
      }
      if (orderStatus === 'Vendor Accepts' || (orderStatus === 'Processing' && !order.shipment?.number)) {
        order.orderStatus = 'Processing';
        order.shipment = {
          number: order.shipment?.number || `SHP-${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
          method: order.shipment?.method || 'Default',
          status: 'Processing',
          note: order.shipment?.note || '',
        };
      } else if (orderStatus === 'Completed') {
        order.orderStatus = 'Completed';
        order.completedAt = new Date();
        order.returnWindowClosesAt = returnWindowDate();
        await ensureEarnings(order);
      } else {
        order.orderStatus = orderStatus;
      }
    }
    await order.save();
    await releaseAvailableIfReady(order);
    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateShipmentTrack = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canAccessOrder(req, order)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (order.orderStatus === 'Order Placed' || order.orderStatus === 'Payment Confirmed') {
      return res.status(400).json({ success: false, message: 'Shipment is created only after vendor accepts' });
    }

    const { status, method, note } = req.body;
    if (status && !SHIPMENT_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid shipment status' });
    }
    if (status === 'Not created') {
      return res.status(400).json({ success: false, message: 'Cannot un-create a shipment' });
    }

    order.shipment = {
      number: order.shipment?.number || `SHP-${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
      method: method || (status === 'Dispatched' ? 'Dispatched' : (order.shipment?.method || 'Default')),
      status: status || order.shipment?.status || 'Processing',
      note: note !== undefined ? note : (order.shipment?.note || ''),
    };
    if (order.shipment.status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.orderItems.forEach((item) => { item.status = 'Delivered'; });
    } else if (order.shipment.status === 'Dispatched') {
      order.orderItems.forEach((item) => { item.status = 'Dispatched'; });
    }
    await order.save();
    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canAccessOrder(req, order)) return res.status(403).json({ success: false, message: 'Not authorized' });
    order.orderStatus = 'Completed';
    order.completedAt = new Date();
    order.returnWindowClosesAt = returnWindowDate();
    await order.save();
    await ensureEarnings(order);
    await releaseAvailableIfReady(order);
    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const releaseEarnings = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id, status: 'Pending' } : { status: 'Pending' };
    const earnings = await Earning.find(filter).populate('order');
    let moved = 0;
    for (const earning of earnings) {
      const order = earning.order;
      if (!order || order.orderStatus !== 'Completed') continue;
      const closeAt = order.returnWindowClosesAt || returnWindowDate(order.completedAt || order.updatedAt);
      if (req.body?.force || closeAt <= new Date()) {
        earning.status = 'Available';
        earning.availableAt = new Date();
        await earning.save();
        moved += 1;
      }
    }
    res.status(200).json({ success: true, message: `${moved} earning(s) moved to Available` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listShipments = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor'
      ? { 'orderItems.vendor': req.user._id }
      : {};
    const orders = await Order.find(filter).populate('user', 'name email').sort('-createdAt');
    res.status(200).json({
      success: true,
      data: orders.map((order) => serializeOrder(order)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  acceptOrder,
  updateOrderTrack,
  updateShipmentTrack,
  completeOrder,
  releaseEarnings,
  listShipments,
  canAccessOrder,
  ensureEarnings,
  serializeOrder,
};
