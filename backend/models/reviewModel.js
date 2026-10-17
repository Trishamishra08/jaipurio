const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestName: {
    type: String,
    default: ''
  },
  guestEmail: {
    type: String,
    default: ''
  },
  // The order this review was written from (set for customer reviews — proves they bought it).
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  images: [{ type: String }],
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  adminReply: {
    type: String,
    default: ''
  },
  adminReplyAt: {
    type: Date
  },
  adminReplyBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// One review per customer per product (guest / admin-entered reviews have no user and are not limited).
reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);
// Ratings are computed per product / seller from approved reviews.
reviewSchema.index({ product: 1, isApproved: 1 });

module.exports = mongoose.model('Review', reviewSchema);
