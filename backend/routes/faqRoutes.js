const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const { slugify } = require('../utils/seoFields');
const Faq = require('../models/faqModel');
const FaqCategory = require('../models/faqCategoryModel');

const router = express.Router();

router.use(protect, authorize('admin'));

router.use(
  '/categories',
  createAdminCrudRouter(FaqCategory, { skipAuth: true, searchFields: ['name', 'slug', 'description'] })
);

router.use(
  '/',
  createAdminCrudRouter(Faq, {
    skipAuth: true,
    searchFields: ['question', 'answer', 'categoryName'],
    beforeSave: async (payload) => {
      const next = { ...payload };
      if (next.question && !next.slug) next.slug = slugify(next.question);
      if (next.category) {
        const cat = await FaqCategory.findById(next.category).lean();
        next.categoryName = cat?.name || '';
      } else {
        next.category = null;
        next.categoryName = '';
      }
      return next;
    },
  })
);

module.exports = router;
