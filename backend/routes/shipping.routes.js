const express = require('express');
const router = express.Router();
const { 
  createShipping, 
  trackShipment, 
  getAdminShippingDetails, 
  cancelShipping,
  shiprocketWebhook
} = require('../controllers/shipping.controller');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Create a new shipment (usually called internally, but exposed here as API)
router.post('/create', protect, authorize('admin'), createShipping);

// Track a shipment (Customer or Admin)
router.get('/track/:orderId', protect, trackShipment);

// Get full shipping details including invoice/label (Admin only)
router.get('/admin/:orderId', protect, authorize('admin'), getAdminShippingDetails);

// Cancel a shipment (Admin only)
router.post('/cancel', protect, authorize('admin'), cancelShipping);

// Webhook for automatic status updates from Shiprocket
router.post('/webhook', shiprocketWebhook);

module.exports = router;
