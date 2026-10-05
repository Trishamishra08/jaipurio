const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const PaymentTransaction = require('../models/paymentTransactionModel');
const Payout = require('../models/payoutModel');
const AffiliatePayout = require('../models/affiliatePayoutModel');

const router = express.Router();

// Unified, read-only view across the three real sources of money movement —
// gateway transactions, vendor payouts, and affiliate payouts — each row
// tagged with its type so the UI can filter. Not a double-entry ledger, just
// a single feed so an admin isn't hunting across 3 separate screens.
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const [transactions, vendorPayouts, affiliatePayouts] = await Promise.all([
      PaymentTransaction.find({}).sort({ createdAt: -1 }).limit(limit).lean(),
      Payout.find({}).populate('vendor', 'storeName fullName').sort({ createdAt: -1 }).limit(limit).lean(),
      AffiliatePayout.find({}).populate('affiliate', 'name email').sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const rows = [
      ...transactions.map((t) => ({
        type: 'Payment',
        id: t._id,
        reference: t.orderNumber || t.gatewayPaymentId || '—',
        party: t.gateway,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
      })),
      ...vendorPayouts.map((p) => ({
        type: 'Vendor Payout',
        id: p._id,
        reference: p.payoutNumber,
        party: p.vendor?.storeName || p.vendor?.fullName || '—',
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
      ...affiliatePayouts.map((p) => ({
        type: 'Affiliate Payout',
        id: p._id,
        reference: p.payoutNumber,
        party: p.affiliate?.name || '—',
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
