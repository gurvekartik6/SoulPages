import { useState, useCallback } from 'react';
import { FiCamera } from 'react-icons/fi';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export function AddBookByISBN({ onSubmit, isSubmitting }) {
  const [isbn, setIsbn] = useState('');
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleaned = isbn.replace(/[-\s]/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid 10 or 13 digit ISBN');
      return;
    }
    try {
      await onSubmit(cleaned);
      setIsbn('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not find that ISBN - In Progress');
    }
  };

  const handleDetected = useCallback((code) => {
    setIsbn(code);
    setScannerOpen(false);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">ISBN</label>
        <div className="mt-1 flex gap-2">
          <input
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
            placeholder="9780135957059"
          />
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            title="Scan barcode with your camera"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink-soft hover:border-ribbon hover:text-ribbon-deep"
          >
            <FiCamera className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">We'll look up the title, author, and cover for you.</p>
        {error && <p className="mt-1 text-xs text-stamp-red">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-ribbon py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Looking up…' : 'Find & add book'}
      </button>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />
    </form>
  );
}
