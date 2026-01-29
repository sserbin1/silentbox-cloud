'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  DollarSign,
  Users,
  Box,
  TrendingUp,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Zap,
  MoreHorizontal,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '12,450',
    unit: 'PLN',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Active Bookings',
    value: '24',
    unit: '',
    change: '+4',
    trend: 'up',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Total Users',
    value: '1,234',
    unit: '',
    change: '+18%',
    trend: 'up',
    icon: Users,
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
  },
  {
    title: 'Booth Occupancy',
    value: '67',
    unit: '%',
    change: '-5%',
    trend: 'down',
    icon: Box,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
];

const recentBookings = [
  {
    id: '1',
    user: 'Jan Kowalski',
    avatar: 'JK',
    booth: 'Booth A1',
    location: 'Warsaw Central',
    time: '14:00 - 15:30',
    status: 'active',
  },
  {
    id: '2',
    user: 'Anna Nowak',
    avatar: 'AN',
    booth: 'Booth B2',
    location: 'Warsaw Central',
    time: '15:00 - 16:00',
    status: 'confirmed',
  },
  {
    id: '3',
    user: 'Piotr Wisniewski',
    avatar: 'PW',
    booth: 'Booth C1',
    location: 'Krakow Mall',
    time: '16:00 - 18:00',
    status: 'pending',
  },
  {
    id: '4',
    user: 'Maria Lewandowska',
    avatar: 'ML',
    booth: 'Booth A2',
    location: 'Warsaw Central',
    time: '17:30 - 18:30',
    status: 'confirmed',
  },
];

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

const todayStats = [
  { label: 'Bookings Today', value: '32', icon: Calendar },
  { label: 'Revenue Today', value: '1,240 PLN', icon: DollarSign },
  { label: 'New Users', value: '8', icon: Users },
  { label: 'Avg. Session', value: '1h 24m', icon: Clock },
];

const locations = [
  { name: 'Warsaw Central', booths: 6, occupancy: 83, status: 'high' },
  { name: 'Krakow Mall', booths: 4, occupancy: 50, status: 'medium' },
  { name: 'Gdansk Station', booths: 2, occupancy: 100, status: 'full' },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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
          ))}
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
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50 hover:border-border cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {booking.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{booking.user}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.booth} • {booking.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{booking.time}</p>
                        <span className={statusConfig[booking.status].className}>
                          {statusConfig[booking.status].label}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  All 12 devices are connected and functioning normally
                </p>
              </div>
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
                <p className="text-sm text-muted-foreground">Real-time occupancy across all locations</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage Locations
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div
                  key={location.name}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{location.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{location.booths} booths</p>
                    </div>
                    <span className={`text-2xl font-bold ${
                      location.occupancy >= 80 ? 'text-emerald-600' :
                      location.occupancy >= 50 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {location.occupancy}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          location.occupancy >= 80 ? 'bg-emerald-500' :
                          location.occupancy >= 50 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${location.occupancy}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Occupancy</span>
                      <span>{Math.round(location.booths * location.occupancy / 100)}/{location.booths} occupied</span>
                    </div>
                  </div>
                  {location.status === 'full' && (
                    <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-emerald-500/10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
