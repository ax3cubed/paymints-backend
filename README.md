# EVLINK Backend API

The EVLINK Backend API is a robust TypeScript-based server application that powers the EVLINK Payment Management System. This API handles user authentication, transactions, service purchases, and administrative functions.

## Tech Stack

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Fastify** - High-performance web framework
- **TypeORM** - ORM for database interactions
- **PostgreSQL/MySQL** - Database
- **Class Validator** - Input validation
- **JWT** - Authentication

## Features

- **Authentication** - Secure user login, registration, and token management
- **User Management** - User accounts, profiles, and permissions
- **Transaction Processing** - Handles all financial transactions
- **Service Integrations**:
  - Airtime purchase for all major networks
  - Data plan purchases
  - Cable TV subscription payments
  - Electricity bill payments
  - Exam fee payments
- **Admin Features** - User management, pricing configuration, system settings
- **Wallet System** - Balance management and transaction history

## Project Structure

```
src/
├── controllers/       # Request handlers
├── entities/          # TypeORM entities
├── middlewares/       # Custom middleware functions
├── migrations/        # Database migrations
├── routes/            # API route definitions
├── services/          # Business logic
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── validators/        # Request validation schemas
├── index.ts           # Application entry point
└── database.ts        # Database configuration
```

## Key Entities

- **User** - User accounts and authentication
- **Transaction** - Financial transaction records
- **Airtime** - Airtime purchase configurations
- **DataPlan** - Data plan packages
- **CablePlan** - Cable TV subscription packages
- **Exam** - Examination fee configurations
- **PricingConfig** - System-wide pricing configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL or MySQL database
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/evlink-backend-api.git
cd evlink-backend-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration and API keys

# Run database migrations
npm run migration:run

# Seed the database with initial data
npm run seed

# Start the development server
npm run dev
```

### Environment Variables

Create a .env file with the following variables:

```
# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=evlink

# Server
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Third-party API keys
PAYMENT_API_KEY=your-payment-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh authentication token
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Airtime
- `GET /api/airtime/pricing` - Get airtime pricing
- `POST /api/airtime/purchase` - Purchase airtime
- `POST /api/airtime/validate-phone` - Validate phone number

### Data Plans
- `GET /api/data/plans` - Get data plans
- `GET /api/data/plans/:id` - Get data plan by ID
- `POST /api/data/purchase` - Purchase data plan

### Cable Plans
- `GET /api/cable/plans` - Get cable plans
- `GET /api/cable/plans/:id` - Get cable plan by ID
- `POST /api/cable/purchase` - Purchase cable subscription
- `POST /api/cable/validate-smartcard` - Validate smartcard

### Exam Fees
- `GET /api/exam/types` - Get exam types
- `POST /api/exam/purchase` - Pay exam fee

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/pricing` - Get pricing configurations
- `PUT /api/admin/pricing` - Update pricing configurations
- `GET /api/admin/users` - Get all users
- `POST /api/admin/sync/data-plans` - Sync data plans
- `POST /api/admin/sync/cable-plans` - Sync cable plans

## Development

### Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeding the Database

```bash
# Run seed script
npm run seed
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build the project
npm run build

# Start production server
npm run start:prod
```

