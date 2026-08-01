import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/overview', async (req, res, next) => {
  try {
    const userResult = await query('SELECT reading_goal FROM users WHERE id = $1', [req.userId]);
    const readingGoal = userResult.rows[0]?.reading_goal || 12;

    const countsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'not-started') AS not_started,
         COUNT(*) FILTER (WHERE status = 'reading') AS reading,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed,
         COUNT(*) AS total,
         COALESCE(SUM(reading_time), 0) AS total_reading_time,
         COUNT(*) FILTER (
           WHERE status = 'completed' AND date_part('year', date_completed) = date_part('year', now())
         ) AS completed_this_year
       FROM books WHERE user_id = $1`,
      [req.userId]
    );
    const c = countsResult.rows[0];

    const pagesResult = await query(
      `SELECT COALESCE(SUM(rs.pages_read), 0) AS total_pages_read
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1`,
      [req.userId]
    );

    res.json({
      totalBooks: Number(c.total),
      readingBooks: Number(c.reading),
      completedBooks: Number(c.completed),
      notStarted: Number(c.not_started),
      totalReadingTime: Number(c.total_reading_time),
      totalPagesRead: Number(pagesResult.rows[0].total_pages_read),
      annualGoal: readingGoal,
      completedThisYear: Number(c.completed_this_year),
      statusData: [
        { name: 'Not started', value: Number(c.not_started) },
        { name: 'Reading', value: Number(c.reading) },
        { name: 'Completed', value: Number(c.completed) }
      ]
    });
  } catch (err) {
    next(err);
  }
});

router.get('/monthly', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT to_char(rs.session_date, 'YYYY-MM') AS month_key,
              COALESCE(SUM(rs.pages_read), 0) AS pages_read
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1 AND rs.session_date >= now() - interval '12 months'
       GROUP BY month_key`,
      [req.userId]
    );
    const pagesByMonth = new Map(result.rows.map((r) => [r.month_key, Number(r.pages_read)]));

    const completedResult = await query(
      `SELECT to_char(date_completed, 'YYYY-MM') AS month_key, COUNT(*) AS completed
       FROM books
       WHERE user_id = $1 AND date_completed >= now() - interval '12 months'
       GROUP BY month_key`,
      [req.userId]
    );
    const completedByMonth = new Map(completedResult.rows.map((r) => [r.month_key, Number(r.completed)]));

    const now = new Date();
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        pagesRead: pagesByMonth.get(key) || 0,
        booksCompleted: completedByMonth.get(key) || 0
      });
    }

    res.json(monthlyData);
  } catch (err) {
    next(err);
  }
});

