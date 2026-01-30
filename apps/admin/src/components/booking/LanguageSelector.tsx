'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SupportedLanguage } from '@/lib/i18n/LanguageContext';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/lib/i18n/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ className = '', variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          aria-label="Select language"
        >
          <span className="text-lg">{LANGUAGE_FLAGS[language]}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 py-1 min-w-[140px] z-50">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                  language === lang ? 'text-violet-400 bg-violet-500/10' : 'text-slate-300'
                }`}
              >
                <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
                <span className="flex-1 text-left">{LANGUAGE_NAMES[lang]}</span>
                {language === lang && <Check className="w-4 h-4 text-violet-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-lg">{LANGUAGE_FLAGS[language]}</span>
        <span>{LANGUAGE_NAMES[language]}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                language === lang ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'
              }`}
            >
              <span className="text-xl">{LANGUAGE_FLAGS[lang]}</span>
              <span className="flex-1 text-left font-medium">{LANGUAGE_NAMES[lang]}</span>
              {language === lang && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
