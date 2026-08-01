import { FiAward } from 'react-icons/fi';
import { formatDurationLong } from '../../utils/formatters';

export function Leaderboard({ data = [], currentUsername }) {
  return (
    <div className="card-cut p-6 pt-7">
      <div className="flex items-center gap-2">
        <FiAward className="h-4 w-4 text-brass-deep" />
        <h3 className="font-display text-lg font-medium text-ink">Top readers</h3>
      </div>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Finish a book to appear on the board.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {data.slice(0, 5).map((entry, index) => (
            <li
              key={entry.username}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                entry.username === currentUsername ? 'bg-brass/10' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="font-mono text-xs text-muted">#{index + 1}</span>
                {entry.username}
                {entry.username === currentUsername && (
                  <span className="rounded-full bg-brass/20 px-1.5 py-0.5 text-[10px] font-medium text-brass-deep">
                    you
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-muted">
                {entry.completed} done · {formatDurationLong(entry.readingTime)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
