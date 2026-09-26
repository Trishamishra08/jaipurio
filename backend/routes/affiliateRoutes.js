const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Affiliate = require('../models/affiliateModel');

const router = express.Router();

router.use('/', createAdminCrudRouter(Affiliate, { searchFields: ['name', 'email'] }));

module.exports = router;
