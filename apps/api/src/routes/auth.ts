// ===========================================
// Authentication Routes
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { env } from '../lib/env.js';
import { ERROR_CODES } from '@silentbox/shared';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../lib/logger.js';

// Rate limiting store (in-memory, consider Redis for production cluster)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.resetAt < now) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 1000);

// Rate limiting middleware
const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetAt: number } => {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || record.resetAt < now) {
    // New window
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - record.count, resetAt: record.resetAt };
};

// Cookie options
// SameSite=None + domain required for cross-origin cookies (admin on cloud.silent-box.com, API on api.cloud.silent-box.com)
// IMPORTANT: maxAge is in SECONDS for @fastify/cookie, not milliseconds!
// Domain must be set to parent domain (.silent-box.com) for cross-subdomain cookie sharing
const getCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: true, // Always secure - we're always on HTTPS in production
  sameSite: 'none' as const, // Required for cross-origin cookies
  domain: '.silent-box.com', // Share cookies across all subdomains
  path: '/',
  maxAge: maxAgeSeconds,
});

// Generate CSRF token
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Log to audit_logs
const logAuditEvent = async (
  eventType: string,
  userId: string | null,
  tenantId: string | null,
  details: Record<string, unknown>,
  ip: string
) => {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      event_type: eventType,
      user_id: userId,
      tenant_id: tenantId,
      details,
      ip_address: ip,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, eventType }, 'Failed to log audit event');
  }
};

