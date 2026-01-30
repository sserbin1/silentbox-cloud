'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../../layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FuturisticBackground, futuristicAnimations } from '@/components/booking/FuturisticBackground';
import { GlassCard, GradientBorderCard, NeonButton, GlowBadge } from '@/components/booking/GlassCard';
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
  ArrowLeft,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
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

// Booth type keys for translation lookup
const boothTypeKeys: Record<string, string> = {
  focus_pod: 'type.focus_pod',
  meeting_room: 'type.meeting_room',
  phone_booth: 'type.phone_booth',
  quiet_zone: 'type.quiet_zone',
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

// Duration options will be translated dynamically
const DURATION_HOURS = [1, 2, 3, 4, 8];

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tenant, tenantSlug } = useBookingContext();
  const { t } = useLanguage();
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

  const nextImage = () => {
    if (booth?.images?.length) {
      setSelectedImage((prev) => (prev + 1) % booth.images.length);
    }
  };

  const prevImage = () => {
    if (booth?.images?.length) {
      setSelectedImage((prev) => (prev - 1 + booth.images.length) % booth.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 relative">
        <FuturisticBackground variant="cyber" />
        <style dangerouslySetInnerHTML={{ __html: futuristicAnimations }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-[60vh] bg-white/5 rounded-3xl mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-white/10 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-32 bg-white/5 rounded-2xl" />
              </div>
              <div className="h-96 bg-white/5 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="min-h-screen bg-slate-950 relative">
        <FuturisticBackground variant="cyber" />
        <style dangerouslySetInnerHTML={{ __html: futuristicAnimations }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 text-center">
          <GlassCard className="p-12 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('error.notFound')}</h1>
            <p className="text-slate-400 mb-6">{t('error.notFoundDesc')}</p>
            <Link href={`/book/${tenantSlug}/spaces`}>
              <NeonButton variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('error.browseSpaces')}
              </NeonButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <FuturisticBackground variant="cyber" />
      <style dangerouslySetInnerHTML={{ __html: futuristicAnimations }} />

      <div className="relative z-10">
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Link
            href={`/book/${tenantSlug}/spaces`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('nav.back')}</span>
          </Link>
        </div>

        {/* Hero Image Gallery */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative rounded-3xl overflow-hidden group">
            {/* Main image */}
            <div className="aspect-[16/9] md:aspect-[21/9] relative">
              {booth.images?.[selectedImage] ? (
                <img
                  src={booth.images[selectedImage]}
                  alt={booth.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-12 h-12 text-violet-400" />
                    </div>
                    <p className="text-slate-400">No images available</p>
                  </div>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              {/* Navigation arrows */}
              {booth.images?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {booth.images?.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white text-sm">
                  {selectedImage + 1} / {booth.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {booth.images?.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {booth.images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <GlowBadge color="violet" className="mb-3">
                    {boothTypeKeys[booth.type] ? t(boothTypeKeys[booth.type] as 'type.focus_pod') : booth.type}
                  </GlowBadge>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{booth.name}</h1>
                  {booth.location && (
                    <p className="text-slate-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-400" />
                      {booth.location.name}, {booth.location.address}, {booth.location.city}
                    </p>
                  )}
                </div>
                {booth.averageRating && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-bold text-white">{booth.averageRating.toFixed(1)}</span>
                    <span className="text-slate-400 text-sm">({booth.reviewCount})</span>
                  </div>
                )}
              </div>

              {booth.description && (
                <p className="text-slate-300 text-lg leading-relaxed">{booth.description}</p>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-5 text-center" hover={false}>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{booth.capacity}</div>
                  <div className="text-sm text-slate-400">{t('detail.capacity')}</div>
                </GlassCard>

                <GlassCard className="p-5 text-center" hover={false}>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{t('detail.minBookingValue')}</div>
                  <div className="text-sm text-slate-400">{t('detail.minBooking')}</div>
                </GlassCard>

                <GlassCard className="p-5 text-center" hover={false}>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    {formatPrice(booth.pricePerHour, booth.currency)}
                  </div>
                  <div className="text-sm text-slate-400">{t('detail.pricePerHour')}</div>
                </GlassCard>

                <GlassCard className="p-5 text-center" hover={false}>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{t('detail.instant')}</div>
                  <div className="text-sm text-slate-400">{t('detail.confirmation')}</div>
                </GlassCard>
              </div>

              {/* Amenities */}
              {booth.amenities?.length > 0 && (
                <GlassCard className="p-6" hover={false}>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    {t('detail.amenities')}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {booth.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity.toLowerCase()] || CheckCircle2;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-violet-400" />
                          </div>
                          <span className="text-slate-300">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <GlassCard className="p-6" hover={false}>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    {t('detail.reviews')} ({reviews.length})
                  </h2>
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">
                            {review.user?.name || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-400 text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Booking Form Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <GradientBorderCard>
                  <div className="p-6">
                    {/* Price header */}
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                        {formatPrice(booth.pricePerHour, booth.currency)}
                      </div>
                      <div className="text-slate-400">{t('spaces.perHour').replace('/', '')}</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Date */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                          <Calendar className="w-4 h-4 text-violet-400" />
                          {t('booking.selectDate')}
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={today}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          {t('booking.startTime')}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {TIME_SLOTS.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setStartTime(time)}
                              className={`p-2 text-xs rounded-lg border transition-all ${
                                startTime === time
                                  ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-medium shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {t('booking.duration')}
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {DURATION_HOURS.map((hours) => (
                            <button
                              key={hours}
                              type="button"
                              onClick={() => setDuration(hours)}
                              className={`p-2 text-xs rounded-lg border transition-all ${
                                duration === hours
                                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-medium shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {hours === 8 ? t('booking.fullDay') : `${hours}${t('booking.hour').charAt(0)}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Guest Info */}
                      {tenant?.features.allowGuestBooking && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                          <p className="text-sm text-slate-400">{t('booking.yourDetails')}</p>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder={t('booking.yourName')}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder={t('booking.email')}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                          {tenant.features.requirePhone && (
                            <input
                              type="tel"
                              value={guestPhone}
                              onChange={(e) => setGuestPhone(e.target.value)}
                              placeholder={t('booking.phone')}
                              required
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                          )}
                        </div>
                      )}

                      {/* Price Summary */}
                      {startTime && date && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                          <div className="flex justify-between text-slate-400 text-sm">
                            <span>
                              {formatPrice(booth.pricePerHour, booth.currency)} x {duration}h
                            </span>
                            <span className="text-white">{formatPrice(totalPrice, booth.currency)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-emerald-400 text-sm">
                              <span>{t('booking.discount')} ({discount * 100}% {t('booking.off')})</span>
                              <span>-{formatPrice(totalPrice * discount, booth.currency)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-white pt-2 border-t border-white/10">
                            <span>{t('booking.total')}</span>
                            <span className="text-xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                              {formatPrice(finalPrice, booth.currency)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Submit */}
                      <NeonButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={!date || !startTime || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? t('booking.processing') : t('booking.bookNow')}
                      </NeonButton>

                      {/* Trust badges */}
                      <div className="flex items-center justify-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Shield className="w-3 h-3" />
                          Secure
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <CheckCircle2 className="w-3 h-3" />
                          Instant confirm
                        </div>
                      </div>
                    </form>
                  </div>
                </GradientBorderCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
