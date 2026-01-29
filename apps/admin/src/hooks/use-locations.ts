'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api';

// Get all locations
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await locationsApi.getAll();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch locations');
      }
      return response.data;
    },
  });
}

// Get single location
export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      const response = await locationsApi.getById(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch location');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Create location mutation
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      city: string;
      coordinates: { lat: number; lng: number };
    }) => {
      const response = await locationsApi.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create location');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// Update location mutation
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      name: string;
      address: string;
      city: string;
      status: string;
      coordinates: { lat: number; lng: number };
    }> }) => {
      const response = await locationsApi.update(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update location');
      }
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations', id] });
    },
  });
}

// Delete location mutation
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await locationsApi.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete location');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
