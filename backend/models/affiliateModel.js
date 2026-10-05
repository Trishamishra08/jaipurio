const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const affiliateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    commissionRate: { type: Number, default: 10 },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    // Bank details, same shape as vendorModel.js — only required once a payout is requested.
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' },
  },
  { timestamps: true }
);

// pending/available balances are NOT stored here — they're computed from
// AffiliateEarning (a ledger), same reasoning as the vendor side: raw
// counters drift on returns/edits, a ledger doesn't.

affiliateSchema.pre('validate', function assignReferralCode() {
  if (!this.referralCode) {
    this.referralCode = randomUUID().replace(/-/g, '').slice(0, 10);
  }
});

module.exports = mongoose.model('Affiliate', affiliateSchema);
