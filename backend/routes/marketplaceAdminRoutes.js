const express = require('express');
const {
  listStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getMarketplaceReports,
  syncStoresFromVendors,
} = require('../controllers/marketplaceAdminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/reports', protect, authorize('admin'), getMarketplaceReports);
router.post('/stores/sync-vendors', protect, authorize('admin'), syncStoresFromVendors);
router.get('/stores', protect, authorize('admin'), listStores);
router.post('/stores', protect, authorize('admin'), createStore);
router.get('/stores/:id', protect, authorize('admin'), getStoreById);
router.put('/stores/:id', protect, authorize('admin'), updateStore);
router.delete('/stores/:id', protect, authorize('admin'), deleteStore);

module.exports = router;
