'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';

// Platform stats hook
export function usePlatformStats() {
  return useQuery({
    queryKey: ['super', 'stats'],
    queryFn: async () => {
      const response = await superAdminApi.getPlatformStats();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch platform stats');
      }
      return response.data;
    },
    refetchInterval: 60000,
  });
}

// Platform activity hook
export function usePlatformActivity() {
  return useQuery({
    queryKey: ['super', 'activity'],
    queryFn: async () => {
      const response = await superAdminApi.getActivity();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch activity');
      }
      return response.data;
    },
    refetchInterval: 30000,
  });
}

// Tenants list hook
export function useTenants() {
  return useQuery({
    queryKey: ['super', 'tenants'],
    queryFn: async () => {
      const response = await superAdminApi.getTenants();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenants');
      }
      return response.data;
    },
  });
}

// Single tenant hook
export function useTenant(id: string) {
  return useQuery({
    queryKey: ['super', 'tenants', id],
    queryFn: async () => {
      const response = await superAdminApi.getTenant(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Tenant stats hook
export function useTenantStats(id: string) {
  return useQuery({
    queryKey: ['super', 'tenants', id, 'stats'],
    queryFn: async () => {
      const response = await superAdminApi.getTenantStats(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant stats');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Create tenant mutation
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      contactEmail: string;
      contactPhone?: string;
      address?: string;
      city?: string;
      country?: string;
    }) => {
      const response = await superAdminApi.createTenant(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super', 'stats'] });
    },
  });
}

// Update tenant mutation
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: {
        name?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        city?: string;
        country?: string;
        status?: 'active' | 'suspended' | 'pending';
      };
    }) => {
      const response = await superAdminApi.updateTenant(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update tenant');
      }
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants', id] });
    },
  });
}

// Activate tenant mutation
export function useActivateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await superAdminApi.activateTenant(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to activate tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
    },
  });
}

// Suspend tenant mutation
export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await superAdminApi.suspendTenant(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to suspend tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
    },
  });
}

// Delete tenant mutation
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await superAdminApi.deleteTenant(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super', 'stats'] });
    },
  });
}
