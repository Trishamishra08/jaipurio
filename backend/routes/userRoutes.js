const express = require('express');
const { signup, login, sendRegisterOtp, register, sendOtp, verifyOtp, getMe, updateProfile, addAddress, updateAddress, deleteAddress, getUsers, getBlockedUsers, blockUser, unblockUser, updatePassword, getLoginActivity } = require('../controllers/userController');
const { protect, authorize, requirePermission } = require('../middlewares/authMiddleware');
const { otpMobileLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), requirePermission('manage_users'), getUsers);

router.get('/blocked', protect, authorize('admin'), requirePermission('manage_users'), getBlockedUsers);
router.put('/:id/block', protect, authorize('admin'), requirePermission('manage_users'), blockUser);
router.put('/:id/unblock', protect, authorize('admin'), requirePermission('manage_users'), unblockUser);

router.post('/signup', signup);
router.post('/login', login);

router.post('/send-register-otp', otpMobileLimiter, sendRegisterOtp);
router.post('/register', register);

router.post('/send-otp', otpMobileLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);

router.route('/profile')
  .get(protect, getMe)
  .put(protect, updateProfile);

router.patch('/update-password', protect, updatePassword);
router.get('/login-activity', protect, getLoginActivity);

router.route('/addresses')
  .post(protect, addAddress);

router.route('/addresses/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;
