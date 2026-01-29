// ===========================================
// SILENTBOX CLOUD - Zod Validation Schemas
// ===========================================

import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['en', 'pl', 'uk']).optional(),
});

// Location Schemas
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().default('UTC'),
  workingHours: z
    .object({
      mon: z.object({ open: z.string(), close: z.string() }).optional(),
      tue: z.object({ open: z.string(), close: z.string() }).optional(),
      wed: z.object({ open: z.string(), close: z.string() }).optional(),
      thu: z.object({ open: z.string(), close: z.string() }).optional(),
      fri: z.object({ open: z.string(), close: z.string() }).optional(),
      sat: z.object({ open: z.string(), close: z.string() }).optional(),
      sun: z.object({ open: z.string(), close: z.string() }).optional(),
    })
    .optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
});

export const updateLocationSchema = createLocationSchema.partial();

// Booth Schemas
export const createBoothSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().min(1).default(1),
  pricePer15Min: z.number().positive('Price must be positive'),
  currency: z.enum(['EUR', 'PLN', 'UAH']).default('EUR'),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  ttlockLockId: z.string().optional(),
  hasGateway: z.boolean().default(false),
});

export const updateBoothSchema = createBoothSchema.partial().omit({ locationId: true });

// Booking Schemas
export const createBookingSchema = z.object({
  boothId: z.string().uuid(),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).multipleOf(15),
});

export const extendBookingSchema = z.object({
  additionalMinutes: z.number().int().min(15).multipleOf(15),
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

// Payment Schemas
export const purchaseCreditsSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['EUR', 'PLN', 'UAH']),
  paymentProvider: z.enum(['przelewy24', 'monobank']),
  returnUrl: z.string().url().optional(),
});

// Search/Filter Schemas
export const geoSearchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().positive().default(10),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const boothFilterSchema = z.object({
  locationId: z.string().uuid().optional(),
  minCapacity: z.number().int().min(1).optional(),
  maxPrice: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const availabilityQuerySchema = z.object({
  boothId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

// Tenant Schemas
export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  name: z.string().min(1, 'Name is required'),
  ownerEmail: z.string().email('Invalid email address'),
  settings: z
    .object({
      currency: z.enum(['EUR', 'PLN', 'UAH']).default('EUR'),
      timezone: z.string().default('UTC'),
      languages: z.array(z.string()).default(['en']),
    })
    .optional(),
});

export const updateTenantSchema = createTenantSchema.partial().omit({ slug: true });

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateBoothInput = z.infer<typeof createBoothSchema>;
export type UpdateBoothInput = z.infer<typeof updateBoothSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;
export type GeoSearchInput = z.infer<typeof geoSearchSchema>;
export type BoothFilterInput = z.infer<typeof boothFilterSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
