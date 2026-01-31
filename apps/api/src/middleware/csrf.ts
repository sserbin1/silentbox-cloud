// ===========================================
// CSRF Protection Middleware
// ===========================================
// Uses Double Submit Cookie pattern:
// - CSRF token set as non-httpOnly cookie (JS-readable)
// - Client must send token in X-CSRF-Token header
// - Middleware validates header matches cookie

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger.js';

/**
 * CSRF validation middleware
 * Apply to all mutating endpoints (POST, PUT, PATCH, DELETE)
 *
 * Validates that:
 * 1. csrf_token cookie exists
 * 2. X-CSRF-Token header exists
 * 3. Header value matches cookie value
 */
export const csrfMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // Skip CSRF for:
  // - GET, HEAD, OPTIONS requests (safe methods)
  // - Webhook endpoints (use signature validation instead)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  // Skip CSRF for webhook routes (they use their own validation)
  if (request.url.startsWith('/webhooks')) {
    return;
  }

  // Get CSRF token from cookie
  const csrfCookie = request.cookies?.csrf_token;

  // Get CSRF token from header
  const csrfHeader = request.headers['x-csrf-token'] as string | undefined;

  // Both must exist
  if (!csrfCookie) {
    logger.warn(
      { ip: request.ip, url: request.url, method },
      'CSRF validation failed: missing csrf_token cookie'
    );
    return reply.status(403).send({
      success: false,
      error: {
        code: 'CSRF_MISSING_COOKIE',
        message: 'CSRF token cookie missing. Please log in again.',
      },
    });
  }

  if (!csrfHeader) {
    logger.warn(
      { ip: request.ip, url: request.url, method },
      'CSRF validation failed: missing X-CSRF-Token header'
    );
    return reply.status(403).send({
      success: false,
      error: {
        code: 'CSRF_MISSING_HEADER',
        message: 'CSRF token header missing. Include X-CSRF-Token header in request.',
      },
    });
  }

  // Validate token matches
  if (csrfCookie !== csrfHeader) {
    logger.warn(
      { ip: request.ip, url: request.url, method },
      'CSRF validation failed: token mismatch'
    );
    return reply.status(403).send({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token invalid. Please log in again.',
      },
    });
  }

  // CSRF validation passed
};

/**
 * Helper to check if CSRF should be skipped for a route
 * Use this if you need custom skip logic
 */
export const shouldSkipCsrf = (request: FastifyRequest): boolean => {
  const method = request.method.toUpperCase();

  // Safe methods don't need CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Webhook routes use signature validation
  if (request.url.startsWith('/webhooks')) {
    return true;
  }

  // Public auth endpoints (login doesn't have CSRF yet)
  if (request.url.includes('/auth/admin/login')) {
    return true;
  }

  return false;
};
