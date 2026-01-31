'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

interface Device {
  id: string;
  booth_id: string;
  device_type: string;
  external_id: string;
  status: string;
  battery_level: number;
  last_seen: string;
  booths?: {
    name: string;
    locations?: {
      name: string;
    };
  };
}

// Get all devices for tenant
export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await adminApi.get<Device[]>('/api/admin/devices');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch devices');
      }
      return response.data;
    },
  });
}

// Get single device
export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      const response = await adminApi.get<Device>(`/api/admin/devices/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch device');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Unlock device
export function useUnlockDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await adminApi.post<{ success: boolean; message: string }>(
        `/api/admin/devices/${deviceId}/unlock`,
        {}
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to unlock device');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

// Lock device
export function useLockDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await adminApi.post<{ success: boolean; message: string }>(
        `/api/admin/devices/${deviceId}/lock`,
        {}
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to lock device');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

// Sync device
export function useSyncDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await adminApi.post<{ success: boolean; message: string }>(
        `/api/admin/devices/${deviceId}/sync`,
        {}
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to sync device');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
