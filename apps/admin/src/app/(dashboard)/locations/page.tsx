'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Box, MoreVertical, Edit, Trash2 } from 'lucide-react';

const locations = [
  {
    id: '1',
    name: 'Warsaw Central',
    address: 'Al. Jerozolimskie 54, Warsaw',
    city: 'Warsaw',
    status: 'active',
    boothsCount: 6,
    activeBookings: 4,
    revenue: '8,450 PLN',
  },
  {
    id: '2',
    name: 'Krakow Mall',
    address: 'ul. Pawia 5, Krakow',
    city: 'Krakow',
    status: 'active',
    boothsCount: 4,
    activeBookings: 2,
    revenue: '3,200 PLN',
  },
  {
    id: '3',
    name: 'Gdansk Station',
    address: 'ul. Podwale Grodzkie 1, Gdansk',
    city: 'Gdansk',
    status: 'active',
    boothsCount: 2,
    activeBookings: 2,
    revenue: '1,800 PLN',
  },
  {
    id: '4',
    name: 'Wroclaw Business Center',
    address: 'ul. Powstancow Slaskich 2, Wroclaw',
    city: 'Wroclaw',
    status: 'maintenance',
    boothsCount: 3,
    activeBookings: 0,
    revenue: '0 PLN',
  },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header title="Locations" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="group relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {location.city}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[location.status]
                    }`}
                  >
                    {location.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{location.address}</p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">{location.boothsCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Booths</p>
                  </div>
                  <div>
                    <span className="text-lg font-semibold">{location.activeBookings}</span>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-green-600">{location.revenue}</span>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    View Booths
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
