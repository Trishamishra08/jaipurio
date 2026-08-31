const express = require('express');
const router = express.Router();
const { getVendorOrders, getAdminOrders, updateOrderItemStatus, createOrder, getMyOrders, createRazorpayOrder, verifyRazorpayOrder, getOrderById, requestReturn, updateRefundDetails, adminUpdateReturn, quoteOrder } = require('../controllers/orderController');
const { acceptOrder, updateOrderTrack, updateShipmentTrack, completeOrder, releaseEarnings, listShipments } = require('../controllers/orderFlowController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/quote', quoteOrder);
router.post('/', protect, createOrder);
router.post('/razorpay/create', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayOrder);
router.get('/my-orders', protect, getMyOrders);

router.get('/vendor', protect, getVendorOrders);
router.get('/admin', protect, authorize('admin'), getAdminOrders);
router.get('/shipments', protect, listShipments);
router.post('/earnings/release', protect, releaseEarnings);
router.put('/:id/accept', protect, acceptOrder);
router.put('/:id/order-status', protect, updateOrderTrack);
router.put('/:id/shipment', protect, updateShipmentTrack);
router.put('/:id/complete', protect, completeOrder);
router.put('/:orderId/item/:itemId/status', protect, updateOrderItemStatus);

router.patch('/:id/request-return', protect, requestReturn);
router.patch('/:id/update-refund-details', protect, updateRefundDetails);
router.patch('/:id/admin-update-return', protect, authorize('admin'), adminUpdateReturn);

router.get('/:id', protect, getOrderById);

module.exports = router;
