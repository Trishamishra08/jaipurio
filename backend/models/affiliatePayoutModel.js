const mongoose = require('mongoose');
const { PAYOUT_STATUS } = require('../constants/flow');

// Mirrors payoutModel.js exactly — affiliate instead of vendor, earningIds
// pointing at AffiliateEarning instead of Earning.
const affiliatePayoutSchema = new mongoose.Schema(
  {
    payoutNumber: { type: String, required: true, unique: true },
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    balanceAtRequest: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'Bank transfer' },
    status: { type: String, enum: PAYOUT_STATUS, default: 'Pending' },
    bankSnapshot: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
    },
    earningIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateEarning' }],
    transactionId: { type: String, default: '' },
    description: { type: String, default: '' },
    settlementNote: { type: String, default: '' },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AffiliatePayout', affiliatePayoutSchema);
