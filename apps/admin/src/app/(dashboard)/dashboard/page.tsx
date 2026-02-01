'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  DollarSign,
  Users,
  Box,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Zap,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDashboardStats, useRecentBookings, useLocationsOverview } from '@/hooks/use-dashboard';
import { useLocationOccupancy } from '@/hooks/use-occupancy';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'status-badge status-badge-success',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'status-badge status-badge-info',
  },
  pending: {
    label: 'Pending',
    className: 'status-badge status-badge-warning',
  },
  completed: {
    label: 'Completed',
    className: 'status-badge status-badge-neutral',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-badge status-badge-error',
  },
};

function StatsCardSkeleton() {
  return (
    <div className="stats-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
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

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: recentBookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useRecentBookings();
  const { data: locations, isLoading: locationsLoading, error: locationsError, refetch: refetchLocations } = useLocationsOverview();
  const { data: locationOccupancy, isLoading: occupancyLoading } = useLocationOccupancy();

  // Calculate occupancy percentage
  const occupancyPercent = stats ? Math.round((stats.occupiedBooths / (stats.totalBooths || 1)) * 100) : 0;

  // Stats cards configuration
  const statsCards = stats ? [
    {
      title: 'Monthly Revenue',
      value: stats.monthlyRevenue.toLocaleString(),
      unit: 'PLN',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings.toString(),
      unit: '',
      change: `+${stats.todayBookings}`,
      trend: 'up' as const,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      unit: '',
      change: '+18%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Booth Occupancy',
      value: occupancyPercent.toString(),
      unit: '%',
      change: `${stats.occupiedBooths}/${stats.totalBooths}`,
      trend: occupancyPercent > 50 ? 'up' as const : 'down' as const,
      icon: Box,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
  ] : [];

  // Today's stats from real data
  const todayStats = stats ? [
    { label: 'Bookings Today', value: stats.todayBookings.toString(), icon: Calendar },
    { label: 'Monthly Revenue', value: `${stats.monthlyRevenue.toLocaleString()} PLN`, icon: DollarSign },
    { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users },
    { label: 'Available Booths', value: `${stats.availableBooths}/${stats.totalBooths}`, icon: Box },
  ] : [];

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : statsError ? (
            <div className="col-span-4">
              <ErrorCard message="Failed to load statistics" onRetry={() => refetchStats()} />
            </div>
          ) : (
            statsCards.map((stat) => (
              <div key={stat.title} className="stats-card group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {stat.value}
                    {stat.unit && <span className="ml-1 text-base font-medium text-muted-foreground">{stat.unit}</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Bookings */}
          <Card className="lg:col-span-4 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
              </div>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View all
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                </div>
              ) : bookingsError ? (
                <ErrorCard message="Failed to load recent bookings" onRetry={() => refetchBookings()} />
              ) : recentBookings && recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.map((booking) => {
                    const userName = booking.users?.full_name || 'Unknown User';
                    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const boothName = booking.booths?.name || 'Unknown Booth';
                    const locationName = booking.booths?.locations?.name || 'Unknown Location';
                    const startTime = new Date(booking.start_time);
                    const endTime = new Date(booking.end_time);
                    const timeRange = `${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50 hover:border-border cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium">{userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {boothName} • {locationName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{timeRange}</p>
                            <span className={statusConfig[booking.status]?.className || statusConfig.pending.className}>
                              {statusConfig[booking.status]?.label || booking.status}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No recent bookings</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Activity */}
          <Card className="lg:col-span-3 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Today's Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : statsError ? (
                <ErrorCard message="Failed to load activity" onRetry={() => refetchStats()} />
              ) : (
                <>
                  {todayStats.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}

                  <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">System Status</span>
                      </div>
                      <span className="status-badge status-badge-success">All Online</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stats?.totalBooths || 0} booths configured across {stats?.totalLocations || 0} locations
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Locations Overview */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <MapPin className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Locations Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Real-time status across all locations</p>
              </div>
            </div>
            <Link href="/locations">
              <Button variant="outline" size="sm">
                Manage Locations
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {locationsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : locationsError ? (
              <ErrorCard message="Failed to load locations" onRetry={() => refetchLocations()} />
            ) : locations && locations.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => {
                  const boothCount = location.booths_count || 0;
                  // Get real occupancy from the occupancy hook
                  const occupancyData = locationOccupancy?.find(o => o.locationId === location.id);
                  const occupancy = occupancyData?.occupancyPercent ?? 0;

                  return (
                    <div
                      key={location.id}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{location.name}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{boothCount} booths</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          location.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {location.status}
                        </span>
                      </div>
                      {/* Occupancy bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Occupancy</span>
                          {occupancyLoading ? (
                            <Skeleton className="h-3 w-8" />
                          ) : (
                            <span className={`font-medium ${
                              occupancy >= 80 ? 'text-red-500' :
                              occupancy >= 50 ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>{occupancy}%</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          {occupancyLoading ? (
                            <Skeleton className="h-full w-full" />
                          ) : (
                            <div
                              className={`h-full rounded-full transition-all ${
                                occupancy >= 80 ? 'bg-red-500' :
                                occupancy >= 50 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancy}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground truncate">{location.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">{location.city}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No locations configured</p>
                <Link href="/locations">
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Location
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
