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
const frontendUrl = process.env.CORS_ORIGIN || 'https://soulpages.up.railway.app';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)) {
  console.error('❌ JWT_SECRET must be set to a long random string in production. Refusing to start.');
  process.exit(1);
}

app.set('trust proxy', 1);

// ✅ FIXED: Configure Helmet with proper CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          frontendUrl,
          'https://*.railway.app',
          'https://*.fly.dev',
          'http://localhost:5000'
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());
app.use(cors({ origin: frontendUrl || '*' }));
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
// SERVE FRONTEND STATIC FILES
// ============================================
if (isProd) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  console.log('Serving frontend from:', frontendPath);
  
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
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

app.use(notFoundHandler);
app.use(errorHandler);

let server;

async function start() {
  await initDb();
  server = app.listen(PORT, () => {
    console.log(`Book Tracker API listening on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS Origin: ${frontendUrl}`);
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