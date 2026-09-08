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

const isVercel = process.env.VERCEL === '1';

/* --------------------------------------------------
   BASIC MIDDLEWARE
-------------------------------------------------- */

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined'));

/* --------------------------------------------------
   RATE LIMITING
-------------------------------------------------- */

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

/* --------------------------------------------------
   DATABASE INITIALIZATION
-------------------------------------------------- */

let dbInitialized = false;

async function ensureDatabase() {
  if (dbInitialized) {
    return;
  }

  await initDb();
  dbInitialized = true;
}

/*
 * Initialize the database before handling API requests.
 *
 * This is important on Vercel because the serverless
 * function can start without the database schema having
 * been initialized yet.
 */
app.use('/api', async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);

    res.status(503).json({
      error: 'Database unavailable'
    });
  }
});

/* --------------------------------------------------
   ROOT / API TEST ROUTES
-------------------------------------------------- */

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SoulPages API'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SoulPages API',
    vercel: isVercel
  });
});

/* --------------------------------------------------
   HEALTH CHECK
-------------------------------------------------- */

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected',
      vercel: isVercel
    });
  } catch (error) {
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

/* --------------------------------------------------
   API ROUTES
-------------------------------------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/quotes', quoteRoutes);

/* --------------------------------------------------
   ERROR HANDLING
-------------------------------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

/* --------------------------------------------------
   LOCAL SERVER
-------------------------------------------------- */

if (!isVercel) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

/* --------------------------------------------------
   VERCEL EXPORT
-------------------------------------------------- */

export default app;