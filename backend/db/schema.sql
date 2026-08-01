-- Book Tracker schema — Postgres 13+ (built-in gen_random_uuid(), no extensions needed).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).
--
-- Local Postgres:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Supabase:
--   Paste this file into the SQL Editor (Project → SQL Editor → New query) and run it,
--   or run it via psql/the Supabase CLI against your project's connection string.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    reading_goal INTEGER NOT NULL DEFAULT 12 CHECK (reading_goal BETWEEN 1 AND 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(300) NOT NULL,
    total_pages INTEGER CHECK (total_pages IS NULL OR total_pages > 0),
    current_page INTEGER NOT NULL DEFAULT 0 CHECK (current_page >= 0),
    reading_time BIGINT NOT NULL DEFAULT 0 CHECK (reading_time >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'not-started'
        CHECK (status IN ('not-started', 'reading', 'completed')),
    date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_started TIMESTAMPTZ,
    date_completed TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    cover_url TEXT,
    genre VARCHAR(100) NOT NULL DEFAULT 'Unspecified',
    annual_goal BOOLEAN NOT NULL DEFAULT false,
    rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    verdict VARCHAR(280) NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration INTEGER NOT NULL CHECK (duration >= 0),
    pages_read INTEGER NOT NULL DEFAULT 0 CHECK (pages_read >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    page INTEGER CHECK (page IS NULL OR page >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);

-- Keep updated_at current automatically on any row update.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated_at ON books;
CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
