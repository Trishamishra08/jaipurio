const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'coupon' },
    code: { type: String, trim: true, uppercase: true, index: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    couponType: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], default: 'percentage' },
    value: { type: Number, default: 0 },
    applyFor: { type: String, default: 'all_orders' },
    minOrderAmount: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    unlimited: { type: Boolean, default: true },
    usageLimit: { type: Number, default: null },
    canUseWithPromotion: { type: Boolean, default: true },
    applyViaUrl: { type: Boolean, default: false },
    displayAtCheckout: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    neverExpired: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    store: { type: String, default: '—' },
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceDiscount', discountSchema);
