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
        className="lg:hidden w-full py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-medium mb-6 flex items-center justify-center gap-2 hover:border-zinc-700 transition-colors"
      >
        <Filter className="w-5 h-5" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-900 border-l border-zinc-800 animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
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
      <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
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
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spaces..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
          />
        </div>
      </form>

      {/* Location Filter */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </label>
        <select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
        >
          <option value="" className="bg-zinc-800">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id} className="bg-zinc-800">
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          Space Type
        </label>
        <div className="space-y-2">
          {BOOTH_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                currentFilters.type === type.value
                  ? 'border-violet-500/30 bg-violet-500/20'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={currentFilters.type === type.value}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-4 h-4 text-violet-600 bg-zinc-800 border-zinc-600 focus:ring-violet-500/50"
              />
              <span className={currentFilters.type === type.value ? 'text-violet-300' : 'text-zinc-400'}>{type.label}</span>
            </label>
          ))}
          {currentFilters.type && (
            <button
              onClick={() => updateFilter('type', '')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear type filter
            </button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Date</label>
        <input
          type="date"
          value={currentFilters.date || ''}
          onChange={(e) => updateFilter('date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
        />
      </div>

      {/* Time Filter */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Start Time</label>
        <select
          value={currentFilters.time || ''}
          onChange={(e) => updateFilter('time', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
        >
          <option value="" className="bg-zinc-800">Any Time</option>
          {Array.from({ length: 12 }, (_, i) => {
            const hour = i + 8;
            const time = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <option key={time} value={time} className="bg-zinc-800">
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
          className="w-full py-2.5 px-4 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
