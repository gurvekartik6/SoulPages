import { useState } from 'react';
import Papa from 'papaparse';
import { AnimatePresence, motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';

const EXPECTED_COLUMNS = 'title, author, totalPages, genre, currentPage, notes';

// Maps common header variants (Goodreads exports, spaced/capitalized column
// names, etc.) to the canonical keys our backend's bulk-import endpoint
// reads. Matching is case/space/punctuation-insensitive — see normalizeHeader.
const HEADER_ALIASES = {
  title: 'title',
  booktitle: 'title',
  name: 'title',
  author: 'author',
  authors: 'author',
  authorlf: 'author',
  totalpages: 'totalPages',
  pages: 'totalPages',
  numberofpages: 'totalPages',
  pagecount: 'totalPages',
  genre: 'genre',
  genres: 'genre',
  category: 'genre',
  bookshelves: 'genre',
  currentpage: 'currentPage',
  currentpagenumber: 'currentPage',
  notes: 'notes',
  note: 'notes',
  myreview: 'notes',
  review: 'notes'
};

function normalizeHeader(header) {
  const key = String(header || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return HEADER_ALIASES[key] || header;
}

export function ImportCsvModal({ open, onClose, onImport, isSubmitting }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        if (!results.data.length) {
          setError('That file has no rows we could read.');
          setRows([]);
          return;
        }
        setRows(results.data.slice(0, 500));
      },
      error: () => setError('Could not parse that file — make sure it is a valid CSV.')
    });
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    await onImport(rows);
    setRows([]);
    setFileName('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-ink">Import from CSV</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted hover:bg-paper-dim hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Recognized columns: <code className="font-mono">{EXPECTED_COLUMNS}</code> — common variants like
              "Book Title", "Number of Pages", or "Bookshelves" (Goodreads exports) also match. Only{' '}
              <code className="font-mono">title</code> and <code className="font-mono">author</code> are required.
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line py-8 text-center hover:border-ribbon">
              <FiUpload className="h-6 w-6 text-muted" />
              <span className="text-sm text-ink-soft">{fileName || 'Choose a .csv file'}</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>

            {error && <p className="mt-2 text-xs text-stamp-red">{error}</p>}

            {rows.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted">
                  Found <span className="font-medium text-ink-soft">{rows.length}</span> row
                  {rows.length === 1 ? '' : 's'}. Preview:
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-line">
                  {rows.slice(0, 8).map((row, i) => (
                    <div key={i} className="border-b border-line px-3 py-1.5 text-xs last:border-0">
                      <span className="font-medium text-ink-soft">{row.title || '(no title)'}</span>{' '}
                      <span className="text-muted">— {row.author || '(no author)'}</span>
                    </div>
                  ))}
                  {rows.length > 8 && (
                    <div className="px-3 py-1.5 text-xs text-muted">…and {rows.length - 8} more</div>
                  )}
                </div>

                <button
                  onClick={handleImport}
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? 'Importing…' : `Import ${rows.length} book${rows.length === 1 ? '' : 's'}`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
