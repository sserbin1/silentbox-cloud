import { Suspense } from 'react';
import { getTenantSlug, getTenantBranding, DEFAULT_BRANDING } from '@/lib/tenant';
import { boothsApi, locationsApi, BoothFilters } from '@/lib/api';
import { BoothCard } from '@/components/BoothCard';
import { SpacesFilters } from '@/components/SpacesFilters';
import { Search } from 'lucide-react';

interface SpacesPageProps {
  searchParams: {
    location?: string;
    type?: string;
    date?: string;
    time?: string;
    q?: string;
  };
}

export const metadata = {
  title: 'Browse Spaces',
  description: 'Find and book private workspaces',
};

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
  const slug = await getTenantSlug();
  const tenant = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;

  if (!slug) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No tenant found</h1>
        <p className="text-gray-600">Please access this page via a tenant subdomain.</p>
      </div>
    );
  }

  // Build filters from search params
  const filters: BoothFilters = {};
  if (searchParams.location) filters.locationId = searchParams.location;
  if (searchParams.type) filters.type = searchParams.type;
  if (searchParams.date) filters.date = searchParams.date;
  if (searchParams.time) filters.startTime = searchParams.time;

  // Fetch data
  const [boothsRes, locationsRes] = await Promise.all([
    boothsApi.list(slug, filters),
    locationsApi.list(slug),
  ]);

  const booths = boothsRes.data || [];
  const locations = locationsRes.data || [];

  // Filter by search query client-side
  const filteredBooths = searchParams.q
    ? booths.filter(
        (b) =>
          b.name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
          b.location?.name.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : booths;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-page py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Spaces</h1>
          <p className="text-gray-600">
            {filteredBooths.length} {filteredBooths.length === 1 ? 'space' : 'spaces'} available
          </p>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="mb-8 lg:mb-0">
            <SpacesFilters
              locations={locations}
              currentFilters={searchParams}
              tenantSlug={slug}
            />
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {filteredBooths.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBooths.map((booth) => (
                  <BoothCard key={booth.id} booth={booth} tenantSlug={slug} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No spaces found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search query.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
