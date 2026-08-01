import { useQuery } from '@tanstack/react-query';
import { FiZap } from 'react-icons/fi';
import { getStreak } from '../../api/stats';

function intensityClass(day) {
  if (!day.active) return 'bg-paper-dim';
  if (day.pagesRead >= 40) return 'bg-ribbon-deep';
  if (day.pagesRead >= 15) return 'bg-ribbon';
  return 'bg-ribbon/40';
}

export function StreakHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'streak'],
    queryFn: () => getStreak(84) // 12 weeks
  });

  if (isLoading || !data) return null;

  // Group into weeks (columns) of 7 days each for a GitHub-style grid
  const weeks = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }

  return (
    <div className="card-cut p-6 pt-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-ink">Reading streak</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <FiZap className="h-3.5 w-3.5 text-brass-deep" />
          <span className="font-mono">
            {data.currentStreak} day{data.currentStreak === 1 ? '' : 's'} · best {data.longestStreak}
          </span>
        </div>
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}${day.active ? ` — ${day.pagesRead} pages` : ''}`}
                className={`h-3 w-3 rounded-sm ${intensityClass(day)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
