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
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-600">
              Join {tenant.name} to book workspaces
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-12"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone (optional or required based on tenant settings) */}
            <div>
              <label className="label">
                Phone number
                {!tenant.features.requirePhone && (
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input pl-12"
                  placeholder="+48 123 456 789"
                  required={tenant.features.requirePhone}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 pr-12"
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-12"
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
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              className="btn-primary btn-lg w-full"
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
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="btn-secondary btn-lg w-full"
          >
            Sign in instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By creating an account, you agree to our{' '}
          {tenant.termsUrl ? (
            <a href={tenant.termsUrl} className="text-primary-600 hover:underline">
              Terms of Service
            </a>
          ) : (
            <span>Terms of Service</span>
          )}{' '}
          and{' '}
          {tenant.privacyUrl ? (
            <a href={tenant.privacyUrl} className="text-primary-600 hover:underline">
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
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-gray-400'}`}>
      <CheckCircle className={`w-4 h-4 ${passed ? 'opacity-100' : 'opacity-50'}`} />
      {label}
    </div>
  );
}
