const mongoose = require('mongoose');
const { VENDOR_PLANS, KYC_STATUS } = require('../constants/flow');

const vendorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  businessName: { type: String, required: true },
  gstNumber: { type: String, required: true },
  businessType: { type: String, required: true },
  businessAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },

  accountHolderName: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  upiId: { type: String },
  bankVerified: { type: Boolean, default: false },

  storeName: { type: String, required: true },
  storeDescription: { type: String, required: true },
  categories: [{ type: String }],
  documents: [{ type: String }],

  kycStatus: { type: String, enum: KYC_STATUS, default: 'Pending' },
  plan: { type: String, enum: Object.keys(VENDOR_PLANS), default: 'Starter' },
  pendingPlan: { type: String, default: null },
  planEffectiveAt: { type: Date },
  commissionRate: { type: Number, default: VENDOR_PLANS.Starter.commissionRate },

  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  role: { type: String, default: 'vendor' },
  fcmTokens: { type: [String], default: [] }
}, {
  timestamps: true
});

vendorSchema.pre('validate', function syncPlan() {
  const current = VENDOR_PLANS[this.plan] || VENDOR_PLANS.Starter;
  if (this.commissionRate == null) this.commissionRate = current.commissionRate;
});

module.exports = mongoose.model('Vendor', vendorSchema);
