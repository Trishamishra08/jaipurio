const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    placement: {
      type: String,
      enum: ['Homepage Top', 'Homepage Sidebar', 'Category Page', 'Product Page', 'Footer', 'Blog'],
      default: 'Homepage Top',
    },
    description: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
    legacyId: { type: Number, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
