'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, locationsApi } from '@/lib/api';

// Dashboard stats hook
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Recent bookings hook
export function useRecentBookings() {
  return useQuery({
    queryKey: ['dashboard', 'recent-bookings'],
    queryFn: async () => {
      const response = await dashboardApi.getRecentBookings();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch recent bookings');
      }
      return response.data;
    },
    refetchInterval: 30000,
  });
}

// Revenue chart hook
export function useRevenueChart(period: string = '7d') {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: async () => {
      const response = await dashboardApi.getRevenueChart(period);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch revenue data');
      }
      return response.data;
    },
  });
}

// Locations overview hook
export function useLocationsOverview() {
  return useQuery({
    queryKey: ['locations', 'overview'],
    queryFn: async () => {
      const response = await locationsApi.getAll();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch locations');
      }
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
