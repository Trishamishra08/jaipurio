const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listSliders,
  getSlider,
  createSlider,
  updateSlider,
  deleteSlider,
  resolveSliderByKey,
} = require('../controllers/simpleSliderController');

const router = express.Router();

// Public — the storefront resolves a slider's slides by shortcode key without an admin session.
router.get('/resolve/:key', resolveSliderByKey);

router.use(protect, authorize('admin'));

router.route('/').get(listSliders).post(createSlider);
router.route('/:id').get(getSlider).put(updateSlider).delete(deleteSlider);

module.exports = router;
