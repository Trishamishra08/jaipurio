const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a category title'],
    trim: true,
  },
  slug: { type: String, trim: true },
  url: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  path: { type: String, default: '' },
  level: { type: Number, default: 1 },
  // Id in the legacy Botble `ec_product_categories` table — lets the import
  // re-run idempotently and map legacy product → category assignments.
  legacyId: { type: Number, index: true, sparse: true },
  image: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seo: seoFields,
}, {
  timestamps: true
});

categorySchema.index({ title: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
