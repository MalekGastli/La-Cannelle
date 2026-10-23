# Frontend-Backend Connection Verification

## ✅ Configuration Status

### Backend Configuration ✅
- [x] Express server on port 3001
- [x] CORS configured for `http://localhost:3000`
- [x] All API routes registered
- [x] JWT authentication middleware
- [x] Error handling middleware
- [x] Prisma schema with MySQL compatibility (JSON fields)

### Frontend Configuration ✅
- [x] API client created (`lib/api.ts`)
- [x] Authentication API module (`lib/api/auth.ts`)
- [x] Orders API module (`lib/api/orders.ts`)
- [x] Products API module (`lib/api/products.ts`)
- [x] Menus API module (`lib/api/menus.ts`)
- [x] Dashboard API module (`lib/api/dashboard.ts`)
- [x] System API module (`lib/api/system.ts`)
- [x] Token management (automatic save/load from localStorage)

## 🔌 Connection Setup Checklist

### Step 1: Environment Files

**Backend** (`backend/.env`):
```env
DATABASE_URL="mysql://root@localhost:3306/catering_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

**Frontend** (`.env.local` in root):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 2: Database Setup

- [ ] WAMP server running (green icon)
- [ ] Database `catering_db` created in phpMyAdmin
- [ ] Backend `.env` configured with correct DATABASE_URL
- [ ] Run `npm run prisma:generate` in backend
- [ ] Run `npm run prisma:migrate` in backend
- [ ] Run `npm run seed` in backend

### Step 3: Start Servers

**Backend:**
```bash
cd backend
npm run dev
```
Expected: `🚀 Server running on port 3001`

**Frontend:**
```bash
npm run dev
```
Expected: `Ready on http://localhost:3000`

## 🧪 Quick Test

### Test 1: Backend Health
Open: `http://localhost:3001/health`
Expected: `{"status":"ok","timestamp":"..."}`

### Test 2: Public Products API
Open: `http://localhost:3001/api/products`
Expected: JSON array of products

### Test 3: Frontend API Client
In browser console (on frontend):
```javascript
// Test API connection
fetch('http://localhost:3001/api/products')
  .then(r => r.json())
  .then(console.log)
```

### Test 4: Product Update Persists (Admin)
In browser console (on frontend), update a product and then re-fetch it:
```javascript
// Pick an existing product id from GET /api/products first.
const id = 1;

await fetch(`http://localhost:3001/api/products/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ price: 99.99, description: 'Updated from verification test' }),
}).then(r => r.json()).then(console.log);

await fetch(`http://localhost:3001/api/products/${id}`).then(r => r.json()).then(console.log);
```
Expected: the second request returns the updated `price`/`description` (even after a full page refresh), and `menuProducts` is present on product payloads used by the admin UI.

## 📡 API Endpoints Summary

### Public Endpoints (No Auth Required)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/menus` - Get all menus
- `GET /api/menus/:id` - Get menu by ID
- `GET /api/system/status` - Get system status

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update profile (requires auth)

### Client Endpoints (Requires Auth - CLIENT role)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:productId` - Remove favorite

### Admin Endpoints (Requires Auth - ADMIN role)
- `GET /api/dashboard` - Dashboard stats
- `GET /api/orders` - Get all orders
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/customers` - Get all customers
- `GET /api/reports/revenue` - Revenue reports
- `GET /api/reports/popular-items` - Popular items
- `GET /api/reports/customers` - Customer analytics
- `PUT /api/system/status` - Update system status
- `GET /api/system/closed-dates` - Get closed dates
- `POST /api/system/closed-dates` - Add closed date
- `DELETE /api/system/closed-dates/:id` - Delete closed date
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

## 🔐 Authentication Flow

1. User calls `authApi.login()` or `authApi.register()`
2. Backend returns `{ user, token }`
3. Frontend automatically saves token to localStorage
4. All subsequent API calls include token in `Authorization: Bearer <token>` header
5. Backend validates token and extracts user info
6. User calls `authApi.logout()` to remove token

## 📝 Next Steps to Integrate

1. **Update Connect Page** (`app/(public)/connect/page.tsx`):
   - Replace `handleLogin` with `authApi.login()`
   - Replace `handleRegister` with `authApi.register()`
   - Load user profile with `authApi.getProfile()`

2. **Update Order Page** (`app/(public)/order/page.tsx`):
   - Replace `handleSubmitOrder` with `ordersApi.createOrder()`
   - Load menus/products from API instead of mock data

3. **Update Admin Dashboard** (`app/(admin)/dashboard/page.tsx`):
   - Load data from `dashboardApi.getDashboard()`

4. **Update Admin Orders** (`app/(admin)/orders/page.tsx`):
   - Load orders from `ordersApi.getOrders()`
   - Update status with `ordersApi.updateOrderStatus()`

5. **Update Menu Management** (`app/(admin)/menu_management/page.tsx`):
   - Load products/menus from API
   - CRUD operations via API

## 🐛 Common Issues

### CORS Error
- **Fix**: Check `FRONTEND_URL` in backend `.env` matches frontend URL

### 401 Unauthorized
- **Fix**: User needs to login first, token might be expired

### 404 Not Found
- **Fix**: Check API endpoint URL, ensure backend routes are registered

### Database Connection Error
- **Fix**: Check WAMP is running, verify DATABASE_URL in backend `.env`

## ✅ Verification Complete!

Both frontend and backend are configured and ready to connect. Follow the integration steps above to connect your components to the API.
