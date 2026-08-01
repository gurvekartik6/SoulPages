import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiTrash2, FiFeather } from 'react-icons/fi';
import { getBookQuotes, addBookQuote, deleteBookQuote } from '../../api/books';

export function BookQuotes({ bookId }) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const queryClient = useQueryClient();

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes', bookId],
    queryFn: () => getBookQuotes(bookId)
  });

  const addMutation = useMutation({
    mutationFn: (payload) => addBookQuote(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', bookId] });
      queryClient.invalidateQueries({ queryKey: ['quotes', 'all'] });
      setText('');
      setPage('');
      toast.success('Quote saved');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not save quote')
  });

  const deleteMutation = useMutation({
    mutationFn: (quoteId) => deleteBookQuote(bookId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', bookId] });
      queryClient.invalidateQueries({ queryKey: ['quotes', 'all'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMutation.mutate({ text: text.trim(), page: page ? Number(page) : undefined });
  };

  return (
    <div className="card-cut p-6 pt-7">
      <div className="flex items-center gap-2">
        <FiFeather className="h-4 w-4 text-brass-deep" />
        <h3 className="font-display text-lg font-medium text-ink">Commonplace</h3>
      </div>
      <p className="mt-1 text-xs text-muted">Lines worth keeping from this book.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste a line worth keeping…"
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ribbon"
        />
        <input
          value={page}
          onChange={(e) => setPage(e.target.value)}
          type="number"
          min="0"
          placeholder="pg"
          className="w-16 rounded-lg border border-line bg-paper px-2 py-2 text-sm outline-none focus:border-ribbon"
        />
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-50"
        >
          Save
        </button>
      </form>

      {quotes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No quotes saved yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {quotes.map((q) => (
            <li key={q.id} className="group flex items-start justify-between gap-3 border-l-2 border-brass/40 pl-3">
              <div>
                <p className="text-sm italic text-ink-soft">&ldquo;{q.text}&rdquo;</p>
                {q.page !== null && q.page !== undefined && (
                  <p className="mt-0.5 font-mono text-[11px] text-muted">p. {q.page}</p>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(q.id)}
                className="shrink-0 rounded-full p-1.5 text-muted opacity-0 hover:text-stamp-red group-hover:opacity-100"
                aria-label="Delete quote"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
