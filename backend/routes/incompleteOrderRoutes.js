const express = require('express');
const router = express.Router();
const { listIncompleteOrders, createIncompleteOrder } = require('../controllers/incompleteOrderController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, listIncompleteOrders);
router.post('/', protect, createIncompleteOrder);

module.exports = router;
