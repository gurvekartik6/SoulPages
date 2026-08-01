export function GenreBreakdown({ data = [] }) {
  const total = data.reduce((sum, g) => sum + g.count, 0);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="card-cut p-6 pt-7">
      <h3 className="font-display text-lg font-medium text-ink">Genres on your shelf</h3>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Add a genre to your books to see this fill in.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((g) => (
            <div key={g.genre}>
              <div className="flex justify-between text-xs text-ink-soft">
                <span>{g.genre}</span>
                <span className="font-mono text-muted">{g.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
                <div
                  className="h-full rounded-full bg-brass"
                  style={{ width: `${total ? (g.count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
