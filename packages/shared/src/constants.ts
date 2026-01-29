// ===========================================
// SILENTBOX CLOUD - Constants
// ===========================================

// Booking
export const MIN_BOOKING_DURATION_MINUTES = 15;
export const MAX_BOOKING_DURATION_HOURS = 8;
export const BOOKING_SLOT_INTERVAL_MINUTES = 15;

// Pricing
export const DEFAULT_CURRENCY = 'EUR' as const;
export const SUPPORTED_CURRENCIES = ['EUR', 'PLN', 'UAH'] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Geo
export const DEFAULT_SEARCH_RADIUS_KM = 10;
export const MAX_SEARCH_RADIUS_KM = 100;

// TTLock
export const TTLOCK_API_BASE_URL = 'https://euapi.ttlock.com/v3';
export const TTLOCK_PASSCODE_LENGTH = 6;
export const TTLOCK_PASSCODE_TTL_BUFFER_MINUTES = 5; // Extra time before/after booking

// Payments
export const P24_API_URL = 'https://secure.przelewy24.pl/api/v1';
export const P24_SANDBOX_URL = 'https://sandbox.przelewy24.pl/api/v1';
export const MONOBANK_API_URL = 'https://api.monobank.ua/api/merchant';

// Credits
export const CREDIT_PACKAGES = [
  { amount: 10, currency: 'EUR', bonus: 0 },
  { amount: 25, currency: 'EUR', bonus: 2 },
  { amount: 50, currency: 'EUR', bonus: 5 },
  { amount: 100, currency: 'EUR', bonus: 15 },
] as const;

// Languages
export const SUPPORTED_LANGUAGES = ['en', 'pl', 'uk'] as const;
export const DEFAULT_LANGUAGE = 'en' as const;

// Timezones
export const DEFAULT_TIMEZONE = 'UTC';

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;

// JWT
export const JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

// WebSocket
export const WS_HEARTBEAT_INTERVAL_MS = 30 * 1000;
export const WS_RECONNECT_DELAY_MS = 5 * 1000;

// Push Notifications
export const PUSH_BOOKING_REMINDER_MINUTES = [60, 15]; // 1 hour and 15 min before
export const PUSH_SESSION_ENDING_MINUTES = 5; // 5 min before session ends

// Error Codes
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  UNAUTHORIZED: 'AUTH_003',

  // Tenant
  TENANT_NOT_FOUND: 'TENANT_001',
  TENANT_SUSPENDED: 'TENANT_002',

  // Booking
  SLOT_NOT_AVAILABLE: 'BOOKING_001',
  INSUFFICIENT_CREDITS: 'BOOKING_002',
  BOOKING_NOT_FOUND: 'BOOKING_003',
  BOOKING_CANNOT_CANCEL: 'BOOKING_004',
  BOOKING_ALREADY_ACTIVE: 'BOOKING_005',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_001',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_002',

  // IoT
  LOCK_NOT_FOUND: 'IOT_001',
  UNLOCK_FAILED: 'IOT_002',
  GATEWAY_OFFLINE: 'IOT_003',
  DEVICE_NOT_FOUND: 'IOT_004',

  // Access
  ACCESS_DENIED: 'ACCESS_001',

  // General
  VALIDATION_ERROR: 'VALIDATION_001',
  NOT_FOUND: 'NOT_FOUND_001',
  INTERNAL_ERROR: 'INTERNAL_001',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_001',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
