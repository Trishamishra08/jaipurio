const express = require('express');
const router = express.Router();
const { updateStock, listInventory } = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, listInventory);
router.put('/:productId', protect, updateStock);

module.exports = router;
