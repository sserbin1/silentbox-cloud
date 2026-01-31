'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, BookingAnalytics, RevenueAnalytics, OccupancyAnalytics } from '@/lib/api';

export function useBookingsAnalytics(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: ['analytics', 'bookings', period],
    queryFn: async () => {
      const response = await analyticsApi.getBookings(period);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch bookings analytics');
      }
      return response.data as BookingAnalytics[];
    },
  });
}

export function useRevenueAnalytics(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: ['analytics', 'revenue', period],
    queryFn: async () => {
      const response = await analyticsApi.getRevenue(period);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch revenue analytics');
      }
      return response.data as RevenueAnalytics[];
    },
  });
}

export function useOccupancyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'occupancy'],
    queryFn: async () => {
      const response = await analyticsApi.getOccupancy();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch occupancy analytics');
      }
      return response.data as OccupancyAnalytics[];
    },
  });
}
