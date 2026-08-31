const mongoose = require('mongoose');
const { INCOMPLETE_STATUS } = require('../constants/flow');

const incompleteOrderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: String, default: 'Guest' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: INCOMPLETE_STATUS, default: 'Abandoned' },
  items: [{ name: String, qty: Number, amount: Number }],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
}, {
  timestamps: true
});

module.exports = mongoose.model('IncompleteOrder', incompleteOrderSchema);
