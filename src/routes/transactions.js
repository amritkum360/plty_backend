const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getTransactionStats,
  updateExistingTransactions
} = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Transaction routes
router.get('/', getTransactions);
router.get('/stats', getTransactionStats);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.patch('/:id/status', updateTransactionStatus);
router.delete('/:id', deleteTransaction);
router.post('/update-existing', updateExistingTransactions);

module.exports = router;
