// ===========================================
// Socket.io Server Setup
// ===========================================

import { Server as SocketServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
const { verify } = jwt;
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

interface JWTPayload {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
}

interface SocketData {
  userId: string;
  tenantId: string;
  role: string;
}

export function setupSocketServer(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: [env.APP_URL, env.ADMIN_URL, 'http://localhost:3000', 'http://localhost:8081'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // JWT Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verify(token, env.JWT_SECRET) as JWTPayload;

      // Attach user data to socket
      socket.data = {
        userId: payload.sub,
        tenantId: payload.tenant_id,
        role: payload.role,
      } as SocketData;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, tenantId, role } = socket.data as SocketData;

    logger.info({ userId, tenantId, socketId: socket.id }, 'Socket connected');

    // Join tenant room for tenant-specific broadcasts
    socket.join(`tenant:${tenantId}`);

    // Join user room for personal notifications
    socket.join(`user:${userId}`);

    // Operators join operator room
    if (role === 'admin' || role === 'operator') {
      socket.join(`operator:${tenantId}`);
    }

    // Handle booth subscription (for real-time availability)
    socket.on('subscribe:booth', (boothId: string) => {
      socket.join(`booth:${boothId}`);
      logger.debug({ userId, boothId }, 'Subscribed to booth');
    });

    socket.on('unsubscribe:booth', (boothId: string) => {
      socket.leave(`booth:${boothId}`);
      logger.debug({ userId, boothId }, 'Unsubscribed from booth');
    });

    // Handle location subscription
    socket.on('subscribe:location', (locationId: string) => {
      socket.join(`location:${locationId}`);
    });

    socket.on('unsubscribe:location', (locationId: string) => {
      socket.leave(`location:${locationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error({ userId, socketId: socket.id, error }, 'Socket error');
    });
  });

  return io;
}

// ===========================================
// Event Emitters
// ===========================================

export class SocketEvents {
  constructor(private io: SocketServer) {}

  // Emit to all users in a tenant
  emitToTenant(tenantId: string, event: string, data: unknown) {
    this.io.to(`tenant:${tenantId}`).emit(event, data);
  }

  // Emit to a specific user
  emitToUser(userId: string, event: string, data: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all operators in a tenant
  emitToOperators(tenantId: string, event: string, data: unknown) {
    this.io.to(`operator:${tenantId}`).emit(event, data);
  }

  // Emit booth availability update
  emitBoothUpdate(boothId: string, data: { status: string; nextAvailable?: string }) {
    this.io.to(`booth:${boothId}`).emit('booth:update', { boothId, ...data });
  }

  // Emit location availability update
  emitLocationUpdate(locationId: string, data: { availableBooths: number }) {
    this.io.to(`location:${locationId}`).emit('location:update', { locationId, ...data });
  }

  // Emit booking status change
  emitBookingUpdate(userId: string, booking: {
    id: string;
    status: string;
    startTime?: string;
    endTime?: string;
  }) {
    this.emitToUser(userId, 'booking:update', booking);
  }

  // Emit new booking notification to operators
  emitNewBooking(tenantId: string, booking: {
    id: string;
    boothName: string;
    userName: string;
    startTime: string;
  }) {
    this.emitToOperators(tenantId, 'booking:new', booking);
  }

  // Emit device status change
  emitDeviceStatus(tenantId: string, device: {
    id: string;
    status: string;
    batteryLevel?: number;
  }) {
    this.emitToOperators(tenantId, 'device:status', device);
  }
}
