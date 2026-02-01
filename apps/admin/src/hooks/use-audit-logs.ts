'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  users: { id: string; email: string; full_name: string } | null;
}

export interface AuditLogFilters {
  action?: string;
  resource?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  filters: {
    actions: string[];
    resources: string[];
  };
}

interface AuditLogResponse {
  data: AuditLogItem[];
  meta: AuditLogMeta;
}

/**
 * Hook to fetch audit logs with pagination and filtering
 */
export function useAuditLogs(page: number = 1, filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');

      if (filters?.action) params.set('action', filters.action);
      if (filters?.resource) params.set('resource', filters.resource);
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);

      const response = await adminApi.get<AuditLogResponse>(`/api/admin/audit-logs?${params.toString()}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }

      return response.data;
    },
  });
}

/**
 * Format action name for display
 */
export function formatActionName(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get action color class
 */
export function getActionColor(action: string): string {
  if (action.includes('create') || action.includes('add')) {
    return 'bg-green-500/10 text-green-600';
  }
  if (action.includes('delete') || action.includes('remove')) {
    return 'bg-red-500/10 text-red-600';
  }
  if (action.includes('update') || action.includes('edit')) {
    return 'bg-blue-500/10 text-blue-600';
  }
  if (action.includes('unlock') || action.includes('sync')) {
    return 'bg-purple-500/10 text-purple-600';
  }
  return 'bg-gray-500/10 text-gray-600';
}
