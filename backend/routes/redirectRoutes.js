const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Redirect = require('../models/redirectModel');

const router = express.Router();

router.use('/', createAdminCrudRouter(Redirect, { searchFields: ['from', 'to'] }));

module.exports = router;
