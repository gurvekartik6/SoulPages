import { test, before, after } from 'node:test';
import assert from 'node:assert';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://booktracker:booktracker_dev_pw@localhost:5432/booktracker_test';
process.env.PGSSL = 'false';

let app;
let server;
let baseUrl;
let pool;
let initDb;
let closeDb;

before(async () => {
  const db = await import('../db.js');
  ({ initDb, closeDb, pool } = db);

  await initDb();
  // Start every test run from a clean slate regardless of what a previous
  // run left behind.
  await pool.query('TRUNCATE quotes, reading_sessions, books, users CASCADE');

  const mod = await import('../index.js');
  app = mod.default;
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDb();
});

let accessToken;
let bookId;
let bookIdForTags;

test('health check responds ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
});

test('register a new user', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kartik',
      email: 'kartik@example.com',
      password: 'password123',
      fullName: 'Kartik Yadav Gurve'
    })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.ok(body.accessToken);
  assert.strictEqual(body.user.username, 'kartik');
  accessToken = body.accessToken;
});

test('rejects duplicate registration', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kartik',
      email: 'kartik@example.com',
      password: 'password123'
    })
  });
  assert.strictEqual(res.status, 409);
});

test('login with correct credentials', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kartik', password: 'password123' })
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.accessToken);
});

test('login fails with wrong password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kartik', password: 'wrong' })
  });
  assert.strictEqual(res.status, 401);
});

test('rejects book creation without auth', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'No Auth Book', author: 'Nobody' })
  });
  assert.strictEqual(res.status, 401);
});

test('create a book', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'The Pragmatic Programmer',
      author: 'David Thomas',
      totalPages: 320,
      genre: 'Technology'
    })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.title, 'The Pragmatic Programmer');
  assert.strictEqual(body.status, 'not-started');
  bookId = body.id;
});

test('list books returns paginated content', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.totalElements, 1);
  assert.strictEqual(body.content.length, 1);
});

test('update reading progress logs a session and updates status', async () => {
  const res = await fetch(`${baseUrl}/api/books/${bookId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ currentPage: 80, sessionDuration: 600, pagesRead: 80 })
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.currentPage, 80);
  assert.strictEqual(body.progress, 25);
  assert.strictEqual(body.status, 'reading');
  assert.strictEqual(body.readingSessions.length, 1);
});

test('rejects an out-of-range page number', async () => {
  const res = await fetch(`${baseUrl}/api/books/${bookId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ currentPage: 999 })
  });
  assert.strictEqual(res.status, 400);
});

test('completing a book marks status and dateCompleted', async () => {
  const res = await fetch(`${baseUrl}/api/books/${bookId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ currentPage: 320, sessionDuration: 1200, pagesRead: 240 })
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'completed');
  assert.strictEqual(body.progress, 100);
  assert.ok(body.dateCompleted);
});

test('overview stats reflect the completed book', async () => {
  const res = await fetch(`${baseUrl}/api/stats/overview`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.totalBooks, 1);
  assert.strictEqual(body.completedBooks, 1);
  assert.strictEqual(body.totalPagesRead, 320);
});

test('genre stats group by genre', async () => {
  const res = await fetch(`${baseUrl}/api/stats/genre`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.deepStrictEqual(body, [{ genre: 'Technology', count: 1 }]);
});

test('delete a book', async () => {
  const res = await fetch(`${baseUrl}/api/books/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 204);

  const list = await fetch(`${baseUrl}/api/books`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const body = await list.json();
  assert.strictEqual(body.totalElements, 0);
});

test('progress update rejects a non-numeric page instead of storing NaN', async () => {
  const create = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Validation Book', author: 'QA', totalPages: 100 })
  });
  const created = await create.json();

  const res = await fetch(`${baseUrl}/api/books/${created.id}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPage: 'not-a-number' })
  });
  assert.strictEqual(res.status, 400);

  // Book should be untouched — still at page 0, not NaN
  const check = await fetch(`${baseUrl}/api/books/${created.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const checkBody = await check.json();
  assert.strictEqual(checkBody.currentPage, 0);
  assert.strictEqual(checkBody.progress, 0);
});

test('session logging rejects a non-numeric duration', async () => {
  const create = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Session Validation Book', author: 'QA' })
  });
  const created = await create.json();

  const res = await fetch(`${baseUrl}/api/books/${created.id}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ duration: 'oops' })
  });
  assert.strictEqual(res.status, 400);
});

test('book update validation rejects an empty title and a bad page count', async () => {
  const create = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Editable Book', author: 'QA', totalPages: 200 })
  });
  const created = await create.json();

  const badTitle = await fetch(`${baseUrl}/api/books/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: '   ' })
  });
  assert.strictEqual(badTitle.status, 400);

  const badPages = await fetch(`${baseUrl}/api/books/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ totalPages: -5 })
  });
  assert.strictEqual(badPages.status, 400);

  const good = await fetch(`${baseUrl}/api/books/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Editable Book (Revised)' })
  });
  assert.strictEqual(good.status, 200);
  const goodBody = await good.json();
  assert.strictEqual(goodBody.title, 'Editable Book (Revised)');
});

