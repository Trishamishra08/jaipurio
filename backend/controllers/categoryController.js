const Category = require('../models/categoryModel');
const { invalidateCatalog } = require('../utils/cache');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin only - ideally)
const createCategory = async (req, res, next) => {
  try {
    const { title, url, parent } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Please provide a title');
    }

    let pathLabel = title;
    let level = 1;
    if (parent) {
      const parentCat = await Category.findById(parent);
      if (parentCat) {
        pathLabel = `${parentCat.path || parentCat.title} / ${title}`;
        level = (parentCat.level || 1) + 1;
      }
    }

    const category = await Category.create({
      title,
      url: url || '',
      parent: parent || null,
      path: pathLabel,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      level,
    });

    invalidateCatalog('categories').catch(() => {});
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).lean();
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    invalidateCatalog('categories').catch(() => {});
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    await category.deleteOne();

    invalidateCatalog('categories').catch(() => {});
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
