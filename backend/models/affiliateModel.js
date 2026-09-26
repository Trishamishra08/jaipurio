const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    commissionRate: { type: Number, default: 10 },
    pending: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Affiliate', affiliateSchema);
