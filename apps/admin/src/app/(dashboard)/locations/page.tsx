'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, MapPin, Box, Edit, Trash2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/use-locations';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function LocationCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
}

const defaultFormData: LocationFormData = {
  name: '',
  address: '',
  city: '',
  lat: '',
  lng: '',
};

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);

  const { data: locations, isLoading, error, refetch } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const filteredLocations = locations?.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        coordinates: {
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0,
        },
      });
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  const handleEditClick = (location: any) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      lat: location.coordinates?.lat?.toString() || '',
      lng: location.coordinates?.lng?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedLocation) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedLocation.id,
        data: {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          coordinates: {
            lat: parseFloat(formData.lat) || 0,
            lng: parseFloat(formData.lng) || 0,
          },
        },
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleDeleteClick = (location: any) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return;
    try {
      await deleteMutation.mutateAsync(selectedLocation.id);
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const LocationForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Warsaw Central"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="e.g., Al. Jerozolimskie 54"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="e.g., Warsaw"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={formData.lat}
            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
            placeholder="52.2297"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={formData.lng}
            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
            placeholder="21.0122"
          />
        </div>
      </div>
    </div>
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Create a new location for your booths.
                </DialogDescription>
              </DialogHeader>
              <LocationForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <LocationCardSkeleton />
              <LocationCardSkeleton />
              <LocationCardSkeleton />
            </>
          ) : error ? (
            <ErrorCard message="Failed to load locations" onRetry={() => refetch()} />
          ) : filteredLocations.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No locations match your search' : 'No locations yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Location
                </Button>
              )}
            </div>
          ) : (
            filteredLocations.map((location) => (
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
                        statusColors[location.status] || statusColors.inactive
                      }`}
                    >
                      {location.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{location.address}</p>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">{location.booths_count || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Booths</p>
                    </div>
                    <div>
                      <span className={`text-lg font-semibold ${
                        location.status === 'active' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {location.status === 'active' ? 'Online' : 'Offline'}
                      </span>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => handleEditClick(location)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Link href={`/booths?locationId=${location.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Booths
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(location)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location details.
            </DialogDescription>
          </DialogHeader>
          <LocationForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
              All booths associated with this location will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
