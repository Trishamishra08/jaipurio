const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();
const { cachePublic } = require('../utils/cache');
const { protect, authorize } = require('../middlewares/authMiddleware');
const adminOnly = [protect, authorize('admin')];

router.route('/')
  .post(...adminOnly, createCategory)
  .get(cachePublic('categories', 300), getCategories);

router.route('/:id')
  .get(getCategoryById) // Get single category
  .put(...adminOnly, updateCategory)  // Edit category
  .delete(...adminOnly, deleteCategory); // Delete category

module.exports = router;
