// ===========================================
// Environment Variables Configuration
// ===========================================

import { z } from 'zod';

const envSchema = z.object({
  // API
  PORT: z.coerce.number().optional(), // Railway sets this
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // TTLock
  TTLOCK_CLIENT_ID: z.string().optional(),
  TTLOCK_CLIENT_SECRET: z.string().optional(),
  TTLOCK_REDIRECT_URI: z.string().optional(),

  // Payments
  P24_MERCHANT_ID: z.string().optional(),
  P24_POS_ID: z.string().optional(),
  P24_API_KEY: z.string().optional(),
  P24_CRC: z.string().optional(),
  P24_SANDBOX: z.coerce.boolean().default(true),
  MONOBANK_TOKEN: z.string().optional(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // Google
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional(),

  // URLs
  APP_URL: z.string().url().default('http://localhost:8081'),
  ADMIN_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Server port - Railway sets PORT, fallback to API_PORT
export const serverPort = env.PORT || env.API_PORT;
