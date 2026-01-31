'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, TenantSettings } from '@/lib/api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsApi.get();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch settings');
      }
      return response.data as TenantSettings;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TenantSettings>) => {
      const response = await settingsApi.update(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update settings');
      }
      return response.data;
    },
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['settings'] });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<TenantSettings>(['settings']);

      // Optimistically update to new value
      if (previousSettings) {
        queryClient.setQueryData<TenantSettings>(['settings'], {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
