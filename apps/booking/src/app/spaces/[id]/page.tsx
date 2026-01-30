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
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-4">
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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
            <div className="card overflow-hidden">
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
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
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
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                      <span>{getBoothTypeIcon(booth.type)}</span>
                      {getBoothTypeLabel(booth.type)}
                    </span>
                    {booth.averageRating && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {booth.averageRating.toFixed(1)}
                        {booth.reviewCount && (
                          <span className="text-gray-500">
                            ({booth.reviewCount} reviews)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {booth.name}
                  </h1>
                </div>
              </div>

              {booth.location && (
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPin className="w-5 h-5" />
                  <span>
                    {booth.location.name} &middot; {booth.location.address}, {booth.location.city}
                  </span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-lg font-semibold text-gray-900">
                    {booth.capacity}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booth.capacity === 1 ? 'Person' : 'People'}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-lg font-semibold text-gray-900">
                    1h min
                  </div>
                  <div className="text-sm text-gray-500">Booking</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-xl">
                  <div className="text-2xl font-bold text-primary-700">
                    {formatPrice(booth.pricePerHour, booth.currency)}
                  </div>
                  <div className="text-sm text-primary-600">per hour</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {booth.description && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  About this space
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {booth.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {booth.amenities?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {booth.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {AMENITY_ICONS[amenity.toLowerCase()] || (
                          <span className="text-sm font-medium">
                            {amenity.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-700 capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {tenant?.features.showReviews && reviews.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reviews ({reviews.length})
                  </h2>
                  {booth.averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-gray-900">
                        {booth.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {review.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.user?.name || 'Anonymous'}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600">{review.comment}</p>
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
