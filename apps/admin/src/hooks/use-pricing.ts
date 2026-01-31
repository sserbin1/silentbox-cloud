'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi, PricingConfig, Discount, PeakHours, CreditPackage } from '@/lib/api';

export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const response = await pricingApi.get();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pricing');
      }
      return response.data as PricingConfig;
    },
  });
}

// Discount mutations
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Discount, 'id' | 'created_at'>) => {
      const response = await pricingApi.createDiscount(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create discount');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Discount> }) => {
      const response = await pricingApi.updateDiscount(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update discount');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await pricingApi.deleteDiscount(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete discount');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

// Peak Hours mutations
export function useCreatePeakHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PeakHours, 'id'>) => {
      const response = await pricingApi.createPeakHours(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create peak hours');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useUpdatePeakHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PeakHours> }) => {
      const response = await pricingApi.updatePeakHours(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update peak hours');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useDeletePeakHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await pricingApi.deletePeakHours(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete peak hours');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

// Credit Package mutations
export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CreditPackage, 'id'>) => {
      const response = await pricingApi.createPackage(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create package');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreditPackage> }) => {
      const response = await pricingApi.updatePackage(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update package');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await pricingApi.deletePackage(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete package');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });
}
