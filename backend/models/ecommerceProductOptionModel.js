const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const productOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    optionType: { type: String, default: 'dropdown' },
    required: { type: Boolean, default: false },
    values: [
      {
        label: String,
        price: { type: Number, default: 0 },
        priceType: { type: String, default: 'fixed' },
        legacyId: String,
      },
    ],
    status: { type: String, default: 'Published' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seo: seoFields,
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceProductOption', productOptionSchema);
