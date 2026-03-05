'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
  CalendarDays,
  History,
  XCircle,
} from 'lucide-react';
import { useAuth, useTenant } from '@/app/providers';
import { bookingsApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, formatTime, getBoothTypeIcon, cn } from '@/lib/utils';

type TabType = 'upcoming' | 'past';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const { tenant } = useTenant();

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/my-bookings');
    }
  }, [isAuthenticated, router]);

  // Fetch bookings
  useEffect(() => {
    if (!token) return;

    const fetchBookings = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await bookingsApi.list(tenant.slug, token);
        if (res.success && res.data) {
          setBookings(res.data);
        } else {
          setError(res.error || 'Failed to load bookings');
        }
      } catch (err) {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token, tenant.slug]);

  // Filter bookings by tab
  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T${booking.endTime}`);
    const isPast = bookingDate < new Date() || ['completed', 'cancelled'].includes(booking.status);
    return activeTab === 'past' ? isPast : !isPast;
  });

  const upcomingCount = bookings.filter((b) => {
    const bookingDate = new Date(`${b.date}T${b.endTime}`);
    return bookingDate >= new Date() && !['completed', 'cancelled'].includes(b.status);
  }).length;

  const pastCount = bookings.length - upcomingCount;

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="container-page py-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-zinc-400">Manage your workspace reservations</p>
        </div>
      </div>

      <div className="container-page py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <TabButton
            active={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            icon={<CalendarDays className="w-5 h-5" />}
            label="Upcoming"
            count={upcomingCount}
          />
          <TabButton
            active={activeTab === 'past'}
            onClick={() => setActiveTab('past')}
            icon={<History className="w-5 h-5" />}
            label="Past"
            count={pastCount}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : error ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Failed to load bookings
            </h3>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} tenantSlug={tenant.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all',
        active
          ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30'
          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-semibold',
          active ? 'bg-white/20' : 'bg-zinc-800'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function BookingCard({ booking, tenantSlug }: { booking: Booking; tenantSlug: string }) {
  const isActive = booking.status === 'active';
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
    confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400' },
    active: { label: 'Active Now', color: 'bg-violet-500/20 text-violet-300' },
    completed: { label: 'Completed', color: 'bg-zinc-800 text-zinc-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
  };

  const status = statusConfig[booking.status] || statusConfig.pending;

  const boothImage = booking.booth?.images?.[0] || 'https://placehold.co/200x200/18181B/7C3AED?text=Workspace';

  return (
    <Link
      href={`/booking/${booking.id}`}
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:border-zinc-700 transition-all',
        isCancelled && 'opacity-60'
      )}
    >
      {/* Image */}
      <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
        <Image
          src={boothImage}
          alt={booking.booth?.name || 'Workspace'}
          fill
          className="object-cover"
        />
        {isActive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold rounded-full animate-pulse-soft">
            <span className="w-2 h-2 bg-white rounded-full" />
            LIVE
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {booking.booth && (
                <span className="text-lg">{getBoothTypeIcon(booking.booth.type)}</span>
              )}
              <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-400 transition-colors">
                {booking.booth?.name || 'Workspace'}
              </h3>
            </div>
            {booking.booth?.location && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                <MapPin className="w-4 h-4" />
                {booking.booth.location.name}
              </div>
            )}
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', status.color)}>
            {status.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-600" />
            {formatDate(booking.date)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-600" />
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="text-lg font-bold text-white">
            {formatPrice(booking.totalPrice, booking.currency)}
          </div>
          <div className="flex items-center gap-1 text-violet-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
            {isActive ? 'Open Session' : isCancelled ? 'View Details' : 'Manage Booking'}
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab }: { tab: TabType }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
      {tab === 'upcoming' ? (
        <>
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No upcoming bookings
          </h3>
          <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
            You don&apos;t have any upcoming reservations. Browse our spaces and book your next workspace!
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/30 transition-all"
          >
            Browse Spaces
          </Link>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <History className="w-10 h-10 text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No past bookings
          </h3>
          <p className="text-zinc-400 max-w-sm mx-auto">
            Your completed and cancelled bookings will appear here.
          </p>
        </>
      )}
    </div>
  );
}
