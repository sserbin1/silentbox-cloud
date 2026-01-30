'use client';

import { useQuery } from '@tanstack/react-query';
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
