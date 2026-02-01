import { z } from 'zod';

/**
 * Booth validation schemas
 */

export const createBoothSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  location_id: z.string().uuid('Invalid location ID'),
  price_per_hour: z.number().min(0, 'Price must be positive').max(10000, 'Price seems too high'),
  amenities: z.array(z.string()).optional().default([]),
});

export const updateBoothSchema = createBoothSchema.partial().extend({
  status: z.enum(['available', 'occupied', 'maintenance', 'inactive']).optional(),
});

export type CreateBoothInput = z.infer<typeof createBoothSchema>;
export type UpdateBoothInput = z.infer<typeof updateBoothSchema>;
