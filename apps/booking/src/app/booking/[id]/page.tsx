'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  Phone,
  Bluetooth,
  Wifi,
  Key,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth, useTenant } from '@/app/providers';
import { bookingsApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, formatTime, getBoothTypeIcon, getBoothTypeLabel, cn } from '@/lib/utils';

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, token } = useAuth();
  const { tenant } = useTenant();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const bookingId = params.id as string;

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await bookingsApi.getById(tenant.slug, bookingId, token || undefined);
        if (res.success && res.data) {
          setBooking(res.data);
        } else {
          setError(res.error || 'Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking');
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

  const handleCancel = async () => {
    if (!token) return;

    setCancelling(true);
    try {
      const res = await bookingsApi.cancel(tenant.slug, bookingId, token);
      if (res.success) {
        setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
        setShowCancelModal(false);
      } else {
        setError(res.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            {error || 'Booking not found'}
          </h2>
          <p className="text-zinc-500 mb-6">
            The booking you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/my-bookings"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 transition-all"
          >
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isActive = booking.status === 'active';
  const isUpcoming = ['pending', 'confirmed'].includes(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';

  const canCancel = isUpcoming;
  const showAccessCode = (isActive || isUpcoming) && booking.accessCode;

  const boothImage = booking.booth?.images?.[0] || 'https://placehold.co/800x400/18181B/6366F1?text=Workspace';

  return (
    <div className="min-h-screen bg-[#09090B] pb-8">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="container-page py-4">
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Bookings
          </Link>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Status Banner */}
          {isActive && (
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-violet-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Session Active</h3>
                  <p className="text-white/80">Your booking is currently in progress</p>
                </div>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 flex items-center gap-4">
              <X className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">Booking Cancelled</h3>
                <p className="text-red-400/80">This booking has been cancelled</p>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Booth Image */}
            <div className="relative h-48 sm:h-64">
              <Image
                src={boothImage}
                alt={booking.booth?.name || 'Workspace'}
                fill
                className="object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Booth Info */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {booking.booth && (
                      <span className="text-xl">{getBoothTypeIcon(booking.booth.type)}</span>
                    )}
                    <h1 className="text-2xl font-bold text-zinc-100">
                      {booking.booth?.name || 'Workspace'}
                    </h1>
                  </div>
                  {booking.booth?.location && (
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <MapPin className="w-4 h-4" />
                      {booking.booth.location.name}, {booking.booth.location.city}
                    </div>
                  )}
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {/* Booking Details */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                  <div className="font-semibold text-zinc-100">
                    {formatDate(booking.date, { weekday: 'long', month: 'long', day: 'numeric' })}
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
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <div className="text-violet-400 text-sm mb-1">Total</div>
                  <div className="font-bold text-xl bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    {formatPrice(booking.totalPrice, booking.currency)}
                  </div>
                </div>
              </div>

              {/* Access Code Section */}
              {showAccessCode && (
                <div className="border-t border-zinc-800 pt-6">
                  <h2 className="text-lg font-semibold text-zinc-100 mb-4">Access Code</h2>
                  <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {booking.accessCode?.split('').map((digit, i) => (
                        <div
                          key={i}
                          className="w-12 h-14 bg-zinc-900 rounded-lg border-2 border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-100"
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-zinc-500 text-sm mb-4">
                      Enter this code on the door keypad
                    </p>
                    <button
                      onClick={handleCopyCode}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="w-5 h-5 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Access Methods */}
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium text-zinc-100">Other ways to unlock</h3>
                    <AccessMethod
                      icon={<Wifi className="w-5 h-5" />}
                      title="Remote Unlock"
                      description="Unlock via internet (coming soon)"
                      disabled
                    />
                    <AccessMethod
                      icon={<Bluetooth className="w-5 h-5" />}
                      title="Bluetooth"
                      description="Hold phone near the lock (coming soon)"
                      disabled
                    />
                    <AccessMethod
                      icon={<Key className="w-5 h-5" />}
                      title="Keypad"
                      description={`Enter ${booking.accessCode} on door keypad`}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {canCancel && (
                <div className="border-t border-zinc-800 pt-6 mt-6">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-red-400 hover:text-red-300 font-medium text-sm"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400">
              <Phone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-100">Need help?</h3>
              <p className="text-zinc-500 text-sm">Contact support for any issues</p>
            </div>
            {tenant.supportEmail && (
              <a
                href={`mailto:${tenant.supportEmail}`}
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold text-sm transition-colors flex items-center gap-1"
              >
                Contact
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              Cancel Booking?
            </h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold transition-colors"
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
    confirmed: { label: 'Confirmed', className: 'bg-green-500/10 text-green-400 border border-green-500/20' },
    active: { label: 'Active', className: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    completed: { label: 'Completed', className: 'bg-zinc-800 text-zinc-400 border border-zinc-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  };

  const { label, className } = config[status] || config.pending;

  return (
    <span className={cn('px-3 py-1.5 rounded-full text-sm font-semibold', className)}>
      {label}
    </span>
  );
}

function AccessMethod({
  icon,
  title,
  description,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border',
        disabled
          ? 'border-zinc-800 bg-zinc-800/30 opacity-60'
          : 'border-zinc-700 bg-zinc-800/50'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          disabled ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-500/10 text-violet-400'
        )}
      >
        {icon}
      </div>
      <div>
        <div className="font-medium text-zinc-100">{title}</div>
        <div className="text-sm text-zinc-500">{description}</div>
      </div>
    </div>
  );
}
