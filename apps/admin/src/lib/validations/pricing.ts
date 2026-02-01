import { z } from 'zod';

/**
 * Pricing validation schemas
 */

// Base discount schema (without refinement for partial support)
const discountBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['percentage', 'fixed'], { required_error: 'Discount type is required' }),
  value: z.number().min(0, 'Value must be positive'),
  min_hours: z.number().min(0).optional(),
  applies_to: z.enum(['all', 'weekdays', 'weekends']).optional().default('all'),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Full discount schema with refinement
export const discountSchema = discountBaseSchema.refine(
  (data) => {
    if (data.type === 'percentage' && data.value > 100) {
      return false;
    }
    return true;
  },
  { message: 'Percentage discount cannot exceed 100%', path: ['value'] }
);

export const createDiscountSchema = discountSchema;
export const updateDiscountSchema = discountBaseSchema.partial();

// Base peak hours schema (without refinement for partial support)
const peakHoursBaseSchema = z.object({
  day_of_week: z.number().min(0, 'Invalid day').max(6, 'Invalid day'),
  start_hour: z.number().min(0, 'Invalid start hour').max(23, 'Invalid start hour'),
  end_hour: z.number().min(0, 'Invalid end hour').max(23, 'Invalid end hour'),
  multiplier: z.number().min(1, 'Multiplier must be at least 1').max(5, 'Multiplier cannot exceed 5x'),
  is_active: z.boolean().default(true),
});

// Full peak hours schema with refinement
export const peakHoursSchema = peakHoursBaseSchema.refine(
  (data) => data.start_hour < data.end_hour,
  { message: 'End hour must be after start hour', path: ['end_hour'] }
);

export const createPeakHoursSchema = peakHoursSchema;
export const updatePeakHoursSchema = peakHoursBaseSchema.partial();

// Credit Package schema
export const creditPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  credits: z.number().int('Credits must be a whole number').min(1, 'Must have at least 1 credit'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('PLN'),
  bonus_credits: z.number().int().min(0).default(0),
  is_popular: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).optional(),
});

export const createCreditPackageSchema = creditPackageSchema;
export const updateCreditPackageSchema = creditPackageSchema.partial();

export type DiscountInput = z.infer<typeof discountSchema>;
export type PeakHoursInput = z.infer<typeof peakHoursSchema>;
export type CreditPackageInput = z.infer<typeof creditPackageSchema>;
