const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const { cachePublic } = require('../utils/cache');
const Country = require('../models/countryModel');

const router = express.Router();

// Public read (checkout/shipping forms can use this without admin auth).
router.get('/public', cachePublic('countries', 3600), async (req, res) => {
  try {
    const rows = await Country.find({ isActive: true, status: 'Published' })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use('/', createAdminCrudRouter(Country, { searchFields: ['name', 'code', 'dialCode'] }));

module.exports = router;
