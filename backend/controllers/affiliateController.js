const Affiliate = require('../models/affiliateModel');
const AffiliateEarning = require('../models/affiliateEarningModel');
const AffiliatePayout = require('../models/affiliatePayoutModel');
const Order = require('../models/orderModel');
const { nextPayoutNumber } = require('../utils/marketplace');
const { PAYOUT_STATUS } = require('../constants/flow');

const serializeAffiliatePayout = (p) => {
  const o = p.toObject ? p.toObject() : { ...p };
  return { ...o, id: o.payoutNumber || String(o._id) };
};

// @desc    Any logged-in customer applies to become an affiliate
// @route   POST /api/affiliates/apply
const applyAffiliate = async (req, res) => {
  try {
    const existing = await Affiliate.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: `You already have an affiliate application (${existing.status}).` });
    }
    const body = req.body || {};
    const affiliate = await Affiliate.create({
      user: req.user._id,
      name: body.name || req.user.name,
      email: body.email || req.user.email,
    });
    res.status(201).json({ success: true, data: affiliate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    The logged-in customer's own affiliate profile, if any
// @route   GET /api/affiliates/me
const getMyAffiliate = async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ user: req.user._id });
    res.status(200).json({ success: true, data: affiliate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update own bank/UPI details (required before requesting a payout)
// @route   PUT /api/affiliates/me
const updateMyAffiliate = async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ user: req.user._id });
    if (!affiliate) return res.status(404).json({ success: false, message: 'Not an affiliate yet.' });
    const { accountHolderName, bankName, accountNumber, ifscCode, upiId } = req.body;
    if (accountHolderName != null) affiliate.accountHolderName = accountHolderName;
    if (bankName != null) affiliate.bankName = bankName;
    if (accountNumber != null) affiliate.accountNumber = accountNumber;
    if (ifscCode != null) affiliate.ifscCode = ifscCode;
    if (upiId != null) affiliate.upiId = upiId;
    await affiliate.save();
    res.status(200).json({ success: true, data: affiliate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pending/available balance + ledger rows for the logged-in affiliate
// @route   GET /api/affiliates/earnings
const getAffiliateEarnings = async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ user: req.user._id });
    if (!affiliate) return res.status(404).json({ success: false, message: 'Not an affiliate yet.' });

    // Self-healing backfill: ensure any orders attributed to this affiliate have AffiliateEarning rows
    try {
      const ordersWithAffiliate = await Order.find({ affiliate: affiliate._id });
      for (const ord of ordersWithAffiliate) {
        const exists = await AffiliateEarning.findOne({ order: ord._id });
        if (!exists) {
          const rate = Number(ord.affiliateCommissionRate || affiliate.commissionRate || 10);
          const orderTotal = Number(ord.totalPrice || 0);
          const commissionAmount = (orderTotal * rate) / 100;
          let status = 'Pending';
          if (ord.orderStatus === 'Completed') status = 'Available';
          if (ord.orderStatus === 'Cancelled') status = 'Refunded';
          await AffiliateEarning.create({
            affiliate: affiliate._id,
            order: ord._id,
            orderTotal,
            commissionRate: rate,
            commissionAmount,
            status,
          });
        }
      }
    } catch (backfillErr) {
      console.warn('Affiliate earnings backfill warning:', backfillErr.message);
    }

    const earnings = await AffiliateEarning.find({ affiliate: affiliate._id })
      .populate('order', 'orderNumber orderStatus')
      .sort({ createdAt: -1 });

    const buckets = { Pending: 0, Available: 0, Cleared: 0, Refunded: 0, Reversed: 0 };
    earnings.forEach((e) => {
      buckets[e.status] = (buckets[e.status] || 0) + Number(e.commissionAmount || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        referralCode: affiliate.referralCode,
        pending: buckets.Pending,
        available: buckets.Available,
        cleared: buckets.Cleared,
        rows: earnings.map((e) => ({
          id: e._id,
          order: e.order?.orderNumber || e.order?._id,
          orderStatus: e.order?.orderStatus,
          commissionAmount: e.commissionAmount,
          status: e.status,
          createdAt: e.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Affiliate requests a payout of their Available balance
// @route   POST /api/affiliates/payouts/request
const requestAffiliatePayout = async (req, res) => {
  try {
    const body = req.body || {};
    const affiliate = await Affiliate.findOne({ user: req.user._id });
    if (!affiliate) return res.status(404).json({ success: false, message: 'Not an affiliate yet.' });
    if (affiliate.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Affiliate application must be Approved first.' });
    }
    if (!affiliate.accountNumber || !affiliate.ifscCode) {
      return res.status(400).json({ success: false, message: 'Add your bank details before requesting a payout.' });
    }

    const earnings = await AffiliateEarning.find({ affiliate: affiliate._id, status: 'Available' });
    const balance = earnings.reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0);
    const amount = Number(body.amount) || balance;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'No available balance to request.' });
    if (amount > balance) return res.status(400).json({ success: false, message: 'Amount exceeds available balance.' });

    const payout = await AffiliatePayout.create({
      payoutNumber: await nextPayoutNumber(AffiliatePayout),
      affiliate: affiliate._id,
      amount,
      balanceAtRequest: balance,
      status: 'Pending',
      bankSnapshot: {
        accountHolderName: affiliate.accountHolderName,
        bankName: affiliate.bankName,
        accountNumber: affiliate.accountNumber,
        ifscCode: affiliate.ifscCode,
        upiId: affiliate.upiId,
      },
      earningIds: earnings.map((e) => e._id),
    });

    res.status(201).json({ success: true, data: serializeAffiliatePayout(payout) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: list affiliate payouts
// @route   GET /api/affiliates/payouts
const CODE_RE = /^[A-Za-z0-9_-]{3,30}$/;
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Admin: change an affiliate's referral code and/or commission rate
// @route   PATCH /api/affiliates/:id/referral
// The old code stays valid (previousCodes) so links that were already shared keep earning credit.
// A new commission rate applies to orders placed from now on; past orders keep the rate they were placed with.
const updateAffiliateReferral = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });

    const { referralCode, commissionRate } = req.body || {};

    if (referralCode !== undefined) {
      const code = String(referralCode).trim();
      if (!CODE_RE.test(code)) {
        return res.status(400).json({ success: false, message: 'Referral code must be 3–30 characters: letters, numbers, - or _ (no spaces).' });
      }
      const same = new RegExp('^' + escapeRegex(code) + '$', 'i');
      const taken = await Affiliate.findOne({
        _id: { $ne: affiliate._id },
        $or: [{ referralCode: { $regex: same } }, { previousCodes: { $regex: same } }],
      });
      if (taken) return res.status(409).json({ success: false, message: 'That code is already used by another affiliate.' });

      if (affiliate.referralCode && affiliate.referralCode.toLowerCase() !== code.toLowerCase()) {
        const old = affiliate.referralCode;
        affiliate.previousCodes = [...new Set([...(affiliate.previousCodes || []), old])]
          .filter((c) => c.toLowerCase() !== code.toLowerCase());
      }
      affiliate.referralCode = code;
    }

    if (commissionRate !== undefined) {
      const rate = Number(commissionRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ success: false, message: 'Commission must be a number between 0 and 100.' });
      }
      affiliate.commissionRate = rate;
    }

    await affiliate.save();
    res.status(200).json({ success: true, data: affiliate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listAffiliatePayouts = async (req, res) => {
  try {
    const payouts = await AffiliatePayout.find({}).populate('affiliate', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payouts.map(serializeAffiliatePayout) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: advance a payout's status (Pending -> Processing -> Completed, or Refused)
// @route   PUT /api/affiliates/payouts/:id/advance
const advanceAffiliatePayout = async (req, res) => {
  try {
    const body = req.body || {};
    const payout = await AffiliatePayout.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

    const flow = ['Pending', 'Processing', 'Completed'];
    let next = body.status && PAYOUT_STATUS.includes(body.status) ? body.status : null;
    if (!next) {
      const idx = flow.indexOf(payout.status);
      next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : payout.status;
    }

    if (next === 'Refused' || next === 'Rejected') {
      payout.status = 'Refused';
      await AffiliateEarning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Available' } });
    } else {
      payout.status = next;
      if (['Processing', 'Completed'].includes(next)) {
        await AffiliateEarning.updateMany({ _id: { $in: payout.earningIds } }, { $set: { status: 'Cleared' } });
      }
    }
    if (payout.status === 'Completed') payout.processedAt = new Date();
    if (body.note) payout.settlementNote = body.note;
    if (body.transactionId) payout.transactionId = body.transactionId;
    await payout.save();

    res.status(200).json({ success: true, data: serializeAffiliatePayout(payout) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  applyAffiliate,
  getMyAffiliate,
  updateMyAffiliate,
  getAffiliateEarnings,
  requestAffiliatePayout,
  updateAffiliateReferral,
  listAffiliatePayouts,
  advanceAffiliatePayout,
};
