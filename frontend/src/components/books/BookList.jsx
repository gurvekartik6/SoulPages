import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiBookOpen, FiGrid, FiUpload } from 'react-icons/fi';
import { getBooks, addBook, addBookByIsbn, importBooks } from '../../api/books';
import { BookCard } from './BookCard';
import { BookFilters } from './BookFilters';
import { AddBookDrawer } from './AddBookDrawer';
import { ImportCsvModal } from './ImportCsvModal';
import { BookshelfView } from './BookshelfView';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export function BookList() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [view, setView] = useState('grid');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['books', status, debouncedSearch, tag],
    queryFn: () =>
      getBooks({ status: status || undefined, search: debouncedSearch || undefined, tag: tag || undefined, size: 100 })
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const manualMutation = useMutation({
    mutationFn: addBook,
    onSuccess: () => {
      toast.success('Book added to your library');
      invalidate();
      setDrawerOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not add book')
  });

  const isbnMutation = useMutation({
    mutationFn: addBookByIsbn,
    onSuccess: () => {
      toast.success('Found it — added to your library');
      invalidate();
      setDrawerOpen(false);
    }
  });

  const importMutation = useMutation({
    mutationFn: importBooks,
    onSuccess: (result) => {
      invalidate();
      setImportOpen(false);
      if (result.skippedCount > 0) {
        toast.success(`Imported ${result.createdCount} books (${result.skippedCount} skipped — missing title/author)`);
      } else {
        toast.success(`Imported ${result.createdCount} books`);
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Import failed')
  });

  const books = data?.content || [];

  const availableTags = useMemo(() => {
    const set = new Set();
    books.forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Library</h1>
          <p className="mt-1 text-sm text-muted">{data?.totalElements ?? 0} books on record</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-ribbon hover:text-ribbon-deep"
          >
            <FiUpload className="h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90"
          >
            <FiPlus className="h-4 w-4" /> Add book
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BookFilters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} />
          <div className="flex shrink-0 gap-1 rounded-full bg-paper-dim p-1">
            <button
              onClick={() => setView('grid')}
              title="Grid view"
              className={`rounded-full p-1.5 ${view === 'grid' ? 'bg-surface shadow-sm text-ink' : 'text-muted'}`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('shelf')}
              title="Shelf view"
              className={`rounded-full p-1.5 ${view === 'shelf' ? 'bg-surface shadow-sm text-ink' : 'text-muted'}`}
            >
              <FiBookOpen className="h-4 w-4" />
            </button>
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTag('')}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                !tag ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:border-ink'
              }`}
            >
              All tags
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t === tag ? '' : t)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  tag === t ? 'border-brass bg-brass/10 text-brass-deep' : 'border-line text-muted hover:border-ink'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner label="Pulling your shelf" />
        ) : books.length === 0 ? (
          <div className="card-cut flex flex-col items-center gap-2 py-16 text-center">
            <FiBookOpen className="h-8 w-8 text-muted" />
            <p className="font-display text-xl text-ink">No books here yet.</p>
            <p className="text-sm text-muted">Add one to start the ledger.</p>
          </div>
        ) : view === 'shelf' ? (
          <BookshelfView books={books} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>

      <AddBookDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddManual={(values) => manualMutation.mutateAsync(values)}
        onAddByIsbn={(isbn) => isbnMutation.mutateAsync(isbn)}
        isSubmitting={manualMutation.isPending || isbnMutation.isPending}
      />

      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(rows) => importMutation.mutateAsync(rows)}
        isSubmitting={importMutation.isPending}
      />
    </div>
  );
}
