import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Shield, Wifi, Search, ArrowRight, Star } from 'lucide-react';
import { getTenantSlug, getTenantBranding, DEFAULT_BRANDING } from '@/lib/tenant';
import { boothsApi, locationsApi } from '@/lib/api';
import { BoothCard } from '@/components/BoothCard';
import { SearchForm } from '@/components/SearchForm';

export default async function HomePage() {
  const slug = await getTenantSlug();
  const branding = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;
  const tenant = branding || DEFAULT_BRANDING;

  // Fetch featured booths and locations if tenant exists
  let featuredBooths: any[] = [];
  let locations: any[] = [];

  if (slug) {
    const [boothsRes, locationsRes] = await Promise.all([
      boothsApi.list(slug),
      locationsApi.list(slug),
    ]);

    featuredBooths = boothsRes.data?.slice(0, 6) || [];
    locations = locationsRes.data || [];
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        {/* Hero Image Overlay */}
        {tenant.heroImage && (
          <div className="absolute inset-0">
            <Image
              src={tenant.heroImage}
              alt=""
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
        )}

        <div className="relative container-page py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {tenant.tagline || 'Book private workspaces instantly'}
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              {tenant.description || 'Find and book quiet, private workspaces near you. Perfect for focused work, video calls, or meetings.'}
            </p>

            {/* Search Form */}
            <SearchForm tenantSlug={slug || 'demo'} locations={locations} />
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why book with us?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium private workspaces with smart access, available when you need them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Book Instantly"
              description="No waiting, no phone calls. Book your workspace in seconds and get immediate confirmation."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Smart Access"
              description="Enter with a PIN code, Bluetooth, or remote unlock. No keys, no hassle."
            />
            <FeatureCard
              icon={<Wifi className="w-8 h-8" />}
              title="Fully Equipped"
              description="High-speed WiFi, power outlets, climate control, and more in every space."
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8" />}
              title="Prime Locations"
              description="Conveniently located spaces in business districts and coworking hubs."
            />
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      {featuredBooths.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-page">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Featured Spaces
                </h2>
                <p className="text-gray-600">
                  Our most popular workspaces
                </p>
              </div>
              <Link
                href="/spaces"
                className="hidden sm:flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                View All
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooths.map((booth) => (
                <BoothCard key={booth.id} booth={booth} tenantSlug={slug!} />
              ))}
            </div>

            <Link
              href="/spaces"
              className="sm:hidden flex items-center justify-center gap-2 mt-8 text-primary-600 font-semibold"
            >
              View All Spaces
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Locations Section */}
      {locations.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container-page">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Locations
              </h2>
              <p className="text-gray-600">
                Find a workspace near you
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.slice(0, 6).map((location) => (
                <Link
                  key={location.id}
                  href={`/spaces?location=${location.id}`}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {location.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {location.address}, {location.city}
                      </p>
                      {location.boothCount && (
                        <p className="text-sm text-primary-600 font-medium">
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

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container-page">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to focus?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Book your first workspace today and experience the difference.
            </p>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <Search className="w-5 h-5" />
              Browse Spaces
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 text-center hover:shadow-lg transition-shadow">
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
