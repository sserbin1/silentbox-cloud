'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Booth, bookingsApi } from '@/lib/api';
import { formatPrice, calculateDuration } from '@/lib/utils';
import { useAuth, useTenant } from '@/app/providers';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  booth: Booth;
  tenantSlug: string;
  allowGuestBooking: boolean;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 2, label: '2 hours' },
  { hours: 3, label: '3 hours' },
  { hours: 4, label: '4 hours' },
  { hours: 8, label: 'Full day' },
];

export function BookingForm({ booth, tenantSlug, allowGuestBooking }: BookingFormProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const { tenant } = useTenant();

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guest info for guest bookings
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Calculate end time and total price
  const endTime = useMemo(() => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, [startTime, duration]);

  const totalPrice = useMemo(() => {
    return booth.pricePerHour * duration;
  }, [booth.pricePerHour, duration]);

  // Discount for longer bookings
  const discount = useMemo(() => {
    if (duration >= 8) return 0.2; // 20% off full day
    if (duration >= 4) return 0.1; // 10% off 4+ hours
    return 0;
  }, [duration]);

  const finalPrice = totalPrice * (1 - discount);

  const isValid = date && startTime && (isAuthenticated || allowGuestBooking);
  const needsGuestInfo = !isAuthenticated && allowGuestBooking;
  const guestInfoValid = !needsGuestInfo || (guestName && guestEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated && !allowGuestBooking) {
      router.push(`/login?redirect=/spaces/${booth.id}`);
      return;
    }

    if (needsGuestInfo && !guestInfoValid) {
      setError('Please fill in your name and email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await bookingsApi.create(
        tenantSlug,
        {
          boothId: booth.id,
          date,
          startTime,
          endTime,
          ...(needsGuestInfo && {
            customerName: guestName,
            customerEmail: guestEmail,
            customerPhone: guestPhone,
          }),
        },
        token || undefined
      );

      if (res.success && res.data) {
        // Redirect to confirmation page
        router.push(`/booking/${res.data.id}/confirmation`);
      } else {
        setError(res.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="text-center mb-6">
        <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          {formatPrice(booth.pricePerHour, booth.currency)}
        </div>
        <div className="text-zinc-500">per hour</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Selection */}
        <div>
          <label className="label flex items-center gap-2 text-zinc-300">
            <Calendar className="w-4 h-4 text-zinc-500" />
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            required
          />
        </div>

        {/* Time Selection */}
        <div>
          <label className="label flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500" />
            Start Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setStartTime(time)}
                className={cn(
                  'p-2 text-sm rounded-lg border transition-all',
                  startTime === time
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-medium'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="label text-zinc-300">Duration</label>
          <div className="grid grid-cols-5 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setDuration(opt.hours)}
                className={cn(
                  'p-2 text-sm rounded-lg border transition-all',
                  duration === opt.hours
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-medium'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guest Info */}
        {needsGuestInfo && (
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              Enter your details to complete the booking:
            </p>
            <div>
              <label className="label text-zinc-300">Your Name *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="label text-zinc-300">Email *</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                placeholder="john@example.com"
                required
              />
            </div>
            {tenant.features.requirePhone && (
              <div>
                <label className="label text-zinc-300">Phone *</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  placeholder="+48 123 456 789"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Price Summary */}
        {startTime && date && (
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>
                {formatPrice(booth.pricePerHour, booth.currency)} x {duration}h
              </span>
              <span>{formatPrice(totalPrice, booth.currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount ({discount * 100}% off)</span>
                <span>-{formatPrice(totalPrice * discount, booth.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-white pt-2 border-t border-zinc-700">
              <span>Total</span>
              <span>{formatPrice(finalPrice, booth.currency)}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || !guestInfoValid || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            'Processing...'
          ) : !isAuthenticated && !allowGuestBooking ? (
            'Sign in to Book'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Book Now
            </>
          )}
        </button>

        {!isAuthenticated && allowGuestBooking && (
          <p className="text-center text-sm text-zinc-500">
            Have an account?{' '}
            <a
              href={`/login?redirect=/spaces/${booth.id}`}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Sign in
            </a>
          </p>
        )}
      </form>
    </div>
  );
}
