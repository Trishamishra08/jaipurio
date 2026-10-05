const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize, requirePermission } = require('../middlewares/authMiddleware');
const { cachePublic } = require('../utils/cache');

router.route('/')
  .get(cachePublic('settings', 300), getSettings)
  .put(protect, authorize('admin'), requirePermission('manage_settings'), updateSettings);

module.exports = router;
