import { z } from 'zod';

/**
 * Settings validation schemas
 */

export const notificationSettingsSchema = z.object({
  email_booking_confirmation: z.boolean().optional(),
  email_booking_reminder: z.boolean().optional(),
  email_booking_cancellation: z.boolean().optional(),
  sms_booking_confirmation: z.boolean().optional(),
  sms_booking_reminder: z.boolean().optional(),
});

export const integrationSettingsSchema = z.object({
  google_calendar_enabled: z.boolean().optional(),
  ttlock_enabled: z.boolean().optional(),
  push_notifications_enabled: z.boolean().optional(),
});

export const pricingSettingsSchema = z.object({
  base_price_per_hour: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  min_booking_minutes: z.number().int().min(15, 'Minimum is 15 minutes').max(240).optional(),
  max_booking_hours: z.number().int().min(1).max(24, 'Maximum is 24 hours').optional(),
  grace_period_minutes: z.number().int().min(0).max(60).optional(),
  no_show_penalty_percent: z.number().min(0).max(100).optional(),
  free_cancellation_hours: z.number().int().min(0).max(72).optional(),
});

export const tenantSettingsSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100).optional(),
  contact_email: z.string().email('Invalid email address').optional(),
  contact_phone: z.string().regex(/^[+]?[\d\s-()]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  notifications: notificationSettingsSchema.optional(),
  integrations: integrationSettingsSchema.optional(),
  pricing: pricingSettingsSchema.optional(),
});

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>;
export type PricingSettingsInput = z.infer<typeof pricingSettingsSchema>;
