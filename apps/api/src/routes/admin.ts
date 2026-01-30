// ===========================================
// Admin API Routes (Tenant Admin Dashboard)
// ===========================================

import { FastifyPluginAsync } from 'fastify';
import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// Admin middleware - verify admin or operator role
// Also supports X-Tenant-ID header for development/testing
const verifyAdmin = async (request: any, reply: any) => {
  // Check for X-Tenant-ID header (dev/testing mode)
  const tenantIdHeader = request.headers['x-tenant-id'];
  if (tenantIdHeader) {
    // Verify tenant exists
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantIdHeader)
      .single();

    if (!error && tenant) {
      request.adminTenantId = tenantIdHeader;
      request.adminRole = 'admin'; // Assume admin for header-based auth
      return;
    }
  }

  // Standard JWT authentication
  try {
    await request.jwtVerify();

    const { data: user, error } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', request.user.sub)
      .single();

    if (error || !['admin', 'operator', 'super_admin'].includes(user?.role)) {
      return reply.code(403).send({
        success: false,
        error: 'Admin access required',
      });
    }

    request.adminTenantId = user.tenant_id;
    request.adminRole = user.role;
  } catch (err) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication required',
    });
  }
};

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // Apply admin verification to all routes
  app.addHook('preHandler', verifyAdmin);

  // ===========================================
  // Dashboard Statistics
  // ===========================================

  // Get dashboard overview
  app.get('/dashboard/stats', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get active bookings
      const { count: activeBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['active', 'confirmed']);

      // Get today's bookings
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());

      // Get total revenue (this month)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('tenant_id', tenantId)
        .eq('type', 'credit_purchase')
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString());

      const monthlyRevenue = monthlyTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      // Get booth stats
      const { data: booths } = await supabase
        .from('booths')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      const totalBooths = booths?.length || 0;
      const availableBooths = booths?.filter((b) => b.status === 'available').length || 0;
      const occupiedBooths = booths?.filter((b) => b.status === 'occupied').length || 0;

      // Get location count
      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      return {
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeBookings: activeBookings || 0,
          todayBookings: todayBookings || 0,
          monthlyRevenue,
          totalBooths,
          availableBooths,
          occupiedBooths,
          totalLocations: totalLocations || 0,
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get dashboard stats');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get dashboard statistics',
      });
    }
  });

  // Get recent bookings
  app.get('/dashboard/recent-bookings', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          start_time,
          end_time,
          total_price,
          created_at,
          users(full_name, email),
          booths(name, locations(name))
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get recent bookings');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get recent bookings',
      });
    }
  });

  // Get revenue chart data
  app.get<{ Querystring: { period?: string } }>('/dashboard/revenue', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const period = request.query.period || '7d';

    try {
      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case '30d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '7d':
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('tenant_id', tenantId)
        .eq('type', 'credit_purchase')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Group by date
      const revenueByDate: Record<string, number> = {};
      data?.forEach((tx) => {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + (tx.amount || 0);
      });

      const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      return { success: true, data: chartData };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get revenue data');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get revenue data',
      });
    }
  });

  // ===========================================
  // User Management
  // ===========================================

  // Get all users
  app.get('/users', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Remove sensitive fields
      const users = data?.map((user) => ({
        ...user,
        password_hash: undefined,
        google_calendar_token_encrypted: undefined,
      }));

      return { success: true, data: users };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get users');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get users',
      });
    }
  });

  // Add credits to user
  app.post<{ Params: { userId: string }; Body: { amount: number; reason?: string } }>(
    '/users/:userId/credits',
    async (request: any, reply) => {
      const tenantId = request.adminTenantId;
      const { userId } = request.params;
      const { amount, reason } = request.body;

      try {
        // Verify user belongs to tenant
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, credits')
          .eq('id', userId)
          .eq('tenant_id', tenantId)
          .single();

        if (userError || !user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          });
        }

        // Update credits
        const newCredits = (user.credits || 0) + amount;

        const { error: updateError } = await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        // Create transaction record
        await supabase.from('transactions').insert({
          tenant_id: tenantId,
          user_id: userId,
          type: amount > 0 ? 'credit_adjustment' : 'credit_deduction',
          amount: Math.abs(amount),
          currency: 'PLN',
          status: 'completed',
          metadata: { reason: reason || 'Admin adjustment' },
        });

        logger.info({ userId, amount, tenantId }, 'Admin credits adjustment');

        return {
          success: true,
          data: { newCredits },
        };
      } catch (error) {
        logger.error({ error, userId, tenantId }, 'Failed to adjust credits');
        return reply.code(500).send({
          success: false,
          error: 'Failed to adjust credits',
        });
      }
    }
  );

  // ===========================================
  // Device Management
  // ===========================================

  // Get all devices
  app.get('/devices', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          booths(name, locations(name))
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get devices');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get devices',
      });
    }
  });

  // ===========================================
  // Reports
  // ===========================================

  // Get booking report
  app.get<{ Querystring: { from?: string; to?: string } }>('/reports/bookings', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const { from, to } = request.query;

    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          start_time,
          end_time,
          duration_minutes,
          total_price,
          currency,
          created_at,
          users(full_name, email),
          booths(name, locations(name))
        `)
        .eq('tenant_id', tenantId);

      if (from) {
        query = query.gte('created_at', from);
      }
      if (to) {
        query = query.lte('created_at', to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Calculate summary
      const summary = {
        total: data?.length || 0,
        completed: data?.filter((b) => b.status === 'completed').length || 0,
        cancelled: data?.filter((b) => b.status === 'cancelled').length || 0,
        totalRevenue: data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0,
        totalMinutes: data?.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) || 0,
      };

      return { success: true, data, summary };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get booking report');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get booking report',
      });
    }
  });

  // Get transaction report
  app.get<{ Querystring: { from?: string; to?: string } }>('/reports/transactions', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const { from, to } = request.query;

    try {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          currency,
          payment_provider,
          status,
          created_at,
          users(full_name, email)
        `)
        .eq('tenant_id', tenantId);

      if (from) {
        query = query.gte('created_at', from);
      }
      if (to) {
        query = query.lte('created_at', to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Calculate summary
      const completed = data?.filter((t) => t.status === 'completed') || [];
      const summary = {
        total: data?.length || 0,
        completed: completed.length,
        totalAmount: completed.reduce((sum, t) => sum + (t.amount || 0), 0),
        byProvider: completed.reduce(
          (acc, t) => {
            const provider = t.payment_provider || 'other';
            acc[provider] = (acc[provider] || 0) + (t.amount || 0);
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      return { success: true, data, summary };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get transaction report');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get transaction report',
      });
    }
  });
};
