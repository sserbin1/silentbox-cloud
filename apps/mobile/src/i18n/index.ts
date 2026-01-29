// ===========================================
// Internationalization (i18n) Setup
// ===========================================

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';

type TranslationKeys = typeof en;
type Language = 'en' | 'pl' | 'uk';

const translations: Record<Language, TranslationKeys> = {
  en,
  pl,
  uk,
};

const LANGUAGE_KEY = '@silentbox:language';

class I18n {
  private currentLanguage: Language = 'en';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeLanguage();
  }

  private async initializeLanguage() {
    try {
      // Try to get saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage as Language;
      } else {
        // Use device locale
        const deviceLocale = Localization.locale.split('-')[0];
        if (this.isValidLanguage(deviceLocale)) {
          this.currentLanguage = deviceLocale as Language;
        }
      }
    } catch (error) {
      console.log('Failed to load language preference:', error);
    }
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['en', 'pl', 'uk'].includes(lang);
  }

  // Get current language
  get language(): Language {
    return this.currentLanguage;
  }

  // Get locale for formatting
  get locale(): string {
    const localeMap: Record<Language, string> = {
      en: 'en-US',
      pl: 'pl-PL',
      uk: 'uk-UA',
    };
    return localeMap[this.currentLanguage];
  }

  // Set language
  async setLanguage(lang: Language): Promise<void> {
    if (!this.isValidLanguage(lang)) return;

    this.currentLanguage = lang;
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);

    // Notify listeners
    this.listeners.forEach((listener) => listener());
  }

  // Subscribe to language changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Translate a key
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
        return params[param]?.toString() || '';
      });
    }

    return value;
  }

  // Format number
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale, options).format(num);
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  // Format date
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  // Format time
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  }

  // Get available languages
  getAvailableLanguages(): { code: Language; name: string; nativeName: string }[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    ];
  }
}

export const i18n = new I18n();

// Shorthand for translation
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
