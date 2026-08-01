import { formatDurationLong } from '../../utils/formatters';

function StatCard({ label, value, accent }) {
  return (
    <div className="card-cut p-5 pt-6">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-medium ${accent || 'text-ink'}`}>{value}</p>
    </div>
  );
}

export function StatsOverview({ stats }) {
  const goalProgress = stats.annualGoal
    ? Math.min(100, Math.round((stats.completedThisYear / stats.annualGoal) * 100))
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total books" value={stats.totalBooks} />
      <StatCard label="Currently reading" value={stats.readingBooks} accent="text-brass-deep" />
      <StatCard label="Completed" value={stats.completedBooks} accent="text-ribbon-deep" />
      <StatCard label="Time reading" value={formatDurationLong(stats.totalReadingTime)} />
      <div className="card-cut col-span-2 p-5 pt-6 lg:col-span-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted">
            {stats.completedThisYear} of {stats.annualGoal} books this year
          </p>
          <p className="font-mono text-xs text-muted">{goalProgress}%</p>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brass to-brass-deep transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
