const mongoose = require('mongoose');

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
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  path: { type: String, default: '' },
  level: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

categorySchema.index({ title: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
