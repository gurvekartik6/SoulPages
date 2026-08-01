import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookSchema } from '../../utils/validators';
import { StarRating } from '../common/StarRating';

export function EditBookModal({ open, onClose, book, onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(bookSchema),
    values: book
      ? {
          title: book.title,
          author: book.author,
          totalPages: book.totalPages || '',
          genre: book.genre === 'Unspecified' ? '' : book.genre,
          notes: book.notes,
          annualGoal: book.annualGoal,
          tags: (book.tags || []).join(', '),
          rating: book.rating || null,
          verdict: book.verdict || ''
        }
      : undefined
  });

  const submit = async (values) => {
    await onSubmit(values);
    onClose();
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
            className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-ink">Edit book details</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted hover:bg-paper-dim hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">Title</label>
                <input
                  {...register('title')}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                />
                {errors.title && <p className="mt-1 text-xs text-stamp-red">{errors.title.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">Author</label>
                <input
                  {...register('author')}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                />
                {errors.author && <p className="mt-1 text-xs text-stamp-red">{errors.author.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Total pages</label>
                  <input
                    type="number"
                    min="1"
                    {...register('totalPages')}
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                  />
                  {errors.totalPages && (
                    <p className="mt-1 text-xs text-stamp-red">{errors.totalPages.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Genre</label>
                  <input
                    {...register('genre')}
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">
                  Tags <span className="normal-case text-muted/70">(comma separated)</span>
                </label>
                <input
                  {...register('tags')}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                  placeholder="book club, favorites"
                />
              </div>

              {book?.status === 'completed' && (
                <div className="rounded-lg bg-paper-dim p-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Your rating</label>
                  <div className="mt-1.5">
                    <Controller
                      name="rating"
                      control={control}
                      render={({ field }) => (
                        <StarRating value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>
                  <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted">
                    One-line verdict
                  </label>
                  <input
                    {...register('verdict')}
                    maxLength={280}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-ribbon"
                    placeholder="Could not put it down."
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
