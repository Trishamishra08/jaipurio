const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          ...review,
          review: review.comment
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Items this customer has actually RECEIVED (item delivered, shipment delivered
 * or order completed; never cancelled ones). Only these can be reviewed.
 * Pass productId to look at a single product.
 */
const receivedItemsFor = async (userId, productId = null) => {
  const query = { user: userId };
  if (productId) query['orderItems.product'] = productId;
  const orders = await Order.find(query).select('orderItems orderStatus shipment orderNumber createdAt').lean();
  const received = [];
  orders.forEach((order) => {
    (order.orderItems || []).forEach((item) => {
      if (!item.product) return;
      if (productId && String(item.product) !== String(productId)) return;
      const delivered =
        item.status === 'Delivered' ||
        order.orderStatus === 'Completed' ||
        (order.shipment && order.shipment.status === 'Delivered');
      if (delivered && item.status !== 'Cancelled') {
        received.push({
          order: order._id,
          orderNumber: order.orderNumber,
          product: item.product,
          name: item.name,
          image: item.image || '',
        });
      }
    });
  });
  return received;
};

const validProductId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

// @desc    Can the logged-in customer review this product, and if not, why?
// @route   GET /api/reviews/eligibility/:productId
// @access  Private
const checkEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product.' });
    if (await Review.exists({ user: req.user._id, product: productId })) {
      return res.status(200).json({ success: true, data: { canReview: false, reason: 'already-reviewed' } });
    }
    const received = await receivedItemsFor(req.user._id, productId);
    if (!received.length) {
      return res.status(200).json({ success: true, data: { canReview: false, reason: 'not-purchased' } });
    }
    res.status(200).json({ success: true, data: { canReview: true, reason: null } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    A customer reviews a product they bought and received (held for admin approval)
// @route   POST /api/reviews   { product, rating (1-5), review | comment }
// @access  Private
const createReview = async (req, res) => {
  try {
    const productId = req.body.product;
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Please choose a product to review.' });

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Please give a rating from 1 to 5 stars.' });
    }
    const comment = String(req.body.review ?? req.body.comment ?? '').trim();
    if (comment.length < 3) return res.status(400).json({ success: false, message: 'Please share a few words about your experience.' });
    if (comment.length > 2000) return res.status(400).json({ success: false, message: 'Your review is too long (2000 characters at most).' });

    const product = await Product.findById(productId).select('vendor').lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Only customers who actually received this product can review it
    const received = await receivedItemsFor(req.user._id, productId);
    if (!received.length) {
      return res.status(403).json({ success: false, message: 'Only customers who have received this product can review it.' });
    }
    if (await Review.exists({ user: req.user._id, product: productId })) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = await Review.create({
      product: productId,
      vendor: product.vendor || undefined,
      user: req.user._id,
      order: received[0].order,
      rating,
      comment,
      isApproved: false, // shown on the store only after an admin approves it
    });

    res.status(201).json({
      success: true,
      status: 'success',
      message: 'Thank you! Your review will appear on the product once it has been approved.',
      data: { review: { id: String(review._id), rating: review.rating, status: 'Pending' } },
    });
  } catch (error) {
    // two requests at once: the unique (user, product) index catches the second
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    The customer's own reviews, plus received products still waiting for a review
// @route   GET /api/reviews/mine
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name title image')
      .sort({ createdAt: -1 })
      .lean();
    const reviewedIds = new Set(reviews.map((r) => String(r.product && r.product._id ? r.product._id : r.product)));

    const received = await receivedItemsFor(req.user._id);
    const seen = new Set();
    const toReview = received.filter((item) => {
      const key = String(item.product);
      if (reviewedIds.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: String(r._id),
          productId: r.product ? String(r.product._id || r.product) : '',
          productName: (r.product && (r.product.name || r.product.title)) || 'Product',
          image: (r.product && r.product.image) || '',
          rating: r.rating,
          comment: r.comment,
          status: r.isApproved ? 'Approved' : 'Pending',
          adminReply: r.adminReply || '',
          createdAt: r.createdAt,
        })),
        toReview: toReview.map((item) => ({
          productId: String(item.product),
          name: item.name,
          image: item.image,
          orderNumber: item.orderNumber,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProductReviews, createReview, getMyReviews, checkEligibility };
