import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| DATABASE_URL
|--------------------------------------------------------------------------
*/

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add your Neon PostgreSQL connection string.'
  );
}

/*
|--------------------------------------------------------------------------
| PostgreSQL / Neon configuration
|--------------------------------------------------------------------------
*/

const isLocal = /localhost|127\.0\.0\.1/.test(
  process.env.DATABASE_URL
);

const useSsl =
  process.env.PGSSL === 'true' ||
  (!isLocal && process.env.PGSSL !== 'false');

/*
|--------------------------------------------------------------------------
| PostgreSQL Pool
|--------------------------------------------------------------------------
|
| Neon works with standard PostgreSQL connections.
|
| Vercel serverless functions may be reused between requests, so we
| keep the pool at module scope instead of creating a new pool for
| every request.
|
|--------------------------------------------------------------------------
*/

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false,

  max: Number(process.env.PG_POOL_MAX) || 5,

  idleTimeoutMillis: 10000,

  connectionTimeoutMillis: 10000
});

/*
|--------------------------------------------------------------------------
| Pool error
|--------------------------------------------------------------------------
*/

pool.on('error', (err) => {
  console.error(
    'Unexpected PostgreSQL pool error:',
    err
  );
});

/*
|--------------------------------------------------------------------------
| Query helper
|--------------------------------------------------------------------------
*/

export async function query(text, params) {
  return pool.query(text, params);
}

/*
|--------------------------------------------------------------------------
| Transaction helper
|--------------------------------------------------------------------------
*/

export async function withTransaction(fn) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await fn(client);

    await client.query('COMMIT');

    return result;
  } catch (err) {
    await client.query('ROLLBACK');

    throw err;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Initialize database
|--------------------------------------------------------------------------
|
| Loads:
|
| backend/db/schema.sql
|
|--------------------------------------------------------------------------
*/

let initialized = false;

export async function initDb() {
  if (initialized) {
    return;
  }

  const schemaPath = path.join(
    __dirname,
    '..',
    'db',
    'schema.sql'
  );

  if (!fs.existsSync(schemaPath)) {
    throw new Error(
      `Database schema not found at: ${schemaPath}`
    );
  }

  const schema = fs.readFileSync(
    schemaPath,
    'utf-8'
  );

  await pool.query(schema);

  initialized = true;

  console.log(
    '✅ Database schema initialized.'
  );
}

/*
|--------------------------------------------------------------------------
| Close database
|--------------------------------------------------------------------------
|
| Mainly useful for local development/tests.
| Do not call this after every Vercel request.
|
|--------------------------------------------------------------------------
*/

export async function closeDb() {
  if (pool) {
    await pool.end();
  }
}