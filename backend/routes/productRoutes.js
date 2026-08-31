const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  getVendorProducts,
  getAdminProducts,
  updateProductStatus,
  submitProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize, optionalProtect } = require('../middlewares/authMiddleware');
const { cachePublic } = require('../utils/cache');

router.get('/', cachePublic('products', 45), getProducts);
router.get('/vendor', protect, authorize('vendor'), getVendorProducts);
router.get('/admin', protect, authorize('admin'), getAdminProducts);
router.post('/', protect, createProduct);
router.put('/:id/status', protect, authorize('admin'), updateProductStatus);
router.put('/:id/submit', protect, submitProduct);
router.get('/:id', optionalProtect, getProductById);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
