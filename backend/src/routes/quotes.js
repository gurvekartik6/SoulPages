import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/quotes - every quote the user has saved, across all books,
// joined with the book's title/author so the commonplace book page
// doesn't need N+1 lookups.
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT q.*, b.title AS book_title, b.author AS book_author
       FROM quotes q
       JOIN books b ON b.id = q.book_id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC`,
      [req.userId]
    );

    res.json(
      result.rows.map((q) => ({
        id: q.id,
        bookId: q.book_id,
        text: q.text,
        page: q.page,
        createdAt: q.created_at,
        bookTitle: q.book_title,
        bookAuthor: q.book_author
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
