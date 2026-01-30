'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Clock } from 'lucide-react';
import { Location } from '@/lib/api';

interface SearchFormProps {
  tenantSlug: string;
  locations: Location[];
}

export function SearchForm({ tenantSlug, locations }: SearchFormProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (locationId) params.append('location', locationId);
    if (date) params.append('date', date);
    if (time) params.append('time', time);

    router.push(`/spaces?${params.toString()}`);
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-2xl shadow-xl p-2 md:p-3">
        <div className="grid md:grid-cols-4 gap-2 md:gap-3">
          {/* Location */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-5 h-5" />
            </div>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500"
              placeholder="Select date"
            />
          </div>

          {/* Time */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Clock className="w-5 h-5" />
            </div>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="">Any Time</option>
              <option value="08:00">08:00</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="12:00">12:00</option>
              <option value="13:00">13:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
              <option value="17:00">17:00</option>
              <option value="18:00">18:00</option>
              <option value="19:00">19:00</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="btn-primary py-4 px-6 rounded-xl flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span className="font-semibold">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}
