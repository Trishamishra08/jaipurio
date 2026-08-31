const express = require('express');
const router = express.Router();
const { listReturns, createReturn, advanceReturn, rejectReturn } = require('../controllers/returnController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, listReturns);
router.post('/', protect, createReturn);
router.put('/:id/advance', protect, advanceReturn);
router.put('/:id/reject', protect, rejectReturn);

module.exports = router;
