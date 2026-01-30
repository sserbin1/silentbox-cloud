'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, ReactNode } from 'react';
import { TenantBranding } from '@/types/tenant';

// Tenant Context
interface TenantContextValue {
  tenant: TenantBranding;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

// Auth Context
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Combined Providers
interface ProvidersProps {
  children: ReactNode;
  tenant: TenantBranding;
}

export function Providers({ children, tenant }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  // Load auth from localStorage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={{ tenant }}>
        <AuthContext.Provider
          value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
          }}
        >
          {children}
        </AuthContext.Provider>
      </TenantContext.Provider>
    </QueryClientProvider>
  );
}
