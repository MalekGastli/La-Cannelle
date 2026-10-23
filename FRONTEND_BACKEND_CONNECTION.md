# Frontend-Backend Connection Guide

## ✅ Configuration Status

### Backend ✅
- Express server configured on port 3001
- CORS enabled for `http://localhost:3000`
- All API endpoints ready
- JWT authentication implemented

### Frontend ✅
- API client created (`lib/api.ts`)
- API modules created for all features
- Environment configuration ready

## 🔌 Connection Setup

### Step 1: Create Environment File

Create `.env.local` in the **root** of your project (same level as `package.json`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Note:** The `.env.local` file is already in `.gitignore`, so it won't be committed.

### Step 2: Start Backend Server

1. Open terminal in `backend` folder
2. Make sure you have:
   - ✅ Created `.env` file with database credentials
   - ✅ Run `npm install`
   - ✅ Run `npm run prisma:generate`
   - ✅ Run `npm run prisma:migrate`
   - ✅ Run `npm run seed`

3. Start the backend:
   ```bash
   npm run dev
   ```

   You should see: `🚀 Server running on port 3001`

### Step 3: Start Frontend Server

1. Open a **new terminal** in the **root** of your project
2. Start Next.js:
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## 📡 API Integration Examples

### Authentication Example

```typescript
import { authApi } from '@/lib/api/auth';

// Login
const handleLogin = async (email: string, password: string) => {
  try {
    const result = await authApi.login({ email, password });
    console.log('Logged in:', result.user);
    // Token is automatically saved
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Register
const handleRegister = async (data: RegisterData) => {
  try {
    const result = await authApi.register(data);
    console.log('Registered:', result.user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Orders Example

```typescript
import { ordersApi } from '@/lib/api/orders';

// Create order
const handleSubmitOrder = async (orderData: CreateOrderData) => {
  try {
    const order = await ordersApi.createOrder(orderData);
    console.log('Order created:', order);
    // Redirect to confirmation
  } catch (error) {
    console.error('Order failed:', error);
    alert('Failed to create order: ' + error.message);
  }
};

// Get orders
const loadOrders = async () => {
  try {
    const orders = await ordersApi.getOrders();
    setOrders(orders);
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
};
```

### Products & Menus Example

```typescript
import { productsApi } from '@/lib/api/products';
import { menusApi } from '@/lib/api/menus';

// Load products
const loadProducts = async () => {
  try {
    const products = await productsApi.getProducts();
    setProducts(products);
  } catch (error) {
    console.error('Failed to load products:', error);
  }
};

// Load menus
const loadMenus = async () => {
  try {
    const menus = await menusApi.getMenus({ isActive: true });
    setMenus(menus);
  } catch (error) {
    console.error('Failed to load menus:', error);
  }
};
```

### Dashboard Example (Admin)

```typescript
import { dashboardApi } from '@/lib/api/dashboard';

const loadDashboard = async () => {
  try {
    const stats = await dashboardApi.getDashboard();
    setDashboardData(stats);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
};
```

## 🔐 Authentication Flow

1. **User logs in** → `authApi.login()` → Token saved automatically
2. **All subsequent requests** → Token sent in `Authorization` header automatically
3. **User logs out** → `authApi.logout()` → Token removed

The API client handles token management automatically!

## 🧪 Testing the Connection

### Test 1: Health Check
Open browser: `http://localhost:3001/health`
Should return: `{"status":"ok","timestamp":"..."}`

### Test 2: Get Products (Public)
Open browser: `http://localhost:3001/api/products`
Should return: Array of products

### Test 3: Login
```typescript
// In browser console or component
import { authApi } from '@/lib/api/auth';
await authApi.login({ 
  email: 'admin@catering.com', 
  password: 'admin123' 
});
```

## 🐛 Troubleshooting

### Error: "Network error" or "Failed to fetch"

**Solutions:**
1. Make sure backend is running on port 3001
2. Check `.env.local` has correct API URL
3. Check CORS is enabled in backend (should be automatic)

### Error: "401 Unauthorized"

**Solutions:**
1. User needs to login first
2. Token might be expired - login again
3. Check if token is saved: `localStorage.getItem('auth_token')`

### Error: "404 Not Found"

**Solutions:**
1. Check API endpoint URL is correct
2. Make sure backend routes are registered
3. Check backend server is running

### Products/Menus not loading

**Solutions:**
1. Make sure database is seeded: `npm run seed` in backend
2. Check database connection in backend `.env`
3. Verify products exist in database

## 📝 Next Steps

1. **Update your components** to use the API instead of mock data
2. **Add error handling** with user-friendly messages
3. **Add loading states** while fetching data
4. **Test all features** end-to-end

## 🔄 Migration Checklist

For each page/component:

- [ ] Replace mock data with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test authentication flow
- [ ] Test CRUD operations
- [ ] Test admin vs client permissions

## 📚 Available API Modules

- `lib/api/auth.ts` - Authentication
- `lib/api/orders.ts` - Orders
- `lib/api/products.ts` - Products
- `lib/api/menus.ts` - Menus
- `lib/api/dashboard.ts` - Dashboard (admin)
- `lib/api/system.ts` - System control (admin)

All modules are ready to use! 🚀
