const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const pageFaqSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    template: {
      type: String,
      enum: ['Default', 'Homepage', 'Full Width', 'Coming Soon'],
      default: 'Default',
    },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Pending'],
      default: 'Published',
    },
    image: { type: String, default: '' },
    faqs: [pageFaqSchema],
    seo: seoFields,
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    legacyId: { type: Number, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Page', pageSchema);
