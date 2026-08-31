const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['privacy', 'return', 'terms', 'cancellation', 'shipping']
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);
