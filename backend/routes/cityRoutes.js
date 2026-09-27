const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const { slugify } = require('../utils/seoFields');
const City = require('../models/cityModel');
const State = require('../models/stateModel');

const router = express.Router();

router.use(
  '/',
  createAdminCrudRouter(City, {
    searchFields: ['name', 'slug', 'stateName', 'countryName'],
    defaultSort: { createdAt: -1 },
    beforeSave: async (payload, req, action) => {
      const next = { ...payload };
      if (next.name && !next.slug) next.slug = slugify(next.name);
      if (next.state) {
        const state = await State.findById(next.state).lean();
        next.stateName = state?.name || '';
        next.country = state?.country || next.country;
        next.countryName = state?.countryName || next.countryName || '';
      }
      if (next.isDefault) {
        const excludeId = action === 'update' ? req.params.id : null;
        await City.updateMany(
          excludeId ? { _id: { $ne: excludeId } } : {},
          { $set: { isDefault: false } }
        );
      }
      return next;
    },
  })
);

module.exports = router;
