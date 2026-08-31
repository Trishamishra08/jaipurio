const mongoose = require('mongoose');

const storeLocationSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: [true, 'Please provide a pincode'],
    trim: true,
    unique: true
  },
  city: {
    type: String,
    required: [true, 'Please provide a city'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'Please provide a district'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'Please provide a state'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StoreLocation', storeLocationSchema);
