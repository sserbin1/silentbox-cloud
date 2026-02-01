'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, boothsApi } from '@/lib/api';

export interface LocationOccupancy {
  locationId: string;
  occupiedBooths: number;
  totalBooths: number;
  occupancyPercent: number;
}

/**
 * Hook to get real-time booth occupancy aggregated by location.
 * Fetches booth data and calculates occupancy based on current status.
 */
export function useLocationOccupancy() {
  return useQuery({
    queryKey: ['occupancy', 'by-location'],
    queryFn: async () => {
      // Fetch all booths with their current status
      const response = await boothsApi.getAll();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch booth data');
      }

      const booths = response.data;

      // Aggregate by location
      const locationMap = new Map<string, { occupied: number; total: number }>();

      for (const booth of booths) {
        const locationId = booth.location_id;
        if (!locationMap.has(locationId)) {
          locationMap.set(locationId, { occupied: 0, total: 0 });
        }

        const stats = locationMap.get(locationId)!;
        stats.total++;

        // Count occupied booths (status can be 'occupied' or 'in_use')
        if (booth.status === 'occupied' || booth.status === 'in_use') {
          stats.occupied++;
        }
      }

      // Convert to array
      const result: LocationOccupancy[] = Array.from(locationMap.entries()).map(
        ([locationId, stats]) => ({
          locationId,
          occupiedBooths: stats.occupied,
          totalBooths: stats.total,
          occupancyPercent: stats.total > 0
            ? Math.round((stats.occupied / stats.total) * 100)
            : 0,
        })
      );

      return result;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });
}

/**
 * Hook to get detailed booth occupancy analytics (30-day historical data)
 */
export function useBoothOccupancyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'occupancy'],
    queryFn: async () => {
      const response = await analyticsApi.getOccupancy();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch occupancy analytics');
      }

      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
