const express = require('express');
const router = express.Router();
const { getFinanceStats, updateEarningCommission, getAdminPayouts, clearVendorPayout, getDashboardStats, getUserAnalytics, getPendingCounts, clearCache, runCleanup } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Using basic protect and authorize for admin routes
// In production, ensure admin users have role 'admin'
router.route('/pending-counts').get(protect, authorize('admin'), getPendingCounts);
router.route('/dashboard-stats').get(protect, authorize('admin'), getDashboardStats);
router.route('/analytics').get(protect, authorize('admin'), getUserAnalytics);
router.route('/finance-stats').get(protect, authorize('admin'), getFinanceStats);
router.route('/finance/earnings/:id/commission').patch(protect, authorize('admin'), updateEarningCommission);
router.route('/clear-cache').post(protect, authorize('admin'), clearCache);
router.route('/cleanup').post(protect, authorize('admin'), runCleanup);

// Payouts routes
router.route('/payouts').get(protect, authorize('admin'), getAdminPayouts);
router.route('/payouts/:vendorId/clear').post(protect, authorize('admin'), clearVendorPayout);

// Reviews routes
const { getAdminReviews, createAdminReview, toggleReviewApproval, deleteReview, replyReview } = require('../controllers/adminController');
router.route('/reviews').get(protect, authorize('admin'), getAdminReviews).post(protect, authorize('admin'), createAdminReview);
router.route('/reviews/:id/toggle-approval').patch(protect, authorize('admin'), toggleReviewApproval);
router.route('/reviews/:id/reply').patch(protect, authorize('admin'), replyReview);
router.route('/reviews/:id').delete(protect, authorize('admin'), deleteReview);

// Testimonials routes
const { 
  getAdminTestimonials, 
  toggleTestimonialApproval, 
  createTestimonial,
  updateTestimonial,
  deleteTestimonial 
} = require('../controllers/adminController');
router.route('/testimonials').get(protect, authorize('admin'), getAdminTestimonials).post(protect, authorize('admin'), createTestimonial);
router.route('/testimonials/:id/toggle-approval').patch(protect, authorize('admin'), toggleTestimonialApproval);
router.route('/testimonials/:id').patch(protect, authorize('admin'), updateTestimonial).delete(protect, authorize('admin'), deleteTestimonial);

// Notifications routes (admin)
const { getAdminNotifications, createNotification, deleteNotification } = require('../controllers/notificationController');
router.route('/notifications').get(protect, authorize('admin'), getAdminNotifications).post(protect, authorize('admin'), createNotification);
router.route('/notifications/:id').delete(protect, authorize('admin'), deleteNotification);

module.exports = router;
