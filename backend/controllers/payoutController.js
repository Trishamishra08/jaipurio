const Payout = require('../models/payoutModel');
const Earning = require('../models/earningModel');
const Vendor = require('../models/vendorModel');
const { PAYOUT_STATUS } = require('../constants/flow');
const { nextPayoutNumber, serializePayout } = require('../utils/marketplace');

const WITHDRAWAL_FEE_RATE = Number(process.env.WITHDRAWAL_FEE_RATE || 0);

const availableBalance = async (vendorId) => {
  const rows = await Earning.find({ vendor: vendorId, status: 'Available' });
  return rows.reduce((sum, row) => sum + Number(row.netEarning || 0), 0);
};

const nextLegacyId = async () => {
  const last = await Payout.findOne({}).sort({ legacyId: -1 }).select('legacyId').lean();
  return (last?.legacyId || 0) + 1;
};

const toDbStatus = (status) => {
  const map = {
    Pending: 'Pending',
    'Pending approval': 'Pending',
    Processing: 'Processing',
    Approved: 'Processing',
    'Sent to bank': 'Processing',
    Completed: 'Completed',
    Settled: 'Completed',
    Refused: 'Refused',
    Rejected: 'Refused',
    Canceled: 'Canceled',
    Cancelled: 'Canceled',
  };
  return map[status] || status || 'Pending';
};

const findPayout = async (key) => {
  const id = String(key || '').trim();
  if (!id) return null;
  if (/^[a-fA-F0-9]{24}$/.test(id)) {
    return Payout.findById(id).populate('vendor', 'storeName fullName businessName email mobile accountHolderName bankName accountNumber ifscCode upiId');
  }
  if (/^\d+$/.test(id)) {
    return Payout.findOne({ legacyId: Number(id) }).populate(
      'vendor',
      'storeName fullName businessName email mobile accountHolderName bankName accountNumber ifscCode upiId'
    );
  }
  return Payout.findOne({ payoutNumber: id }).populate(
    'vendor',
    'storeName fullName businessName email mobile accountHolderName bankName accountNumber ifscCode upiId'
  );
};

