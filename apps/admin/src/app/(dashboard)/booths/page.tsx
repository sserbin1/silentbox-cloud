'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, DollarSign, Edit, Wifi, WifiOff } from 'lucide-react';

const booths = [
  {
    id: '1',
    name: 'Booth A1',
    location: 'Warsaw Central',
    status: 'available',
    pricePerHour: 30,
    amenities: ['WiFi', 'Power outlets', 'Monitor', 'Webcam'],
    todayBookings: 5,
    deviceStatus: 'online',
  },
  {
    id: '2',
    name: 'Booth A2',
    location: 'Warsaw Central',
    status: 'occupied',
    pricePerHour: 30,
    amenities: ['WiFi', 'Power outlets', 'Monitor'],
    todayBookings: 7,
    deviceStatus: 'online',
  },
  {
    id: '3',
    name: 'Booth B1',
    location: 'Warsaw Central',
    status: 'available',
    pricePerHour: 35,
    amenities: ['WiFi', 'Power outlets', 'Monitor', 'Webcam', 'Whiteboard'],
    todayBookings: 4,
    deviceStatus: 'online',
  },
  {
    id: '4',
    name: 'Booth B2',
    location: 'Warsaw Central',
    status: 'maintenance',
    pricePerHour: 35,
    amenities: ['WiFi', 'Power outlets', 'Monitor', 'Webcam', 'Whiteboard'],
    todayBookings: 0,
    deviceStatus: 'offline',
  },
  {
    id: '5',
    name: 'Booth C1',
    location: 'Krakow Mall',
    status: 'occupied',
    pricePerHour: 25,
    amenities: ['WiFi', 'Power outlets'],
    todayBookings: 6,
    deviceStatus: 'online',
  },
  {
    id: '6',
    name: 'Booth D1',
    location: 'Gdansk Station',
    status: 'available',
    pricePerHour: 28,
    amenities: ['WiFi', 'Power outlets', 'Monitor'],
    todayBookings: 3,
    deviceStatus: 'online',
  },
];

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  offline: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function BoothsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooths = booths.filter(
    (booth) =>
      booth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booth.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header title="Booths" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search booths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Booth
          </Button>
        </div>

        {/* Booths Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooths.map((booth) => (
            <Card key={booth.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {booth.name}
                      {booth.deviceStatus === 'online' ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {booth.location}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      statusColors[booth.status]
                    }`}
                  >
                    {booth.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {booth.pricePerHour} PLN/h
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {booth.todayBookings} bookings today
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {booth.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    View Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
