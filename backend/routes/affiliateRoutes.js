const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Affiliate = require('../models/affiliateModel');
const { protect, authorize, requirePermission } = require('../middlewares/authMiddleware');
const {
  applyAffiliate,
  getMyAffiliate,
  updateMyAffiliate,
  getAffiliateEarnings,
  requestAffiliatePayout,
  listAffiliatePayouts,
  advanceAffiliatePayout,
} = require('../controllers/affiliateController');

const router = express.Router();

// Customer self-service — any logged-in customer, not admin-only.
router.post('/apply', protect, applyAffiliate);
router.get('/me', protect, getMyAffiliate);
router.put('/me', protect, updateMyAffiliate);
router.get('/earnings', protect, getAffiliateEarnings);
router.post('/payouts/request', protect, requestAffiliatePayout);

// Admin payout management — gated by the Phase 1 permission layer.
router.get('/payouts', protect, authorize('admin'), requirePermission('manage_affiliates'), listAffiliatePayouts);
router.put('/payouts/:id/advance', protect, authorize('admin'), requirePermission('manage_affiliates'), advanceAffiliatePayout);

// Existing admin CRUD (list/approve/reject applications) — unchanged.
router.use('/', createAdminCrudRouter(Affiliate, { searchFields: ['name', 'email'] }));

module.exports = router;
