import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import {
  initDb,
  query,
  closeDb
} from './db.js';

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

const isVercel = process.env.VERCEL === '1';

const frontendUrl =
  process.env.CORS_ORIGIN ||
  'http://localhost:5173';


/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 16)
) {
  console.error(
    '❌ JWT_SECRET must be set to a long random string.'
  );

  process.exit(1);
}

app.set('trust proxy', 1);


/*
|--------------------------------------------------------------------------
| Helmet
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginEmbedderPolicy: false
  })
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: frontendUrl,
    credentials: true
  })
);


/*
|--------------------------------------------------------------------------
| Body parsing
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);


/*
|--------------------------------------------------------------------------
| Rate limiting
|--------------------------------------------------------------------------
*/

const generalLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  });


const authLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error:
        'Too many attempts. Please try again later.'
    }
  });


app.use(
  '/api/',
  generalLimiter
);

app.use(
  '/api/auth/',
  authLimiter
);


/*
|--------------------------------------------------------------------------
| Database initialization
|--------------------------------------------------------------------------
*/

let dbReady = false;

async function ensureDatabase() {

  if (dbReady) {
    return;
  }

  await initDb();

  dbReady = true;
}


/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get(
  '/api/health',
  async (req, res) => {

    try {

      await ensureDatabase();

      await query('SELECT 1');

      res.status(200).json({
        status: 'ok',
        database: 'connected',
        environment:
          process.env.NODE_ENV ||
          'development',
        vercel: isVercel,
        timestamp:
          new Date().toISOString()
      });

    } catch (error) {

      console.error(
        '❌ Health check failed:',
        error
      );

      res.status(503).json({
        status: 'degraded',
        database: 'unreachable',
        timestamp:
          new Date().toISOString()
      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
*/

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/books',
  bookRoutes
);

app.use(
  '/api/stats',
  statsRoutes
);

app.use(
  '/api/quotes',
  quotesRoutes
);


/*
|--------------------------------------------------------------------------
| API 404
|--------------------------------------------------------------------------
*/

app.use(
  notFoundHandler
);


/*
|--------------------------------------------------------------------------
| Error handler
|--------------------------------------------------------------------------
*/

app.use(
  errorHandler
);


/*
|--------------------------------------------------------------------------
| LOCAL DEVELOPMENT ONLY
|--------------------------------------------------------------------------
*/

let server;

async function start() {

  try {

    await ensureDatabase();

    server = app.listen(
      PORT,
      () => {

        console.log(
          `✅ Backend running at http://localhost:${PORT}`
        );

        console.log(
          `Environment: ${
            process.env.NODE_ENV ||
            'development'
          }`
        );

      }
    );

  } catch (error) {

    console.error(
      '❌ Failed to start backend:',
      error
    );

    process.exit(1);

  }

}


async function shutdown(signal) {

  console.log(
    `${signal} received, shutting down...`
  );

  try {

    if (server) {

      await new Promise(
        (resolve) => {
          server.close(resolve);
        }
      );

    }

    await closeDb();

    process.exit(0);

  } catch (error) {

    console.error(
      '❌ Shutdown error:',
      error
    );

    process.exit(1);

  }

}


/*
|--------------------------------------------------------------------------
| Don't call app.listen() on Vercel
|--------------------------------------------------------------------------
*/

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
| Export Express app
|--------------------------------------------------------------------------
*/

export default app;