test('ISBN lookup rejects a malformed ISBN before calling out to OpenLibrary', async () => {
  const res = await fetch(`${baseUrl}/api/books/isbn/not-an-isbn`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 400);
});

test('update profile: full name and reading goal', async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ fullName: 'Kartik Yadav Gurve', readingGoal: 24 })
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.fullName, 'Kartik Yadav Gurve');
  assert.strictEqual(body.readingGoal, 24);
});

test('update profile rejects an out-of-range reading goal', async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ readingGoal: 0 })
  });
  assert.strictEqual(res.status, 400);
});

test('change password requires the correct current password', async () => {
  const wrong = await fetch(`${baseUrl}/api/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'newpassword123' })
  });
  assert.strictEqual(wrong.status, 401);

  const right = await fetch(`${baseUrl}/api/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPassword: 'password123', newPassword: 'newpassword123' })
  });
  assert.strictEqual(right.status, 200);

  // Old password should no longer work; new one should
  const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kartik', password: 'password123' })
  });
  assert.strictEqual(oldLogin.status, 401);

  const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kartik', password: 'newpassword123' })
  });
  assert.strictEqual(newLogin.status, 200);
});

test('book creation accepts and normalizes tags', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      title: 'Tagged Book',
      author: 'QA',
      tags: ['Book Club', 'book club', ' To Re-read ', '']
    })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  // Duplicates (case/whitespace-insensitive) collapsed, blanks dropped
  assert.deepStrictEqual(body.tags, ['book club', 'to re-read']);
  bookIdForTags = body.id;
});

test('filtering the library by tag returns only matching books', async () => {
  const res = await fetch(`${baseUrl}/api/books?tag=book%20club`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.content.some((b) => b.id === bookIdForTags));
});

test('rating and verdict can be set on a completed book, with validation', async () => {
  const badRating = await fetch(`${baseUrl}/api/books/${bookIdForTags}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ rating: 7 })
  });
  assert.strictEqual(badRating.status, 400);

  const good = await fetch(`${baseUrl}/api/books/${bookIdForTags}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ rating: 5, verdict: 'Could not put it down.' })
  });
  assert.strictEqual(good.status, 200);
  const body = await good.json();
  assert.strictEqual(body.rating, 5);
  assert.strictEqual(body.verdict, 'Could not put it down.');
});

