const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getAdminBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  listTags,
  createTag,
  listUiBlocks,
} = require('../controllers/blogController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { cachePublic } = require('../utils/cache');

router.route('/').get(cachePublic('blogs', 180), getBlogs).post(protect, authorize('admin'), createBlog);

router.route('/admin').get(protect, authorize('admin'), getAdminBlogs);

router.get('/slug/:slug', cachePublic('blogs', 180), getBlogBySlug);

router
  .route('/categories')
  .get(protect, authorize('admin'), listCategories)
  .post(protect, authorize('admin'), createCategory);

router.post('/categories/reorder', protect, authorize('admin'), reorderCategories);

router
  .route('/categories/:id')
  .get(protect, authorize('admin'), getCategoryById)
  .put(protect, authorize('admin'), updateCategory)
  .patch(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

router
  .route('/tags')
  .get(protect, authorize('admin'), listTags)
  .post(protect, authorize('admin'), createTag);

router.route('/ui-blocks').get(protect, authorize('admin'), listUiBlocks);

router
  .route('/:id')
  .get(cachePublic('blogs', 180), getBlogById)
  .put(protect, authorize('admin'), updateBlog)
  .patch(protect, authorize('admin'), updateBlog)
  .delete(protect, authorize('admin'), deleteBlog);

module.exports = router;
