const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
// const fetch = require('node-fetch'); 
const axios = require('axios')

// Get all customers with optional search and pagination
const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }
    
    const skip = (page - 1) * limit;
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCustomers: total,
        hasNext: skip + customers.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error while fetching customers' });
  }
};

// Get single customer by ID with transaction summary
const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get customer's transaction summary
    const transactions = await Transaction.find({ customer: id, status: { $ne: 'deleted' } })
      .sort({ date: -1 })
      .limit(10);
    
    // Calculate statistics
    const totalPurchases = await Transaction.aggregate([
      { $match: { customer: customer._id, type: 'receive', status: { $ne: 'deleted' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const outstandingBalance = await Transaction.aggregate([
      { $match: { customer: customer._id, status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Alternative calculation using type field for outstanding balance
    const outstandingBalanceByType = await Transaction.aggregate([
      { $match: { customer: customer._id, type: 'give', status: { $ne: 'deleted' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    

    
    const lastTransaction = await Transaction.findOne({ customer: customer._id, status: { $ne: 'deleted' } })
      .sort({ date: -1 })
      .select('date status totalAmount');
    
    const customerData = {
      ...customer.toObject(),
      totalPurchases: totalPurchases[0]?.total || 0,
      outstandingBalance: outstandingBalanceByType[0]?.total || outstandingBalance[0]?.total || 0,
      lastTransaction: lastTransaction ? {
        date: lastTransaction.date,
        status: lastTransaction.status,
        amount: lastTransaction.totalAmount
      } : null,
      recentTransactions: transactions
    };
    
    res.json({ customer: customerData });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error while fetching customer' });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, creditLimit, notes } = req.body;
    
    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }
    
    const customer = new Customer({
      name,
      phone,
      address,
      creditLimit: creditLimit || 0,
      notes
    });
    
    await customer.save();
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error while creating customer' });
  }
};



// const createCustomer = async (req, res) => {
//   try {
//     const { name, phone, address, creditLimit, notes } = req.body;

//     // Check if customer with same phone already exists
//     const existingCustomer = await Customer.findOne({ phone });
//     if (existingCustomer) {
//       return res.status(400).json({ message: 'Customer with this phone number already exists' });
//     }

//     const customer = new Customer({
//       name,
//       phone,
//       address,
//       creditLimit: creditLimit || 0,
//       notes
//     });

//     await customer.save();

//     // 🔹 N8N Webhook call using axios
//     axios.post('https://n8n.srv926439.hstgr.cloud/webhook-test/newcustomer_added', {
//       message: name,
//       phone,
//       address
//     })
//     .then(() => console.log("Webhook sent successfully"))
//     .catch(err => console.error("Webhook error:", err));

//     res.status(201).json({
//       message: 'Customer created successfully',
//       customer
//     });
//   } catch (error) {
//     console.error('Create customer error:', error);
//     res.status(500).json({ message: 'Server error while creating customer' });
//   }
// };



// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error while updating customer' });
  }
};

// Delete customer (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({
      message: 'Customer deleted successfully',
      customer
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error while deleting customer' });
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const activeCustomers = await Customer.countDocuments({ isActive: true });
    const inactiveCustomers = await Customer.countDocuments({ isActive: false });
    
    // Get customers with outstanding balance
    const customersWithOutstanding = await Transaction.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: '$customer', totalOutstanding: { $sum: '$totalAmount' } } },
      { $count: 'count' }
    ]);
    
    const outstandingCustomers = customersWithOutstanding[0]?.count || 0;
    
    res.json({
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      outstandingCustomers
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ message: 'Server error while fetching customer statistics' });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};
