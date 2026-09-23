const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Ad = require('../models/adModel');
const { getAdSettings, updateAdSettings } = require('../controllers/adSettingController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/settings').get(getAdSettings).put(updateAdSettings);

router.use('/', createAdminCrudRouter(Ad, { skipAuth: true, searchFields: ['title', 'slug', 'placement'] }));

module.exports = router;
