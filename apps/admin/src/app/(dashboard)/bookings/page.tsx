'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Calendar, Clock, MapPin, MoreHorizontal, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useBookings, useCancelBooking } from '@/hooks/use-bookings';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const filters = ['All', 'Active', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-10" />
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
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

function BookingsContent() {
  const searchParams = useSearchParams();
  const boothIdFilter = searchParams.get('boothId');
  const locationIdFilter = searchParams.get('locationId');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings, isLoading, error, refetch } = useBookings({
    status: activeFilter !== 'All' ? activeFilter.toLowerCase() : undefined,
    locationId: locationIdFilter || undefined,
  });
  const cancelMutation = useCancelBooking();

  const filteredBookings = bookings?.filter((booking) => {
    const userName = booking.users?.full_name || '';
    const userEmail = booking.users?.email || '';
    const boothName = booking.booths?.name || '';
    const locationName = booking.booths?.locations?.name || '';

    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boothName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBoothFilter = !boothIdFilter || booking.booth_id === boothIdFilter;

    return matchesSearch && matchesBoothFilter;
  }) || [];

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    try {
      await cancelMutation.mutateAsync(selectedBooking.id);
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return format(new Date(isoString), 'yyyy-MM-dd');
    } catch {
      return '--';
    }
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    } catch {
      return 0;
    }
  };

  return (
    <>
      <Header title="Bookings" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {(boothIdFilter || locationIdFilter) && (
              <Link href="/bookings">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
              </Link>
            )}
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
            {isLoading ? (
              <TableSkeleton />
            ) : error ? (
              <ErrorCard message="Failed to load bookings" onRetry={() => refetch()} />
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || activeFilter !== 'All'
                    ? 'No bookings match your filters'
                    : 'No bookings yet'}
                </p>
              </div>
            ) : (
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
                    {filteredBookings.map((booking) => {
                      const userName = booking.users?.full_name || 'Unknown';
                      const userEmail = booking.users?.email || '';
                      const boothName = booking.booths?.name || 'Unknown';
                      const locationName = booking.booths?.locations?.name || 'Unknown';
                      const duration = calculateDuration(booking.start_time, booking.end_time);

                      return (
                        <tr key={booking.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{userName}</p>
                              <p className="text-sm text-muted-foreground">{userEmail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{boothName}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {locationName}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(booking.start_time)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{duration} min</td>
                          <td className="px-4 py-3 font-medium">{booking.total_price} PLN</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                statusColors[booking.status] || statusColors.pending
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!['cancelled', 'completed'].includes(booking.status) && (
                                  <DropdownMenuItem
                                    onClick={() => handleCancelClick(booking)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Booking
                                  </DropdownMenuItem>
                                )}
                                {['cancelled', 'completed'].includes(booking.status) && (
                                  <DropdownMenuItem disabled>
                                    No actions available
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? The user will be notified and may receive a refund based on your cancellation policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <BookingsContent />
    </Suspense>
  );
}
