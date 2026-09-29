const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const { slugify } = require('../utils/seoFields');
const Faq = require('../models/faqModel');
const FaqCategory = require('../models/faqCategoryModel');

const router = express.Router();

// Vendors need read-only access to the reusable FAQ library so the product
// editor can let them attach existing FAQs instead of only writing new ones.
// Registered before the blanket admin-only gate below so this GET matches
// first; full CRUD (create/update/delete) further down stays admin-only.
router.get('/', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const filter = {
      ...(req.user.role === 'vendor' ? { status: 'Published' } : {}),
      ...(q ? { question: { $regex: q, $options: 'i' } } : {}),
    };
    const rows = await Faq.find(filter).sort({ sortOrder: 1, updatedAt: -1 }).lean();
    res.json({ success: true, data: rows.map((r) => ({ ...r, id: String(r._id) })), total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
