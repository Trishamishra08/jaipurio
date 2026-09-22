const mongoose = require('mongoose');
const { PAYOUT_STATUS } = require('../constants/flow');

const payoutSchema = new mongoose.Schema(
  {
    payoutNumber: { type: String, required: true, unique: true },
    legacyId: { type: Number, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
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
    earningIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Earning' }],
    transactionId: { type: String, default: '' },
    description: { type: String, default: '' },
    settlementNote: { type: String, default: '' },
    proofImages: [{ type: String }],
    processedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
