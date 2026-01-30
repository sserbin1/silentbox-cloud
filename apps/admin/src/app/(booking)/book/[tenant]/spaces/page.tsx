'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../layout';
import { MapPin, Users, Star, Filter, X } from 'lucide-react';

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
    city: string;
  };
}

interface Location {
  id: string;
  name: string;
  city: string;
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

const boothTypes = [
  { value: '', label: 'All Types' },
  { value: 'focus_pod', label: 'Focus Pod' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'phone_booth', label: 'Phone Booth' },
  { value: 'quiet_zone', label: 'Quiet Zone' },
];

export default function SpacesPage() {
  const { tenant, tenantSlug } = useBookingContext();
  const searchParams = useSearchParams();

  const [booths, setBooths] = useState<Booth[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [locationId, setLocationId] = useState(searchParams.get('locationId') || '');
  const [boothType, setBoothType] = useState(searchParams.get('type') || '');
  const [minCapacity, setMinCapacity] = useState(searchParams.get('minCapacity') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    async function loadLocations() {
      const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}/locations`);
      const data = await res.json();
      if (data.success) {
        setLocations(data.data || []);
      }
    }
    loadLocations();
  }, [tenantSlug]);

  useEffect(() => {
    async function loadBooths() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (locationId) params.set('locationId', locationId);
      if (boothType) params.set('type', boothType);
      if (minCapacity) params.set('minCapacity', minCapacity);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}/booths?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBooths(data.data || []);
      }
      setIsLoading(false);
    }
    loadBooths();
  }, [tenantSlug, locationId, boothType, minCapacity, maxPrice]);

  const clearFilters = () => {
    setLocationId('');
    setBoothType('');
    setMinCapacity('');
    setMaxPrice('');
  };

  const hasFilters = locationId || boothType || minCapacity || maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Spaces</h1>
          <p className="text-gray-600">
            {booths.length} {booths.length === 1 ? 'space' : 'spaces'} available
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 md:hidden"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span
              className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center"
              style={{ backgroundColor: tenant?.primaryColor }}
            >
              !
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}
        >
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Space Type
                </label>
                <select
                  value={boothType}
                  onChange={(e) => setBoothType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {boothTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Capacity
                </label>
                <select
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+ person</option>
                  <option value="2">2+ people</option>
                  <option value="4">4+ people</option>
                  <option value="6">6+ people</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price/Hour
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="50">Up to 50 PLN</option>
                  <option value="100">Up to 100 PLN</option>
                  <option value="150">Up to 150 PLN</option>
                  <option value="200">Up to 200 PLN</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : booths.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or check back later.
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium"
                  style={{ color: tenant?.primaryColor }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {booths.map((booth) => (
                <Link
                  key={booth.id}
                  href={`/book/${tenantSlug}/spaces/${booth.id}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {booth.images?.[0] ? (
                      <img
                        src={booth.images[0]}
                        alt={booth.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                        {boothTypeLabels[booth.type] || booth.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{booth.name}</h3>
                    {booth.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {booth.location.name}, {booth.location.city}
                      </p>
                    )}

                    {booth.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {booth.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {booth.capacity} {booth.capacity === 1 ? 'person' : 'people'}
                      </span>
                      {booth.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {booth.averageRating.toFixed(1)}
                          {booth.reviewCount && (
                            <span className="text-gray-400">({booth.reviewCount})</span>
                          )}
                        </span>
                      )}
                    </div>

                    {booth.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {booth.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                          >
                            {amenity}
                          </span>
                        ))}
                        {booth.amenities.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                            +{booth.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span
                          className="text-lg font-bold"
                          style={{ color: tenant?.primaryColor }}
                        >
                          {formatPrice(booth.pricePerHour, booth.currency)}
                        </span>
                        <span className="text-gray-500 text-sm"> /hour</span>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: tenant?.primaryColor }}
                      >
                        Book now &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
