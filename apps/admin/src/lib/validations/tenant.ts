import { z } from 'zod';

/**
 * Tenant validation schemas
 */

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().regex(/^[+]?[\d\s-()]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
});

export const updateTenantSchema = createTenantSchema.partial().extend({
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
