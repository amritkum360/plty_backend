const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poultry_admin');
    console.log('Connected to MongoDB for seeding data');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@poultry.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create sample customers
    const customers = [
      {
        name: 'Rajesh Kumar Meat Shop',
        phone: '+91 98765 43210',
        address: 'Shop No. 15, Gandhi Market, Sector 12, Delhi - 110001',
        creditLimit: 50000,
        notes: 'Regular customer, good payment history'
      },
      {
        name: 'Amit Singh Poultry',
        phone: '+91 87654 32109',
        address: 'Plot No. 45, Industrial Area, Gurgaon - 122001',
        creditLimit: 75000,
        notes: 'Bulk orders, weekly delivery'
      },
      {
        name: 'Suresh Patel Food Store',
        phone: '+91 76543 21098',
        address: 'Main Road, Old City, Mumbai - 400001',
        creditLimit: 30000,
        notes: 'Small orders, daily delivery'
      }
    ];

    const savedCustomers = await Customer.insertMany(customers);
    console.log('Created sample customers');

    // Create sample transactions
    const transactions = [
      {
        customer: savedCustomers[0]._id,
        weight: 250,
        weightUnit: 'kg',
        rate: 180,
        rateUnit: 'kg',
        totalAmount: 45000,
        status: 'pending',
        notes: 'Fresh chicken delivery'
      },
      {
        customer: savedCustomers[0]._id,
        weight: 150,
        weightUnit: 'kg',
        rate: 185,
        rateUnit: 'kg',
        totalAmount: 27750,
        status: 'paid',
        notes: 'Premium quality chicken'
      },
      {
        customer: savedCustomers[1]._id,
        weight: 500,
        weightUnit: 'kg',
        rate: 175,
        rateUnit: 'kg',
        totalAmount: 87500,
        status: 'pending',
        notes: 'Bulk order for restaurant'
      },
      {
        customer: savedCustomers[2]._id,
        weight: 50,
        weightUnit: 'kg',
        rate: 190,
        rateUnit: 'kg',
        totalAmount: 9500,
        status: 'paid',
        notes: 'Small order for local shop'
      }
    ];

    await Transaction.insertMany(transactions);
    console.log('Created sample transactions');

    console.log('Data seeding completed successfully!');
    console.log('\nSample Login Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
