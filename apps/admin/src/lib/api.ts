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

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
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

    // Add CSRF token for mutating requests
    const method = options.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
      }
    }

    // Legacy token support (for transition, will be removed)
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
        credentials: 'include', // Include cookies for httpOnly auth
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for auth errors
        if (response.status === 401) {
          // Token expired or invalid - could trigger refresh here
          return {
            success: false,
            error: data.error?.message || data.error || 'Authentication required',
          };
        }

        return {
          success: false,
          error: data.error?.message || data.error || data.message || 'Request failed',
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

// ===========================================
// Auth API
// ===========================================

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'admin' | 'operator' | 'super_admin';
    tenantId: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
  };
}

export const authApi = {
  login: (data: LoginRequest) =>
    adminApi.post<LoginResponse>('/api/auth/admin/login', data),

  logout: () =>
    adminApi.post<{ success: boolean }>('/api/auth/admin/logout', {}),

  refresh: () =>
    adminApi.post<RefreshResponse>('/api/auth/admin/refresh', {}),

  me: () =>
    adminApi.get<LoginResponse['user']>('/api/auth/admin/me'),
};

// API endpoints
export const dashboardApi = {
  getStats: () => adminApi.get<DashboardStats>('/api/admin/dashboard/stats'),
  getRecentBookings: () => adminApi.get<Booking[]>('/api/admin/dashboard/recent-bookings'),
  getRevenueChart: (period: string) => adminApi.get<RevenueData[]>(`/api/admin/dashboard/revenue?period=${period}`),
};

