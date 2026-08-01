export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-12 py-14 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-6 items-center justify-center rounded-b-sm bg-brass text-[10px] font-bold text-surface">
            LG
          </span>
          <span className="font-display text-lg font-semibold">SoulPages</span>
        </div>

        <div className="max-w-sm">
          <p className="font-display text-4xl leading-tight font-medium">
            Every page turned<br />is a line in the record.
          </p>
          <p className="mt-4 text-sm text-paper/70">
            Track what you're reading, time your sessions, and watch your yearly goal fill in —
            one stamped entry at a time.
          </p>
        </div>

        <p className="font-mono text-xs text-paper/50">est. reading, tracked properly</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-medium text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
