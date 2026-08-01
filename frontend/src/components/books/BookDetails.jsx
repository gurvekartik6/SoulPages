import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiEdit2, FiTrendingUp } from 'react-icons/fi';
import { getBook, deleteBook, updateBook } from '../../api/books';
import { ReadingTimer } from '../reading/ReadingTimer';
import { ProgressBar } from '../reading/ProgressBar';
import { ReadingStats } from '../reading/ReadingStats';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StarRating } from '../common/StarRating';
import { BookCover } from './BookCover';
import { BookQuotes } from './BookQuotes';
import { EditBookModal } from './EditBookModal';
import { STATUS_LABELS, formatDate } from '../../utils/formatters';
import { estimatePace } from '../../utils/pace';

export function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => getBook(id)
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(id),
    onSuccess: () => {
      toast.success('Removed from your library');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      navigate('/books');
    }
  });

  const notesMutation = useMutation({
    mutationFn: (payload) => updateBook(id, payload),
    onSuccess: () => toast.success('Notes saved')
  });

  const editMutation = useMutation({
    mutationFn: (payload) => updateBook(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['book', id], updated);
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Details updated');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update details')
  });

  const handleUpdate = (updated) => {
    queryClient.setQueryData(['book', id], updated);
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  if (isLoading) return <LoadingSpinner label="Opening this entry" />;
  if (!book) return null;

  const pace = estimatePace(book);

  return (
    <div>
      <Link to="/books" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <FiArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <BookCover
          title={book.title}
          coverUrl={book.coverUrl}
          className="h-40 w-28 shrink-0 shadow-md sm:h-48 sm:w-32"
        />

        <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-display text-3xl font-medium text-ink">{book.title}</h1>
            <p className="mt-1 text-muted">{book.author}</p>

            {book.status === 'completed' && book.rating ? (
              <div className="mt-2">
                <StarRating value={book.rating} readOnly size="h-4 w-4" />
              </div>
            ) : null}
            {book.verdict && <p className="mt-1 text-sm italic text-ink-soft">&ldquo;{book.verdict}&rdquo;</p>}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="rounded-full bg-paper-dim px-2.5 py-1 font-medium text-ink-soft">
                {STATUS_LABELS[book.status]}
              </span>
              <span>{book.genre}</span>
              <span>Added {formatDate(book.dateAdded)}</span>
              {book.dateCompleted && <span>Finished {formatDate(book.dateCompleted)}</span>}
            </div>

            {book.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brass/10 px-2 py-0.5 text-[11px] font-medium text-brass-deep"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-ribbon hover:text-ribbon-deep"
            >
              <FiEdit2 className="h-3.5 w-3.5" /> Edit details
            </button>
            <button
              onClick={() => {
                if (confirm(`Remove "${book.title}" from your library?`)) deleteMutation.mutate();
              }}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-stamp-red hover:text-stamp-red"
            >
              <FiTrash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar progress={book.progress} />
        <div className="mt-1.5 flex justify-between font-mono text-xs text-muted">
          <span>{book.currentPage} pages read</span>
          <span>{book.progress}%</span>
        </div>
        {pace && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <FiTrendingUp className="h-3.5 w-3.5 text-ribbon-deep" />
            At your recent pace, you'll likely finish around{' '}
            <span className="font-medium text-ink-soft">
              {pace.finishDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadingTimer
          bookId={book.id}
          currentPage={book.currentPage}
          totalPages={book.totalPages}
          onUpdate={handleUpdate}
        />
        <ReadingStats sessions={book.readingSessions} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-cut p-6 pt-7">
          <h3 className="font-display text-lg font-medium text-ink">Notes</h3>
          <textarea
            key={book.notes}
            defaultValue={book.notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-ribbon"
            placeholder="What stood out, where you left off mentally…"
          />
          <button
            onClick={() => notesMutation.mutate({ notes: notes ?? book.notes })}
            disabled={notes === null || notesMutation.isPending}
            className="mt-3 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-50"
          >
            {notesMutation.isPending ? 'Saving…' : 'Save notes'}
          </button>
        </div>

        <BookQuotes bookId={book.id} />
      </div>

      <EditBookModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        book={book}
        isSubmitting={editMutation.isPending}
        onSubmit={(values) => editMutation.mutateAsync(values)}
      />
    </div>
  );
}
