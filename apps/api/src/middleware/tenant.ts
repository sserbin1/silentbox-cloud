// ===========================================
// Tenant Resolution Middleware
// ===========================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { ERROR_CODES } from '@silentbox/shared';

// Routes that skip tenant verification (but still resolve tenant if provided)
const PUBLIC_ROUTES = [
  '/health',
  '/webhooks',
];

// Auth routes that need tenant context but don't require it for access
const AUTH_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/oauth',
];

// Super admin routes (platform-level, no tenant)
const SUPER_ADMIN_ROUTES = ['/api/super'];

// Admin routes (have their own auth, get tenant from JWT)
const ADMIN_ROUTES = ['/api/admin'];

export const tenantMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const path = request.url.split('?')[0];

  // Skip tenant resolution entirely for public routes
  if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
    return;
  }

  // Skip for super admin routes (handled separately)
  if (SUPER_ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return;
  }

  // Skip for admin routes (they have their own JWT-based auth)
  if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    return;
  }

  // Check if this is an auth route (needs tenant but doesn't require it)
  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

  // Try to get tenant from multiple sources (in order of priority)
  let tenantId: string | undefined;
  let tenantSlug: string | undefined;

  // 1. From JWT token (if authenticated)
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = request.server.jwt.decode<{ tenant_id?: string }>(token);
      tenantId = decoded?.tenant_id;
    } catch {
      // Token decode failed, continue to other methods
    }
  }

  // 2. From X-Tenant-ID header
  if (!tenantId) {
    tenantId = request.headers['x-tenant-id'] as string;
  }

  // 3. From X-Tenant-Slug header (resolve to ID)
  if (!tenantId) {
    tenantSlug = request.headers['x-tenant-slug'] as string;
    if (tenantSlug) {
      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('id, status')
        .eq('slug', tenantSlug)
        .single();

      if (error || !tenant) {
        return reply.status(404).send({
          success: false,
          error: {
            code: ERROR_CODES.TENANT_NOT_FOUND,
            message: `Tenant not found: ${tenantSlug}`,
          },
        });
      }

      if (tenant.status === 'suspended') {
        return reply.status(403).send({
          success: false,
          error: {
            code: ERROR_CODES.TENANT_SUSPENDED,
            message: 'Tenant is suspended',
          },
        });
      }

      tenantId = tenant.id;
    }
  }

  // 4. From subdomain (e.g., my-network.silentbox.cloud)
  if (!tenantId) {
    const host = request.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'api' && subdomain !== 'www' && subdomain !== 'localhost') {
      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('id, status')
        .eq('slug', subdomain)
        .single();

      if (!error && tenant) {
        if (tenant.status === 'suspended') {
          return reply.status(403).send({
            success: false,
            error: {
              code: ERROR_CODES.TENANT_SUSPENDED,
              message: 'Tenant is suspended',
            },
          });
        }
        tenantId = tenant.id;
      }
    }
  }

  // If no tenant found, handle based on route type
  if (!tenantId) {
    // Auth routes can proceed without tenant (the route handler will validate)
    if (isAuthRoute) {
      logger.debug({ path }, 'Auth route without tenant context');
      return;
    }

    logger.warn({ path, headers: request.headers }, 'Tenant not resolved');
    return reply.status(400).send({
      success: false,
      error: {
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant identification required. Provide X-Tenant-ID or X-Tenant-Slug header.',
      },
    });
  }

  // Verify tenant exists and is active
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, status')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    return reply.status(404).send({
      success: false,
      error: {
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant not found',
      },
    });
  }

  if (tenant.status === 'suspended') {
    return reply.status(403).send({
      success: false,
      error: {
        code: ERROR_CODES.TENANT_SUSPENDED,
        message: 'Tenant is suspended',
      },
    });
  }

  // Set tenant context on request
  request.tenantId = tenantId;

  logger.debug({ tenantId, tenantSlug: tenant.slug, path }, 'Tenant resolved');
};
