const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Customer routes
router.get('/', getCustomers);
router.get('/stats', getCustomerStats);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
