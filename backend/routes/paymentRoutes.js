const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/paymentTransactionController');
const {
  listMethods,
  listPublicMethods,
  toggleMethod,
  saveMethodConfig,
  setDefaultMethod,
  listAvailableGateways,
  createMethod,
  deleteMethod,
} = require('../controllers/paymentMethodController');

const router = express.Router();

// Public — checkout needs this without an admin session.
router.get('/methods/public', listPublicMethods);

router.use(protect, authorize('admin'));

router.get('/methods', listMethods);
router.get('/methods/available', listAvailableGateways);
router.post('/methods', createMethod);
router.put('/methods/:id/toggle', toggleMethod);
router.put('/methods/:id/config', saveMethodConfig);
router.put('/methods/:id/default', setDefaultMethod);
router.delete('/methods/:id', deleteMethod);

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
