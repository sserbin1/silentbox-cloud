import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'operator' | 'super_admin';
  tenant_id: string | null; // null for super_admin
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Computed helpers
  isSuperAdmin: () => boolean;
  getTenantId: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start as loading until we check auth

      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),

      isSuperAdmin: () => get().user?.role === 'super_admin',

      getTenantId: () => get().user?.tenant_id || null,
    }),
    {
      name: 'silentbox-admin-auth',
      // Only persist user data, not loading state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
