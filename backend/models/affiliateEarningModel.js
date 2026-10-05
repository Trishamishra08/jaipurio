const mongoose = require('mongoose');
const { EARNING_STATUS } = require('../constants/flow');

// One row per order (not per item, unlike the vendor Earning ledger) — an
// affiliate commission applies to the whole order's value, not itemized per
// product. Mirrors the vendor ledger's Pending->Available mechanics exactly.
const affiliateEarningSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderTotal: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: EARNING_STATUS, default: 'Pending' },
    availableAt: { type: Date },
    reversedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AffiliateEarning', affiliateEarningSchema);
