'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../../../layout';
import { CheckCircle2, Calendar, Clock, MapPin, Key, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Booking {
  id: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  accessCode?: string;
  booth?: {
    id: string;
    name: string;
    type: string;
    images: string[];
    location?: {
      name: string;
      address: string;
      city: string;
    };
  };
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'PLN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const { tenant, tenantSlug } = useBookingContext();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}/bookings/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.data);
      }
      setIsLoading(false);
    }
    loadBooking();
  }, [tenantSlug, bookingId]);

  useEffect(() => {
    // Fire confetti on load
    if (booking && !isLoading) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [tenant?.primaryColor || '#6366F1', '#10B981', '#F59E0B'],
      });
    }
  }, [booking, isLoading, tenant]);

  const copyAccessCode = () => {
    if (booking?.accessCode) {
      navigator.clipboard.writeText(booking.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
        <p className="text-gray-600 mb-4">We couldn't find this booking.</p>
        <Link
          href={`/book/${tenantSlug}/spaces`}
          className="text-sm font-medium"
          style={{ color: tenant?.primaryColor }}
        >
          Browse spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${tenant?.primaryColor}15` }}
        >
          <CheckCircle2 className="w-10 h-10" style={{ color: tenant?.primaryColor }} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600">
          Your workspace is reserved. Check your email for details.
        </p>
      </div>

      {/* Booking Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        {/* Booth Image */}
        {booking.booth?.images?.[0] && (
          <div className="aspect-video bg-gray-100">
            <img
              src={booking.booth.images[0]}
              alt={booking.booth.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Booth Info */}
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {booking.booth?.name}
          </h2>
          {booking.booth?.location && (
            <p className="text-gray-600 flex items-center gap-1 mb-4">
              <MapPin className="w-4 h-4" />
              {booking.booth.location.name}, {booking.booth.location.city}
            </p>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Date
              </div>
              <div className="font-medium text-gray-900">{formatDate(booking.date)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Time
              </div>
              <div className="font-medium text-gray-900">
                {booking.startTime} - {booking.endTime}
              </div>
            </div>
          </div>

          {/* Access Code */}
          {booking.accessCode && (
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Key className="w-4 h-4" />
                Access Code
              </div>
              <div className="flex items-center gap-3">
                <code
                  className="text-2xl font-mono font-bold tracking-wider px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: `${tenant?.primaryColor}10`,
                    color: tenant?.primaryColor,
                  }}
                >
                  {booking.accessCode}
                </code>
                <button
                  onClick={copyAccessCode}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Use this code to unlock the door when you arrive.
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-gray-600">Total Paid</span>
            <span className="text-xl font-bold" style={{ color: tenant?.primaryColor }}>
              {formatPrice(booking.totalPrice, booking.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Reference */}
      <div className="text-center text-sm text-gray-500 mb-8">
        Booking Reference: <code className="font-mono">{booking.id}</code>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={`/book/${tenantSlug}/booking/${booking.id}`}
          className="px-6 py-3 rounded-lg font-semibold text-white text-center"
          style={{ backgroundColor: tenant?.primaryColor }}
        >
          View Booking Details
        </Link>
        <Link
          href={`/book/${tenantSlug}/spaces`}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-center"
        >
          Book Another Space
        </Link>
      </div>
    </div>
  );
}
