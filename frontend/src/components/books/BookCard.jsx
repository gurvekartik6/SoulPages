import { Link } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import { BookCover } from './BookCover';
import { ProgressRing } from '../common/ProgressRing';
import { StarRating } from '../common/StarRating';
import { STATUS_LABELS, formatDurationLong } from '../../utils/formatters';

const statusStyles = {
  'not-started': 'bg-paper-dim text-ink-soft',
  reading: 'bg-brass/15 text-brass-deep',
  completed: 'bg-ribbon/15 text-ribbon-deep'
};

export function BookCard({ book }) {
  return (
    <Link
      to={`/books/${book.id}`}
      className="card-cut group flex gap-4 p-4 pt-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <BookCover title={book.title} coverUrl={book.coverUrl} className="h-28 w-20 shrink-0 shadow-sm" />

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="truncate font-display text-lg font-medium leading-snug text-ink">{book.title}</p>
          <p className="truncate text-sm text-muted">{book.author}</p>
          {book.rating ? (
            <div className="mt-1">
              <StarRating value={book.rating} readOnly size="h-3 w-3" />
            </div>
          ) : null}
          {book.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {book.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-paper-dim px-1.5 py-0.5 text-[10px] font-medium text-ink-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[book.status]}`}>
              {STATUS_LABELS[book.status]}
            </span>
            {book.readingTime > 0 && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
                <FiClock className="h-3 w-3" /> {formatDurationLong(book.readingTime)}
              </span>
            )}
          </div>
          <ProgressRing progress={book.progress} size={44} stroke={4} />
        </div>
      </div>
    </Link>
  );
}
