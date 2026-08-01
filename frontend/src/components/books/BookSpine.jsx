import { Link } from 'react-router-dom';
import { paletteFor } from './BookCover';

export function BookSpine({ book }) {
  const [from, to] = paletteFor(book.title || 'book');
  // Slightly vary height by page count so the shelf doesn't look perfectly uniform
  const height = book.totalPages
    ? Math.min(240, Math.max(150, 140 + book.totalPages / 6)) : 170;

  return (
    <Link
      to={`/books/${book.id}`}
      title={`${book.title} — ${book.author}`}
      className="group relative flex w-12 shrink-0 items-end justify-center overflow-hidden rounded-t-sm shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
      style={{ height, background: `linear-gradient(100deg, ${from}, ${to})` }}
    >
      {book.status === 'completed' && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-ribbon" />
      )}
      <span
        className="mb-3 origin-center text-[11px] font-medium text-white/90"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          maxHeight: height - 24
        }}
      >
        {book.title}
      </span>
    </Link>
  );
}
