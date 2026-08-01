import { formatDate, formatDurationLong } from '../../utils/formatters';

export function ReadingStats({ sessions = [] }) {
  if (sessions.length === 0) {
    return (
      <div className="card-cut p-6 pt-7">
        <h3 className="font-display text-lg font-medium text-ink">Session history</h3>
        <p className="mt-2 text-sm text-muted">No sessions logged yet — start the timer to begin.</p>
      </div>
    );
  }

  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Session history</h3>
      <div className="ledger-rule mt-4 max-h-72 space-y-0 overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-soft">{formatDate(session.sessionDate)}</span>
            <span className="font-mono text-xs text-muted">{session.pagesRead} pg</span>
            <span className="font-mono text-xs font-medium text-ink">
              {formatDurationLong(session.duration)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
