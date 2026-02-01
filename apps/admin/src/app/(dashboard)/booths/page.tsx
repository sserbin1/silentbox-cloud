'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, MapPin, DollarSign, Edit, Wifi, WifiOff, Trash2, AlertCircle, RefreshCw, Loader2, Box } from 'lucide-react';
import { toast } from 'sonner';
import { useBooths, useCreateBooth, useUpdateBooth, useDeleteBooth } from '@/hooks/use-booths';
import { useLocations } from '@/hooks/use-locations';
import Link from 'next/link';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';

// Form schema with string amenities (converted to array on submit)
const boothFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  location_id: z.string().min(1, 'Location is required'),
  price_per_hour: z.number().min(0, 'Price must be positive').max(10000, 'Price seems too high'),
  amenities: z.string(),
});

type BoothFormInput = z.infer<typeof boothFormSchema>;

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  offline: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function BoothCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
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

interface BoothFormProps {
  defaultValues?: BoothFormInput;
  onSubmit: (data: BoothFormInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  locations: Array<{ id: string; name: string }>;
}

function BoothForm({ defaultValues, onSubmit, onCancel, isSubmitting, submitLabel, locations }: BoothFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BoothFormInput>({
    resolver: zodResolver(boothFormSchema),
    defaultValues: defaultValues || {
      name: '',
      location_id: '',
      price_per_hour: 0,
      amenities: '',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const nameAriaProps = getFieldAriaProps('name', !!errors.name);
  const locationAriaProps = getFieldAriaProps('location_id', !!errors.location_id);
  const priceAriaProps = getFieldAriaProps('price_per_hour', !!errors.price_per_hour);
  const amenitiesAriaProps = getFieldAriaProps('amenities', !!errors.amenities);

  const watchedLocationId = watch('location_id');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Booth A1"
            aria-invalid={nameAriaProps['aria-invalid']}
            aria-describedby={nameAriaProps['aria-describedby']}
          />
          <FormError message={errors.name?.message} id={nameAriaProps.errorId} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Select
            value={watchedLocationId}
            onValueChange={(value) => setValue('location_id', value)}
          >
            <SelectTrigger
              aria-invalid={locationAriaProps['aria-invalid']}
              aria-describedby={locationAriaProps['aria-describedby']}
            >
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={errors.location_id?.message} id={locationAriaProps.errorId} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">Price per Hour (PLN)</Label>
          <Input
            id="price"
            type="number"
            {...register('price_per_hour', { valueAsNumber: true })}
            placeholder="e.g., 30"
            aria-invalid={priceAriaProps['aria-invalid']}
            aria-describedby={priceAriaProps['aria-describedby']}
          />
          <FormError message={errors.price_per_hour?.message} id={priceAriaProps.errorId} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amenities">Amenities (comma-separated)</Label>
          <Input
            id="amenities"
            {...register('amenities')}
            placeholder="e.g., WiFi, Power outlets, Monitor"
            aria-invalid={amenitiesAriaProps['aria-invalid']}
            aria-describedby={amenitiesAriaProps['aria-describedby']}
          />
          <FormError message={errors.amenities?.message} id={amenitiesAriaProps.errorId} />
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

function BoothsContent() {
  const searchParams = useSearchParams();
  const locationIdFilter = searchParams.get('locationId');

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<any>(null);

  const { data: booths, isLoading, error, refetch } = useBooths(locationIdFilter || undefined);
  const { data: locations } = useLocations();
  const createMutation = useCreateBooth();
  const updateMutation = useUpdateBooth();
  const deleteMutation = useDeleteBooth();

  const filteredBooths = booths?.filter(
    (booth) =>
      booth.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getLocationName = (locationId: string) => {
    const location = locations?.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const handleCreateSubmit = async (data: BoothFormInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        location_id: data.location_id,
        price_per_hour: data.price_per_hour,
        amenities: data.amenities.split(',').map(a => a.trim()).filter(Boolean),
      });
      toast.success('Booth created successfully');
      setIsCreateDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create booth');
    }
  };

  const handleEditClick = (booth: any) => {
    setSelectedBooth(booth);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: BoothFormInput) => {
    if (!selectedBooth) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedBooth.id,
        data: {
          name: data.name,
          location_id: data.location_id,
          price_per_hour: data.price_per_hour,
          amenities: data.amenities.split(',').map(a => a.trim()).filter(Boolean),
        },
      });
      toast.success('Booth updated successfully');
      setIsEditDialogOpen(false);
      setSelectedBooth(null);
    } catch (err) {
      toast.error('Failed to update booth');
    }
  };

  const handleDeleteClick = (booth: any) => {
    setSelectedBooth(booth);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBooth) return;
    try {
      await deleteMutation.mutateAsync(selectedBooth.id);
      toast.success('Booth deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedBooth(null);
    } catch (err) {
      toast.error('Failed to delete booth');
    }
  };

  return (
    <>
      <Header title="Booths" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search booths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {locationIdFilter && (
              <Link href="/booths">
                <Button variant="outline" size="sm">
                  Clear Filter
                </Button>
              </Link>
            )}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Booth
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Booth</DialogTitle>
                <DialogDescription>
                  Create a new booth at one of your locations.
                </DialogDescription>
              </DialogHeader>
              <BoothForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsCreateDialogOpen(false)}
                isSubmitting={createMutation.isPending}
                submitLabel="Create"
                locations={locations || []}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Booths Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <BoothCardSkeleton />
              <BoothCardSkeleton />
              <BoothCardSkeleton />
            </>
          ) : error ? (
            <ErrorCard message="Failed to load booths" onRetry={() => refetch()} />
          ) : filteredBooths.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No booths match your search' : 'No booths yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Booth
                </Button>
              )}
            </div>
          ) : (
            filteredBooths.map((booth) => (
              <Card key={booth.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {booth.name}
                        {booth.status === 'available' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : booth.status === 'maintenance' ? (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Wifi className="h-4 w-4 text-blue-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {getLocationName(booth.location_id)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusColors[booth.status] || statusColors.available
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
                      {booth.price_per_hour} PLN/h
                    </div>
                  </div>

                  {booth.amenities && booth.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {booth.amenities.map((amenity: string) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => handleEditClick(booth)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Link href={`/bookings?boothId=${booth.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Bookings
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(booth)}
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
            <DialogTitle>Edit Booth</DialogTitle>
            <DialogDescription>
              Update the booth details.
            </DialogDescription>
          </DialogHeader>
          {selectedBooth && (
            <BoothForm
              defaultValues={{
                name: selectedBooth.name,
                location_id: selectedBooth.location_id,
                price_per_hour: selectedBooth.price_per_hour || 0,
                amenities: selectedBooth.amenities?.join(', ') || '',
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={updateMutation.isPending}
              submitLabel="Save Changes"
              locations={locations || []}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booth</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBooth?.name}"? This action cannot be undone.
              All bookings associated with this booth will also be affected.
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

export default function BoothsPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BoothCardSkeleton />
          <BoothCardSkeleton />
          <BoothCardSkeleton />
        </div>
      </div>
    }>
      <BoothsContent />
    </Suspense>
  );
}
