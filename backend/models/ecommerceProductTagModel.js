const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const productTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    status: { type: String, default: 'Published' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seo: seoFields,
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceProductTag', productTagSchema);
