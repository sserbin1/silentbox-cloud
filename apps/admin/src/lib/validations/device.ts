import { z } from 'zod';

/**
 * Device validation schemas
 */

export const lockDeviceSchema = z.object({
  device_id: z.string().uuid('Invalid device ID'),
});

export const deviceActionSchema = z.object({
  action: z.enum(['lock', 'unlock', 'sync']),
});

export type LockDeviceInput = z.infer<typeof lockDeviceSchema>;
export type DeviceActionInput = z.infer<typeof deviceActionSchema>;
