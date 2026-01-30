'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, MapPin, Users, Grid3X3 } from 'lucide-react';
import { Location } from '@/lib/api';
import { getBoothTypeLabel } from '@/lib/utils';

interface SpacesFiltersProps {
  locations: Location[];
  currentFilters: {
    location?: string;
    type?: string;
    date?: string;
    time?: string;
    q?: string;
  };
  tenantSlug: string;
}

const BOOTH_TYPES = [
  { value: 'focus_pod', label: 'Focus Pod' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'phone_booth', label: 'Phone Booth' },
  { value: 'quiet_zone', label: 'Quiet Zone' },
];

export function SpacesFilters({ locations, currentFilters, tenantSlug }: SpacesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentFilters.q || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/spaces?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/spaces');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', search);
  };

  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className="lg:hidden w-full btn-secondary btn-md mb-6 flex items-center justify-center gap-2"
      >
        <Filter className="w-5 h-5" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-full pb-32">
              <FiltersContent
                locations={locations}
                currentFilters={currentFilters}
                updateFilter={updateFilter}
                search={search}
                setSearch={setSearch}
                handleSearch={handleSearch}
                clearFilters={clearFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:block card p-6 sticky top-24">
        <FiltersContent
          locations={locations}
          currentFilters={currentFilters}
          updateFilter={updateFilter}
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          clearFilters={clearFilters}
        />
      </div>
    </>
  );
}

function FiltersContent({
  locations,
  currentFilters,
  updateFilter,
  search,
  setSearch,
  handleSearch,
  clearFilters,
}: {
  locations: Location[];
  currentFilters: any;
  updateFilter: (key: string, value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  clearFilters: () => void;
}) {
  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <label className="label">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spaces..."
            className="input pl-10"
          />
        </div>
      </form>

      {/* Location Filter */}
      <div>
        <label className="label flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </label>
        <select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="input"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="label flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          Space Type
        </label>
        <div className="space-y-2">
          {BOOTH_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={currentFilters.type === type.value}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">{type.label}</span>
            </label>
          ))}
          {currentFilters.type && (
            <button
              onClick={() => updateFilter('type', '')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear type filter
            </button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          value={currentFilters.date || ''}
          onChange={(e) => updateFilter('date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="input"
        />
      </div>

      {/* Time Filter */}
      <div>
        <label className="label">Start Time</label>
        <select
          value={currentFilters.time || ''}
          onChange={(e) => updateFilter('time', e.target.value)}
          className="input"
        >
          <option value="">Any Time</option>
          {Array.from({ length: 12 }, (_, i) => {
            const hour = i + 8;
            const time = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <option key={time} value={time}>
                {time}
              </option>
            );
          })}
        </select>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full btn-secondary btn-md"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
