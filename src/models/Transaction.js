const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['receive', 'give'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'quintal'],
    default: 'kg'
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  rateUnit: {
    type: String,
    enum: ['kg', 'quintal'],
    default: 'kg'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'deleted'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ customer: 1, date: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
