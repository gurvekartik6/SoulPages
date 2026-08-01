import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query, withTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function computeStatus(totalPages, currentPage) {
  if (totalPages && currentPage >= totalPages) return 'completed';
  if (currentPage > 0) return 'reading';
  return 'not-started';
}

function computeProgress(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}

function sessionToResponse(row) {
  return {
    id: row.id,
    bookId: row.book_id,
    sessionDate: row.session_date,
    duration: row.duration,
    pagesRead: row.pages_read
  };
}

function bookToResponse(row, sessions = []) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    progress: computeProgress(row.total_pages, row.current_page),
    readingTime: Number(row.reading_time),
    status: row.status,
    dateAdded: row.date_added,
    dateStarted: row.date_started,
    dateCompleted: row.date_completed,
    notes: row.notes,
    coverUrl: row.cover_url,
    annualGoal: row.annual_goal,
    genre: row.genre || 'Unspecified',
    rating: row.rating ?? null,
    verdict: row.verdict || '',
    tags: row.tags || [],
    readingSessions: sessions
      .filter((s) => s.book_id === row.id)
      .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
      .map(sessionToResponse)
  };
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

async function fetchOwnedBook(bookId, userId) {
  const result = await query('SELECT * FROM books WHERE id = $1 AND user_id = $2', [bookId, userId]);
  return result.rows[0] || null;
}

