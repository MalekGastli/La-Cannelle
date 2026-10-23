import './env';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import menuRoutes from './routes/menus';
import customerRoutes from './routes/customers';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import systemRoutes from './routes/system';
import favoriteRoutes from './routes/favorites';
import contactRoutes from './routes/contact';
import accessoryRoutes from './routes/accessories';
import serviceRoutes from './routes/services';
import todoRoutes from './routes/todos';
import phoneRoutes from './routes/phone';
import { ensureUploadsDir } from './utils/uploads';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, '');
const allowedOrigins = new Set<string>([
  normalizedFrontendUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalizedOrigin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

const BODY_LIMIT = process.env.BODY_LIMIT || '25mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));

const uploadsDir = ensureUploadsDir();
app.use('/api/uploads', express.static(uploadsDir));
const legacyUploadsDir = path.join(__dirname, 'uploads');
if (legacyUploadsDir !== uploadsDir && fs.existsSync(legacyUploadsDir)) {
  app.use('/api/uploads', express.static(legacyUploadsDir));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/phone', phoneRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
});
