const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getProductReviews,
  createReview,
  getMyReviews,
  checkEligibility,
} = require('../controllers/reviewController');

// Public: approved reviews of a product
router.get('/product/:productId', getProductReviews);

// Customer (logged in): write a review, see my reviews, check if I may review a product
router.post('/', protect, createReview);
router.get('/mine', protect, getMyReviews);
router.get('/eligibility/:productId', protect, checkEligibility);

module.exports = router;
