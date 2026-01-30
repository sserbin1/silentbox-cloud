'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookingContext } from './layout';
import { Search, MapPin, Clock, Users, Wifi, Coffee, ArrowRight, Star } from 'lucide-react';

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
  const [locations, setLocations] = useState<Location[]>([]);
  const [featuredBooths, setFeaturedBooths] = useState<Booth[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    async function loadData() {
      // Load locations
      const locRes = await fetch(`${API_URL}/api/tenants/${tenantSlug}/locations`);
      const locData = await locRes.json();
      if (locData.success) {
        setLocations(locData.data || []);
      }

      // Load featured booths
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
    <div>
      {/* Hero Section */}
      <section
        className="relative py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${tenant?.primaryColor || '#6366F1'} 0%, ${tenant?.secondaryColor || '#4F46E5'} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Workspace
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Book private workspaces by the hour. Focus, create, succeed.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Location
                </label>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Date
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <Link
                  href={`/book/${tenantSlug}/spaces${searchLocation || searchDate ? `?locationId=${searchLocation}&date=${searchDate}` : ''}`}
                  className="w-full px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                  style={{ backgroundColor: tenant?.primaryColor || '#6366F1' }}
                >
                  <Search className="w-5 h-5" />
                  Search Spaces
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      {featuredBooths.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Spaces</h2>
              <Link
                href={`/book/${tenantSlug}/spaces`}
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: tenant?.primaryColor || '#6366F1' }}
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooths.map((booth) => (
                <Link
                  key={booth.id}
                  href={`/book/${tenantSlug}/spaces/${booth.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
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

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {booth.capacity}
                      </span>
                      {booth.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {booth.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-lg font-bold" style={{ color: tenant?.primaryColor }}>
                          {formatPrice(booth.pricePerHour, booth.currency)}
                        </span>
                        <span className="text-gray-500 text-sm"> /hour</span>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: tenant?.primaryColor }}
                      >
                        Book now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <section className="py-16 px-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Locations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Link
                  key={location.id}
                  href={`/book/${tenantSlug}/spaces?locationId=${location.id}`}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tenant?.primaryColor}20` }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: tenant?.primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.city}</p>
                      <p className="text-sm text-gray-400 mt-1">{location.address}</p>
                      {location.boothCount !== undefined && (
                        <p className="text-sm mt-2" style={{ color: tenant?.primaryColor }}>
                          {location.boothCount} spaces available
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Why Book With Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${tenant?.primaryColor}15` }}
              >
                <Clock className="w-8 h-8" style={{ color: tenant?.primaryColor }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Hours</h3>
              <p className="text-gray-600">
                Book by the hour, day, or longer. Pay only for what you use.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${tenant?.primaryColor}15` }}
              >
                <Wifi className="w-8 h-8" style={{ color: tenant?.primaryColor }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">All Amenities Included</h3>
              <p className="text-gray-600">
                High-speed WiFi, power outlets, and comfortable seating.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${tenant?.primaryColor}15` }}
              >
                <Coffee className="w-8 h-8" style={{ color: tenant?.primaryColor }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Premium Environment</h3>
              <p className="text-gray-600">
                Clean, quiet spaces designed for productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-4"
        style={{ backgroundColor: tenant?.primaryColor || '#6366F1' }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-8">
            Find and book your perfect workspace in minutes.
          </p>
          <Link
            href={`/book/${tenantSlug}/spaces`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ color: tenant?.primaryColor }}
          >
            Browse Available Spaces
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
