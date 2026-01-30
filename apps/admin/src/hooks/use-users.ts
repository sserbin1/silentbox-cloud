'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  credits: number;
  role: string;
  created_at: string;
  avatar_url?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all users for tenant
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await adminApi.get<User[]>('/api/admin/users');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      return response.data;
    },
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await adminApi.get<User>(`/api/admin/users/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Add credits to user
export function useAddCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason?: string }) => {
      const response = await adminApi.post<{ newCredits: number }>(`/api/admin/users/${userId}/credits`, {
        amount,
        reason,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to add credits');
      }
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await adminApi.patch<User>(`/api/admin/users/${id}`, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}
