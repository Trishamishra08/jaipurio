const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  username: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
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
  dateOfBirth: {
    type: Date
  },
  privateNotes: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  // Only meaningful when role === 'admin' — finer-grained permission set on
  // top of the coarse role gate. Null = no sub-role assigned yet.
  adminRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null
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
  // Legacy token list — superseded by the DeviceToken collection (kept for migration).
  fcmTokens: {
    type: [String],
    default: []
  },
  // Push/inbox preferences. Transactional categories (orders, payments, account…)
  // are always delivered; 'muted' only affects optional ones, 'promotions' is opt-in.
  notificationPrefs: {
    promotions: { type: Boolean, default: false },
    muted: { type: [String], default: [] }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
