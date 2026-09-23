const PaymentTransaction = require('../models/paymentTransactionModel');

// @desc    List payment transactions (optionally filtered by status)
// @route   GET /api/payments/transactions?status=success
// @route   GET /api/payments/logs (same data, unfiltered by default, most-recent-first)
const listTransactions = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const status = req.query.status;
    const gateway = req.query.gateway;
    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { gatewayOrderId: { $regex: q, $options: 'i' } },
        { gatewayPaymentId: { $regex: q, $options: 'i' } },
      ];
    }
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const [rows, total] = await Promise.all([
      PaymentTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentTransaction.countDocuments(filter),
    ]);
    res.json({ success: true, data: rows.map((r) => ({ ...r, id: String(r._id) })), total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const doc = await PaymentTransaction.findById(req.params.id).populate('order', 'orderNumber').lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { ...doc, id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const payload = {};
    if (req.body.status) payload.status = req.body.status;
    const doc = await PaymentTransaction.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const doc = await PaymentTransaction.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Best-effort logger used by the checkout/payment flow — never throws. */
const logTransaction = async (fields) => {
  try {
    await PaymentTransaction.create(fields);
  } catch (err) {
    console.error('PaymentTransaction log failed:', err.message);
  }
};

module.exports = {
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  logTransaction,
};
