const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { bulkImportLocations, importCountryPreset, getExportData } = require('../controllers/locationImportExportController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/import', bulkImportLocations);
router.post('/import-country-preset', importCountryPreset);
router.get('/export-data', getExportData);

module.exports = router;
