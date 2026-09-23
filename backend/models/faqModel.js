const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    answer: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FaqCategory', default: null, index: true },
    categoryName: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faq', faqSchema);
