const ReturnRequest = require('../models/returnRequestModel');
const Order = require('../models/orderModel');
const Earning = require('../models/earningModel');
const { RETURN_STATUS } = require('../constants/flow');
const { nextRmaNumber, serializeReturn } = require('../utils/marketplace');
const { canAccessOrder } = require('./orderFlowController');
const { notify, orderRef } = require('../services/notify');

const listReturns = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : req.user.role === 'admin' ? {} : { user: req.user._id };
    const items = await ReturnRequest.find(filter).populate('order', 'orderNumber').populate('user', 'name').sort('-createdAt');
    res.status(200).json({ success: true, data: items.map(serializeReturn) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.body.orderId || req.body.order);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canAccessOrder(req, order) && req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.shipment?.status !== 'Delivered' && !order.isDelivered) {
      return res.status(400).json({ success: false, message: 'Return can be requested only after delivery' });
    }

    const vendorId = order.orderItems.find((i) => i.vendor)?.vendor;
    const item = await ReturnRequest.create({
      rmaNumber: await nextRmaNumber(ReturnRequest),
      order: order._id,
      vendor: vendorId,
      user: order.user,
      customer: order.customerName || req.user.name || '',
      reason: req.body.reason,
      photos: Number(req.body.photos || (req.body.photoUrls || []).length || 0),
      photoUrls: req.body.photoUrls || [],
      status: 'Vendor Review',
    });
    order.returnStatus = 'Return Requested';
    order.returnReason = req.body.reason;
    order.returnAction = 'Refund';
    await order.save();

    const returnData = { orderNumber: orderRef(order), rma: item.rmaNumber, kind: 'Refund', reason: req.body.reason };
    if (vendorId) {
      notify({ event: 'vendor.return_requested', to: { vendorId }, data: returnData, relatedId: item._id, relatedModel: 'ReturnRequest' });
    }
    notify({ event: 'admin.return_requested', to: { admins: true }, data: returnData, relatedId: item._id, relatedModel: 'ReturnRequest' });

    res.status(201).json({ success: true, data: serializeReturn(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const advanceReturn = async (req, res) => {
  try {
    const item = await ReturnRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Return not found' });
    if (req.user.role === 'vendor' && item.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const index = RETURN_STATUS.indexOf(item.status);
    const nextStatus = RETURN_STATUS[Math.min(index + 1, RETURN_STATUS.indexOf('Commission reversed'))];
    item.status = nextStatus;
    await item.save();

    if (nextStatus === 'Payment status: Refunded') {
      await Order.findByIdAndUpdate(item.order, { paymentStatus: 'Refunded', returnStatus: 'Returned' });
    }
    if (item.user) {
      const order = await Order.findById(item.order).select('orderNumber totalPrice');
      const data = { orderNumber: orderRef(order || {}), kind: 'return', status: nextStatus.replace(/^Payment status:s*/, '') };
      if (nextStatus === 'Payment status: Refunded') {
        notify({ event: 'refund.processed', to: { userId: item.user }, data: { orderNumber: data.orderNumber, amount: order?.totalPrice }, relatedId: item._id, relatedModel: 'ReturnRequest' });
      } else if (nextStatus !== 'Commission reversed') {
        notify({ event: 'return.updated', to: { userId: item.user }, data, relatedId: item._id, relatedModel: 'ReturnRequest' });
      }
    }
    if (nextStatus === 'Commission reversed') {
      await Earning.updateMany(
        { order: item.order },
        { $set: { status: 'Reversed', reversedAt: new Date() } }
      );
    }

    res.status(200).json({ success: true, data: serializeReturn(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectReturn = async (req, res) => {
  try {
    const item = await ReturnRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Return not found' });
    if (req.user.role === 'vendor' && item.vendor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    item.status = 'Rejected — admin dispute available';
    item.adminNote = req.body.note || '';
    await item.save();
    await Order.findByIdAndUpdate(item.order, { returnStatus: 'Return Rejected' });
    if (item.user) {
      const order = await Order.findById(item.order).select('orderNumber');
      notify({ event: 'return.updated', to: { userId: item.user }, data: { orderNumber: orderRef(order || {}), kind: 'return', status: 'rejected' }, relatedId: item._id, relatedModel: 'ReturnRequest' });
    }
    res.status(200).json({ success: true, data: serializeReturn(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listReturns,
  createReturn,
  advanceReturn,
  rejectReturn,
};
