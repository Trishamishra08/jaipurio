const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  subscribe,
  unsubscribe,
  listSubscribers,
  updateSubscriber,
  deleteSubscriber,
} = require('../controllers/newsletterController');

const router = express.Router();

// Public: storefront footer signup / unsubscribe link.
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

router.use(protect, authorize('admin'));
router.get('/', listSubscribers);
router.put('/:id', updateSubscriber);
router.patch('/:id', updateSubscriber);
router.delete('/:id', deleteSubscriber);

module.exports = router;
