const express = require('express');
const router = express.Router();
const {
  listPayouts,
  getPayoutById,
  requestPayout,
  updatePayout,
  advancePayout,
  deletePayout,
  earningsSummary,
} = require('../controllers/payoutController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, listPayouts);
router.get('/earnings', protect, earningsSummary);
router.post('/request', protect, authorize('vendor'), requestPayout);
router.get('/:id', protect, getPayoutById);
router.put('/:id', protect, authorize('admin'), updatePayout);
router.put('/:id/advance', protect, authorize('admin'), advancePayout);
router.delete('/:id', protect, authorize('admin'), deletePayout);

module.exports = router;
