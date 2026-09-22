const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const blogFaqSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: '' },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    categories: [{ type: String, trim: true }],
    category: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true }],
    author: { type: String, default: 'Admin' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Pending'],
      default: 'Published',
    },
    readTime: { type: String, default: '5 min' },
    faqs: [blogFaqSchema],
    seo: seoFields,
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    legacyId: { type: Number, index: true },
  },
  { timestamps: true }
);

blogSchema.pre('validate', function syncTitle() {
  if (!this.name && this.title) this.name = this.title;
  if (!this.title && this.name) this.title = this.name;
  if (!this.excerpt && this.description) this.excerpt = this.description;
  if (!this.description && this.excerpt) this.description = this.excerpt;
  if ((!this.categories || !this.categories.length) && this.category) {
    this.categories = [this.category];
  }
  if (!this.category && Array.isArray(this.categories) && this.categories[0]) {
    this.category = this.categories[0];
  }
});

module.exports = mongoose.model('Blog', blogSchema);
