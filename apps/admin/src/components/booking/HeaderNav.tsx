'use client';

import Link from 'next/link';
import { MapPin, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderNavProps {
  tenantSlug: string;
  primaryColor: string;
}

export function HeaderNav({ tenantSlug, primaryColor }: HeaderNavProps) {
  const { t } = useLanguage();

  return (
    <nav className="flex items-center gap-2">
      <Link
        href={`/book/${tenantSlug}/spaces`}
        className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all text-sm font-medium"
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">{t('nav.browseSpaces')}</span>
      </Link>
      <LanguageSelector variant="compact" />
      <Link
        href={`/book/${tenantSlug}/login`}
        className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:from-violet-500 hover:to-violet-400 transition-all"
      >
        <User className="w-4 h-4" />
        <span>{t('nav.signIn')}</span>
      </Link>
    </nav>
  );
}
