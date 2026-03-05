'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth, useTenant } from '@/app/providers';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { tenant } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(tenant.slug, { email, password });

      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        router.push(redirect);
      } else {
        setError(res.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#09090B] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-500">
              Sign in to your {tenant.name} account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label text-zinc-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0 text-zinc-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-12 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-zinc-500">
                New to {tenant.name}?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="w-full py-3.5 rounded-xl font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            Create an account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-600 mt-6">
          By signing in, you agree to our{' '}
          {tenant.termsUrl ? (
            <a href={tenant.termsUrl} className="text-violet-400 hover:underline">
              Terms of Service
            </a>
          ) : (
            <span>Terms of Service</span>
          )}{' '}
          and{' '}
          {tenant.privacyUrl ? (
            <a href={tenant.privacyUrl} className="text-violet-400 hover:underline">
              Privacy Policy
            </a>
          ) : (
            <span>Privacy Policy</span>
          )}
        </p>
      </div>
    </div>
  );
}
