// ===========================================
// Auth Store - Zustand
// ===========================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, usersApi, api } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  credits: number;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantId: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setTenantId: (tenantId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  tenantId: null,

  initialize: async () => {
    try {
      // Check for stored tokens
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const tenantId = await SecureStore.getItemAsync('tenantId');

      if (tenantId) {
        api.setTenantId(tenantId);
        set({ tenantId });
      }

      if (accessToken) {
        // Fetch user profile
        const response = await usersApi.getProfile();

        if (response.success && response.data) {
          set({
            user: {
              id: response.data.id,
              email: response.data.email,
              fullName: response.data.full_name,
              role: response.data.role,
              credits: response.data.credits,
              avatarUrl: response.data.avatar_url,
            },
            isAuthenticated: true,
          });
        } else {
          // Token invalid, clear storage
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        // Store tokens
        await SecureStore.setItemAsync('accessToken', response.data.token);
        await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);

        const user = response.data.user;
        set({
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            credits: user.credits,
          },
          isAuthenticated: true,
        });

        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  register: async (email, password, fullName, phone) => {
    try {
      const response = await authApi.register({ email, password, fullName, phone });

      if (response.success && response.data) {
        // Store tokens
        await SecureStore.setItemAsync('accessToken', response.data.token);
        await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);

        const user = response.data.user;
        set({
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            credits: 0,
          },
          isAuthenticated: true,
        });

        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout API errors
    }

    // Clear stored tokens
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  updateUser: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...data } });
    }
  },

  setTenantId: async (tenantId) => {
    await SecureStore.setItemAsync('tenantId', tenantId);
    api.setTenantId(tenantId);
    set({ tenantId });
  },
}));
