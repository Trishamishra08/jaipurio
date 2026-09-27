const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const { slugify } = require('../utils/seoFields');
const State = require('../models/stateModel');
const Country = require('../models/countryModel');

const router = express.Router();

router.use(
  '/',
  createAdminCrudRouter(State, {
    searchFields: ['name', 'slug', 'abbreviation', 'countryName'],
    defaultSort: { createdAt: -1 },
    beforeSave: async (payload, req, action) => {
      const next = { ...payload };
      if (next.name && !next.slug) next.slug = slugify(next.name);
      if (next.country) {
        const country = await Country.findById(next.country).lean();
        next.countryName = country?.name || '';
      }
      if (next.isDefault) {
        const excludeId = action === 'update' ? req.params.id : null;
        await State.updateMany(
          excludeId ? { _id: { $ne: excludeId } } : {},
          { $set: { isDefault: false } }
        );
      }
      return next;
    },
  })
);

module.exports = router;
