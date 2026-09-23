const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createAdminCrudRouter } = require('../utils/crudFactory');
const PaymentMethod = require('../models/paymentMethodModel');
const {
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/paymentTransactionController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.use(
  '/methods',
  createAdminCrudRouter(PaymentMethod, { skipAuth: true, searchFields: ['name', 'code', 'description'] })
);

// Transactions and Logs are the same underlying collection: Transactions defaults to
// successful payments, Logs shows everything (including failed/initiated attempts).
router.get('/transactions', (req, res, next) => {
  if (!req.query.status) req.query.status = 'success';
  next();
}, listTransactions);
router.get('/logs', listTransactions);
router.get('/transactions/:id', getTransactionById);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

module.exports = router;
