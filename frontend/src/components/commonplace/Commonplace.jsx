import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiFeather, FiTrash2 } from 'react-icons/fi';
import { getAllQuotes } from '../../api/quotes';
import { deleteBookQuote } from '../../api/books';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function Commonplace() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', 'all'],
    queryFn: getAllQuotes
  });

  const deleteMutation = useMutation({
    mutationFn: ({ bookId, quoteId }) => deleteBookQuote(bookId, quoteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] })
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return quotes;
    const term = search.toLowerCase();
    return quotes.filter(
      (q) =>
        q.text.toLowerCase().includes(term) ||
        q.bookTitle.toLowerCase().includes(term) ||
        q.bookAuthor.toLowerCase().includes(term)
    );
  }, [quotes, search]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <FiFeather className="h-5 w-5 text-brass-deep" />
        <h1 className="font-display text-3xl font-medium text-ink">Commonplace book</h1>
      </div>
      <p className="mt-1 text-sm text-muted">Every line you've saved, in one place.</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search your saved quotes…"
        className="mt-6 w-full max-w-sm rounded-lg border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-ribbon"
      />

      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner label="Gathering your quotes" />
        ) : filtered.length === 0 ? (
          <div className="card-cut py-16 text-center">
            <p className="font-display text-xl text-ink">Nothing saved yet.</p>
            <p className="mt-1 text-sm text-muted">
              Open a book and save a line worth keeping.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => (
              <div key={q.id} className="card-cut group p-5 pt-6">
                <p className="text-base italic leading-relaxed text-ink">&ldquo;{q.text}&rdquo;</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <Link to={`/books/${q.bookId}`} className="hover:text-ink">
                    {q.bookTitle} — {q.bookAuthor}
                    {q.page !== null && q.page !== undefined && <span className="ml-1">· p. {q.page}</span>}
                  </Link>
                  <button
                    onClick={() => deleteMutation.mutate({ bookId: q.bookId, quoteId: q.id })}
                    className="rounded-full p-1.5 opacity-0 hover:text-stamp-red group-hover:opacity-100"
                    aria-label="Delete quote"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
