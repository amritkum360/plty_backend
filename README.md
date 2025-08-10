# Poultry Admin Backend Server

A Node.js backend server for the Poultry Admin application with MongoDB database integration.

## Features

- **Authentication System**: JWT-based authentication with user registration and login
- **Customer Management**: CRUD operations for customers with search and pagination
- **Transaction Management**: Complete transaction tracking with weight, rate, and amount calculations
- **Role-based Access Control**: Admin and user roles with different permissions
- **RESTful API**: Clean and organized API endpoints
- **MongoDB Integration**: Mongoose ODM with proper indexing and relationships

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Cross-origin resource sharing enabled
- **Environment**: dotenv for configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd poultry_server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   - Copy `env.example` to `.env`
   - Update the values according to your setup:
     ```
     MONGODB_URI=mongodb://localhost:27017/poultry_admin
     JWT_SECRET=your_secure_jwt_secret_here
     PORT=5000
     NODE_ENV=development
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Customers
- `GET /api/customers` - Get all customers (with search, pagination)
- `GET /api/customers/stats` - Get customer statistics
- `GET /api/customers/:id` - Get specific customer with transaction summary
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Soft delete customer

### Transactions
- `GET /api/transactions` - Get all transactions (with filters, pagination)
- `GET /api/transactions/stats` - Get transaction statistics
- `GET /api/transactions/:id` - Get specific transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `PATCH /api/transactions/:id/status` - Update transaction status
- `DELETE /api/transactions/:id` - Delete transaction

## Database Models

### User
- username, email, password (hashed), role, isActive, timestamps

### Customer
- name, phone, address, creditLimit, isActive, notes, timestamps

### Transaction
- customer (reference), date, weight, weightUnit, rate, rateUnit, totalAmount, status, paymentDate, notes, timestamps

## Features

### Customer Management
- Search customers by name or phone
- Pagination support
- Soft delete functionality
- Credit limit tracking
- Customer statistics

### Transaction Management
- Automatic total amount calculation
- Support for different weight units (kg, quintal)
- Status tracking (pending, paid, overdue)
- Customer relationship linking
- Transaction statistics and reporting

### Authentication & Security
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API endpoints

## Development

The server runs on port 5000 by default. You can change this in the `.env` file.

### File Structure
```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Authentication middleware
├── models/          # MongoDB models
└── routes/          # API route definitions
```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "message": "Error description"
}
```

## Error Handling

The server includes comprehensive error handling:
- Validation errors
- Database connection errors
- Authentication errors
- 404 for undefined routes
- 500 for server errors

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Update documentation for new features

## License

ISC License
