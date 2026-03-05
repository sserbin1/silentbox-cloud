import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Users,
  Star,
  Clock,
  Wifi,
  Zap,
  Wind,
  Volume2,
  Monitor,
  Coffee,
  Share2,
  Heart
} from 'lucide-react';
import { getTenantSlug, getTenantBranding, DEFAULT_BRANDING } from '@/lib/tenant';
import { boothsApi, reviewsApi } from '@/lib/api';
import { formatPrice, getBoothTypeLabel, getBoothTypeIcon } from '@/lib/utils';
import { BookingForm } from '@/components/BookingForm';

interface BoothPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: BoothPageProps) {
  const slug = await getTenantSlug();
  if (!slug) return { title: 'Space Details' };

  const res = await boothsApi.getById(slug, params.id);
  const booth = res.data;

  return {
    title: booth?.name || 'Space Details',
    description: booth?.description || 'Book this private workspace',
  };
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  power: <Zap className="w-5 h-5" />,
  'air conditioning': <Wind className="w-5 h-5" />,
  ac: <Wind className="w-5 h-5" />,
  soundproof: <Volume2 className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  display: <Monitor className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
};

export default async function BoothPage({ params }: BoothPageProps) {
  const slug = await getTenantSlug();
  const tenant = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;

  if (!slug) {
    return notFound();
  }

  const boothRes = await boothsApi.getById(slug, params.id);

  if (!boothRes.success || !boothRes.data) {
    return notFound();
  }

  const booth = boothRes.data;

  // Fetch reviews if enabled
  let reviews: any[] = [];
  if (tenant?.features.showReviews) {
    const reviewsRes = await reviewsApi.list(slug, params.id);
    reviews = reviewsRes.data || [];
  }

  const images = booth.images?.length > 0
    ? booth.images
    : ['https://placehold.co/800x600/EEF2FF/6366F1?text=Workspace'];

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Back Button */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="container-page py-4">
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Spaces
          </Link>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="card overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="relative h-64 md:h-96">
                <Image
                  src={images[0]}
                  alt={booth.name}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="w-10 h-10 bg-zinc-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors">
                    <Share2 className="w-5 h-5 text-zinc-300" />
                  </button>
                  <button className="w-10 h-10 bg-zinc-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors">
                    <Heart className="w-5 h-5 text-zinc-300" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-zinc-900">
                  {images.slice(0, 5).map((img, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="card p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm font-medium">
                      <span>{getBoothTypeIcon(booth.type)}</span>
                      {getBoothTypeLabel(booth.type)}
                    </span>
                    {booth.averageRating && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-300">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {booth.averageRating.toFixed(1)}
                        {booth.reviewCount && (
                          <span className="text-zinc-500">
                            ({booth.reviewCount} reviews)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {booth.name}
                  </h1>
                </div>
              </div>

              {booth.location && (
                <div className="flex items-center gap-2 text-zinc-500 mb-6">
                  <MapPin className="w-5 h-5" />
                  <span>
                    {booth.location.name} &middot; {booth.location.address}, {booth.location.city}
                  </span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-zinc-800 rounded-xl">
                  <Users className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                  <div className="text-lg font-semibold text-white">
                    {booth.capacity}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {booth.capacity === 1 ? 'Person' : 'People'}
                  </div>
                </div>
                <div className="text-center p-4 bg-zinc-800 rounded-xl">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                  <div className="text-lg font-semibold text-white">
                    1h min
                  </div>
                  <div className="text-sm text-zinc-500">Booking</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-xl">
                  <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    {formatPrice(booth.pricePerHour, booth.currency)}
                  </div>
                  <div className="text-sm text-zinc-400">per hour</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {booth.description && (
              <div className="card p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <h2 className="text-lg font-semibold text-white mb-4">
                  About this space
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  {booth.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {booth.amenities?.length > 0 && (
              <div className="card p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {booth.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400">
                        {AMENITY_ICONS[amenity.toLowerCase()] || (
                          <span className="text-sm font-medium">
                            {amenity.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-300 capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {tenant?.features.showReviews && reviews.length > 0 && (
              <div className="card p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Reviews ({reviews.length})
                  </h2>
                  {booth.averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-white">
                        {booth.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="pb-6 border-b border-zinc-800 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center">
                          <span className="text-violet-300 font-semibold">
                            {review.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {review.user?.name || 'Anonymous'}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-sm text-zinc-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-zinc-400">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <BookingForm
                booth={booth}
                tenantSlug={slug}
                allowGuestBooking={tenant?.features.allowGuestBooking ?? true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
