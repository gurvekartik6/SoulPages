import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import statsRoutes from './routes/stats.js';
import quoteRoutes from './routes/quotes.js';

import { initDb, pool } from './db.js';

import {
  notFoundHandler,
  errorHandler
} from './middleware/errorHandler.js';

dotenv.config();

const app = express();

/* ==================================================
   ENVIRONMENT
================================================== */

const isVercel = process.env.VERCEL === '1';

/* ==================================================
   SECURITY & BASIC MIDDLEWARE
================================================== */

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(compression());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined'));

/* ==================================================
   RATE LIMITING
================================================== */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

/* ==================================================
   DATABASE INITIALIZATION
================================================== */

let dbInitialized = false;

async function ensureDatabase() {
  if (dbInitialized) {
    return;
  }

  try {
    await initDb();
    dbInitialized = true;

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/*
 * Initialize the database before processing API
 * requests.
 *
 * This is required because Vercel runs the Express
 * application as a serverless function.
 */
app.use('/api', async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error('❌ API database middleware error:', error);

    return res.status(503).json({
      error: 'Database unavailable'
    });
  }
});

/* ==================================================
   ROOT ROUTE
================================================== */

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SoulPages API',
    vercel: isVercel
  });
});

/* ==================================================
   API ROOT TEST ROUTE
================================================== */

app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SoulPages API',
    vercel: isVercel
  });
});

/* ==================================================
   HEALTH CHECK
================================================== */

app.get('/api/health', async (req, res) => {
  try {
    await ensureDatabase();

    await pool.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      vercel: isVercel
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);

    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

/* ==================================================
   AUTH ROUTES
================================================== */

app.use('/api/auth', authRoutes);

/* ==================================================
   BOOK ROUTES
================================================== */

app.use('/api/books', bookRoutes);

/* ==================================================
   STATS ROUTES
================================================== */

app.use('/api/stats', statsRoutes);

/* ==================================================
   QUOTE ROUTES
================================================== */

app.use('/api/quotes', quoteRoutes);

/* ==================================================
   404 HANDLER
================================================== */

app.use(notFoundHandler);

/* ==================================================
   GLOBAL ERROR HANDLER
================================================== */

app.use(errorHandler);

/* ==================================================
   LOCAL DEVELOPMENT SERVER
================================================== */

if (!isVercel) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 SoulPages API running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
  });
}

/* ==================================================
   VERCEL SERVERLESS EXPORT
================================================== */

export default app;