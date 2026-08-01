export function estimatePace(book) {
  const sessions = book.readingSessions || [];
  const withPages = sessions.filter((s) => s.pagesRead > 0 && s.duration > 0);
  if (withPages.length === 0 || !book.totalPages || book.status === 'completed') return null;

  const recent = withPages.slice(0, 5); // most recent sessions (API returns newest-first)
  const totalPages = recent.reduce((sum, s) => sum + s.pagesRead, 0);
  const totalMinutes = recent.reduce((sum, s) => sum + s.duration, 0) / 60;
  if (totalMinutes === 0) return null;

  const pagesPerMinute = totalPages / totalMinutes;
  const pagesRemaining = Math.max(0, book.totalPages - book.currentPage);
  if (pagesPerMinute <= 0 || pagesRemaining === 0) return null;

  // Rough assumption: ~30 minutes of reading per day, based on recent pace
  const minutesRemaining = pagesRemaining / pagesPerMinute;
  const daysRemaining = Math.max(1, Math.ceil(minutesRemaining / 30));

  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);

  return {
    pagesPerMinute: Number(pagesPerMinute.toFixed(2)),
    daysRemaining,
    finishDate
  };
}
