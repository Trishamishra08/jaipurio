const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined to be ignored for uniqueness
    lowercase: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    // Not required globally because 'user' role logs in with OTP
  },
  addresses: [
    {
      title: { type: String, default: 'Home' },
      addressLine: String,
      mobile: String,
      isDefault: { type: Boolean, default: false }
    }
  ],
  profile: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  fcmTokens: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
