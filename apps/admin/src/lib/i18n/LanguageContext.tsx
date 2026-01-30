'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  translations,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getTranslation,
  TranslationKey
} from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'silentbox_language';

interface LanguageProviderProps {
  children: ReactNode;
  tenantSlug?: string;
}

export function LanguageProvider({ children, tenantSlug }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    // Try to get saved language from localStorage (tenant-specific or global)
    const storageKey = tenantSlug ? `${STORAGE_KEY}_${tenantSlug}` : STORAGE_KEY;
    const savedLanguage = localStorage.getItem(storageKey) as SupportedLanguage | null;

    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Detect from browser
      const browserLanguage = detectBrowserLanguage();
      setLanguageState(browserLanguage);
    }

    setIsInitialized(true);
  }, [tenantSlug]);

  // Save language preference when changed
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;

    setLanguageState(lang);

    // Save to localStorage
    const storageKey = tenantSlug ? `${STORAGE_KEY}_${tenantSlug}` : STORAGE_KEY;
    localStorage.setItem(storageKey, lang);

    // Also update document lang attribute
    document.documentElement.lang = lang;
  }, [tenantSlug]);

  // Translation function
  const t = useCallback((key: TranslationKey): string => {
    return getTranslation(language, key);
  }, [language]);

  // Update document lang on language change
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.lang = language;
    }
  }, [language, isInitialized]);

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export for convenience
export { SUPPORTED_LANGUAGES, type SupportedLanguage, type TranslationKey };
