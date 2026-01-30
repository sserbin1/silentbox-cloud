// ===========================================
// Admin API Client
// ===========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AdminApiClient {
  private token: string | null = null;
  private tenantId: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    // Add tenant header for tenant-scoped routes
    if (this.tenantId && !endpoint.startsWith('/api/super')) {
      (headers as Record<string, string>)['X-Tenant-ID'] = this.tenantId;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      // API returns { success, data } directly - don't double-wrap
      if (typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const adminApi = new AdminApiClient();

// API endpoints
export const dashboardApi = {
  getStats: () => adminApi.get<DashboardStats>('/api/admin/dashboard/stats'),
  getRecentBookings: () => adminApi.get<Booking[]>('/api/admin/dashboard/recent-bookings'),
  getRevenueChart: (period: string) => adminApi.get<RevenueData[]>(`/api/admin/dashboard/revenue?period=${period}`),
};

export const locationsApi = {
  getAll: () => adminApi.get<Location[]>('/api/locations'),
  getById: (id: string) => adminApi.get<Location>(`/api/locations/${id}`),
  create: (data: CreateLocationData) => adminApi.post<Location>('/api/locations', data),
  update: (id: string, data: UpdateLocationData) => adminApi.put<Location>(`/api/locations/${id}`, data),
  delete: (id: string) => adminApi.delete(`/api/locations/${id}`),
};

export const boothsApi = {
  getAll: (locationId?: string) => adminApi.get<Booth[]>(`/api/booths${locationId ? `?locationId=${locationId}` : ''}`),
  getById: (id: string) => adminApi.get<Booth>(`/api/booths/${id}`),
  create: (data: CreateBoothData) => adminApi.post<Booth>('/api/booths', data),
  update: (id: string, data: UpdateBoothData) => adminApi.put<Booth>(`/api/booths/${id}`, data),
  delete: (id: string) => adminApi.delete(`/api/booths/${id}`),
};

export const bookingsApi = {
  getAll: (params?: { status?: string; locationId?: string; date?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return adminApi.get<Booking[]>(`/api/bookings?${searchParams}`);
  },
  getById: (id: string) => adminApi.get<Booking>(`/api/bookings/${id}`),
  cancel: (id: string) => adminApi.post(`/api/bookings/${id}/cancel`, {}),
};

export const usersApi = {
  getAll: () => adminApi.get<User[]>('/api/users'),
  getById: (id: string) => adminApi.get<User>(`/api/users/${id}`),
  update: (id: string, data: UpdateUserData) => adminApi.patch<User>(`/api/users/${id}`, data),
  addCredits: (id: string, amount: number) => adminApi.post(`/api/users/${id}/credits`, { amount }),
};

export const devicesApi = {
  getAll: () => adminApi.get<Device[]>('/api/devices'),
  getById: (id: string) => adminApi.get<Device>(`/api/devices/${id}`),
  unlock: (id: string) => adminApi.post(`/api/devices/${id}/unlock`, {}),
  sync: (id: string) => adminApi.post(`/api/devices/${id}/sync`, {}),
};

// Types
interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  todayBookings: number;
  monthlyRevenue: number;
  totalBooths: number;
  availableBooths: number;
  occupiedBooths: number;
  totalLocations: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  status: string;
  booths_count?: number;
}

interface Booth {
  id: string;
  name: string;
  location_id: string;
  status: string;
  price_per_hour: number;
  amenities: string[];
}

interface Booking {
  id: string;
  user_id: string;
  booth_id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  users?: { full_name: string; email: string };
  booths?: { name: string; locations?: { name: string } };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  credits: number;
  role: string;
  created_at: string;
}

interface Device {
  id: string;
  booth_id: string;
  device_type: string;
  external_id: string;
  status: string;
  battery_level: number;
  last_seen: string;
}

interface CreateLocationData {
  name: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
}

interface UpdateLocationData extends Partial<CreateLocationData> {
  status?: string;
}

interface CreateBoothData {
  name: string;
  location_id: string;
  price_per_hour: number;
  amenities?: string[];
}

interface UpdateBoothData extends Partial<CreateBoothData> {
  status?: string;
}

interface UpdateUserData {
  full_name?: string;
  phone?: string;
  role?: string;
}

// ===========================================
// Super Admin API
// ===========================================

export const superAdminApi = {
  // Tenants
  getTenants: () => adminApi.get<Tenant[]>('/api/super/tenants'),
  getTenant: (id: string) => adminApi.get<Tenant>(`/api/super/tenants/${id}`),
  getTenantStats: (id: string) => adminApi.get<TenantStats>(`/api/super/tenants/${id}/stats`),
  createTenant: (data: CreateTenantData) => adminApi.post<Tenant>('/api/super/tenants', data),
  updateTenant: (id: string, data: UpdateTenantData) => adminApi.put<Tenant>(`/api/super/tenants/${id}`, data),
  activateTenant: (id: string) => adminApi.post(`/api/super/tenants/${id}/activate`, {}),
  suspendTenant: (id: string) => adminApi.post(`/api/super/tenants/${id}/suspend`, {}),
  deleteTenant: (id: string) => adminApi.delete(`/api/super/tenants/${id}`),

  // Platform
  getPlatformStats: () => adminApi.get<PlatformStats>('/api/super/stats/overview'),
  getActivity: () => adminApi.get<PlatformActivity>('/api/super/activity'),

  // Admins
  getSuperAdmins: () => adminApi.get<User[]>('/api/super/admins'),
  promoteToSuperAdmin: (userId: string) => adminApi.post(`/api/super/admins/${userId}/promote`, {}),
  demoteSuperAdmin: (userId: string) => adminApi.post(`/api/super/admins/${userId}/demote`, {}),
};

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  payment_providers: string[];
  default_currency: string;
  default_timezone: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  status: 'active' | 'suspended' | 'pending' | 'trialing';
  subscription_status?: string;
  trial_ends_at?: string;
  billing_email?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  locations_count?: number;
  booths_count?: number;
  users_count?: number;
  created_at: string;
  updated_at: string;
}

interface TenantStats {
  users: number;
  locations: number;
  booths: number;
  bookings: number;
  activeBookings: number;
  revenue: number;
}

interface CreateTenantData {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: Record<string, unknown>;
}

interface UpdateTenantData {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: Record<string, unknown>;
  status?: 'active' | 'suspended' | 'pending';
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  activeSubscriptions: number;
  trialTenants: number;
  newTenantsThisMonth: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalBooths: number;
  mrr: number;
}

interface PlatformActivityItem {
  id: string;
  type: 'tenant_created' | 'subscription_updated' | 'payment_received' | string;
  message: string;
  timestamp: string;
}

type PlatformActivity = PlatformActivityItem[];
