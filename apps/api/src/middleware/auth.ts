// ===========================================
// Authentication Middleware
// ===========================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { ERROR_CODES } from '@silentbox/shared';
import * as jose from 'jose';
import { env } from '../lib/env.js';

interface JWTPayload {
  sub: string; // user id
  email: string;
  tenant_id: string | null; // null for super_admin
  role: 'user' | 'operator' | 'admin' | 'super_admin';
  iat: number;
  exp: number;
}

// Extend FastifyRequest to include user info
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: string;
    tenantId?: string;
  }
}

/**
 * Extract JWT token from request
 * Priority: 1. access_token cookie, 2. Authorization Bearer header
 */
const extractToken = (request: FastifyRequest): string | null => {
  // Try cookie first (httpOnly cookie from admin auth)
  const cookieToken = request.cookies?.access_token;
  if (cookieToken) {
    request.log.debug({ hasCookie: true }, 'Token from cookie');
    return cookieToken;
  }

  // Fall back to Authorization header
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    request.log.debug({ hasAuthHeader: true }, 'Token from auth header');
    return authHeader.substring(7);
  }

  request.log.debug({ cookies: Object.keys(request.cookies || {}), hasAuthHeader: !!authHeader }, 'No token found');
  return null;
};

/**
 * Verify JWT token using jose (edge-compatible)
 */
const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
};

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Extract token from cookie or header
    const token = extractToken(request);

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }

    // Verify token
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.sub) {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or expired token',
        },
      });
    }

    // Set user info on request
    request.userId = decoded.sub;
    request.userRole = decoded.role;

    // Super admins can have null tenant_id
    if (decoded.role === 'super_admin') {
      // Super admin doesn't need tenant validation
      return;
    }

    // Ensure tenant from token matches resolved tenant (for non-super-admins)
    if (request.tenantId && decoded.tenant_id && decoded.tenant_id !== request.tenantId) {
      return reply.status(403).send({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Token tenant mismatch',
        },
      });
    }

    // Set tenant from token if not already set
    if (!request.tenantId && decoded.tenant_id) {
      request.tenantId = decoded.tenant_id;
    }
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid or expired token',
      },
    });
  }
};

// Middleware for operator/admin only routes
export const operatorMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // First run auth middleware to set user info
  const authResult = await authMiddleware(request, reply);

  // If authMiddleware already sent a response (error), stop here
  if (reply.sent) return;

  // Check role
  const role = request.userRole;
  if (role !== 'operator' && role !== 'admin' && role !== 'super_admin') {
    return reply.status(403).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Operator or admin access required',
      },
    });
  }
};

// Middleware for admin only routes
export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // First run auth middleware to set user info
  const authResult = await authMiddleware(request, reply);

  // If authMiddleware already sent a response (error), stop here
  if (reply.sent) return;

  // Check role - admin or super_admin
  const role = request.userRole;
  if (role !== 'admin' && role !== 'super_admin') {
    return reply.status(403).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Admin access required',
      },
    });
  }
};

// Middleware for super admin only routes
export const superAdminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // First run auth middleware to set user info
  const authResult = await authMiddleware(request, reply);

  // If authMiddleware already sent a response (error), stop here
  if (reply.sent) return;

  // Check role - must be super_admin
  const role = request.userRole;
  if (role !== 'super_admin') {
    return reply.status(403).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Super admin access required',
      },
    });
  }
};
