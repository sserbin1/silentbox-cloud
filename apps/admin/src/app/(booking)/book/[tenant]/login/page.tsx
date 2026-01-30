'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant, tenantSlug } = useBookingContext();
  const { t } = useLanguage();
  const redirect = searchParams.get('redirect') || `/book/${tenantSlug}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        // Store token
        localStorage.setItem(`booking_token_${tenantSlug}`, data.data.token);
        localStorage.setItem(`booking_user_${tenantSlug}`, JSON.stringify(data.data.user));
        router.push(redirect);
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {tenant?.logo ? (
              <img src={tenant.logo} alt={tenant.name} className="h-12 mx-auto mb-4" />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4"
                style={{ backgroundColor: tenant?.primaryColor }}
              >
                {tenant?.name?.charAt(0)}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
            <p className="text-gray-600 mt-1">{t('auth.signInSubtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: tenant?.primaryColor || '#6366F1' }}
            >
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.noAccount')}{' '}
            <Link
              href={`/book/${tenantSlug}/register${redirect !== `/book/${tenantSlug}` ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-medium"
              style={{ color: tenant?.primaryColor }}
            >
              {t('auth.createOne')}
            </Link>
          </p>
        </div>

        {/* Guest booking notice */}
        {tenant?.features?.allowGuestBooking && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('auth.alsoCanBook')}{' '}
            <Link
              href={`/book/${tenantSlug}/spaces`}
              className="font-medium"
              style={{ color: tenant?.primaryColor }}
            >
              {t('auth.bookAsGuest')}
            </Link>{' '}
            {t('auth.withoutAccount')}
          </p>
        )}
      </div>
    </div>
  );
}
