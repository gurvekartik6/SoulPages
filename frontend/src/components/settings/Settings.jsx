import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, changePassword } from '../../api/auth';
import { profileSchema, passwordSchema } from '../../utils/validators';

function ProfileForm() {
  const { user, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName || '', readingGoal: user?.readingGoal || 12 }
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update profile')
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
        <input
          {...register('fullName')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
        />
        {errors.fullName && <p className="mt-1 text-xs text-stamp-red">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Annual reading goal (books)</label>
        <input
          type="number"
          min="1"
          max="500"
          {...register('readingGoal')}
          className="mt-1 w-32 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
        />
        {errors.readingGoal && <p className="mt-1 text-xs text-stamp-red">{errors.readingGoal.message}</p>}
      </div>

      <button
        type="submit"
        disabled={!isDirty || mutation.isPending}
        className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password updated');
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not change password')
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutateAsync(values))} className="space-y-4">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Current password</label>
        <input
          type="password"
          {...register('currentPassword')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
        />
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-stamp-red">{errors.currentPassword.message}</p>
        )}
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">New password</label>
        <input
          type="password"
          {...register('newPassword')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
        />
        {errors.newPassword && <p className="mt-1 text-xs text-stamp-red">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Confirm new password</label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ribbon"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-stamp-red">{errors.confirmPassword.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Updating…' : 'Change password'}
      </button>
    </form>
  );
}

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your account and reading preferences.</p>
      </div>

      <div className="card-cut p-6 pt-7">
        <h3 className="font-display text-lg font-medium text-ink">Profile</h3>
        <p className="mt-1 text-xs text-muted">
          {user?.username} · {user?.email}
        </p>
        <div className="mt-4">
          <ProfileForm />
        </div>
      </div>

      <div className="card-cut p-6 pt-7">
        <h3 className="font-display text-lg font-medium text-ink">Password</h3>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
