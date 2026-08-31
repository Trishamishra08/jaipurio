const mongoose = require('mongoose');
const { PAYOUT_STATUS } = require('../constants/flow');

const payoutSchema = new mongoose.Schema({
  payoutNumber: { type: String, required: true, unique: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: PAYOUT_STATUS, default: 'Pending approval' },
  bankSnapshot: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  earningIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Earning' }],
  settlementNote: { type: String, default: '' },
  processedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payout', payoutSchema);
