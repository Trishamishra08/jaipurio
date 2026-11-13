const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  saveDevice,
  removeDevice,
  getPreferences,
  updatePreferences,
  sendChatNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// Inbox (customer, seller or admin — role comes from the login token)
router.get('/me', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/mark-all-read', protect, markAllRead);
router.patch('/:id/read', protect, markAsRead);

// Push devices
router.post('/devices', protect, saveDevice);
router.delete('/devices', protect, removeDevice);
router.post('/save-fcm-token', protect, saveDevice); // legacy name
router.post('/remove-fcm-token', protect, removeDevice); // legacy name

// Preferences
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

// Chat push (sender must belong to the conversation)
router.post('/chat', protect, sendChatNotification);

module.exports = router;
