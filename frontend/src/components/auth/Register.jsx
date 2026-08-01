import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { registerSchema } from '../../utils/validators';
import { AuthLayout } from './AuthLayout';

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await registerUser(values);
      toast.success(`Welcome, ${user.fullName || user.username}! Your ledger is open.`);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Could not create your account.');
    }
  };

  return (
    <AuthLayout title="Open a new ledger" subtitle="A few details and you're set.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
          <input
            type="text"
            {...register('fullName')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="Kartik Yadav Gurve"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Username</label>
          <input
            type="text"
            autoComplete="username"
            {...register('username')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="kartik"
          />
          {errors.username && <p className="mt-1 text-xs text-stamp-red">{errors.username.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Email</label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-stamp-red">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="mt-1 text-xs text-stamp-red">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-lg bg-stamp-red/10 px-3 py-2 text-xs text-stamp-red">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ribbon hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
