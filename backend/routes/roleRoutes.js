const express = require('express');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const Role = require('../models/roleModel');

const router = express.Router();

router.use('/', createAdminCrudRouter(Role, { searchFields: ['name', 'description'] }));

module.exports = router;
