'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boothsApi } from '@/lib/api';

// Get all booths (optionally filtered by location)
export function useBooths(locationId?: string) {
  return useQuery({
    queryKey: ['booths', { locationId }],
    queryFn: async () => {
      const response = await boothsApi.getAll(locationId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch booths');
      }
      return response.data;
    },
  });
}

// Get single booth
export function useBooth(id: string) {
  return useQuery({
    queryKey: ['booths', id],
    queryFn: async () => {
      const response = await boothsApi.getById(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch booth');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Create booth mutation
export function useCreateBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      location_id: string;
      price_per_hour: number;
      amenities?: string[];
    }) => {
      const response = await boothsApi.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create booth');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// Update booth mutation
export function useUpdateBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      name: string;
      location_id: string;
      price_per_hour: number;
      status: string;
      amenities: string[];
    }> }) => {
      const response = await boothsApi.update(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update booth');
      }
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
      queryClient.invalidateQueries({ queryKey: ['booths', id] });
    },
  });
}

// Delete booth mutation
export function useDeleteBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await boothsApi.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete booth');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
