# Catering Backend API

Node.js + TypeScript REST API backend for the catering management system.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── server.ts          # Application entry point
├── .env.example           # Environment variables template
├── package.json
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/catering_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# DeepL (optional, for auto-translating content)
DEEPL_AUTH_KEY="your-deepl-free-api-key"
DEEPL_API_URL="https://api-free.deepl.com/v2/translate"
DEEPL_AUTO_TRANSLATE_ON_READ="true"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### 3. Set Up Database

1. Create a MySQL database:
   ```sql
   CREATE DATABASE catering_db;
   ```

2. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
   If you are developing and need Prisma to create a new migration from schema changes, use:
   ```bash
   npm run prisma:migrate:dev
   ```

4. Seed the database:
   ```bash
   npm run seed
   ```

   Or restore from a SQL dump (defaults to `../../backup.sql` from `backend/`):
   ```bash
   npm run seed:backup
   ```
   You can also pass a custom file:
   ```bash
   npm run seed:backup -- --file "C:\\path\\to\\backup.sql"
   ```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new client
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/profile` - Get current user profile (requires auth)
- `PUT /api/auth/profile` - Update current user profile (requires auth)

### Orders

- `POST /api/orders` - Create a new order (requires auth)
- `GET /api/orders` - Get orders (filtered by user role)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status (admin only)
- `PATCH /api/orders/:id/payment` - Update payment status (admin only)

### Products

- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Menus

- `GET /api/menus` - Get all menus (public)
- `GET /api/menus/:id` - Get menu by ID (public)
- `POST /api/menus` - Create menu (admin only)
- `PUT /api/menus/:id` - Update menu (admin only)
- `DELETE /api/menus/:id` - Delete menu (admin only)

### Dashboard (Admin Only)

- `GET /api/dashboard` - Get dashboard statistics

### Reports (Admin Only)

- `GET /api/reports/revenue` - Get revenue report
- `GET /api/reports/popular-items` - Get popular items
- `GET /api/reports/customers` - Get customer analytics

### Customers (Admin Only)

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID

### System Control (Admin Only)

- `GET /api/system/status` - Get system status (public for order page)
- `PUT /api/system/status` - Update system status
- `GET /api/system/closed-dates` - Get closed dates
- `POST /api/system/closed-dates` - Create closed date
- `DELETE /api/system/closed-dates/:id` - Delete closed date

### Favorites (Client Only)

- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add product to favorites
- `DELETE /api/favorites/:productId` - Remove product from favorites

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is returned after successful login/registration.

## Default Users

After seeding, you can login with:

**Admin:**
- Email: `admin@catering.com`
- Password: `admin123`

**Client:**
- Email: `client@example.com`
- Password: `client123`

## Database Schema

### Main Models

- **User**: Admin and client users
- **Product**: Menu items/products
- **Menu**: Menu collections
- **Order**: Customer orders
- **OrderItem**: Items in an order
- **Favorite**: User's favorite products
- **SystemStatus**: System configuration
- **ClosedDate**: Dates when ordering is closed

## Development

### Prisma Studio

View and edit database records:
```bash
npm run prisma:studio
```

### TypeScript Compilation

```bash
npm run build
```

## CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `FRONTEND_URL` environment variable. Make sure this matches your Next.js app URL (default: `http://localhost:3000`).

## Error Handling

All errors are handled by the error middleware and return JSON responses:

```json
{
  "error": "Error message"
}
```

## Notes

- Service fee: Configurable per order (default: €48.90)
- Order statuses: PENDING, CONFIRMED, PREPARATION, DELIVERY, COMPLETED, CANCELLED
- Payment statuses: PENDING, PAID, REFUNDED
