const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu, getMenuSources,
} = require('../controllers/menuController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/meta/sources', getMenuSources);
router.route('/').get(listMenus).post(createMenu);
router.route('/:id').get(getMenu).put(updateMenu).delete(deleteMenu);

module.exports = router;
