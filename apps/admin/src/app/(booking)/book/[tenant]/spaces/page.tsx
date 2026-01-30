'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingContext } from '../layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FuturisticBackground, futuristicAnimations } from '@/components/booking/FuturisticBackground';
import { GlassCard, GradientBorderCard, NeonButton, GlowBadge } from '@/components/booking/GlassCard';
import {
  MapPin,
  Users,
  Star,
  Filter,
  X,
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
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

// Translation keys for booth types
const boothTypeKeys: Record<string, string> = {
  focus_pod: 'type.focus_pod',
  meeting_room: 'type.meeting_room',
  phone_booth: 'type.phone_booth',
  quiet_zone: 'type.quiet_zone',
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
  const { t } = useLanguage();
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
  const activeFilterCount = [locationId, boothType, minCapacity, maxPrice].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <FuturisticBackground variant="cyber" />
      <style dangerouslySetInnerHTML={{ __html: futuristicAnimations }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <GlowBadge color="cyan" className="mb-3">
                <Search className="w-3 h-3 mr-1" />
                {t('spaces.title')}
              </GlowBadge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('spaces.findSpace')}
              </h1>
              <p className="text-slate-400">
                {booths.length} {booths.length === 1 ? t('spaces.spaceAvailable') : t('spaces.spacesAvailable')}
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('spaces.filters')}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-violet-500 text-xs text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside
              className={`md:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}
            >
              <div className="sticky top-24">
                <GlassCard className="p-5" hover={false}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <Filter className="w-4 h-4 text-violet-400" />
                      {t('spaces.filters')}
                    </h2>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        {t('spaces.clear')}
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('search.location')}
                      </label>
                      <select
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">{t('search.allLocations')}</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id} className="bg-slate-900">
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('spaces.spaceType')}
                      </label>
                      <select
                        value={boothType}
                        onChange={(e) => setBoothType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                      >
                        {boothTypes.map((type) => (
                          <option key={type.value} value={type.value} className="bg-slate-900">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('spaces.minCapacity')}
                      </label>
                      <select
                        value={minCapacity}
                        onChange={(e) => setMinCapacity(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">{t('spaces.any')}</option>
                        <option value="1" className="bg-slate-900">1+ {t('spaces.person')}</option>
                        <option value="2" className="bg-slate-900">2+ {t('spaces.people')}</option>
                        <option value="4" className="bg-slate-900">4+ {t('spaces.people')}</option>
                        <option value="6" className="bg-slate-900">6+ {t('spaces.people')}</option>
                      </select>
                    </div>

                    {/* Max Price */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('spaces.maxPrice')}
                      </label>
                      <select
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">{t('spaces.any')}</option>
                        <option value="50" className="bg-slate-900">{t('spaces.upTo')} 50 PLN</option>
                        <option value="100" className="bg-slate-900">{t('spaces.upTo')} 100 PLN</option>
                        <option value="150" className="bg-slate-900">{t('spaces.upTo')} 150 PLN</option>
                        <option value="200" className="bg-slate-900">{t('spaces.upTo')} 200 PLN</option>
                      </select>
                    </div>
                  </div>

                  {/* Active filters summary */}
                  {hasFilters && (
                    <div className="mt-5 pt-5 border-t border-white/10">
                      <p className="text-xs text-slate-500 mb-2">Active filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {locationId && (
                          <span className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs">
                            {locations.find(l => l.id === locationId)?.name}
                          </span>
                        )}
                        {boothType && (
                          <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">
                            {boothTypes.find(t => t.value === boothType)?.label}
                          </span>
                        )}
                        {minCapacity && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs">
                            {minCapacity}+ people
                          </span>
                        )}
                        {maxPrice && (
                          <span className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs">
                            Up to {maxPrice} PLN
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </aside>

            {/* Results Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                      <div className="aspect-video bg-white/5" />
                      <div className="p-5 bg-slate-900/50 space-y-3">
                        <div className="h-5 bg-white/10 rounded w-3/4" />
                        <div className="h-4 bg-white/5 rounded w-1/2" />
                        <div className="h-4 bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : booths.length === 0 ? (
                <GlassCard className="p-12 text-center" hover={false}>
                  <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('spaces.noSpaces')}</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {t('spaces.noSpacesDesc')}
                  </p>
                  {hasFilters && (
                    <NeonButton variant="outline" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      {t('spaces.clearFilters')}
                    </NeonButton>
                  )}
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {booths.map((booth) => (
                    <Link
                      key={booth.id}
                      href={`/book/${tenantSlug}/spaces/${booth.id}`}
                      className="group"
                    >
                      <GradientBorderCard className="overflow-hidden h-full">
                        <div className="h-full flex flex-col">
                          {/* Image */}
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={booth.images?.[0] || `https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=80&sig=${booth.id}`}
                              alt={booth.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=80';
                              }}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                            {/* Type badge */}
                            <div className="absolute top-3 left-3">
                              <GlowBadge color="violet">
                                {boothTypeKeys[booth.type] ? t(boothTypeKeys[booth.type] as 'type.focus_pod') : booth.type}
                              </GlowBadge>
                            </div>

                            {/* Rating badge */}
                            {booth.averageRating && (
                              <div className="absolute top-3 right-3">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-white font-medium">{booth.averageRating.toFixed(1)}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors">
                              {booth.name}
                            </h3>
                            {booth.location && (
                              <p className="text-sm text-slate-400 flex items-center gap-1 mb-3">
                                <MapPin className="w-3 h-3 text-violet-400" />
                                {booth.location.name}, {booth.location.city}
                              </p>
                            )}

                            {booth.description && (
                              <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">
                                {booth.description}
                              </p>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-cyan-400" />
                                {booth.capacity} {booth.capacity === 1 ? t('spaces.person') : t('spaces.people')}
                              </span>
                              {booth.reviewCount && booth.reviewCount > 0 && (
                                <span className="text-slate-500">
                                  ({booth.reviewCount} {t('detail.reviews').toLowerCase()})
                                </span>
                              )}
                            </div>

                            {/* Amenities */}
                            {booth.amenities?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {booth.amenities.slice(0, 3).map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                                {booth.amenities.length > 3 && (
                                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-500">
                                    +{booth.amenities.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Price and CTA */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                              <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                  {formatPrice(booth.pricePerHour, booth.currency)}
                                </span>
                                <span className="text-slate-500 text-sm ml-1">{t('spaces.perHour')}</span>
                              </div>
                              <div className="flex items-center gap-1 text-violet-400 group-hover:text-violet-300 transition-colors">
                                <span className="text-sm font-medium">{t('spaces.bookNow')}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </GradientBorderCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
