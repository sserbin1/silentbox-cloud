// ===========================================
// Authentication Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { env } from '../lib/env.js';
import { ERROR_CODES } from '@silentbox/shared';
import bcrypt from 'bcrypt';

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
};