// GET /api/books - paginated, filterable by status/search/tag
router.get('/', async (req, res, next) => {
  try {
    const { status, search, tag, page = 1, size = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(size, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = ['user_id = $1'];
    const params = [req.userId];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (tag) {
      params.push(String(tag).toLowerCase());
      conditions.push(`$${params.length} = ANY(tags)`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length})`);
    }

    const whereClause = conditions.join(' AND ');
    params.push(pageSize, offset);

    const result = await query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM books
       WHERE ${whereClause}
       ORDER BY date_added DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalElements = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const bookIds = result.rows.map((r) => r.id);

    let sessions = [];
    if (bookIds.length > 0) {
      const sessionResult = await query('SELECT * FROM reading_sessions WHERE book_id = ANY($1::uuid[])', [
        bookIds
      ]);
      sessions = sessionResult.rows;
    }

    res.json({
      content: result.rows.map((row) => bookToResponse(row, sessions)),
      page: pageNum,
      size: pageSize,
      totalElements,
      totalPages: Math.ceil(totalElements / pageSize)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const book = await fetchOwnedBook(req.params.id, req.userId);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const sessionResult = await query('SELECT * FROM reading_sessions WHERE book_id = $1', [book.id]);
    res.json(bookToResponse(book, sessionResult.rows));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('totalPages').optional().isInt({ min: 1 }).withMessage('Total pages must be at least 1'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { title, author, totalPages, notes, annualGoal, coverUrl, genre, tags } = req.body;

      const result = await query(
        `INSERT INTO books (user_id, title, author, total_pages, notes, cover_url, genre, annual_goal, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          title,
          author,
          totalPages || null,
          notes || '',
          coverUrl || null,
          genre || 'Unspecified',
          Boolean(annualGoal),
          sanitizeTags(tags)
        ]
      );

      res.status(201).json(bookToResponse(result.rows[0], []));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/books/import - bulk create from parsed CSV rows
router.post(
  '/import',
  body('books').isArray({ min: 1, max: 500 }).withMessage('Provide a non-empty list of books (max 500 per import)'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const created = [];
      const skipped = [];

      await withTransaction(async (client) => {
        for (const raw of req.body.books) {
          const title = String(raw.title || '').trim();
          const author = String(raw.author || '').trim();
          if (!title || !author) {
            skipped.push({ row: raw, reason: 'Missing title or author' });
            continue;
          }

          const totalPages = Number(raw.totalPages) > 0 ? Math.floor(Number(raw.totalPages)) : null;
          const currentPageRaw = Number(raw.currentPage) > 0 ? Math.floor(Number(raw.currentPage)) : 0;
          const currentPage = totalPages ? Math.min(currentPageRaw, totalPages) : currentPageRaw;
          const status = computeStatus(totalPages, currentPage);
          const dateStarted = currentPage > 0 ? new Date() : null;
          const dateCompleted = status === 'completed' ? new Date() : null;

          const result = await client.query(
            `INSERT INTO books
               (user_id, title, author, total_pages, current_page, status, date_started, date_completed, notes, genre)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
              req.userId,
              title,
              author,
              totalPages,
              currentPage,
              status,
              dateStarted,
              dateCompleted,
              String(raw.notes || ''),
              String(raw.genre || '').trim() || 'Unspecified'
            ]
          );
          created.push(result.rows[0]);
        }
      });

      res.status(201).json({
        createdCount: created.length,
        skippedCount: skipped.length,
        skipped,
        books: created.map((row) => bookToResponse(row, []))
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/books/isbn/:isbn - lookup via OpenLibrary
router.post('/isbn/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const cleanedIsbn = String(isbn).replace(/[-\s]/g, '');

    if (!/^\d{9}[\dXx]$|^\d{13}$/.test(cleanedIsbn)) {
      return res.status(400).json({ error: 'Enter a valid 10 or 13 digit ISBN' });
    }

    const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(
      `ISBN:${cleanedIsbn}`
    )}&format=json&jscmd=data`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Could not reach OpenLibrary' });
    }
    const data = await response.json();
    const entry = data[`ISBN:${cleanedIsbn}`];

    if (!entry) {
      return res.status(404).json({ error: `No book found for ISBN ${cleanedIsbn}` });
    }

    const result = await query(
      `INSERT INTO books (user_id, title, author, total_pages, cover_url, genre)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.userId,
        entry.title || 'Unknown title',
        (entry.authors && entry.authors.map((a) => a.name).join(', ')) || 'Unknown author',
        entry.number_of_pages || null,
        entry.cover ? entry.cover.medium : null,
        (entry.subjects && entry.subjects[0] && entry.subjects[0].name) || 'Unspecified'
      ]
    );

    res.status(201).json(bookToResponse(result.rows[0], []));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
  body('totalPages').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Total pages must be at least 1'),
  body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('verdict').optional().isString().isLength({ max: 280 }).withMessage('Verdict must be 280 characters or fewer'),
  body('tags').optional().isArray().withMessage('Tags must be a list'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const existing = await fetchOwnedBook(req.params.id, req.userId);
      if (!existing) return res.status(404).json({ error: 'Book not found' });

      const { title, author, totalPages, notes, annualGoal, coverUrl, genre, rating, verdict, tags } = req.body;

      const nextTitle = title !== undefined ? title : existing.title;
      const nextAuthor = author !== undefined ? author : existing.author;
      const nextTotalPages = totalPages !== undefined ? totalPages : existing.total_pages;
      const nextNotes = notes !== undefined ? notes : existing.notes;
      const nextAnnualGoal = annualGoal !== undefined ? Boolean(annualGoal) : existing.annual_goal;
      const nextCoverUrl = coverUrl !== undefined ? coverUrl : existing.cover_url;
      const nextGenre = genre !== undefined ? genre : existing.genre;
      const nextRating = rating !== undefined ? (rating === null ? null : Number(rating)) : existing.rating;
      const nextVerdict = verdict !== undefined ? verdict : existing.verdict;
      const nextTags = tags !== undefined ? sanitizeTags(tags) : existing.tags;

      // Clamp currentPage if the book was shortened below where the reader had reached
      const nextCurrentPage =
        nextTotalPages && existing.current_page > nextTotalPages ? nextTotalPages : existing.current_page;
      const nextStatus = computeStatus(nextTotalPages, nextCurrentPage);

      const result = await query(
        `UPDATE books SET
           title = $1, author = $2, total_pages = $3, notes = $4, annual_goal = $5,
           cover_url = $6, genre = $7, rating = $8, verdict = $9, tags = $10,
           current_page = $11, status = $12
         WHERE id = $13 AND user_id = $14
         RETURNING *`,
        [
          nextTitle,
          nextAuthor,
          nextTotalPages,
          nextNotes,
          nextAnnualGoal,
          nextCoverUrl,
          nextGenre,
          nextRating,
          nextVerdict,
          nextTags,
          nextCurrentPage,
          nextStatus,
          req.params.id,
          req.userId
        ]
      );

      const sessionResult = await query('SELECT * FROM reading_sessions WHERE book_id = $1', [req.params.id]);
      res.json(bookToResponse(result.rows[0], sessionResult.rows));
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      req.userId
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    // reading_sessions and quotes cascade-delete via foreign key constraints.
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id/progress - update progress + log a session
router.put(
  '/:id/progress',
  body('currentPage').optional().isInt({ min: 0 }).withMessage('Current page must be a non-negative whole number'),
  body('sessionDuration').optional().isInt({ min: 0 }).withMessage('Session duration must be a non-negative whole number'),
  body('pagesRead').optional().isInt({ min: 0 }).withMessage('Pages read must be a non-negative whole number'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const existing = await fetchOwnedBook(req.params.id, req.userId);
      if (!existing) return res.status(404).json({ error: 'Book not found' });

      const { currentPage, sessionDuration = 0, pagesRead = 0 } = req.body;

      let nextCurrentPage = existing.current_page;
      if (currentPage !== undefined) {
        const page = Number(currentPage);
        if (existing.total_pages && (page < 0 || page > existing.total_pages)) {
          return res.status(400).json({ error: `Page must be between 0 and ${existing.total_pages}` });
        }
        nextCurrentPage = page;
      }

      const nextDateStarted = !existing.date_started && nextCurrentPage > 0 ? new Date() : existing.date_started;
      const nextReadingTime = Number(existing.reading_time) + Number(sessionDuration || 0);
      const nextStatus = computeStatus(existing.total_pages, nextCurrentPage);
      const nextDateCompleted =
        nextStatus === 'completed' && !existing.date_completed ? new Date() : existing.date_completed;

      await withTransaction(async (client) => {
        await client.query(
          `UPDATE books SET
             current_page = $1, date_started = $2, reading_time = $3, status = $4, date_completed = $5
           WHERE id = $6`,
          [nextCurrentPage, nextDateStarted, nextReadingTime, nextStatus, nextDateCompleted, existing.id]
        );

        if (Number(sessionDuration) > 0 || Number(pagesRead) > 0) {
          await client.query(
            `INSERT INTO reading_sessions (book_id, duration, pages_read) VALUES ($1, $2, $3)`,
            [existing.id, Number(sessionDuration || 0), Number(pagesRead || 0)]
          );
        }
      });

      const updated = await fetchOwnedBook(req.params.id, req.userId);
      const sessionResult = await query('SELECT * FROM reading_sessions WHERE book_id = $1', [req.params.id]);
      res.json(bookToResponse(updated, sessionResult.rows));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/sessions',
  body('duration').isInt({ min: 1 }).withMessage('duration (seconds) must be a positive whole number'),
  body('pagesRead').optional().isInt({ min: 0 }).withMessage('pagesRead must be a non-negative whole number'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const existing = await fetchOwnedBook(req.params.id, req.userId);
      if (!existing) return res.status(404).json({ error: 'Book not found' });

      const { duration, pagesRead = 0 } = req.body;

      const result = await withTransaction(async (client) => {
        const sessionResult = await client.query(
          `INSERT INTO reading_sessions (book_id, duration, pages_read) VALUES ($1, $2, $3) RETURNING *`,
          [existing.id, Number(duration), Number(pagesRead || 0)]
        );
        await client.query('UPDATE books SET reading_time = reading_time + $1 WHERE id = $2', [
          Number(duration),
          existing.id
        ]);
        return sessionResult.rows[0];
      });

      res.status(201).json(sessionToResponse(result));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id/sessions', async (req, res, next) => {
  try {
    const existing = await fetchOwnedBook(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    const result = await query('SELECT * FROM reading_sessions WHERE book_id = $1 ORDER BY session_date DESC', [
      req.params.id
    ]);
    res.json(result.rows.map(sessionToResponse));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const existing = await fetchOwnedBook(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    const result = await query(
      `SELECT COUNT(*) AS total_sessions,
              COALESCE(SUM(duration), 0) AS total_duration,
              COALESCE(SUM(pages_read), 0) AS total_pages_read
       FROM reading_sessions WHERE book_id = $1`,
      [req.params.id]
    );
    const row = result.rows[0];
    const totalDuration = Number(row.total_duration);
    const totalPagesRead = Number(row.total_pages_read);
    const avgPagesPerMinute = totalDuration > 0 ? Number(((totalPagesRead / totalDuration) * 60).toFixed(2)) : 0;

    res.json({
      bookId: existing.id,
      totalSessions: Number(row.total_sessions),
      totalDuration,
      totalPagesRead,
      avgPagesPerMinute,
      progress: computeProgress(existing.total_pages, existing.current_page)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/quotes', async (req, res, next) => {
  try {
    const existing = await fetchOwnedBook(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    const result = await query('SELECT * FROM quotes WHERE book_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json(
      result.rows.map((q) => ({
        id: q.id,
        bookId: q.book_id,
        text: q.text,
        page: q.page,
        createdAt: q.created_at
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/quotes',
  body('text').trim().notEmpty().withMessage('Quote text is required').isLength({ max: 2000 }),
  body('page').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Page must be a non-negative whole number'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const existing = await fetchOwnedBook(req.params.id, req.userId);
      if (!existing) return res.status(404).json({ error: 'Book not found' });

      const page = req.body.page !== undefined && req.body.page !== null ? Number(req.body.page) : null;
      const result = await query(
        `INSERT INTO quotes (user_id, book_id, text, page) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.userId, existing.id, req.body.text, page]
      );
      const q = result.rows[0];

      res.status(201).json({ id: q.id, bookId: q.book_id, text: q.text, page: q.page, createdAt: q.created_at });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id/quotes/:quoteId', async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM quotes WHERE id = $1 AND book_id = $2 AND user_id = $3 RETURNING id',
      [req.params.quoteId, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quote not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
