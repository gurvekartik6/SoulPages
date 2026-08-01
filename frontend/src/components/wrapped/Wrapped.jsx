import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWrapped } from '../../api/stats';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDurationLong } from '../../utils/formatters';

export function Wrapped() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'wrapped', year],
    queryFn: () => getWrapped(year)
  });

  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Your year in reading</h1>
          <p className="mt-1 text-sm text-muted">A stamped summary of what you read.</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-ribbon"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Stamping the record" />
      ) : (
        <div className="card-cut relative mt-8 overflow-hidden p-10 text-center">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rotate-12 rounded-full border-4 border-dashed opacity-20"
            style={{ borderColor: 'var(--color-stamp-red)' }}
          />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{data.year} · reading ledger</p>

          <p className="mt-6 font-display text-6xl font-semibold text-ink">{data.booksCompleted}</p>
          <p className="mt-1 text-sm text-muted">
            {data.booksCompleted === 1 ? 'book' : 'books'} finished this year
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-8 text-left">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Pages read</p>
              <p className="mt-1 font-display text-2xl text-ink">{data.totalPagesRead.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Time reading</p>
              <p className="mt-1 font-display text-2xl text-ink">{formatDurationLong(data.totalReadingTime)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Favorite genre</p>
              <p className="mt-1 font-display text-2xl text-ink">{data.favoriteGenre || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Longest book</p>
              <p className="mt-1 truncate font-display text-2xl text-ink" title={data.longestBook?.title}>
                {data.longestBook ? data.longestBook.title : '—'}
              </p>
            </div>
          </div>

          <p className="mt-8 font-mono text-[11px] text-muted">
            Right-click → "Save as image" or take a screenshot to keep this one.
          </p>
        </div>
      )}
    </div>
  );
}
