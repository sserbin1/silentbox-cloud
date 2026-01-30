const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Base API client for booking portal
 */
async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ==========================================
// Booth API
// ==========================================

export interface Booth {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  description?: string;
  type: 'focus_pod' | 'meeting_room' | 'phone_booth' | 'quiet_zone';
  capacity: number;
  pricePerHour: number;
  currency: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  location?: {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  averageRating?: number;
  reviewCount?: number;
}

export interface BoothFilters {
  locationId?: string;
  type?: string;
  minCapacity?: number;
  maxPrice?: number;
  amenities?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
}

export const boothsApi = {
  list: (tenantSlug: string, filters?: BoothFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Booth[]>(`/api/tenants/${tenantSlug}/booths${query}`);
  },

  getById: (tenantSlug: string, boothId: string) => {
    return apiClient<Booth>(`/api/tenants/${tenantSlug}/booths/${boothId}`);
  },

  checkAvailability: (
    tenantSlug: string,
    boothId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => {
    return apiClient<{ available: boolean; slots: string[] }>(
      `/api/tenants/${tenantSlug}/booths/${boothId}/availability?date=${date}&startTime=${startTime}&endTime=${endTime}`
    );
  },
};

// ==========================================
// Locations API
// ==========================================

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  openingHours?: {
    [day: string]: { open: string; close: string } | null;
  };
  images?: string[];
  boothCount?: number;
}

export const locationsApi = {
  list: (tenantSlug: string) => {
    return apiClient<Location[]>(`/api/tenants/${tenantSlug}/locations`);
  },

  getById: (tenantSlug: string, locationId: string) => {
    return apiClient<Location>(`/api/tenants/${tenantSlug}/locations/${locationId}`);
  },
};

// ==========================================
// Bookings API
// ==========================================

export interface CreateBookingDto {
  boothId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  userId?: string;
  boothId: string;
  tenantId: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  accessCode?: string;
  booth?: Booth;
  createdAt: string;
}

export const bookingsApi = {
  create: (tenantSlug: string, data: CreateBookingDto, token?: string) => {
    return apiClient<Booking>(`/api/tenants/${tenantSlug}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  getById: (tenantSlug: string, bookingId: string, token?: string) => {
    return apiClient<Booking>(`/api/tenants/${tenantSlug}/bookings/${bookingId}`, { token });
  },

  list: (tenantSlug: string, token: string) => {
    return apiClient<Booking[]>(`/api/tenants/${tenantSlug}/bookings/my`, { token });
  },

  cancel: (tenantSlug: string, bookingId: string, token: string) => {
    return apiClient<Booking>(`/api/tenants/${tenantSlug}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      token,
    });
  },
};

// ==========================================
// Auth API
// ==========================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  token: string;
}

export const authApi = {
  login: (tenantSlug: string, data: LoginDto) => {
    return apiClient<AuthResponse>(`/api/tenants/${tenantSlug}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: (tenantSlug: string, data: RegisterDto) => {
    return apiClient<AuthResponse>(`/api/tenants/${tenantSlug}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  me: (tenantSlug: string, token: string) => {
    return apiClient<AuthResponse['user']>(`/api/tenants/${tenantSlug}/auth/me`, { token });
  },
};

// ==========================================
// Reviews API
// ==========================================

export interface Review {
  id: string;
  boothId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export const reviewsApi = {
  list: (tenantSlug: string, boothId: string) => {
    return apiClient<Review[]>(`/api/tenants/${tenantSlug}/booths/${boothId}/reviews`);
  },

  create: (
    tenantSlug: string,
    boothId: string,
    data: { rating: number; comment?: string },
    token: string
  ) => {
    return apiClient<Review>(`/api/tenants/${tenantSlug}/booths/${boothId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },
};
