export function ProgressBar({ progress = 0 }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
      <div
        className="h-full rounded-full bg-gradient-to-r from-ribbon to-ribbon-deep transition-all duration-500"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );
}
