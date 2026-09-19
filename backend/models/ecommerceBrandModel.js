const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    logo: { type: String, default: '' },
    order: { type: Number, default: 0 },
    status: { type: String, default: 'Published' },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seo: seoFields,
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceBrand', brandSchema);
