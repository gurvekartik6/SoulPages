const statusOptions = [
  { value: '', label: 'All' },
  { value: 'not-started', label: 'Not started' },
  { value: 'reading', label: 'Reading' },
  { value: 'completed', label: 'Completed' }
];

export function BookFilters({ status, onStatusChange, search, onSearchChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              status === opt.value
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-soft hover:border-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search title or author…"
        className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-ribbon sm:w-64"
      />
    </div>
  );
}
