const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  badge: {
    type: String,
    default: 'DEAL',
  },
  image: {
    type: String,
    required: false,
  },
  discountValue: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
