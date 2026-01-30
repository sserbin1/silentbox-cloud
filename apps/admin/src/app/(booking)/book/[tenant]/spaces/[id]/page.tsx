'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../../layout';
import {
  MapPin,
  Users,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Monitor,
  Coffee,
  Zap,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Booth {
  id: string;
  name: string;
  type: string;
  description?: string;
  pricePerHour: number;
  currency: string;
  images: string[];
  capacity: number;
  amenities: string[];
  averageRating?: number;
  reviewCount?: number;
  location?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { name: string };
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'PLN',
    minimumFractionDigits: 0,
  }).format(amount);
}

const boothTypeLabels: Record<string, string> = {
  focus_pod: 'Focus Pod',
  meeting_room: 'Meeting Room',
  phone_booth: 'Phone Booth',
  quiet_zone: 'Quiet Zone',
};

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  monitor: Monitor,
  coffee: Coffee,
  power: Zap,
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 2, label: '2 hours' },
  { hours: 3, label: '3 hours' },
  { hours: 4, label: '4 hours' },
  { hours: 8, label: 'Full day' },
];

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tenant, tenantSlug } = useBookingContext();
  const boothId = params.id as string;

  const [booth, setBooth] = useState<Booth | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Booking form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Load booth
      const boothRes = await fetch(`${API_URL}/api/tenants/${tenantSlug}/booths/${boothId}`);
      const boothData = await boothRes.json();
      if (boothData.success) {
        setBooth(boothData.data);
      }

      // Load reviews
      const reviewsRes = await fetch(`${API_URL}/api/tenants/${tenantSlug}/booths/${boothId}/reviews`);
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.data || []);
      }

      setIsLoading(false);
    }
    loadData();
  }, [tenantSlug, boothId]);

  const endTime = useMemo(() => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, [startTime, duration]);

  const totalPrice = useMemo(() => {
    if (!booth) return 0;
    return booth.pricePerHour * duration;
  }, [booth, duration]);

  const discount = useMemo(() => {
    if (duration >= 8) return 0.2;
    if (duration >= 4) return 0.1;
    return 0;
  }, [duration]);

  const finalPrice = totalPrice * (1 - discount);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booth || !date || !startTime) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boothId: booth.id,
          date,
          startTime,
          endTime,
          customerName: guestName || undefined,
          customerEmail: guestEmail || undefined,
          customerPhone: guestPhone || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        router.push(`/book/${tenantSlug}/booking/${data.data.id}/confirmation`);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Space Not Found</h1>
        <p className="text-gray-600 mb-4">This space doesn't exist or is no longer available.</p>
        <Link
          href={`/book/${tenantSlug}/spaces`}
          className="text-sm font-medium"
          style={{ color: tenant?.primaryColor }}
        >
          Browse available spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Image Gallery */}
      <div className="mb-8">
        <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 mb-4">
          {booth.images?.[selectedImage] ? (
            <img
              src={booth.images[selectedImage]}
              alt={booth.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin className="w-16 h-16" />
            </div>
          )}
        </div>
        {booth.images?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {booth.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === i ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span
                className="inline-block px-2 py-1 rounded-full text-xs font-medium mb-2"
                style={{
                  backgroundColor: `${tenant?.primaryColor}15`,
                  color: tenant?.primaryColor,
                }}
              >
                {boothTypeLabels[booth.type] || booth.type}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{booth.name}</h1>
              {booth.location && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {booth.location.name}, {booth.location.address}, {booth.location.city}
                </p>
              )}
            </div>
            {booth.averageRating && (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-semibold">{booth.averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({booth.reviewCount})</span>
              </div>
            )}
          </div>

          {booth.description && (
            <p className="text-gray-700 mb-6">{booth.description}</p>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <div className="text-lg font-semibold text-gray-900">{booth.capacity}</div>
              <div className="text-sm text-gray-500">Capacity</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <div className="text-lg font-semibold text-gray-900">1h min</div>
              <div className="text-sm text-gray-500">Booking</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div
                className="w-6 h-6 mx-auto mb-2 rounded-full"
                style={{ backgroundColor: tenant?.primaryColor }}
              />
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(booth.pricePerHour, booth.currency)}
              </div>
              <div className="text-sm text-gray-500">Per hour</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-semibold text-gray-900">Instant</div>
              <div className="text-sm text-gray-500">Confirmation</div>
            </div>
          </div>

          {/* Amenities */}
          {booth.amenities?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {booth.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity.toLowerCase()] || CheckCircle2;
                  return (
                    <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {review.user?.name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold" style={{ color: tenant?.primaryColor }}>
                {formatPrice(booth.pricePerHour, booth.currency)}
              </div>
              <div className="text-gray-500">per hour</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setStartTime(time)}
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        startTime === time
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setDuration(opt.hours)}
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        duration === opt.hours
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Info */}
              {tenant?.features.allowGuestBooking && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">Your details:</p>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  {tenant.features.requirePhone && (
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Phone number"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              )}

              {/* Price Summary */}
              {startTime && date && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>
                      {formatPrice(booth.pricePerHour, booth.currency)} x {duration}h
                    </span>
                    <span>{formatPrice(totalPrice, booth.currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Discount ({discount * 100}% off)</span>
                      <span>-{formatPrice(totalPrice * discount, booth.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(finalPrice, booth.currency)}</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!date || !startTime || isSubmitting}
                className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: tenant?.primaryColor || '#6366F1' }}
              >
                {isSubmitting ? 'Processing...' : 'Book Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
