import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatTime(time: string): string {
  // Assumes time is in HH:MM format
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  return (endTotal - startTotal) / 60;
}

export function getBoothTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    focus_pod: 'Focus Pod',
    meeting_room: 'Meeting Room',
    phone_booth: 'Phone Booth',
    quiet_zone: 'Quiet Zone',
  };
  return labels[type] || type;
}

export function getBoothTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    focus_pod: '🎯',
    meeting_room: '👥',
    phone_booth: '📞',
    quiet_zone: '🤫',
  };
  return icons[type] || '🏢';
}
