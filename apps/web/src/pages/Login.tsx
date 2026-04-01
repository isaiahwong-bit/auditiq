import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { session, profile, orgSlug, loading, signIn } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in
  if (!loading && session && profile && orgSlug) {
    return <Navigate to={`/${orgSlug}/dashboard`} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signIn(data.email, data.password);
      // Profile fetch happens via onAuthStateChange — wait briefly for it
    } catch (err) {
      setSigningIn(false);
      setAuthError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  // Show loading after successful sign-in while profile loads
  if (signingIn && session && !orgSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-sm backdrop-blur-xl border border-white/20 dark:bg-white/5 dark:border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">AuditArmour</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-brand-red">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-brand-red">{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <div className="rounded-xl bg-red-50/80 p-3.5 text-sm text-brand-red dark:bg-red-500/10">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
