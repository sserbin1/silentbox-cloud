'use client';

import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string;
  id?: string;
  className?: string;
}

/**
 * Form field error component with ARIA accessibility
 * Displays inline validation errors below form fields
 */
export function FormError({ message, id, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'mt-1 text-sm text-red-600 dark:text-red-400',
        className
      )}
    >
      {message}
    </p>
  );
}

/**
 * Props for form fields with validation
 * Use with react-hook-form's FieldError
 */
export interface FormFieldErrorProps {
  error?: { message?: string };
  name: string;
}

/**
 * Generates ARIA attributes for form fields with validation
 */
export function getFieldAriaProps(name: string, hasError: boolean) {
  const errorId = `${name}-error`;
  return {
    'aria-invalid': hasError ? 'true' as const : undefined,
    'aria-describedby': hasError ? errorId : undefined,
    errorId,
  };
}
