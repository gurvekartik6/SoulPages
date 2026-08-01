const PALETTES = [
  ['#2F6F5A', '#234F41'],
  ['#C08A28', '#9C6D1B'],
  ['#3B5A7A', '#28405A'],
  ['#7A4A3B', '#5A3428'],
  ['#5A4A7A', '#3E3358']
];

export function paletteFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function BookCover({ title, coverUrl, className = '' }) {
  if (coverUrl) {
    return (
      <div className={`overflow-hidden rounded-md bg-paper-dim ${className}`}>
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const [from, to] = paletteFor(title || 'book');
  const initial = (title || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md ${className}`}
      style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
    >
      {/* Spine highlight */}
      <div className="absolute left-2 top-0 bottom-0 w-[3px] rounded bg-white/25" />
      <span
        className="font-display text-3xl font-semibold text-white/90"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
      >
        {initial}
      </span>
    </div>
  );
}
