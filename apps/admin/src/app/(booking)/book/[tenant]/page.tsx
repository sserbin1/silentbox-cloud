'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookingContext } from './layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Search, MapPin, Clock, Users, Wifi, Coffee, ArrowRight, Star,
  Zap, Shield, Sparkles, ChevronRight
} from 'lucide-react';
import { FuturisticBackground, futuristicAnimations } from '@/components/booking/FuturisticBackground';
import { GlassCard, NeonButton, GlowBadge, GradientBorderCard } from '@/components/booking/GlassCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  boothCount?: number;
}

interface Booth {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  currency: string;
  images: string[];
  capacity: number;
  amenities: string[];
  averageRating?: number;
  location?: {
    name: string;
    city: string;
  };
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

export default function BookingLandingPage() {
  const { tenant, tenantSlug } = useBookingContext();
  const { t } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [featuredBooths, setFeaturedBooths] = useState<Booth[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    async function loadData() {
      const locRes = await fetch(`${API_URL}/api/tenants/${tenantSlug}/locations`);
      const locData = await locRes.json();
      if (locData.success) {
        setLocations(locData.data || []);
      }

      const boothRes = await fetch(`${API_URL}/api/tenants/${tenantSlug}/booths?limit=6`);
      const boothData = await boothRes.json();
      if (boothData.success) {
        setFeaturedBooths(boothData.data || []);
      }
    }
    loadData();
  }, [tenantSlug]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Inject animations */}
      <style dangerouslySetInnerHTML={{ __html: futuristicAnimations }} />

      {/* Background */}
      <FuturisticBackground variant="cyber" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
        {/* Floating particles canvas */}
        <FuturisticBackground variant="particles" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <GlowBadge color="cyan">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('hero.badge') || 'Next Generation Workspace'}
            </GlowBadge>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Search Form - Glassmorphism */}
          <GlassCard variant="dark" glow className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2 text-violet-400" />
                  {t('search.location')}
                </label>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white
                    focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all
                    hover:border-violet-500/50"
                >
                  <option value="">{t('search.allLocations')}</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2 text-cyan-400" />
                  {t('search.date')}
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white
                    focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all
                    hover:border-violet-500/50 [color-scheme:dark]"
                />
              </div>

              <div className="flex items-end">
                <Link
                  href={`/book/${tenantSlug}/spaces${searchLocation || searchDate ? `?locationId=${searchLocation}&date=${searchDate}` : ''}`}
                  className="w-full"
                >
                  <NeonButton variant="primary" size="lg" className="w-full">
                    <Search className="w-5 h-5 mr-2" />
                    {t('hero.searchButton')}
                  </NeonButton>
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            {[
              { value: `${locations.length}+`, label: t('stats.locations') || 'Locations' },
              { value: `${featuredBooths.length * 10}+`, label: t('stats.spaces') || 'Spaces' },
              { value: '24/7', label: t('stats.access') || 'Access' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-violet-500/50 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-violet-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      {featuredBooths.length > 0 && (
        <section className="relative py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <GlowBadge color="violet" className="mb-4">{t('spaces.badge') || 'Premium Spaces'}</GlowBadge>
                <h2 className="text-3xl md:text-4xl font-bold">{t('spaces.title')}</h2>
              </div>
              <Link
                href={`/book/${tenantSlug}/spaces`}
                className="hidden md:flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors group"
              >
                {t('cta.button')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooths.map((booth, index) => (
                <Link key={booth.id} href={`/book/${tenantSlug}/spaces/${booth.id}`}>
                  <GradientBorderCard className="h-full group cursor-pointer">
                    <div className="p-1">
                      {/* Image */}
                      <div className="aspect-video rounded-t-xl overflow-hidden relative">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        {/* Badge */}
                        <div className="absolute top-4 left-4">
                          <GlowBadge color={index % 2 === 0 ? 'violet' : 'cyan'}>
                            {boothTypeLabels[booth.type] || booth.type}
                          </GlowBadge>
                        </div>
                        {/* Rating */}
                        {booth.averageRating && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{booth.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                          {booth.name}
                        </h3>
                        {booth.location && (
                          <p className="text-slate-400 text-sm flex items-center gap-1 mb-4">
                            <MapPin className="w-3 h-3" />
                            {booth.location.name}, {booth.location.city}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-slate-400 text-sm mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {booth.capacity}
                          </span>
                          {booth.amenities?.slice(0, 2).map((amenity) => (
                            <span key={amenity} className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                          <div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                              {formatPrice(booth.pricePerHour, booth.currency)}
                            </span>
                            <span className="text-slate-500 text-sm ml-1">{t('spaces.perHour')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-violet-400 group-hover:text-violet-300">
                            <span className="text-sm font-medium">{t('spaces.bookNow')}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </GradientBorderCard>
                </Link>
              ))}
            </div>

            {/* Mobile view all button */}
            <div className="mt-8 md:hidden text-center">
              <Link href={`/book/${tenantSlug}/spaces`}>
                <NeonButton variant="outline">
                  {t('cta.button')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </NeonButton>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <section className="relative py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <GlowBadge color="cyan" className="mb-4">{t('locations.badge') || 'Global Network'}</GlowBadge>
              <h2 className="text-3xl md:text-4xl font-bold">{t('locations.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Link key={location.id} href={`/book/${tenantSlug}/spaces?locationId=${location.id}`}>
                  <GlassCard variant="dark" glow={false} className="p-6 h-full group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center
                        group-hover:from-violet-500/30 group-hover:to-cyan-500/30 transition-all">
                        <MapPin className="w-7 h-7 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors">
                          {location.name}
                        </h3>
                        <p className="text-slate-400 text-sm">{location.city}</p>
                        <p className="text-slate-500 text-sm mt-2">{location.address}</p>
                        {location.boothCount !== undefined && (
                          <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-400 text-sm font-medium">
                              {location.boothCount} {t('spaces.available') || 'spaces available'}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <GlowBadge color="pink" className="mb-4">{t('features.badge') || 'Why Choose Us'}</GlowBadge>
            <h2 className="text-3xl md:text-4xl font-bold">{t('features.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                color: 'violet',
                title: t('features.flexible.title'),
                desc: t('features.flexible.desc'),
              },
              {
                icon: Wifi,
                color: 'cyan',
                title: t('features.amenities.title'),
                desc: t('features.amenities.desc'),
              },
              {
                icon: Shield,
                color: 'pink',
                title: t('features.environment.title'),
                desc: t('features.environment.desc'),
              },
            ].map((feature, i) => (
              <GlassCard key={i} variant="dark" className="p-8 text-center group">
                <div
                  className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center
                    bg-gradient-to-br ${
                      feature.color === 'violet' ? 'from-violet-500/20 to-violet-600/10' :
                      feature.color === 'cyan' ? 'from-cyan-500/20 to-cyan-600/10' :
                      'from-pink-500/20 to-pink-600/10'
                    }
                    group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-10 h-10 ${
                    feature.color === 'violet' ? 'text-violet-400' :
                    feature.color === 'cyan' ? 'text-cyan-400' :
                    'text-pink-400'
                  }`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-cyan-600/20" />

        <div className="relative max-w-4xl mx-auto">
          <GlassCard variant="neon" glow className="p-12 md:p-16 text-center">
            <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                {t('cta.title')}
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <Link href={`/book/${tenantSlug}/spaces`}>
              <NeonButton variant="primary" size="lg">
                {t('cta.button')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </NeonButton>
            </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
