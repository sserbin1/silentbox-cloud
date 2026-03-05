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
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-2 md:p-3">
        <div className="grid md:grid-cols-4 gap-2 md:gap-3">
          {/* Location */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <MapPin className="w-5 h-5" />
            </div>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-800">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id} className="bg-zinc-800">
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-violet-500/50"
              placeholder="Select date"
            />
          </div>

          {/* Time */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Clock className="w-5 h-5" />
            </div>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-800">Any Time</option>
              <option value="08:00" className="bg-zinc-800">08:00</option>
              <option value="09:00" className="bg-zinc-800">09:00</option>
              <option value="10:00" className="bg-zinc-800">10:00</option>
              <option value="11:00" className="bg-zinc-800">11:00</option>
              <option value="12:00" className="bg-zinc-800">12:00</option>
              <option value="13:00" className="bg-zinc-800">13:00</option>
              <option value="14:00" className="bg-zinc-800">14:00</option>
              <option value="15:00" className="bg-zinc-800">15:00</option>
              <option value="16:00" className="bg-zinc-800">16:00</option>
              <option value="17:00" className="bg-zinc-800">17:00</option>
              <option value="18:00" className="bg-zinc-800">18:00</option>
              <option value="19:00" className="bg-zinc-800">19:00</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="py-4 px-6 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap min-w-fit bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}
