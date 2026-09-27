const mongoose = require('mongoose');

const MENU_LOCATIONS = ['Main Navigation', 'Header Navigation', 'Footer Menu'];

const menuItemSchema = new mongoose.Schema(
  {
    parentId: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    url: { type: String, default: '' },
    itemType: {
      type: String,
      enum: ['page', 'product-category', 'brand', 'category', 'tag', 'custom-link'],
      default: 'custom-link',
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    icon: { type: String, default: '' },
    iconImage: { type: String, default: '' },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { _id: true, timestamps: false }
);

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
    locations: { type: [String], default: [] },
    items: { type: [menuItemSchema], default: [] },
  },
  { timestamps: true }
);

menuSchema.statics.LOCATIONS = MENU_LOCATIONS;

module.exports = mongoose.model('Menu', menuSchema);
module.exports.MENU_LOCATIONS = MENU_LOCATIONS;
