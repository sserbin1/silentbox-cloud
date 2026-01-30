// ===========================================
// SILENTBOX CLOUD API - Entry Point
// ===========================================

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';

import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { errorHandler } from './middleware/error.js';

// Import routes
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { locationsRoutes } from './routes/locations.js';
import { boothsRoutes } from './routes/booths.js';
import { bookingsRoutes } from './routes/bookings.js';
import { paymentsRoutes } from './routes/payments.js';
import { accessRoutes } from './routes/access.js';
import { webhookRoutes } from './routes/webhooks/index.js';
import { notificationsRoutes } from './routes/notifications.js';
import { superadminRoutes } from './routes/superadmin.js';
import { adminRoutes } from './routes/admin.js';

// Import socket setup
import { setupSocketServer, SocketEvents } from './socket/index.js';

// Import cron scheduler
import { cronScheduler } from './services/cron.js';

// Create Fastify instance
const app = Fastify({
  logger: logger as any,
});

// Register plugins
await app.register(cors, {
  origin: [
    env.APP_URL,
    env.ADMIN_URL,
    'http://localhost:3000',
    'http://localhost:8081',
    'http://cloud.silent-box.com',
    'https://cloud.silent-box.com',
  ],
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false, // Disable for API
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await app.register(jwt, {
  secret: env.JWT_SECRET,
});

// Global error handler
app.setErrorHandler(errorHandler);

// Tenant middleware for all /api routes
app.addHook('preHandler', tenantMiddleware);

// Register routes
await app.register(healthRoutes, { prefix: '/health' });
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(usersRoutes, { prefix: '/api/users' });
await app.register(locationsRoutes, { prefix: '/api/locations' });
await app.register(boothsRoutes, { prefix: '/api/booths' });
await app.register(bookingsRoutes, { prefix: '/api/bookings' });
await app.register(paymentsRoutes, { prefix: '/api/payments' });
await app.register(accessRoutes, { prefix: '/api/access' });
await app.register(webhookRoutes, { prefix: '/webhooks' });
await app.register(notificationsRoutes, { prefix: '/api/notifications' });
await app.register(superadminRoutes, { prefix: '/api/super' });
await app.register(adminRoutes, { prefix: '/admin' });

// Socket.io setup
const io = setupSocketServer(app.server);
const socketEvents = new SocketEvents(io);

// Make io and socketEvents available globally
app.decorate('io', io);
app.decorate('socketEvents', socketEvents);

// Start server
const start = async () => {
  try {
    // Railway sets PORT, fallback to API_PORT for local dev
    const port = env.PORT || env.API_PORT;
    const address = await app.listen({
      port,
      host: env.API_HOST,
    });
    logger.info(`Server listening at ${address}`);

    // Start cron scheduler after server is ready
    cronScheduler.start();
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    cronScheduler.stop();
    await app.close();
    process.exit(0);
  });
});

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
    socketEvents: SocketEvents;
  }
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
  }
}

export { socketEvents };
