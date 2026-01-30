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
  const imageUrl = booth.images?.[0] || 'https://placehold.co/400x300/EEF2FF/6366F1?text=Workspace';

  return (
    <Link
      href={`/spaces/${booth.id}`}
      className="card overflow-hidden group hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageUrl}
          alt={booth.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700">
            <span>{getBoothTypeIcon(booth.type)}</span>
            {getBoothTypeLabel(booth.type)}
          </span>
        </div>

        {/* Rating */}
        {booth.averageRating && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {booth.averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
          {booth.name}
        </h3>

        {booth.location && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{booth.location.name}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
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
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md"
              >
                {amenity}
              </span>
            ))}
            {booth.amenities.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                +{booth.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(booth.pricePerHour, booth.currency)}
            </span>
            <span className="text-gray-500 text-sm"> / hour</span>
          </div>
          <span className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
}
