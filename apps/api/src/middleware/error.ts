// ===========================================
// Global Error Handler
// ===========================================

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';
import { ERROR_CODES } from '@silentbox/shared';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log error
  logger.error(
    {
      err: error,
      url: request.url,
      method: request.method,
      tenantId: request.tenantId,
    },
    'Request error'
  );

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.flatten(),
      },
    });
  }

  // JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authorization header required',
      },
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.status(401).send({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Token expired',
      },
    });
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid token',
      },
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
      },
    });
  }

  // Not found errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: error.message || 'Resource not found',
      },
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : error.message || 'An error occurred';

  return reply.status(statusCode).send({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message,
    },
  });
};
