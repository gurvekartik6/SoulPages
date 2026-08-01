import { useQuery } from '@tanstack/react-query';
import { getOverview, getMonthly, getGenreStats, getLeaderboard } from '../../api/stats';
import { getBooks } from '../../api/books';
import { StatsOverview } from './StatsOverview';
import { MonthlyChart } from './MonthlyChart';
import { YearlyChart } from './YearlyChart';
import { GenreBreakdown } from './GenreBreakdown';
import { Leaderboard } from './Leaderboard';
import { StreakHeatmap } from './StreakHeatmap';
import { Achievements } from './Achievements';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { BookCard } from '../books/BookCard';
import { useAuth } from '../../hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: getOverview
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['stats', 'monthly'],
    queryFn: getMonthly
  });

  const { data: genreData } = useQuery({
    queryKey: ['stats', 'genre'],
    queryFn: getGenreStats
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['stats', 'leaderboard'],
    queryFn: getLeaderboard
  });

  const { data: currentlyReading, isLoading: booksLoading } = useQuery({
    queryKey: ['books', 'reading', 'dashboard'],
    queryFn: () => getBooks({ status: 'reading', size: 3 })
  });

  if (statsLoading || monthlyLoading) return <LoadingSpinner label="Tallying the ledger" />;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Welcome back, {(user?.fullName || user?.username || '').split(' ')[0]}
        </h1>
      </div>

      <StatsOverview stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlyChart data={monthly} />
        <YearlyChart statusData={stats.statusData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StreakHeatmap />
        <Achievements />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GenreBreakdown data={genreData || []} />
        <Leaderboard data={leaderboard || []} currentUsername={user?.username} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-ink">Currently reading</h2>
        </div>
        <div className="mt-4">
          {booksLoading ? (
            <LoadingSpinner label="Fetching" />
          ) : currentlyReading?.content?.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentlyReading.content.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Nothing in progress — pick up a book from your library.</p>
          )}
        </div>
      </div>
    </div>
  );
}
