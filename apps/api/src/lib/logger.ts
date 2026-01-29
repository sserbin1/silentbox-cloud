// ===========================================
// Logger Configuration (Pino)
// ===========================================

import pino from 'pino';
import { env, isDev } from './env.js';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: env.NODE_ENV,
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

// Child logger with tenant context
export const createTenantLogger = (tenantId: string) => {
  return logger.child({ tenantId });
};
