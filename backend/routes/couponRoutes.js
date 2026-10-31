const express = require('express');
const router = express.Router();
const {
    getCoupons,
    getPublicCoupons,
    validateCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controllers/couponController');
const { cachePublic } = require('../utils/cache');
const { protect, authorize } = require('../middlewares/authMiddleware');
const adminOnly = [protect, authorize('admin')];

router.get('/public', cachePublic('coupons', 60), getPublicCoupons);
router.post('/validate', validateCoupon);

router.route('/')
    .get(...adminOnly, getCoupons)
    .post(...adminOnly, createCoupon);

router.route('/:id')
    .patch(...adminOnly, updateCoupon)
    .delete(...adminOnly, deleteCoupon);

module.exports = router;
