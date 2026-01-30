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
              colors: ['#6366F1', '#818CF8', '#A5B4FC', '#F59E0B', '#FCD34D'],
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Booking not found'}
          </h2>
          <Link href="/" className="btn-primary btn-md mt-4">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const boothImage = booking.booth?.images?.[0] || 'https://placehold.co/400x200/EEF2FF/6366F1?text=Workspace';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your workspace has been successfully reserved
          </p>
        </div>

        {/* Booking Card */}
        <div className="card overflow-hidden mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Image */}
          <div className="relative h-40">
            <Image
              src={boothImage}
              alt={booking.booth?.name || 'Workspace'}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Booth Name */}
            <div className="flex items-center gap-2 mb-1">
              {booking.booth && (
                <span className="text-xl">{getBoothTypeIcon(booking.booth.type)}</span>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {booking.booth?.name || 'Workspace'}
              </h2>
            </div>

            {booking.booth?.location && (
              <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                {booking.booth.location.name}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
                <div className="font-semibold text-gray-900">
                  {formatDate(booking.date)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Time
                </div>
                <div className="font-semibold text-gray-900">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </div>
              </div>
            </div>

            {/* Access Code */}
            {booking.accessCode && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 text-center">
                  Your Access Code
                </h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {booking.accessCode.split('').map((digit, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-900"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="btn-secondary btn-md w-full flex items-center justify-center gap-2"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
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
            <div className="border-t border-gray-100 pt-6 mt-6 flex items-center justify-between">
              <span className="text-gray-600">Total Paid</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(booking.totalPrice, booking.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div
          className="card p-4 flex items-center gap-4 mb-6 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
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
            className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
          >
            View Booking Details
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/spaces"
            className="btn-secondary btn-lg w-full"
          >
            Browse More Spaces
          </Link>
        </div>

        {/* Booking Reference */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Booking Reference: #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
