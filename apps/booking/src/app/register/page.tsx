'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth, useTenant } from '@/app/providers';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { tenant } = useTenant();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.register(tenant.slug, {
        name,
        email,
        password,
        phone: phone || undefined,
      });

      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        router.push(redirect);
      } else {
        setError(res.error || 'Registration failed');
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
              Create your account
            </h1>
            <p className="text-zinc-500">
              Join {tenant.name} to book workspaces
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label text-zinc-300">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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

            {/* Phone (optional or required based on tenant settings) */}
            <div>
              <label className="label text-zinc-300">
                Phone number
                {!tenant.features.requirePhone && (
                  <span className="text-zinc-600 font-normal ml-1">(optional)</span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="+48 123 456 789"
                  required={tenant.features.requirePhone}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-12 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
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

              {/* Password Requirements */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                  <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                  <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                  <PasswordCheck passed={passwordChecks.number} label="One number" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label text-zinc-300">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 pl-12 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-2">
                  <PasswordCheck passed={passwordsMatch} label="Passwords match" />
                </div>
              )}
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
              disabled={loading || !passwordValid || !passwordsMatch}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="w-full py-3.5 rounded-xl font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            Sign in instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-600 mt-6">
          By creating an account, you agree to our{' '}
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

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-400' : 'text-zinc-600'}`}>
      <CheckCircle className={`w-4 h-4 ${passed ? 'opacity-100' : 'opacity-50'}`} />
      {label}
    </div>
  );
}
