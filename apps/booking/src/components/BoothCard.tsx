'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Users, Star } from 'lucide-react';
import { Booth } from '@/lib/api';
import { formatPrice, getBoothTypeLabel, getBoothTypeIcon } from '@/lib/utils';

interface BoothCardProps {
  booth: Booth;
  tenantSlug: string;
}

export function BoothCard({ booth, tenantSlug }: BoothCardProps) {
  // Use booth images, or fallback to local product photos based on capacity
  const fallbackImages: Record<number, string> = {
    1: '/images/booths/solo.webp',
    2: '/images/booths/duet.png',
    4: '/images/booths/quartet.png',
  };
  const imageUrl = booth.images?.[0] || fallbackImages[booth.capacity] || '/images/booths/solo.webp';

  return (
    <Link
      href={`/spaces/${booth.id}`}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageUrl}
          alt={booth.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/90 backdrop-blur-sm rounded-lg text-sm font-medium text-zinc-300">
            <span>{getBoothTypeIcon(booth.type)}</span>
            {getBoothTypeLabel(booth.type)}
          </span>
        </div>

        {/* Rating */}
        {booth.averageRating && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800/90 backdrop-blur-sm rounded-lg text-sm font-medium text-zinc-300">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {booth.averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-blue-400 transition-colors">
          {booth.name}
        </h3>

        {booth.location && (
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{booth.location.name}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{booth.capacity} {booth.capacity === 1 ? 'person' : 'people'}</span>
          </div>
          {booth.reviewCount ? (
            <span>{booth.reviewCount} reviews</span>
          ) : null}
        </div>

        {/* Amenities */}
        {booth.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {booth.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md"
              >
                {amenity}
              </span>
            ))}
            {booth.amenities.length > 3 && (
              <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md">
                +{booth.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              {formatPrice(booth.pricePerHour, booth.currency)}
            </span>
            <span className="text-zinc-500 text-sm"> / hour</span>
          </div>
          <span className="text-zinc-400 font-medium text-sm group-hover:text-white group-hover:translate-x-1 transition-all">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
}
