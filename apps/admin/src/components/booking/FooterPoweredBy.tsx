'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export function FooterPoweredBy() {
  const { t } = useLanguage();

  return (
    <div className="text-sm text-slate-500">
      {t('footer.poweredBy')}{' '}
      <a
        href="https://silent-box.com"
        className="text-violet-400 hover:text-violet-300 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        Silentbox
      </a>
    </div>
  );
}
