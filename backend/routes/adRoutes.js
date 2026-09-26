const express = require('express');
const crypto = require('crypto');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Ad = require('../models/adModel');
const { getAdSettings, getPublicAdSettings, updateAdSettings } = require('../controllers/adSettingController');
const { getByShortcode, trackClick } = require('../controllers/adShortcodeController');

const router = express.Router();

// Public — the storefront resolves/tracks ad shortcodes and reads AdSense settings without an admin session.
router.get('/settings/public', getPublicAdSettings);
router.get('/shortcode/:code', getByShortcode);
router.post('/shortcode/:code/click', trackClick);

router.use(protect, authorize('admin'));

router.route('/settings').get(getAdSettings).put(updateAdSettings);

const generateShortcode = () => crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);

router.use(
  '/',
  createAdminCrudRouter(Ad, {
    skipAuth: true,
    searchFields: ['title', 'slug', 'placement', 'shortcode'],
    beforeSave: async (payload, req, action) => {
      if (action === 'create' && !payload.shortcode) {
        payload.shortcode = generateShortcode();
      }
      return payload;
    },
  })
);

module.exports = router;
