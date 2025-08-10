const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

// Get all transactions with optional filters and pagination
const getTransactions = async (req, res) => {
  try {
    const { 
      customer, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      includeDeleted = false
    } = req.query;
    
    let query = {};
    
    // Customer filter
    if (customer) {
      query.customer = customer;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    } else if (includeDeleted !== 'true') {
      // By default, exclude deleted transactions unless includeDeleted is true
      query.status = { $ne: 'deleted' };
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .populate('customer', 'name phone')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNext: skip + transactions.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Get single transaction by ID
const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findById(id)
      .populate('customer', 'name phone address');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction' });
  }
};

// Create new transaction
const createTransaction = async (req, res) => {
  try {
    const { 
      customer, 
      type, // 'receive' or 'give'
      weight, 
      rate, 
      totalAmount, 
      description, // frontend sends 'description' instead of 'notes'
      date, // frontend sends combined date and time
      status
    } = req.body;
    
    // Validate customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Validate required fields
    if (!weight || !rate ) {
      return res.status(400).json({ message: 'Weight and rate are required' });
    }
    
    // Parse date from frontend format (YYYY-MM-DDTHH:mm:ss)
    let transactionDate = new Date();
    if (date) {
      transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }
    
    // Calculate total amount if not provided
    let calculatedAmount = totalAmount;
    if (!calculatedAmount && weight && rate) {
      calculatedAmount = parseFloat(weight) * parseFloat(rate);
    }

    // Determine status based on transaction type if not provided
    let transactionStatus = status;
    if (!transactionStatus) {
      if (type === 'receive') {
        transactionStatus = 'paid'; // When we receive (credit), it's already paid
      } else if (type === 'give') {
        transactionStatus = 'pending'; // When we give (debit), it's pending payment
      } else {
        transactionStatus = 'pending'; // Default fallback
      }
    }

    // If status is 'pending', treat it as 'give' (debit) transaction
    if (transactionStatus === 'pending' && !type) {
      type = 'give';
    }

    console.log('Transaction creation - type:', type);
    console.log('Transaction creation - status:', status);
    console.log('Transaction creation - final status:', transactionStatus);
    
    const transaction = new Transaction({
      customer,
      type: type, // Save the transaction type
      weight: parseFloat(weight),
      weightUnit: 'kg', // Default to kg as per frontend
      rate: parseFloat(rate),
      rateUnit: 'kg', // Default to kg as per frontend
      totalAmount: calculatedAmount,
      notes: description, // Map description to notes
      date: transactionDate,
      status: transactionStatus
    });
    
    await transaction.save();
    
    // Populate customer details for response
    await transaction.populate('customer', 'name phone');
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // If updating amount-related fields, recalculate total
    if (updates.weight || updates.rate || updates.weightUnit || updates.rateUnit) {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      const weight = updates.weight || transaction.weight;
      const weightUnit = updates.weightUnit || transaction.weightUnit;
      const rate = updates.rate || transaction.rate;
      const rateUnit = updates.rateUnit || transaction.rateUnit;
      
      // Recalculate total amount
      let calculatedAmount;
      if (weightUnit === 'quintal' && rateUnit === 'quintal') {
        calculatedAmount = weight * rate;
      } else if (weightUnit === 'kg' && rateUnit === 'kg') {
        calculatedAmount = weight * rate;
      } else {
        const weightInKg = weightUnit === 'quintal' ? weight * 100 : weight;
        const ratePerKg = rateUnit === 'quintal' ? rate / 100 : rate;
        calculatedAmount = weightInKg * ratePerKg;
      }
      
      updates.totalAmount = calculatedAmount;
    }
    
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('customer', 'name phone');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
};

// Update transaction status (mark as paid, overdue, etc.)
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, notes } = req.body;
    
    const updates = { status };
    if (paymentDate) updates.paymentDate = new Date(paymentDate);
    if (notes) updates.notes = notes;
    
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('customer', 'name phone');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({
      message: 'Transaction status updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ message: 'Server error while updating transaction status' });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByIdAndUpdate(
      id, 
      { status: 'deleted' },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({
      message: 'Transaction marked as deleted successfully',
      transaction
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error while marking transaction as deleted' });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }
    
    // Total transactions and amount
    const totalStats = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalTransactions: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);
    
    // Status-wise statistics
    const statusStats = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);
    
    // Monthly statistics
    const monthlyStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      totalStats: totalStats[0] || { totalTransactions: 0, totalAmount: 0 },
      statusStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction statistics' });
  }
};

// Update existing transactions to add type field (for migration)
const updateExistingTransactions = async (req, res) => {
  try {
    // Find all transactions without a type field
    const transactionsWithoutType = await Transaction.find({ type: { $exists: false } });
    
    console.log(`Found ${transactionsWithoutType.length} transactions without type field`);
    
    // Update transactions based on their status
    // If status is 'pending', treat as 'give' (debit), otherwise 'receive' (credit)
    const updateResult = await Transaction.updateMany(
      { type: { $exists: false } },
      [
        {
          $set: {
            type: {
              $cond: {
                if: { $eq: ['$status', 'pending'] },
                then: 'give',
                else: 'receive'
              }
            }
          }
        }
      ]
    );
    
    console.log(`Updated ${updateResult.modifiedCount} transactions`);
    
    res.json({
      message: `Updated ${updateResult.modifiedCount} transactions with appropriate type based on status`,
      updatedCount: updateResult.modifiedCount,
      totalFound: transactionsWithoutType.length
    });
  } catch (error) {
    console.error('Update existing transactions error:', error);
    res.status(500).json({ message: 'Server error while updating existing transactions' });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getTransactionStats,
  updateExistingTransactions
};
