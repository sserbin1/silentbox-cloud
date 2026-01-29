'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';

interface BookingFilters {
  status?: string;
  locationId?: string;
  boothId?: string;
  date?: string;
}

// Get all bookings with optional filters
export function useBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.locationId) params.locationId = filters.locationId;
      if (filters?.date) params.date = filters.date;
      // Note: boothId filter may need to be handled differently

      const response = await bookingsApi.getAll(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch bookings');
      }
      return response.data;
    },
  });
}

// Get single booking
export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const response = await bookingsApi.getById(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch booking');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Cancel booking mutation
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await bookingsApi.cancel(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel booking');
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
