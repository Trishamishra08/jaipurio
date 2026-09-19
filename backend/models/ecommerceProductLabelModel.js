const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const productLabelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    color: { type: String, default: '#ef4444' },
    status: { type: String, default: 'Published' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seo: seoFields,
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceProductLabel', productLabelSchema);
