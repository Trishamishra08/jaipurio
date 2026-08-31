const mongoose = require('mongoose');
const { EARNING_STATUS } = require('../constants/flow');

const earningSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  costPerItem: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 12
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  netEarning: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: EARNING_STATUS,
    default: 'Pending'
  },
  availableAt: { type: Date },
  reversedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Earning', earningSchema);
