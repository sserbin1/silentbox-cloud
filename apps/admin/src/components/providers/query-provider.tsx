'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

// Demo tenant ID - TODO: Replace with proper auth/tenant selection
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

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

  // Initialize tenant ID for API client
  useEffect(() => {
    adminApi.setTenantId(DEMO_TENANT_ID);
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
