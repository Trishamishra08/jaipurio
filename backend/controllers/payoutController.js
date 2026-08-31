const Payout = require('../models/payoutModel');
const Earning = require('../models/earningModel');
const Vendor = require('../models/vendorModel');
const { PAYOUT_STATUS } = require('../constants/flow');
const { nextPayoutNumber, serializePayout } = require('../utils/marketplace');

const availableBalance = async (vendorId) => {
  const rows = await Earning.find({ vendor: vendorId, status: 'Available' });
  return rows.reduce((sum, row) => sum + Number(row.netEarning || 0), 0);
};

const listPayouts = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
    const items = await Payout.find(filter).populate('vendor', 'storeName').sort('-createdAt');
    res.status(200).json({ success: true, data: items.map(serializePayout) });
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
    const amount = Number(req.body.amount) || earnings.reduce((sum, row) => sum + Number(row.netEarning || 0), 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance to request' });
    }

    const payout = await Payout.create({
      payoutNumber: await nextPayoutNumber(Payout),
      vendor: vendor._id,
      amount,
      status: 'Pending approval',
      bankSnapshot: {
        accountHolderName: vendor.accountHolderName,
        bankName: vendor.bankName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
      },
      earningIds: earnings.map((e) => e._id),
    });

    res.status(201).json({ success: true, data: serializePayout(payout) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const advancePayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const payout = await Payout.findById(req.params.id).populate('vendor', 'storeName');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

    const index = PAYOUT_STATUS.indexOf(payout.status);
    const next = req.body.status || PAYOUT_STATUS[Math.min(index + 1, PAYOUT_STATUS.indexOf('Settled'))];
    if (next === 'Rejected') {
      payout.status = 'Rejected';
    } else {
      payout.status = next;
    }
    if (payout.status === 'Approved' || payout.status === 'Sent to bank' || payout.status === 'Settled') {
      await Earning.updateMany(
        { _id: { $in: payout.earningIds } },
        { $set: { status: 'Cleared' } }
      );
    }
    if (payout.status === 'Settled') payout.processedAt = new Date();
    payout.settlementNote = req.body.note || payout.settlementNote;
    await payout.save();
    res.status(200).json({ success: true, data: serializePayout(payout) });
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
  requestPayout,
  advancePayout,
  earningsSummary,
};
