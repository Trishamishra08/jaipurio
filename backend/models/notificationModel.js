const mongoose = require('mongoose');
const { CATEGORIES } = require('../services/notificationEvents');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'alert'],
    default: 'info'
  },
  targetRole: {
    type: String,
    enum: ['admin', 'vendor', 'user', 'all'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null  // null means broadcast to all of the targetRole
  },
  // Event key from services/notificationEvents.js (e.g. 'order.shipped'); '' for manual broadcasts.
  event: { type: String, default: '' },
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'general'
  },
  // Relative URL the notification opens (e.g. /orders, /vendor/orders).
  link: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, default: undefined },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedModel: {
    type: String,
    default: null
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId
  }]
}, {
  timestamps: true
});

notificationSchema.index({ targetRole: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
