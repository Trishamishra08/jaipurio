const express = require('express');
const router = express.Router();
const { listPayouts, requestPayout, advancePayout, earningsSummary } = require('../controllers/payoutController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, listPayouts);
router.get('/earnings', protect, earningsSummary);
router.post('/request', protect, requestPayout);
router.put('/:id/advance', protect, advancePayout);

module.exports = router;
