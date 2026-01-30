'use client';

import { useLanguage, SupportedLanguage } from '@/lib/i18n/LanguageContext';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/lib/i18n/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'sm'}
          className={cn('gap-2', className)}
        >
          <Globe className="h-4 w-4" />
          {variant === 'default' && (
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span>{LANGUAGE_FLAGS[language]}</span>
              <span>{LANGUAGE_NAMES[language]}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as SupportedLanguage)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              language === lang && 'bg-accent'
            )}
          >
            <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
            <span>{LANGUAGE_NAMES[lang]}</span>
            {language === lang && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