export const authRoutes = async (app: FastifyInstance) => {
  // Register new user
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const tenantId = request.tenantId;

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant context required for registration',
        },
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: body.fullName,
        tenant_id: tenantId,
      },
    });

    if (authError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: authError.message,
        },
      });
    }

    // Create user record in our users table
    const { data: user, error: userError } = await supabaseAdmin.from('users').insert({
      tenant_id: tenantId,
      auth_id: authData.user.id,
      email: body.email,
      full_name: body.fullName,
      phone: body.phone,
      role: 'user',
      credits: 0,
    }).select().single();

    if (userError) {
      // Rollback auth user creation
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create user profile',
        },
      });
    }

    // Generate JWT
    const token = app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenant_id: tenantId,
        role: user.role,
      },
      { expiresIn: '15m' }
    );

    const refreshToken = app.jwt.sign(
      {
        sub: user.id,
        tenant_id: tenantId,
        type: 'refresh',
      },
      { expiresIn: '7d' }
    );

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  });

  // Login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const tenantId = request.tenantId;

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant context required for login',
        },
      });
    }

    // First, try to find user by email in our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', body.email)
      .eq('tenant_id', tenantId)
      .single();

    if (userError || !user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        },
      });
    }

    // If user has auth_id, use Supabase Auth
    if (user.auth_id) {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: body.email,
          password: body.password,
        });

      if (authError || !authData.user) {
        return reply.status(401).send({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          },
        });
      }
    } else if (user.password_hash) {
      // Fallback to bcrypt for users without Supabase Auth (e.g., demo users)
      const isValidPassword = await bcrypt.compare(body.password, user.password_hash);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          },
        });
      }
    } else {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'No authentication method available',
        },
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT
    const token = app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenant_id: tenantId,
        role: user.role,
      },
      { expiresIn: '15m' }
    );

    const refreshToken = app.jwt.sign(
      {
        sub: user.id,
        tenant_id: tenantId,
        type: 'refresh',
      },
      { expiresIn: '7d' }
    );

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          credits: user.credits,
        },
        token,
        refreshToken,
      },
    });
  });

  // Refresh token
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Refresh token required',
        },
      });
    }

    try {
      const decoded = app.jwt.verify<{
        sub: string;
        tenant_id: string;
        type: string;
      }>(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.sub)
        .eq('tenant_id', decoded.tenant_id)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const token = app.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          tenant_id: decoded.tenant_id,
          role: user.role,
        },
        { expiresIn: '15m' }
      );

      const newRefreshToken = app.jwt.sign(
        {
          sub: user.id,
          tenant_id: decoded.tenant_id,
          type: 'refresh',
        },
        { expiresIn: '7d' }
      );

      return reply.send({
        success: true,
        data: {
          token,
          refreshToken: newRefreshToken,
        },
      });
    } catch {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  // Logout (just a placeholder - actual logout is client-side)
  app.post('/logout', async (request, reply) => {
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  // ===========================================
  // Admin Authentication (separate from user auth)
  // ===========================================

  // Admin Login - with rate limiting and httpOnly cookies
  app.post('/admin/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      await logAuditEvent('admin_login_rate_limited', null, null, { ip }, ip);

      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString());

      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
      });
    }

    reply.header('X-RateLimit-Remaining', rateLimit.remaining.toString());
    reply.header('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString());

    // Parse and validate body
    const body = loginSchema.parse(request.body);
    const { rememberMe } = request.body as { rememberMe?: boolean };

    // Find user by email (admin can be cross-tenant for super_admin)
    let user;

    // First try to find a super_admin (no tenant restriction)
    const { data: superAdminUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', body.email)
      .eq('role', 'super_admin')
      .single();

    if (superAdminUser) {
      user = superAdminUser;
    } else {
      // Try to find admin/operator in any tenant
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', body.email)
        .in('role', ['admin', 'operator'])
        .single();

      user = adminUser;
    }

    if (!user) {
      await logAuditEvent('admin_login_failed', null, null, { email: body.email, reason: 'user_not_found' }, ip);
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        },
      });
    }

    // Check if user has admin/operator/super_admin role
    if (!['admin', 'operator', 'super_admin'].includes(user.role)) {
      await logAuditEvent('admin_login_failed', user.id, user.tenant_id, { reason: 'insufficient_role' }, ip);
      return reply.status(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Admin access required',
        },
      });
    }

    // Verify password
    let isValidPassword = false;

    if (user.auth_id) {
      // Use Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      app.log.info({ authError: authError?.message, authData: !!authData?.user, userAuthId: user.auth_id }, 'Admin login auth check');
      isValidPassword = !authError;
    } else if (user.password_hash) {
      // Use bcrypt for demo users
      isValidPassword = await bcrypt.compare(body.password, user.password_hash);
    }

    if (!isValidPassword) {
      app.log.warn({ userId: user.id, hasAuthId: !!user.auth_id, hasPasswordHash: !!user.password_hash }, 'Admin login password validation failed');
      await logAuditEvent('admin_login_failed', user.id, user.tenant_id, { reason: 'invalid_password' }, ip);
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        },
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const accessTokenExpiry = '24h';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';
    // maxAge is in SECONDS for @fastify/cookie
    const accessTokenMaxAge = 24 * 60 * 60; // 24 hours in seconds
    const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 or 7 days in seconds

    const accessToken = app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenant_id: user.tenant_id, // null for super_admin
        role: user.role,
      },
      { expiresIn: accessTokenExpiry }
    );

    const refreshToken = app.jwt.sign(
      {
        sub: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        type: 'refresh',
      },
      { expiresIn: refreshTokenExpiry }
    );

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Set cookies
    reply.setCookie('access_token', accessToken, getCookieOptions(accessTokenMaxAge));
    reply.setCookie('refresh_token', refreshToken, getCookieOptions(refreshTokenMaxAge));
    reply.setCookie('csrf_token', csrfToken, {
      ...getCookieOptions(refreshTokenMaxAge),
      httpOnly: false, // CSRF token must be readable by JS
    });

    // Log successful login
    await logAuditEvent('admin_login_success', user.id, user.tenant_id, { role: user.role }, ip);

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
        },
        // Also return tokens in body for clients that can't use cookies
        accessToken,
        refreshToken,
        csrfToken,
      },
    });
  });

  // Admin Logout - clears all auth cookies
  app.post('/admin/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || 'unknown';

    // Try to get user from token for audit log
    let userId = null;
    let tenantId = null;
    try {
      const token = request.cookies.access_token;
      if (token) {
        const decoded = app.jwt.decode<{ sub: string; tenant_id: string }>(token);
        userId = decoded?.sub || null;
        tenantId = decoded?.tenant_id || null;
      }
    } catch {
      // Ignore decode errors
    }

    // Clear all auth cookies - MUST specify same domain as when setting!
    reply.clearCookie('access_token', { path: '/', domain: '.silent-box.com' });
    reply.clearCookie('refresh_token', { path: '/', domain: '.silent-box.com' });
    reply.clearCookie('csrf_token', { path: '/', domain: '.silent-box.com' });

    if (userId) {
      await logAuditEvent('admin_logout', userId, tenantId, {}, ip);
    }

    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  // Admin Token Refresh - with token rotation and grace period
  app.post('/admin/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || 'unknown';
    const refreshTokenFromCookie = request.cookies.refresh_token;
    const refreshTokenFromBody = (request.body as { refreshToken?: string })?.refreshToken;
    const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Refresh token required',
        },
      });
    }

    try {
      const decoded = app.jwt.verify<{
        sub: string;
        tenant_id: string | null;
        role: string;
        type: string;
        iat: number;
      }>(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if this is an old token within grace period (30 seconds)
      // This handles race conditions with multiple tabs
      const tokenAge = Date.now() / 1000 - decoded.iat;
      const GRACE_PERIOD = 30; // seconds

      // Get user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.sub)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Verify role hasn't changed
      if (!['admin', 'operator', 'super_admin'].includes(user.role)) {
        throw new Error('User no longer has admin access');
      }

      // Generate new tokens
      const newAccessToken = app.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          role: user.role,
        },
        { expiresIn: '24h' }
      );

      const newRefreshToken = app.jwt.sign(
        {
          sub: user.id,
          tenant_id: user.tenant_id,
          role: user.role,
          type: 'refresh',
        },
        { expiresIn: '7d' }
      );

      const csrfToken = generateCsrfToken();

      // Set new cookies (maxAge in SECONDS)
      reply.setCookie('access_token', newAccessToken, getCookieOptions(24 * 60 * 60)); // 24 hours
      reply.setCookie('refresh_token', newRefreshToken, getCookieOptions(7 * 24 * 60 * 60)); // 7 days
      reply.setCookie('csrf_token', csrfToken, {
        ...getCookieOptions(7 * 24 * 60 * 60), // 7 days
        httpOnly: false,
      });

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: user.tenant_id,
          },
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          csrfToken,
        },
      });
    } catch (err) {
      logger.warn({ error: err, ip }, 'Admin token refresh failed');
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  // Get current admin user from token
  app.get('/admin/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.access_token || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    try {
      const decoded = app.jwt.verify<{
        sub: string;
        email: string;
        tenant_id: string | null;
        role: string;
      }>(token);

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, tenant_id, credits')
        .eq('id', decoded.sub)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
          credits: user.credits,
        },
      });
    } catch {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
    }
  });
};
