'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth, useTenant } from '@/app/providers';
import { bookingsApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, formatTime, getBoothTypeIcon, cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export default function BookingConfirmationPage() {
  const params = useParams();
  const { token } = useAuth();
  const { tenant } = useTenant();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const bookingId = params.id as string;

  // Fetch booking and trigger confetti
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await bookingsApi.getById(tenant.slug, bookingId, token || undefined);
        if (res.success && res.data) {
          setBooking(res.data);
          // Trigger confetti on successful load
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#8B5CF6', '#7C3AED', '#6D28D9', '#3B82F6', '#2563EB'],
            });
          }, 300);
        } else {
          setError(res.error || 'Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, tenant.slug, token]);

  const handleCopyCode = () => {
    if (booking?.accessCode) {
      navigator.clipboard.writeText(booking.accessCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            {error || 'Booking not found'}
          </h2>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all mt-4"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const boothImage = booking.booth?.images?.[0] || 'https://placehold.co/400x200/18181B/6366F1?text=Workspace';

  return (
    <div className="min-h-screen bg-[#09090B] py-12 px-4">
      {/* Subtle gradient glow at top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg mx-auto relative">
        {/* Success Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-zinc-500">
            Your workspace has been successfully reserved
          </p>
        </div>

        {/* Booking Card with gradient border glow */}
        <div className="relative mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Gradient border glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-violet-500/40 via-blue-500/20 to-zinc-800/0 rounded-2xl" />
          <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
            {/* Image */}
            <div className="relative h-40">
              <Image
                src={boothImage}
                alt={booking.booth?.name || 'Workspace'}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Booth Name */}
              <div className="flex items-center gap-2 mb-1">
                {booking.booth && (
                  <span className="text-xl">{getBoothTypeIcon(booking.booth.type)}</span>
                )}
                <h2 className="text-xl font-bold text-zinc-100">
                  {booking.booth?.name || 'Workspace'}
                </h2>
              </div>

              {booking.booth?.location && (
                <div className="flex items-center gap-1.5 text-zinc-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  {booking.booth.location.name}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                  <div className="font-semibold text-zinc-100">
                    {formatDate(booking.date)}
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Time
                  </div>
                  <div className="font-semibold text-zinc-100">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
              </div>

              {/* Access Code */}
              {booking.accessCode && (
                <div className="border-t border-zinc-800 pt-6">
                  <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3 text-center">
                    Your Access Code
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {booking.accessCode.split('').map((digit, i) => (
                      <div
                        key={i}
                        className="w-12 h-14 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-100"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        Copied to clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Price */}
              <div className="border-t border-zinc-800 pt-6 mt-6 flex items-center justify-between">
                <span className="text-zinc-400">Total Paid</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {formatPrice(booking.totalPrice, booking.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 mb-6 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-400">
              A confirmation email has been sent to your email address with all the booking details.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          <Link
            href={`/booking/${booking.id}`}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
          >
            View Booking Details
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/spaces"
            className="w-full py-3.5 rounded-xl font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            Browse More Spaces
          </Link>
        </div>

        {/* Booking Reference */}
        <p className="text-center text-sm text-zinc-600 mt-8">
          Booking Reference: #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
