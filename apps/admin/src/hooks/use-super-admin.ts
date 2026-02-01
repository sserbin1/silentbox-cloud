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

// Analytics trends hook
export function useAnalyticsTrends(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['super', 'analytics', 'trends', period],
    queryFn: async () => {
      const response = await superAdminApi.getAnalyticsTrends(period);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch analytics trends');
      }
      return response.data;
    },
    refetchInterval: 60000,
  });
}

// Top tenants hook
export function useTopTenants(limit: number = 5) {
  return useQuery({
    queryKey: ['super', 'analytics', 'top-tenants', limit],
    queryFn: async () => {
      const response = await superAdminApi.getTopTenants(limit);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch top tenants');
      }
      return response.data;
    },
    refetchInterval: 60000,
  });
}

// Billing stats hook
export function useBillingStats() {
  return useQuery({
    queryKey: ['super', 'billing', 'stats'],
    queryFn: async () => {
      const response = await superAdminApi.getBillingStats();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing stats');
      }
      return response.data;
    },
    refetchInterval: 60000,
  });
}

// Invoices hook
export function useInvoices() {
  return useQuery({
    queryKey: ['super', 'billing', 'invoices'],
    queryFn: async () => {
      const response = await superAdminApi.getInvoices();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invoices');
      }
      return response.data;
    },
  });
}

// Create invoice mutation
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tenant_id: string;
      amount: number;
      due_date: string;
      description?: string;
      items: { description: string; quantity: number; unit_price: number }[];
    }) => {
      const response = await superAdminApi.createInvoice(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create invoice');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'billing'] });
    },
  });
}

// Update invoice status mutation
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' }) => {
      const response = await superAdminApi.updateInvoiceStatus(id, status);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update invoice status');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super', 'billing'] });
    },
  });
}

// Subscription plans hook
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['super', 'billing', 'plans'],
    queryFn: async () => {
      const response = await superAdminApi.getSubscriptionPlans();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch subscription plans');
      }
      return response.data;
    },
  });
}

// Tenant activity hook
export function useTenantActivity(tenantId: string) {
  return useQuery({
    queryKey: ['super', 'tenants', tenantId, 'activity'],
    queryFn: async () => {
      const response = await superAdminApi.getTenantActivity(tenantId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant activity');
      }
      return response.data;
    },
    enabled: !!tenantId,
  });
}
