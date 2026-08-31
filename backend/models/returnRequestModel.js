const mongoose = require('mongoose');
const { RETURN_STATUS } = require('../constants/flow');

const returnRequestSchema = new mongoose.Schema({
  rmaNumber: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: String, default: '' },
  reason: { type: String, required: true },
  photos: { type: Number, default: 0 },
  photoUrls: [{ type: String }],
  status: { type: String, enum: RETURN_STATUS, default: 'Return Request created' },
  adminNote: { type: String, default: '' },
}, {
  timestamps: true
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
