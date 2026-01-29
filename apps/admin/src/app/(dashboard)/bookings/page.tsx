'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Calendar, Clock, User, MapPin, MoreHorizontal } from 'lucide-react';

const bookings = [
  {
    id: '1',
    user: { name: 'Jan Kowalski', email: 'jan@example.com' },
    booth: { name: 'Booth A1', location: 'Warsaw Central' },
    date: '2024-01-29',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    price: '45 PLN',
    status: 'active',
  },
  {
    id: '2',
    user: { name: 'Anna Nowak', email: 'anna@example.com' },
    booth: { name: 'Booth B2', location: 'Warsaw Central' },
    date: '2024-01-29',
    startTime: '15:00',
    endTime: '16:00',
    duration: 60,
    price: '30 PLN',
    status: 'confirmed',
  },
  {
    id: '3',
    user: { name: 'Piotr Wisniewski', email: 'piotr@example.com' },
    booth: { name: 'Booth C1', location: 'Krakow Mall' },
    date: '2024-01-29',
    startTime: '16:00',
    endTime: '18:00',
    duration: 120,
    price: '60 PLN',
    status: 'pending',
  },
  {
    id: '4',
    user: { name: 'Maria Lewandowska', email: 'maria@example.com' },
    booth: { name: 'Booth A2', location: 'Warsaw Central' },
    date: '2024-01-29',
    startTime: '17:30',
    endTime: '18:30',
    duration: 60,
    price: '30 PLN',
    status: 'confirmed',
  },
  {
    id: '5',
    user: { name: 'Tomasz Zielinski', email: 'tomasz@example.com' },
    booth: { name: 'Booth D1', location: 'Gdansk Station' },
    date: '2024-01-28',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    price: '60 PLN',
    status: 'completed',
  },
  {
    id: '6',
    user: { name: 'Katarzyna Mazur', email: 'kasia@example.com' },
    booth: { name: 'Booth A1', location: 'Warsaw Central' },
    date: '2024-01-28',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    price: '30 PLN',
    status: 'cancelled',
  },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const filters = ['All', 'Active', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.booth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.booth.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'All' || booking.status.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Header title="Bookings" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Booth</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{booking.user.name}</p>
                          <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{booking.booth.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.booth.location}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {booking.date}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </td>
                      <td className="px-4 py-3">{booking.duration} min</td>
                      <td className="px-4 py-3 font-medium">{booking.price}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[booking.status]
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
