// ===========================================
// Authentication Middleware
// ===========================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { ERROR_CODES } from '@silentbox/shared';

interface JWTPayload {
  sub: string; // user id
  email: string;
  tenant_id: string;
  role: 'user' | 'operator' | 'admin';
  iat: number;
  exp: number;
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = await request.jwtVerify<JWTPayload>();
    request.userId = decoded.sub;

    // Ensure tenant from token matches resolved tenant
    if (request.tenantId && decoded.tenant_id !== request.tenantId) {
      return reply.status(403).send({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Token tenant mismatch',
        },
      });
    }

    // Set tenant from token if not already set
    if (!request.tenantId) {
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
  await authMiddleware(request, reply);

  const decoded = await request.jwtVerify<JWTPayload>();
  if (decoded.role !== 'operator' && decoded.role !== 'admin') {
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
  await authMiddleware(request, reply);

  const decoded = await request.jwtVerify<JWTPayload>();
  if (decoded.role !== 'admin') {
    return reply.status(403).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Admin access required',
      },
    });
  }
};
