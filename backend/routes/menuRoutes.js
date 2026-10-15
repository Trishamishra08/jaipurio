const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu, getMenuSources, getPublicMenu,
} = require('../controllers/menuController');

const router = express.Router();

// Public: the storefront reads the menu assigned to a location (e.g. the mobile drawer).
router.get('/public/:location', getPublicMenu);

router.use(protect, authorize('admin'));

router.get('/meta/sources', getMenuSources);
router.route('/').get(listMenus).post(createMenu);
router.route('/:id').get(getMenu).put(updateMenu).delete(deleteMenu);

module.exports = router;
