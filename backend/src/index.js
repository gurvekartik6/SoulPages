import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, query, closeDb } from './db.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import statsRoutes from './routes/stats.js';
import quotesRoutes from './routes/quotes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)) {
  console.error('❌ JWT_SECRET must be set to a long random string in production. Refusing to start.');
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// Generous general limiter, tighter one for auth endpoints (brute-force protection)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', timestamp: new Date().toISOString() });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/quotes', quotesRoutes);

// ============================================
// ✅ ADD THIS: SERVE FRONTEND STATIC FILES
// ============================================
if (isProd) {
  // Path to frontend build folder
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  console.log('📂 Serving frontend from:', frontendPath);
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development - show API info
  app.get('/', (req, res) => {
    res.json({ 
      message: 'SoulPages API is running!',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        books: '/api/books',
        stats: '/api/stats',
        quotes: '/api/quotes'
      }
    });
  });
}

// ============================================
// ERROR HANDLING (must be AFTER all routes)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

let server;

async function start() {
  await initDb();
  server = app.listen(PORT, () => {
    console.log(`📚 Book Tracker API listening on http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully…`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDb();
  process.exit(0);
}

if (process.env.NODE_ENV !== 'test') {
  start();
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;