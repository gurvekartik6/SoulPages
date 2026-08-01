import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Point it at your Postgres instance (local, Docker, or Supabase) — see .env.example.'
  );
}

// Supabase (and most managed Postgres providers) require SSL; local/dev
// Postgres usually doesn't have a cert configured, so only enable it when
// the connection string doesn't already say otherwise and we're not
// explicitly pointed at localhost.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const useSsl = process.env.PGSSL === 'true' || (!isLocal && process.env.PGSSL !== 'false');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_POOL_MAX) || 10
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err);
});

export async function query(text, params) {
  return pool.query(text, params);
}

// Runs a function inside a single client transaction (BEGIN/COMMIT/ROLLBACK).
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

// Applies db/schema.sql. Safe to call on every boot — every statement in
// the schema is idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP+CREATE
// for triggers), so this doubles as a zero-dependency migration runner.
export async function initDb() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
}

export async function closeDb() {
  await pool.end();
}
