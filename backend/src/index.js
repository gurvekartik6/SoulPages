import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { initDb, query, closeDb } from './db.js';

import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import statsRoutes from './routes/stats.js';
import quotesRoutes from './routes/quotes.js';

import {
  notFoundHandler,
  errorHandler
} from './middleware/errorHandler.js';

const app = express();

const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === 'production';

const frontendUrl =
  process.env.CORS_ORIGIN ||
  'https://soul-pages-sable.vercel.app';

/*
|--------------------------------------------------------------------------
| Production environment validation
|--------------------------------------------------------------------------
*/

if (
  isProd &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)
) {
  console.error(
    '❌ JWT_SECRET must be set to a long random string in production.'
  );

  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| Trust proxy
|--------------------------------------------------------------------------
*/

app.set('trust proxy', 1);

/*
|--------------------------------------------------------------------------
| Security - Helmet
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        connectSrc: [
          "'self'",
          frontendUrl,
          'https://*.vercel.app',
          'https://*.railway.app',
          'https://*.fly.dev',
          'http://localhost:5000',
          'http://localhost:5173'
        ],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'"
        ],

        imgSrc: [
          "'self'",
          'data:',
          'https:'
        ],

        fontSrc: [
          "'self'",
          'https:',
          'data:'
        ],

        formAction: ["'self'"],

        frameAncestors: ["'self'"]
      }
    },

    crossOriginEmbedderPolicy: false
  })
);

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(compression());

app.use(
  cors({
    origin: frontendUrl,
    credentials: true
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  morgan(
    isProd
      ? 'combined'
      : 'dev'
  )
);

/*
|--------------------------------------------------------------------------
| Rate limiting
|--------------------------------------------------------------------------
*/

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

  message: {
    error: 'Too many attempts. Please try again later.'
  }
});

app.use('/api/', generalLimiter);

app.use('/api/auth/', authLimiter);

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'degraded',
      database: 'unreachable',
      timestamp: new Date().toISOString()
    });
  }
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);

app.use('/api/books', bookRoutes);

app.use('/api/stats', statsRoutes);

app.use('/api/quotes', quotesRoutes);

/*
|--------------------------------------------------------------------------
| API 404 handler
|--------------------------------------------------------------------------
*/

app.use(notFoundHandler);

/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Local development server
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Vercel imports `app` directly.
| We only call app.listen() when running locally.
|
|--------------------------------------------------------------------------
*/

let server;

async function start() {
  try {
    await initDb();

    server = app.listen(PORT, () => {
      console.log(
        `✅ Book Tracker API listening on http://localhost:${PORT}`
      );

      console.log(
        `Environment: ${process.env.NODE_ENV || 'development'}`
      );

      console.log(
        `CORS Origin: ${frontendUrl}`
      );
    });
  } catch (error) {
    console.error(
      '❌ Failed to start server:',
      error
    );

    process.exit(1);
  }
}

/*
|--------------------------------------------------------------------------
| Graceful shutdown
|--------------------------------------------------------------------------
*/

async function shutdown(signal) {
  console.log(
    `\n${signal} received, shutting down gracefully...`
  );

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    await closeDb();

    console.log('✅ Server shutdown complete.');

    process.exit(0);
  } catch (error) {
    console.error(
      '❌ Error during shutdown:',
      error
    );

    process.exit(1);
  }
}

/*
|--------------------------------------------------------------------------
| Start only outside Vercel production
|--------------------------------------------------------------------------
*/

const isVercel =
  process.env.VERCEL === '1';

if (
  !isVercel &&
  process.env.NODE_ENV !== 'test'
) {
  start();

  process.on(
    'SIGTERM',
    () => shutdown('SIGTERM')
  );

  process.on(
    'SIGINT',
    () => shutdown('SIGINT')
  );
}

/*
|--------------------------------------------------------------------------
| Export Express application
|--------------------------------------------------------------------------
*/

export default app;