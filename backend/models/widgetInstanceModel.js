const mongoose = require('mongoose');

const SIDEBAR_KEYS = [
  'primary', 'top-footer', 'footer', 'bottom-footer', 'products-list', 'product-detail',
];

const WIDGET_TYPES = [
  'simple-menu', 'text', 'ads', 'become-a-vendor', 'blog-categories', 'blog-search',
  'tags', 'custom-menu', 'newsletter-form', 'product-categories', 'recent-posts',
  'site-features', 'site-information',
];

const widgetInstanceSchema = new mongoose.Schema(
  {
    sidebarKey: { type: String, required: true, enum: SIDEBAR_KEYS, index: true },
    widgetType: { type: String, required: true, enum: WIDGET_TYPES },
    order: { type: Number, default: 0 },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

widgetInstanceSchema.index({ sidebarKey: 1, order: 1 });

module.exports = mongoose.model('WidgetInstance', widgetInstanceSchema);
module.exports.SIDEBAR_KEYS = SIDEBAR_KEYS;
module.exports.WIDGET_TYPES = WIDGET_TYPES;
