// ===========================================
// SILENTBOX CLOUD - Shared Types
// ===========================================

// Tenant Types
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerEmail: string;
  settings: TenantSettings;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  theme?: {
    primaryColor?: string;
    logo?: string;
  };
  currency: Currency;
  timezone: string;
  languages: string[];
}

export type TenantStatus = 'active' | 'suspended' | 'trial';

// User Types
export interface User {
  id: string;
  tenantId: string;
  authId: string;
  email: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  language: string;
  credits: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'user' | 'operator' | 'admin';

// Location Types
export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  workingHours?: WorkingHours;
  amenities: string[];
  images: string[];
  status: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}

export interface DayHours {
  open: string; // "08:00"
  close: string; // "22:00"
}

export type LocationStatus = 'active' | 'inactive' | 'maintenance';

// Booth Types
export interface Booth {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  capacity: number;
  pricePer15Min: number;
  currency: Currency;
  amenities: string[];
  images: string[];
  ttlockLockId?: string;
  hasGateway: boolean;
  status: BoothStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BoothStatus = 'available' | 'occupied' | 'maintenance';

export const BOOTH_AMENITIES = [
  'wifi',
  'charger',
  'ac',
  'screen',
  'webcam',
  'whiteboard',
  'soundproof',
] as const;

export type BoothAmenity = (typeof BOOTH_AMENITIES)[number];

// Booking Types
export interface Booking {
  id: string;
  tenantId: string;
  userId: string;
  boothId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  totalPrice: number;
  currency: Currency;
  status: BookingStatus;
  accessCode?: string;
  qrCodeData?: string;
  unlockMethod: UnlockMethod;
  googleCalendarEventId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type UnlockMethod = 'bluetooth' | 'remote' | 'pin';

// Transaction Types
export interface Transaction {
  id: string;
  tenantId: string;
  userId: string;
  bookingId?: string;
  idempotencyKey?: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  paymentProvider?: PaymentProvider;
  providerTransactionId?: string;
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type TransactionType = 'credit_purchase' | 'booking_charge' | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentProvider = 'przelewy24' | 'monobank' | 'credits';

// Device Types
export interface Device {
  id: string;
  tenantId: string;
  boothId: string;
  provider: 'ttlock';
  externalId: string;
  gatewayId?: string;
  name?: string;
  batteryLevel?: number;
  lastSeenAt?: Date;
  status: DeviceStatus;
  supportsRemoteUnlock: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type DeviceStatus = 'online' | 'offline' | 'low_battery';

// Access Log Types
export interface AccessLog {
  id: string;
  tenantId: string;
  bookingId: string;
  deviceId?: string;
  action: AccessAction;
  method?: UnlockMethod;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export type AccessAction = 'unlock' | 'lock' | 'code_generated';

// Currency
export type Currency = 'EUR' | 'PLN' | 'UAH';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Geo Types
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoSearchParams extends PaginationParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}
