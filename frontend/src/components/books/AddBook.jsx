import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookSchema } from '../../utils/validators';

export function AddBook({ onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ resolver: zodResolver(bookSchema) });

  const submit = async (values) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Title</label>
        <input
          {...register('title')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
          placeholder="The Pragmatic Programmer"
        />
        {errors.title && <p className="mt-1 text-xs text-stamp-red">{errors.title.message}</p>}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Author</label>
        <input
          {...register('author')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
          placeholder="David Thomas"
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
            placeholder="320"
          />
          {errors.totalPages && <p className="mt-1 text-xs text-stamp-red">{errors.totalPages.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Genre</label>
          <input
            {...register('genre')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
            placeholder="Technology"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
          placeholder="Why this one, what you're hoping to get from it…"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">
          Tags <span className="normal-case text-muted/70">(comma separated — e.g. book club, to re-read)</span>
        </label>
        <input
          {...register('tags')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
          placeholder="book club, favorites"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" {...register('annualGoal')} className="h-4 w-4 rounded border-line accent-ribbon" />
        Count toward my annual goal
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Adding…' : 'Add to library'}
      </button>
    </form>
  );
}
