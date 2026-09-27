const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listWidgets, createWidget, updateWidget, reorderWidgets, deleteWidget, getWidgetSources,
} = require('../controllers/widgetController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/meta/sources', getWidgetSources);
router.put('/reorder', reorderWidgets);
router.route('/').get(listWidgets).post(createWidget);
router.route('/:id').put(updateWidget).delete(deleteWidget);

module.exports = router;