test('quotes: add, list, and delete are scoped to the owning book', async () => {
  const add = await fetch(`${baseUrl}/api/books/${bookIdForTags}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ text: 'A line worth keeping.', page: 42 })
  });
  assert.strictEqual(add.status, 201);
  const quote = await add.json();
  assert.strictEqual(quote.page, 42);

  const list = await fetch(`${baseUrl}/api/books/${bookIdForTags}/quotes`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const quotes = await list.json();
  assert.strictEqual(quotes.length, 1);

  const aggregate = await fetch(`${baseUrl}/api/quotes`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const allQuotes = await aggregate.json();
  assert.ok(allQuotes.some((q) => q.id === quote.id && q.bookTitle === 'Tagged Book'));

  const del = await fetch(`${baseUrl}/api/books/${bookIdForTags}/quotes/${quote.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(del.status, 204);

  const listAfter = await fetch(`${baseUrl}/api/books/${bookIdForTags}/quotes`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual((await listAfter.json()).length, 0);
});

test('quote validation rejects empty text', async () => {
  const res = await fetch(`${baseUrl}/api/books/${bookIdForTags}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ text: '   ' })
  });
  assert.strictEqual(res.status, 400);
});

test('bulk import creates valid rows and reports skipped invalid ones', async () => {
  const res = await fetch(`${baseUrl}/api/books/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      books: [
        { title: 'Imported One', author: 'Author A', totalPages: '150', genre: 'Fiction' },
        { title: '', author: 'No Title' },
        { title: 'Imported Two', author: 'Author B', currentPage: '999999', totalPages: '100' }
      ]
    })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.createdCount, 2);
  assert.strictEqual(body.skippedCount, 1);
  const imported2 = body.books.find((b) => b.title === 'Imported Two');
  // currentPage should be clamped to totalPages, not stored as an overflowing value
  assert.strictEqual(imported2.currentPage, 100);
  assert.strictEqual(imported2.status, 'completed');
});

test('bulk import rejects an empty list', async () => {
  const res = await fetch(`${baseUrl}/api/books/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ books: [] })
  });
  assert.strictEqual(res.status, 400);
});

test('streak endpoint returns a daily heatmap and current streak', async () => {
  const create = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Streak Book', author: 'QA', totalPages: 200 })
  });
  const created = await create.json();

  await fetch(`${baseUrl}/api/books/${created.id}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPage: 10, sessionDuration: 300, pagesRead: 10 })
  });

  const res = await fetch(`${baseUrl}/api/stats/streak?days=7`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.days.length, 7);
  assert.ok(body.currentStreak >= 1);
  assert.strictEqual(body.days[body.days.length - 1].active, true);
});

test('achievements endpoint reflects unlocked state', async () => {
  const res = await fetch(`${baseUrl}/api/stats/achievements`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const badges = await res.json();
  const firstBook = badges.find((b) => b.id === 'first-book');
  const tenBooks = badges.find((b) => b.id === 'ten-books');
  assert.strictEqual(firstBook.unlocked, true);
  assert.strictEqual(tenBooks.unlocked, false);
});

test('wrapped endpoint summarizes the year', async () => {
  // Dedicated fixture so fastestBook is deterministically populated, rather
  // than depending on whatever earlier tests happened to leave behind.
  const create = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: 'Wrapped Fixture Book', author: 'QA', totalPages: 100, genre: 'Fiction' })
  });
  const created = await create.json();
  await fetch(`${baseUrl}/api/books/${created.id}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPage: 100, sessionDuration: 3600, pagesRead: 100 })
  });

  const res = await fetch(`${baseUrl}/api/stats/wrapped?year=${new Date().getFullYear()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(typeof body.totalPagesRead, 'number');
  assert.strictEqual(typeof body.booksCompleted, 'number');
  assert.strictEqual(typeof body.totalReadingTime, 'number');
  assert.ok(body.fastestBook, 'expected a fastestBook to be computed from the fixture');
  // Postgres BIGINT columns come back as strings from the driver unless
  // explicitly converted — this catches that regression.
  assert.strictEqual(typeof body.fastestBook.readingTime, 'number');
  assert.strictEqual(body.fastestBook.readingTime, 3600);
});
