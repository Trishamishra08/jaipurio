const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const marketplaceStoreSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Published', 'Pending', 'Blocked', 'Draft'],
      default: 'Published',
      index: true,
    },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
    vendorName: { type: String, default: '' },
    companyName: { type: String, default: '' },
    taxId: { type: String, default: '' },
    taxCountry: { type: String, default: 'IN' },
    taxState: { type: String, default: '' },
    address: { type: String, default: '' },
    country: { type: String, default: 'India' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: '' },
    verificationNote: { type: String, default: '' },
    earnings: { type: Number, default: 0 },
    productsCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    seo: seoFields,
  },
  { timestamps: true }
);

marketplaceStoreSchema.index({ name: 'text', email: 'text', vendorName: 'text' });

module.exports = mongoose.model('MarketplaceStore', marketplaceStoreSchema);
