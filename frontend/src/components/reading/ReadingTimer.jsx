import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateProgress } from '../../api/books';
import { useTimer } from '../../hooks/useTimer';
import { formatDuration } from '../../utils/formatters';

export function ReadingTimer({ bookId, currentPage, totalPages, onUpdate }) {
  const { seconds, isRunning, start, stop, reset } = useTimer();
  const [startPage, setStartPage] = useState(currentPage);
  const [pageInput, setPageInput] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => updateProgress(bookId, payload),
    onSuccess: (data) => {
      onUpdate(data);
      toast.success('Progress saved');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not save progress')
  });

  const handleStartStop = () => {
    if (!isRunning) {
      setStartPage(currentPage);
      start();
    } else {
      stop();
      const pagesRead = Math.max(0, currentPage - startPage);
      mutation.mutate({ currentPage, sessionDuration: seconds, pagesRead });
      reset();
    }
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (Number.isNaN(page) || page < 0 || (totalPages && page > totalPages)) {
      toast.error(`Enter a page between 0 and ${totalPages || '∞'}`);
      return;
    }
    mutation.mutate({ currentPage: page, sessionDuration: 0, pagesRead: 0 });
    setPageInput('');
  };

  const pagesPerMinute =
    seconds > 0 && currentPage > startPage
      ? ((currentPage - startPage) / (seconds / 60)).toFixed(1)
      : '—';

  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Reading timer</h3>

      <div className="mt-4 text-center">
        <div className="font-mono text-5xl font-semibold tracking-tight text-ink">
          {formatDuration(seconds)}
        </div>

        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={handleStartStop}
            className={`rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
              isRunning ? 'bg-stamp-red text-paper' : 'bg-ribbon text-paper'
            }`}
          >
            {isRunning ? 'Stop & log session' : 'Start reading'}
          </button>
          {!isRunning && seconds > 0 && (
            <button
              onClick={reset}
              className="rounded-full border border-line px-5 py-3 text-sm font-medium text-ink-soft hover:border-ink"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handlePageJump} className="mt-6 flex items-center justify-center gap-3">
        <span className="font-mono text-sm text-muted">
          pg <span className="font-semibold text-ink">{currentPage}</span> / {totalPages || '—'}
        </span>
        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder="Jump to page"
          className="w-32 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-ribbon"
          min="0"
          max={totalPages || undefined}
        />
        <button
          type="submit"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-ink"
        >
          Go
        </button>
      </form>

      <div className="mt-6 grid grid-cols-3 gap-3 rounded-lg bg-paper-dim p-4 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Speed</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">{pagesPerMinute} pg/min</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Progress</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
            {totalPages ? Math.round((currentPage / totalPages) * 100) : 0}%
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Remaining</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
            {totalPages ? Math.max(0, totalPages - currentPage) : '—'} pg
          </p>
        </div>
      </div>
    </div>
  );
}
