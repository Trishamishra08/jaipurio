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

// Pincode → city / state for the checkout address form (India Post data, cached in memory)
const pincodeCache = new Map();
router.get('/pincode/:pin', async (req, res) => {
  const pin = String(req.params.pin || '');
  if (!/^[1-9]\d{5}$/.test(pin)) return res.status(400).json({ success: false, message: 'Enter a valid 6-digit pincode' });
  if (pincodeCache.has(pin)) return res.json({ success: true, data: pincodeCache.get(pin) });
  try {
    const { data } = await require('axios').get(`https://api.postalpincode.in/pincode/${pin}`, { timeout: 8000 });
    const offices = data?.[0]?.Status === 'Success' ? data[0].PostOffice || [] : [];
    if (!offices.length) return res.status(404).json({ success: false, message: 'Pincode not found' });
    const result = { pincode: pin, city: offices[0].District, state: offices[0].State };
    if (pincodeCache.size > 5000) pincodeCache.clear();
    pincodeCache.set(pin, result);
    res.json({ success: true, data: result });
  } catch {
    res.status(502).json({ success: false, message: 'Pincode lookup is unavailable right now' });
  }
});

module.exports = router;
