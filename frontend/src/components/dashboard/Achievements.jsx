import { useQuery } from '@tanstack/react-query';
import { FiAward } from 'react-icons/fi';
import { getAchievements } from '../../api/stats';

export function Achievements() {
  const { data: badges = [] } = useQuery({
    queryKey: ['stats', 'achievements'],
    queryFn: getAchievements
  });

  if (badges.length === 0) return null;

  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Stamps earned</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-opacity ${
              badge.unlocked ? 'border-brass/40 bg-brass/5' : 'border-line opacity-40'
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                badge.unlocked ? 'border-brass text-brass-deep' : 'border-line text-muted'
              }`}
            >
              <FiAward className="h-4 w-4" />
            </div>
            <p className="text-[11px] font-medium leading-tight text-ink-soft">{badge.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
