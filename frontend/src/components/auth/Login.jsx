import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/validators';
import { AuthLayout } from './AuthLayout';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.fullName || user.username}`);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Could not sign in. Check your details.');
    }
  };

  return (
    <AuthLayout
      title="Pick up where you left off"
      subtitle="Sign in to your ledger."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">
            Username or email
          </label>
          <input
            type="text"
            autoComplete="username"
            {...register('username')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="e.g. kartik"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-stamp-red">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ribbon"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-stamp-red">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-lg bg-stamp-red/10 px-3 py-2 text-xs text-stamp-red">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-ribbon hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
