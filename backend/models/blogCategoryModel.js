const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const blogCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      default: null,
      set: (v) => (!v || v === 'none' || v === 'None' ? null : v),
    },
    isDefault: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Pending'],
      default: 'Published',
    },
    sortOrder: { type: Number, default: 0 },
    seo: seoFields,
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

blogCategorySchema.index({ name: 1 }, { unique: true });
blogCategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
blogCategorySchema.index({ parent: 1, sortOrder: 1 });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);
