const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');

const EcommerceBrand = require('../models/ecommerceBrandModel');
const EcommerceProductTag = require('../models/ecommerceProductTagModel');
const EcommerceProductCollection = require('../models/ecommerceProductCollectionModel');
const EcommerceProductLabel = require('../models/ecommerceProductLabelModel');
const EcommerceProductOption = require('../models/ecommerceProductOptionModel');
const EcommerceAttributeSet = require('../models/ecommerceAttributeSetModel');
const EcommerceFlashSale = require('../models/ecommerceFlashSaleModel');
const EcommerceDiscount = require('../models/ecommerceDiscountModel');
const EcommerceSpecificationGroup = require('../models/ecommerceSpecificationGroupModel');
const EcommerceSpecificationAttribute = require('../models/ecommerceSpecificationAttributeModel');
const EcommerceSpecificationTable = require('../models/ecommerceSpecificationTableModel');
const EcommerceInvoice = require('../models/ecommerceInvoiceModel');

const {
  getReports,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  syncInvoicesFromOrders,
} = require('../controllers/ecommerceController');

const {
  listForCategory,
  assignAttribute,
  updateAssignment,
  removeAssignment,
  reorderAssignments,
} = require('../controllers/categoryAttributeController');

const router = express.Router();
const crudOpts = { skipAuth: true };

router.use(protect, authorize('admin'));

router.get('/reports', getReports);

const categoryAttributesRouter = express.Router({ mergeParams: true });
categoryAttributesRouter.get('/', listForCategory);
categoryAttributesRouter.post('/', assignAttribute);
categoryAttributesRouter.post('/reorder', reorderAssignments);
categoryAttributesRouter.put('/:assignmentId', updateAssignment);
categoryAttributesRouter.delete('/:assignmentId', removeAssignment);
router.use('/categories/:categoryId/attributes', categoryAttributesRouter);
router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.post('/invoices/sync', syncInvoicesFromOrders);

router.use('/brands', createAdminCrudRouter(EcommerceBrand, { ...crudOpts, searchFields: ['name', 'slug', 'website'] }));
router.use(
  '/product-tags',
  createAdminCrudRouter(EcommerceProductTag, { ...crudOpts, searchFields: ['name', 'slug'] })
);
router.use(
  '/product-collections',
  createAdminCrudRouter(EcommerceProductCollection, { ...crudOpts, searchFields: ['name', 'slug'] })
);
router.use(
  '/product-labels',
  createAdminCrudRouter(EcommerceProductLabel, { ...crudOpts, searchFields: ['name', 'slug'] })
);
router.use(
  '/product-options',
  createAdminCrudRouter(EcommerceProductOption, { ...crudOpts, searchFields: ['name', 'slug'] })
);
router.use(
  '/product-attribute-sets',
  createAdminCrudRouter(EcommerceAttributeSet, { ...crudOpts, searchFields: ['title', 'name', 'slug'] })
);
router.use('/flash-sales', createAdminCrudRouter(EcommerceFlashSale, { ...crudOpts, searchFields: ['name'] }));
router.use(
  '/discounts',
  createAdminCrudRouter(EcommerceDiscount, { ...crudOpts, searchFields: ['code', 'title', 'description'] })
);
router.use(
  '/specification-groups',
  createAdminCrudRouter(EcommerceSpecificationGroup, { ...crudOpts, searchFields: ['name', 'slug', 'description'] })
);
router.use(
  '/specification-attributes',
  createAdminCrudRouter(EcommerceSpecificationAttribute, {
    ...crudOpts,
    searchFields: ['name', 'slug', 'groupName', 'type'],
  })
);
router.use(
  '/specification-tables',
  createAdminCrudRouter(EcommerceSpecificationTable, {
    ...crudOpts,
    searchFields: ['name', 'slug', 'description'],
  })
);
router.use(
  '/invoices',
  createAdminCrudRouter(EcommerceInvoice, {
    ...crudOpts,
    searchFields: ['invoiceNumber', 'customerName', 'orderNumber'],
  })
);

module.exports = router;
