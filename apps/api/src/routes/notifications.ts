// ===========================================
// Notification Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';

export const notificationsRoutes = async (app: FastifyInstance) => {
  // Register push token
  app.post('/register-token', { preHandler: authMiddleware }, async (request, reply) => {
    const { token, platform } = request.body as { token: string; platform: 'ios' | 'android' };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    if (!token) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Push token is required',
        },
      });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        push_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to register push token',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Push token registered' },
    });
  });

  // Unregister push token (logout)
  app.delete('/unregister-token', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    await supabaseAdmin
      .from('users')
      .update({
        push_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    return reply.send({
      success: true,
      data: { message: 'Push token unregistered' },
    });
  });

  // Get user's notifications
  app.get('/', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;
    const { page = 1, limit = 20, unread } = request.query as {
      page?: number;
      limit?: number;
      unread?: string;
    };
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (unread === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch notifications',
        },
      });
    }

    return reply.send({
      success: true,
      data: notifications,
      meta: {
        page,
        limit,
        total: count || 0,
        unreadCount: unread === 'true' ? count : undefined,
      },
    });
  });

  // Get unread count
  app.get('/unread-count', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch unread count',
        },
      });
    }

    return reply.send({
      success: true,
      data: { count: count || 0 },
    });
  });

  // Mark notification as read
  app.patch('/:id/read', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to mark notification as read',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Notification marked as read' },
    });
  });

  // Mark all notifications as read
  app.patch('/read-all', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to mark notifications as read',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'All notifications marked as read' },
    });
  });

  // Delete notification
  app.delete('/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to delete notification',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Notification deleted' },
    });
  });
};