const listPayouts = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
    if (req.query.status) {
      const s = toDbStatus(req.query.status);
      filter.status = { $in: [s, req.query.status, 'Pending approval', 'Approved', 'Sent to bank', 'Settled', 'Rejected'].filter(Boolean) };
      if (s === 'Pending') filter.status = { $in: ['Pending', 'Pending approval'] };
      if (s === 'Processing') filter.status = { $in: ['Processing', 'Approved', 'Sent to bank'] };
      if (s === 'Completed') filter.status = { $in: ['Completed', 'Settled'] };
      if (s === 'Refused') filter.status = { $in: ['Refused', 'Rejected'] };
    }
    const q = String(req.query.q || '').trim();
    const items = await Payout.find(filter)
      .populate('vendor', 'storeName fullName businessName email')
      .sort('-createdAt');

    let data = items.map(serializePayout);
    if (q) {
      const needle = q.toLowerCase();
      data = data.filter(
        (row) =>
          String(row.id).includes(needle) ||
          String(row.vendorName || row.vendor || '')
            .toLowerCase()
            .includes(needle) ||
          String(row.payoutNumber || '')
            .toLowerCase()
            .includes(needle)
      );
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayoutById = async (req, res) => {
  try {
    const payout = await findPayout(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    res.status(200).json({ success: true, data: serializePayout(payout) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestPayout = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    if (vendor.kycStatus !== 'Verified') {
      return res.status(400).json({ success: false, message: 'KYC must be verified before payout' });
    }

    const earnings = await Earning.find({ vendor: vendor._id, status: 'Available' });
    const balance = earnings.reduce((sum, row) => sum + Number(row.netEarning || 0), 0);
    const amount = Number(req.body.amount) || balance;
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance to request' });
    }
    if (amount > balance) {
      return res.status(400).json({ success: false, message: 'Amount exceeds available balance' });
    }

    const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
    const legacyId = await nextLegacyId();
    const payout = await Payout.create({
      payoutNumber: await nextPayoutNumber(Payout),
      legacyId,
      vendor: vendor._id,
      amount,
      fee,
      balanceAtRequest: balance,
      paymentMethod: req.body.paymentMethod || 'Bank transfer',
      status: 'Pending',
      description: req.body.description || '',
      bankSnapshot: {
        accountHolderName: vendor.accountHolderName,
        bankName: vendor.bankName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
        upiId: vendor.upiId,
      },
      earningIds: earnings.map((e) => e._id),
    });

    res.status(201).json({ success: true, data: serializePayout(await payout.populate('vendor', 'storeName fullName businessName')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const payout = await findPayout(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

    const body = req.body || {};
    if (body.amount != null) payout.amount = Number(body.amount);
    if (body.fee != null) payout.fee = Number(body.fee);
    if (body.paymentMethod != null) payout.paymentMethod = body.paymentMethod;
    if (body.transactionId != null) payout.transactionId = body.transactionId;
    if (body.description != null) payout.description = body.description;
    if (body.settlementNote != null) payout.settlementNote = body.settlementNote;
    if (Array.isArray(body.proofImages)) payout.proofImages = body.proofImages;

    if (body.status) {
      const next = toDbStatus(body.status);
      if (!PAYOUT_STATUS.includes(next)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      payout.status = next;
    }

    if (['Processing', 'Completed', 'Approved', 'Sent to bank', 'Settled'].includes(payout.status)) {
      await Earning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Cleared' } });
    }
    if (['Refused', 'Rejected', 'Canceled'].includes(payout.status)) {
      await Earning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Available' } });
    }
    if (['Completed', 'Settled'].includes(payout.status)) payout.processedAt = new Date();

    await payout.save();
    const refreshed = await findPayout(payout._id);
    res.status(200).json({ success: true, data: serializePayout(refreshed) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const advancePayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const payout = await findPayout(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

    const flow = ['Pending', 'Pending approval', 'Processing', 'Completed'];
    const current = toDbStatus(payout.status);
    let next = req.body.status ? toDbStatus(req.body.status) : null;
    if (!next) {
      if (current === 'Pending' || current === 'Pending approval') next = 'Processing';
      else if (current === 'Processing' || current === 'Approved' || current === 'Sent to bank') next = 'Completed';
      else next = current;
    }
    if (next === 'Refused' || next === 'Rejected') {
      payout.status = 'Refused';
      await Earning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Available' } });
    } else {
      payout.status = next;
      if (['Processing', 'Completed'].includes(next)) {
        await Earning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Cleared' } });
      }
    }
    if (payout.status === 'Completed') payout.processedAt = new Date();
    payout.settlementNote = req.body.note || payout.settlementNote;
    if (req.body.transactionId) payout.transactionId = req.body.transactionId;
    await payout.save();
    const refreshed = await findPayout(payout._id);
    res.status(200).json({ success: true, data: serializePayout(refreshed) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const payout = await findPayout(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (!['Pending', 'Pending approval', 'Refused', 'Canceled', 'Rejected'].includes(toDbStatus(payout.status))) {
      return res.status(400).json({ success: false, message: 'Only pending/refused withdrawals can be deleted' });
    }
    if (['Pending', 'Pending approval'].includes(toDbStatus(payout.status))) {
      await Earning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Available' } });
    }
    await payout.deleteOne();
    res.status(200).json({ success: true, message: 'Withdrawal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const earningsSummary = async (req, res) => {
  try {
    const vendorId = req.user.role === 'vendor' ? req.user._id : req.query.vendorId;
    if (!vendorId) return res.status(400).json({ success: false, message: 'Vendor required' });
    const earnings = await Earning.find({ vendor: vendorId }).populate('order', 'orderNumber orderStatus totalPrice');
    const buckets = { Pending: 0, Available: 0, Cleared: 0, Refunded: 0, Reversed: 0 };
    let commission = 0;
    let cost = 0;
    earnings.forEach((e) => {
      buckets[e.status] = (buckets[e.status] || 0) + Number(e.netEarning || 0);
      if (e.status !== 'Refunded' && e.status !== 'Reversed') commission += Number(e.commissionAmount || 0);
      cost += Number(e.costPerItem || 0);
    });
    res.status(200).json({
      success: true,
      data: {
        pending: buckets.Pending,
        available: buckets.Available,
        cleared: buckets.Cleared,
        commission,
        cost,
        availableNow: await availableBalance(vendorId),
        rows: earnings.map((e) => ({
          id: e._id,
          order: e.order?.orderNumber || e.order?._id,
          status: e.order?.orderStatus,
          earningStatus: e.status,
          total: e.totalAmount,
          net: e.netEarning,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listPayouts,
  getPayoutById,
  requestPayout,
  updatePayout,
  advancePayout,
  deletePayout,
  earningsSummary,
};
