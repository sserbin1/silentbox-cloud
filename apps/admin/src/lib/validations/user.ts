import { z } from 'zod';

/**
 * User validation schemas
 */

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{7,20}$/, 'Invalid phone number format').optional().or(z.literal('')),
  role: z.enum(['user', 'admin', 'operator']).optional(),
});

export const addCreditsSchema = z.object({
  amount: z.number()
    .int('Credits must be a whole number')
    .min(1, 'Amount must be at least 1')
    .max(10000, 'Amount cannot exceed 10,000'),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AddCreditsInput = z.infer<typeof addCreditsSchema>;
