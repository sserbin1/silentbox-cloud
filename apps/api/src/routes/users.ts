// ===========================================
// User Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { updateProfileSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';

export const usersRoutes = async (app: FastifyInstance) => {
  // Get current user profile
  app.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', request.userId)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        language: user.language,
        credits: user.credits,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  });

  // Update current user profile
  app.patch('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);

    const updateData: Record<string, unknown> = {};
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;
    if (body.language !== undefined) updateData.language = body.language;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', request.userId)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error || !user) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to update profile',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        language: user.language,
        credits: user.credits,
        role: user.role,
      },
    });
  });

  // Get user credits balance
  app.get('/me/credits', { preHandler: authMiddleware }, async (request, reply) => {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', request.userId)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        credits: user.credits,
      },
    });
  });

  // Delete account (soft delete)
  app.delete('/me', { preHandler: authMiddleware }, async (request, reply) => {
    // Mark user as deleted (we don't actually delete for data retention)
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${request.userId}@silentbox.local`,
      })
      .eq('id', request.userId)
      .eq('tenant_id', request.tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to delete account',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Account deleted successfully' },
    });
  });
};