export const locationsApi = {
  getAll: () => adminApi.get<Location[]>('/api/locations'),
  getById: (id: string) => adminApi.get<Location>(`/api/locations/${id}`),
  create: (data: CreateLocationData) => {
    // Transform coordinates to latitude/longitude for API
    const apiData = {
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng,
    };
    return adminApi.post<Location>('/api/locations', apiData);
  },
  update: (id: string, data: UpdateLocationData) => {
    // Transform coordinates to latitude/longitude for API
    const apiData: Record<string, unknown> = {};
    if (data.name !== undefined) apiData.name = data.name;
    if (data.address !== undefined) apiData.address = data.address;
    if (data.city !== undefined) apiData.city = data.city;
    if (data.status !== undefined) apiData.status = data.status;
    if (data.coordinates) {
      apiData.latitude = data.coordinates.lat;
      apiData.longitude = data.coordinates.lng;
    }
    return adminApi.patch<Location>(`/api/locations/${id}`, apiData);
  },
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
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.locationId) searchParams.set('locationId', params.locationId);
    if (params?.date) searchParams.set('date', params.date);
    const queryString = searchParams.toString();
    return adminApi.get<Booking[]>(`/api/admin/bookings${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => adminApi.get<Booking>(`/api/admin/bookings/${id}`),
  cancel: (id: string) => adminApi.post(`/api/admin/bookings/${id}/cancel`, {}),
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
  unlock: (id: string) => adminApi.post<{ message: string }>(`/api/admin/devices/${id}/unlock`, {}),
  sync: (id: string) => adminApi.post<{ status: string; battery_level: number; last_seen: string }>(`/api/admin/devices/${id}/sync`, {}),
};

// ===========================================
// Settings API
// ===========================================

export interface TenantSettings {
  business_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notifications?: {
    email_booking_confirmation?: boolean;
    email_booking_reminder?: boolean;
    email_booking_cancellation?: boolean;
    sms_booking_confirmation?: boolean;
    sms_booking_reminder?: boolean;
  };
  integrations?: {
    google_calendar_enabled?: boolean;
    ttlock_enabled?: boolean;
    push_notifications_enabled?: boolean;
  };
  pricing?: {
    base_price_per_hour?: number;
    currency?: string;
    min_booking_minutes?: number;
    max_booking_hours?: number;
    grace_period_minutes?: number;
    no_show_penalty_percent?: number;
    free_cancellation_hours?: number;
  };
}

export const settingsApi = {
  get: () => adminApi.get<TenantSettings>('/api/admin/settings'),
  update: (data: Partial<TenantSettings>) => adminApi.patch<{ message: string }>('/api/admin/settings', data),
};

// ===========================================
// Pricing API
// ===========================================

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_hours?: number;
  applies_to?: 'all' | 'weekdays' | 'weekends';
  conditions?: Record<string, unknown>;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface PeakHours {
  id: string;
  day_of_week: number;
  start_time?: string;
  end_time?: string;
  start_hour?: number;
  end_hour?: number;
  multiplier: number;
  is_active?: boolean;
}

export interface CreditPackage {
  id: string;
  name: string;
  description?: string;
  credits: number;
  price: number;
  currency?: string;
  bonus_credits: number;
  is_popular: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface BoothPricing {
  id: string;
  name: string;
  price_per_15min: number;
  currency: string;
}

export interface PricingConfig {
  general: {
    booths: BoothPricing[];
  };
  discounts: Discount[];
  peak_hours: PeakHours[];
  packages: CreditPackage[];
}

export const pricingApi = {
  get: () => adminApi.get<PricingConfig>('/api/admin/pricing'),

  // Discounts
  createDiscount: (data: Omit<Discount, 'id' | 'created_at'>) =>
    adminApi.post<Discount>('/api/admin/pricing/discounts', data),
  updateDiscount: (id: string, data: Partial<Discount>) =>
    adminApi.patch<Discount>(`/api/admin/pricing/discounts/${id}`, data),
  deleteDiscount: (id: string) =>
    adminApi.delete(`/api/admin/pricing/discounts/${id}`),

  // Peak Hours
  createPeakHours: (data: Omit<PeakHours, 'id'>) =>
    adminApi.post<PeakHours>('/api/admin/pricing/peak-hours', data),
  updatePeakHours: (id: string, data: Partial<PeakHours>) =>
    adminApi.patch<PeakHours>(`/api/admin/pricing/peak-hours/${id}`, data),
  deletePeakHours: (id: string) =>
    adminApi.delete(`/api/admin/pricing/peak-hours/${id}`),

  // Credit Packages
  createPackage: (data: Omit<CreditPackage, 'id'>) =>
    adminApi.post<CreditPackage>('/api/admin/pricing/packages', data),
  updatePackage: (id: string, data: Partial<CreditPackage>) =>
    adminApi.patch<CreditPackage>(`/api/admin/pricing/packages/${id}`, data),
  deletePackage: (id: string) =>
    adminApi.delete(`/api/admin/pricing/packages/${id}`),
};

// ===========================================
// Transactions API
// ===========================================

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  credits?: number;
  method?: string;
  payment_provider?: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
  user_email?: string;
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface TransactionsMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary?: {
    total_amount: number;
    count_by_type: Record<string, number>;
  };
}

export interface TransactionsParams {
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
  type?: string;
  search?: string;
}

export const transactionsApi = {
  getAll: (params?: TransactionsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    const queryString = searchParams.toString();
    return adminApi.get<Transaction[]>(`/api/admin/transactions${queryString ? `?${queryString}` : ''}`);
  },
  export: (params?: { date_from?: string; date_to?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('format', 'csv');
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    if (params?.type) searchParams.set('type', params.type);
    return `${API_URL}/api/admin/transactions/export?${searchParams.toString()}`;
  },
};

// ===========================================
// Analytics API
// ===========================================

export interface BookingAnalytics {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface RevenueAnalytics {
  date: string;
  revenue: number;
  count: number;
}

export interface OccupancyAnalytics {
  booth_id: string;
  booth_name: string;
  total_bookings: number;
  total_minutes: number;
  occupancy_rate: number;
}

export const analyticsApi = {
  getBookings: (period: '7d' | '30d' | '90d' = '7d') =>
    adminApi.get<BookingAnalytics[]>(`/api/admin/analytics/bookings?period=${period}`),
  getRevenue: (period: '7d' | '30d' | '90d' = '7d') =>
    adminApi.get<RevenueAnalytics[]>(`/api/admin/analytics/revenue?period=${period}`),
  getOccupancy: () =>
    adminApi.get<OccupancyAnalytics[]>('/api/admin/analytics/occupancy'),
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

  // Analytics
  getAnalyticsTrends: (period: string) => adminApi.get<AnalyticsTrend[]>(`/api/super/analytics/trends?period=${period}`),
  getTopTenants: (limit: number) => adminApi.get<TopTenant[]>(`/api/super/analytics/top-tenants?limit=${limit}`),

  // Billing
  getBillingStats: () => adminApi.get<BillingStats>('/api/super/billing/stats'),

  // Admins
  getSuperAdmins: () => adminApi.get<User[]>('/api/super/admins'),
  promoteToSuperAdmin: (userId: string) => adminApi.post(`/api/super/admins/${userId}/promote`, {}),
  demoteSuperAdmin: (userId: string) => adminApi.post(`/api/super/admins/${userId}/demote`, {}),
};

// Analytics types
export interface AnalyticsTrend {
  date: string;
  bookings: number;
  revenue: number;
  tenants: number;
}

export interface TopTenant {
  id: string;
  name: string;
  slug: string;
  bookings: number;
  revenue: number;
}

export interface BillingStats {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

export interface Tenant {
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
