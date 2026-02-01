'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { toast } from 'sonner';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/use-locations';
import Link from 'next/link';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';
import { createLocationSchema, type CreateLocationInput } from '@/lib/validations/location';

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

interface LocationFormProps {
  defaultValues?: CreateLocationInput;
  onSubmit: (data: CreateLocationInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function LocationForm({ defaultValues, onSubmit, onCancel, isSubmitting, submitLabel }: LocationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateLocationInput>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: defaultValues || {
      name: '',
      address: '',
      city: '',
      coordinates: { lat: 0, lng: 0 },
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const nameAriaProps = getFieldAriaProps('name', !!errors.name);
  const addressAriaProps = getFieldAriaProps('address', !!errors.address);
  const cityAriaProps = getFieldAriaProps('city', !!errors.city);
  const latAriaProps = getFieldAriaProps('lat', !!errors.coordinates?.lat);
  const lngAriaProps = getFieldAriaProps('lng', !!errors.coordinates?.lng);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Warsaw Central"
            aria-invalid={nameAriaProps['aria-invalid']}
            aria-describedby={nameAriaProps['aria-describedby']}
          />
          <FormError message={errors.name?.message} id={nameAriaProps.errorId} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="e.g., Al. Jerozolimskie 54"
            aria-invalid={addressAriaProps['aria-invalid']}
            aria-describedby={addressAriaProps['aria-describedby']}
          />
          <FormError message={errors.address?.message} id={addressAriaProps.errorId} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="e.g., Warsaw"
            aria-invalid={cityAriaProps['aria-invalid']}
            aria-describedby={cityAriaProps['aria-describedby']}
          />
          <FormError message={errors.city?.message} id={cityAriaProps.errorId} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              {...register('coordinates.lat', { valueAsNumber: true })}
              placeholder="52.2297"
              aria-invalid={latAriaProps['aria-invalid']}
              aria-describedby={latAriaProps['aria-describedby']}
            />
            <FormError message={errors.coordinates?.lat?.message} id={latAriaProps.errorId} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              {...register('coordinates.lng', { valueAsNumber: true })}
              placeholder="21.0122"
              aria-invalid={lngAriaProps['aria-invalid']}
              aria-describedby={lngAriaProps['aria-describedby']}
            />
            <FormError message={errors.coordinates?.lng?.message} id={lngAriaProps.errorId} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const { data: locations, isLoading, error, refetch } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const filteredLocations = locations?.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateSubmit = async (data: CreateLocationInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Location created successfully');
      setIsCreateDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create location');
    }
  };

  const handleEditClick = (location: any) => {
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: CreateLocationInput) => {
    if (!selectedLocation) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedLocation.id,
        data,
      });
      toast.success('Location updated successfully');
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
    } catch (err) {
      toast.error('Failed to update location');
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
      toast.success('Location deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
    } catch (err) {
      toast.error('Failed to delete location');
    }
  };

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
              <LocationForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsCreateDialogOpen(false)}
                isSubmitting={createMutation.isPending}
                submitLabel="Create"
              />
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
          {selectedLocation && (
            <LocationForm
              defaultValues={{
                name: selectedLocation.name,
                address: selectedLocation.address,
                city: selectedLocation.city,
                coordinates: selectedLocation.coordinates || { lat: 0, lng: 0 },
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
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