router.get('/yearly', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT date_part('year', rs.session_date)::int AS year,
              COALESCE(SUM(rs.pages_read), 0) AS pages_read,
              COALESCE(SUM(rs.duration), 0) AS reading_time
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1
       GROUP BY year`,
      [req.userId]
    );

    const completedResult = await query(
      `SELECT date_part('year', date_completed)::int AS year, COUNT(*) AS completed
       FROM books
       WHERE user_id = $1 AND date_completed IS NOT NULL
       GROUP BY year`,
      [req.userId]
    );

    const byYear = new Map();
    result.rows.forEach((r) => {
      byYear.set(r.year, { year: r.year, pagesRead: Number(r.pages_read), readingTime: Number(r.reading_time), booksCompleted: 0 });
    });
    completedResult.rows.forEach((r) => {
      const existing = byYear.get(r.year) || { year: r.year, pagesRead: 0, readingTime: 0, booksCompleted: 0 };
      existing.booksCompleted = Number(r.completed);
      byYear.set(r.year, existing);
    });

    const yearlyData = [...byYear.values()].sort((a, b) => a.year - b.year);
    res.json(yearlyData.length > 0 ? yearlyData : [{ year: new Date().getFullYear(), pagesRead: 0, readingTime: 0, booksCompleted: 0 }]);
  } catch (err) {
    next(err);
  }
});

router.get('/genre', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COALESCE(NULLIF(genre, ''), 'Unspecified') AS genre, COUNT(*) AS count
       FROM books WHERE user_id = $1
       GROUP BY genre
       ORDER BY count DESC`,
      [req.userId]
    );
    res.json(result.rows.map((r) => ({ genre: r.genre, count: Number(r.count) })));
  } catch (err) {
    next(err);
  }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.username,
              COUNT(*) FILTER (WHERE b.status = 'completed') AS completed,
              COALESCE(SUM(b.reading_time), 0) AS reading_time
       FROM users u
       LEFT JOIN books b ON b.user_id = u.id
       GROUP BY u.id, u.username
       ORDER BY completed DESC, reading_time DESC
       LIMIT 20`
    );
    res.json(
      result.rows.map((r) => ({
        username: r.username,
        completed: Number(r.completed),
        readingTime: Number(r.reading_time)
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/streak?days=90 - daily activity heatmap + current/longest streak
router.get('/streak', async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));

    const result = await query(
      `SELECT rs.session_date, rs.pages_read, rs.duration
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1 AND rs.session_date >= now() - ($2 || ' days')::interval`,
      [req.userId, days]
    );

    const byDay = new Map();
    result.rows.forEach((s) => {
      const key = dayKey(s.session_date);
      const entry = byDay.get(key) || { pagesRead: 0, duration: 0 };
      entry.pagesRead += s.pages_read;
      entry.duration += s.duration;
      byDay.set(key, entry);
    });

    const today = new Date();
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const entry = byDay.get(key);
      daily.push({
        date: key,
        pagesRead: entry?.pagesRead || 0,
        duration: entry?.duration || 0,
        active: Boolean(entry)
      });
    }

    let currentStreak = 0;
    for (let i = daily.length - 1; i >= 0; i--) {
      if (daily[i].active) {
        currentStreak++;
      } else if (i === daily.length - 1) {
        continue; // today has no activity yet — don't zero the streak for that alone
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let running = 0;
    daily.forEach((d) => {
      running = d.active ? running + 1 : 0;
      longestStreak = Math.max(longestStreak, running);
    });

    res.json({ days: daily, currentStreak, longestStreak });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/achievements - badges computed from the reader's own history
router.get('/achievements', async (req, res, next) => {
  try {
    const bookStats = await query(
      `SELECT COUNT(*) AS total_books,
              COUNT(*) FILTER (WHERE status = 'completed') AS completed,
              COALESCE(SUM(reading_time), 0) AS total_reading_time,
              COUNT(DISTINCT genre) FILTER (WHERE genre IS NOT NULL AND genre != 'Unspecified') AS distinct_genres
       FROM books WHERE user_id = $1`,
      [req.userId]
    );
    const b = bookStats.rows[0];

    const sessionStats = await query(
      `SELECT COUNT(*) AS total_sessions
       FROM reading_sessions rs JOIN books bk ON bk.id = rs.book_id
       WHERE bk.user_id = $1`,
      [req.userId]
    );

    const totalBooks = Number(b.total_books);
    const completedCount = Number(b.completed);
    const totalHours = Number(b.total_reading_time) / 3600;
    const distinctGenres = Number(b.distinct_genres);
    const totalSessions = Number(sessionStats.rows[0].total_sessions);

    const badges = [
      { id: 'first-book', label: 'First chapter', description: 'Added your first book', unlocked: totalBooks >= 1 },
      { id: 'first-finish', label: 'The End', description: 'Finished your first book', unlocked: completedCount >= 1 },
      { id: 'ten-books', label: 'Bookshelf builder', description: 'Finished 10 books', unlocked: completedCount >= 10 },
      { id: 'hundred-hours', label: 'Century of pages', description: 'Logged 100 hours of reading', unlocked: totalHours >= 100 },
      { id: 'genre-explorer', label: 'Genre explorer', description: 'Read across 5 different genres', unlocked: distinctGenres >= 5 },
      { id: 'dedicated-reader', label: 'Dedicated reader', description: 'Logged 25 reading sessions', unlocked: totalSessions >= 25 }
    ];

    res.json(badges);
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/wrapped?year=2026 - a year-in-review summary
router.get('/wrapped', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const sessionResult = await query(
      `SELECT COALESCE(SUM(rs.pages_read), 0) AS total_pages_read,
              COALESCE(SUM(rs.duration), 0) AS total_reading_time
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1 AND date_part('year', rs.session_date) = $2`,
      [req.userId, year]
    );

    const completedResult = await query(
      `SELECT id, title, total_pages, reading_time, genre
       FROM books
       WHERE user_id = $1 AND status = 'completed' AND date_part('year', date_completed) = $2`,
      [req.userId, year]
    );
    const completedThisYear = completedResult.rows;

    const genreTally = {};
    completedThisYear.forEach((b) => {
      const g = b.genre || 'Unspecified';
      genreTally[g] = (genreTally[g] || 0) + 1;
    });
    const favoriteGenre = Object.entries(genreTally).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const longestBook = [...completedThisYear].sort((a, b) => (b.total_pages || 0) - (a.total_pages || 0))[0];
    const fastestBook = [...completedThisYear]
      .filter((b) => b.reading_time > 0 && b.total_pages)
      .sort((a, b) => a.reading_time / a.total_pages - b.reading_time / b.total_pages)[0];

    res.json({
      year,
      booksCompleted: completedThisYear.length,
      totalPagesRead: Number(sessionResult.rows[0].total_pages_read),
      totalReadingTime: Number(sessionResult.rows[0].total_reading_time),
      favoriteGenre,
      longestBook: longestBook ? { title: longestBook.title, totalPages: longestBook.total_pages } : null,
      fastestBook: fastestBook ? { title: fastestBook.title, readingTime: Number(fastestBook.reading_time) } : null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
