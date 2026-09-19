const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { normalizeSeo, slugify } = require('./seoFields');

const serializeDoc = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = o._id ? String(o._id) : o.id;
  return o;
};

/**
 * Generic admin CRUD for ecommerce catalog entities.
 * Optimized: lean lists, projection-friendly, shared auth.
 */
const createCrudController = (Model, options = {}) => {
  const {
    searchFields = ['name', 'title', 'code', 'slug'],
    defaultSort = { updatedAt: -1 },
    beforeSave,
    mapListItem,
  } = options;

  const list = async (req, res) => {
    try {
      const q = String(req.query.q || req.query.search || '').trim();
      const status = req.query.status;
      const filter = {};
      if (status) filter.status = status;
      if (q && searchFields.length) {
        filter.$or = searchFields.map((f) => ({
          [f]: { $regex: q, $options: 'i' },
        }));
      }
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const skip = Math.max(Number(req.query.skip) || 0, 0);
      const [rows, total] = await Promise.all([
        Model.find(filter).sort(defaultSort).skip(skip).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      const data = rows.map((r) => {
        const item = serializeDoc(r);
        return mapListItem ? mapListItem(item) : item;
      });
      res.json({ success: true, data, total });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const getById = async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: serializeDoc(doc) });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const create = async (req, res) => {
    try {
      let payload = { ...req.body };
      delete payload._id;
      delete payload.id;
      if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
      if (payload.title && !payload.slug) payload.slug = slugify(payload.title);
      if (Model.schema.path('seo')) {
        payload.seo = normalizeSeo(payload, payload.name || payload.title || '', payload.description || '');
        payload.seoTitle = payload.seo.general.metaTitle;
        payload.seoDescription = payload.seo.general.metaDescription;
      }
      if (typeof beforeSave === 'function') payload = await beforeSave(payload, req, 'create');
      const doc = await Model.create(payload);
      res.status(201).json({ success: true, data: serializeDoc(doc) });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  const update = async (req, res) => {
    try {
      let payload = { ...req.body };
      delete payload._id;
      delete payload.id;
      delete payload.__v;
      delete payload.createdAt;
      if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
      if (Model.schema.path('seo')) {
        const existing = await Model.findById(req.params.id).lean();
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        payload.seo = normalizeSeo(
          { ...existing, ...payload, seo: payload.seo || existing.seo },
          payload.name || existing.name || payload.title || existing.title || '',
          payload.description || existing.description || ''
        );
        payload.seoTitle = payload.seo.general.metaTitle;
        payload.seoDescription = payload.seo.general.metaDescription;
        if (!payload.slug && payload.seo.general.slug) payload.slug = payload.seo.general.slug;
      }
      if (typeof beforeSave === 'function') payload = await beforeSave(payload, req, 'update');
      const doc = await Model.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: serializeDoc(doc) });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  const remove = async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: { id: String(doc._id) } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  return { list, getById, create, update, remove };
};

const createAdminCrudRouter = (Model, options = {}) => {
  const router = express.Router();
  const ctrl = createCrudController(Model, options);
  if (!options.skipAuth) {
    router.use(protect, authorize('admin'));
  }
  router.get('/', ctrl.list);
  router.get('/:id', ctrl.getById);
  router.post('/', ctrl.create);
  router.put('/:id', ctrl.update);
  router.delete('/:id', ctrl.remove);
  return router;
};

module.exports = { createCrudController, createAdminCrudRouter, serializeDoc };
