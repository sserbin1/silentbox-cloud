'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Get tenant_id from auth store
  const tenantId = useAuthStore((state) => state.user?.tenant_id);
  const isSuperAdmin = useAuthStore((state) => state.user?.role === 'super_admin');

  // Update API client tenant ID when user changes
  useEffect(() => {
    if (tenantId) {
      adminApi.setTenantId(tenantId);
    } else if (isSuperAdmin) {
      // Super admins don't have a default tenant
      // They will need to select one from the UI for tenant-scoped operations
      adminApi.setTenantId(null);
    }
  }, [tenantId, isSuperAdmin]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
