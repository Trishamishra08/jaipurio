const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const ContactCustomField = require('../models/contactCustomFieldModel');
const {
  submitContact,
  listContacts,
  getContactById,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

const router = express.Router();

// Public: anyone can submit the contact form.
router.post('/', submitContact);

router.use(protect, authorize('admin'));

router.use(
  '/custom-fields',
  createAdminCrudRouter(ContactCustomField, { skipAuth: true, searchFields: ['name', 'label', 'slug'] })
);

router.get('/', listContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.patch('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router;
