// ===========================================
// API Client for Silentbox Mobile App
// ===========================================

import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || '';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private tenantId: string | null = null;

  constructor(baseUrl: string, tenantId?: string) {
    this.baseUrl = baseUrl;
    if (tenantId) {
      this.tenantId = tenantId;
    }
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    // Handle token refresh if needed
    if (response.status === 401 && data.error?.code === 'TOKEN_EXPIRED') {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the original request
        return this.request<T>(method, path, body);
      }
    }

    return data;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        await SecureStore.setItemAsync('accessToken', data.data.token);
        await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient(API_URL, DEFAULT_TENANT_ID);

// ===========================================
// API Endpoints
// ===========================================

// Auth
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<{ user: any; token: string; refreshToken: string }>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: any; token: string; refreshToken: string }>('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),
};

// Users
export const usersApi = {
  getProfile: () => api.get<any>('/api/users/profile'),
  updateProfile: (data: any) => api.put('/api/users/profile', data),
};

// Locations
export const locationsApi = {
  getAll: (params?: { city?: string; lat?: number; lng?: number; radius?: number }) => {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.lat) query.append('lat', params.lat.toString());
    if (params?.lng) query.append('lng', params.lng.toString());
    if (params?.radius) query.append('radius', params.radius.toString());
    return api.get<any[]>(`/api/locations?${query}`);
  },
  getById: (id: string) => api.get<any>(`/api/locations/${id}`),
};

// Booths
export const boothsApi = {
  getAll: (locationId?: string, status?: string) => {
    const query = new URLSearchParams();
    if (locationId) query.append('locationId', locationId);
    if (status) query.append('status', status);
    return api.get<any[]>(`/api/booths?${query}`);
  },
  getById: (id: string) => api.get<any>(`/api/booths/${id}`),
  getAvailability: (id: string, date: string) =>
    api.get<any>(`/api/booths/${id}/availability?date=${date}`),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get<any[]>(`/api/booths/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5000}`),
};

// Bookings
export const bookingsApi = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get<any[]>(`/api/bookings${query}`);
  },
  getById: (id: string) => api.get<any>(`/api/bookings/${id}`),
  create: (data: { boothId: string; startTime: string; durationMinutes: number }) =>
    api.post<any>('/api/bookings', data),
  extend: (id: string, additionalMinutes: number) =>
    api.post<any>(`/api/bookings/${id}/extend`, { additionalMinutes }),
  cancel: (id: string, reason?: string) =>
    api.post<any>(`/api/bookings/${id}/cancel`, { reason }),
};

// Payments
export const paymentsApi = {
  getPackages: () => api.get<any[]>('/api/payments/packages'),
  purchase: (data: { packageId: string; paymentMethod?: string }) =>
    api.post<{ transactionId: string; paymentUrl: string }>('/api/payments/purchase', data),
  getTransactions: (page?: number) =>
    api.get<any[]>(`/api/payments/transactions?page=${page || 1}`),
};

// Access
export const accessApi = {
  unlock: (bookingId: string) =>
    api.post<{ method: string; bluetoothCredentials?: any }>(`/api/access/unlock/${bookingId}`),
  getCode: (bookingId: string) =>
    api.get<{ accessCode: string; validFrom: string; validUntil: string }>(`/api/access/code/${bookingId}`),
  getHistory: () => api.get<any[]>('/api/access/history'),
};
