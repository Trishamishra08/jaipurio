const mongoose = require('mongoose');

const blogTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Pending'],
      default: 'Published',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogTag', blogTagSchema);
