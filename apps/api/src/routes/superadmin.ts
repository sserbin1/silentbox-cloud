// ===========================================
// Super Admin Routes (Platform Management)
// ===========================================

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { tenantsService } from '../services/tenants.js';
import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import * as jose from 'jose';
import { env } from '../lib/env.js';

// Schema definitions
const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('PL'),
  settings: z.record(z.unknown()).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

// ===========================================
// Audit Logging Helper
// ===========================================
const logAuditEvent = async (
  userId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  details: Record<string, unknown> = {},
  ipAddress: string | null = null
) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, action, resource }, 'Failed to log audit event');
  }
};

// ===========================================
// Super Admin middleware - verify super admin role
// Supports both cookie-based and header-based auth
// ===========================================
const verifySuperAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const ipAddress = request.ip || request.headers['x-forwarded-for']?.toString() || null;

  try {
    // Try cookie-based auth first (admin_token), then fall back to Authorization header
    const cookieToken = request.cookies?.admin_token;
    const authHeader = request.headers.authorization;

    let token: string | null = null;

    if (cookieToken) {
      token = cookieToken;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      logger.warn({ ip: ipAddress }, 'Super admin access attempt without token');
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify JWT using jose (edge-compatible)
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    let payload: jose.JWTPayload;

    try {
      const { payload: verifiedPayload } = await jose.jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch (jwtErr) {
      logger.warn({ ip: ipAddress, error: (jwtErr as Error).message }, 'Invalid JWT in super admin request');
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const userId = payload.sub as string;

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid token payload',
      });
    }

    // Check if user exists and is super admin
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email, full_name')
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.warn({ userId, ip: ipAddress }, 'Super admin access attempt - user not found');
      await logAuditEvent(userId, 'superadmin_access_denied', 'auth', null, { reason: 'user_not_found' }, ipAddress);
      return reply.code(401).send({
        success: false,
        error: 'User not found',
      });
    }

    if (user.role !== 'super_admin') {
      logger.warn({ userId, role: user.role, ip: ipAddress }, 'Super admin access attempt with insufficient role');
      await logAuditEvent(userId, 'superadmin_access_denied', 'auth', null, { reason: 'insufficient_role', actualRole: user.role }, ipAddress);
      return reply.code(403).send({
        success: false,
        error: 'Super admin access required',
      });
    }

    // Attach user info to request for downstream handlers
    (request as any).superAdmin = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    // Log successful access (only for write operations to avoid log spam)
    const method = request.method.toUpperCase();
    if (method !== 'GET') {
      await logAuditEvent(userId, `superadmin_${method.toLowerCase()}`, request.url, null, {}, ipAddress);
    }

  } catch (err) {
    logger.error({ error: err, ip: ipAddress }, 'Super admin auth middleware error');
    return reply.code(500).send({
      success: false,
      error: 'Authentication error',
    });
  }
};

export const superadminRoutes: FastifyPluginAsync = async (app) => {
  // ===========================================
  // Protected Read Routes (require super admin auth)
  // ===========================================

  // Get platform overview
  app.get('/stats/overview', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      // Get total tenants
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'deleted');

      // Get active tenants
      const { count: activeTenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get trial tenants
      const { count: trialTenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trialing');

      // Get new tenants this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newTenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get total revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'credit_purchase')
        .eq('status', 'completed');

      const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      // Get total booths
      const { count: boothsCount } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true });

      return {
        success: true,
        data: {
          totalTenants: tenantsCount || 0,
          activeTenants: activeTenantsCount || 0,
          activeSubscriptions: activeTenantsCount || 0,
          trialTenants: trialTenantsCount || 0,
          newTenantsThisMonth: newTenantsCount || 0,
          totalUsers: usersCount || 0,
          totalBookings: bookingsCount || 0,
          totalRevenue,
          totalBooths: boothsCount || 0,
          mrr: 0,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get platform stats');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get platform statistics',
      });
    }
  });

  // Get recent activity
  app.get('/activity', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      const activities: Array<{
        id: string;
        type: string;
        message: string;
        timestamp: string;
      }> = [];

      // Get recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          users(full_name, email),
          booths(name, locations(name)),
          tenants(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      recentBookings?.forEach((booking: any) => {
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking_created',
          message: `New booking at ${booking.booths?.name || 'Unknown'} by ${booking.users?.full_name || 'Unknown'}`,
          timestamp: booking.created_at,
        });
      });

      // Get recent tenants
      const { data: recentTenants } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentTenants?.forEach((tenant: any) => {
        activities.push({
          id: `tenant-${tenant.id}`,
          type: 'tenant_created',
          message: `New tenant: ${tenant.name}`,
          timestamp: tenant.created_at,
        });
      });

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        success: true,
        data: activities.slice(0, 10),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get activity');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get activity',
      });
    }
  });

  // Get analytics trends (chart data)
  app.get<{ Querystring: { period?: string } }>('/analytics/trends', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const period = request.query.period || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily booking counts
      const { data: bookings } = await supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Get daily revenue from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('status', 'completed')
        .eq('type', 'credit_purchase')
        .gte('created_at', startDate.toISOString());

      // Get new tenants by day
      const { data: newTenants } = await supabase
        .from('tenants')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Aggregate by date
      const dataByDate: Record<string, { bookings: number; revenue: number; tenants: number }> = {};

      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split('T')[0];
        dataByDate[dateKey] = { bookings: 0, revenue: 0, tenants: 0 };
      }

      // Count bookings per day
      bookings?.forEach((b: any) => {
        const dateKey = new Date(b.created_at).toISOString().split('T')[0];
        if (dataByDate[dateKey]) {
          dataByDate[dateKey].bookings++;
        }
      });

      // Sum revenue per day
      transactions?.forEach((t: any) => {
        const dateKey = new Date(t.created_at).toISOString().split('T')[0];
        if (dataByDate[dateKey]) {
          dataByDate[dateKey].revenue += t.amount || 0;
        }
      });

      // Count new tenants per day
      newTenants?.forEach((t: any) => {
        const dateKey = new Date(t.created_at).toISOString().split('T')[0];
        if (dataByDate[dateKey]) {
          dataByDate[dateKey].tenants++;
        }
      });

      // Convert to array
      const chartData = Object.entries(dataByDate).map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...values,
      }));

      return { success: true, data: chartData };
    } catch (error) {
      logger.error({ error }, 'Failed to get analytics trends');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get analytics trends',
      });
    }
  });

  // Get top performing tenants
  app.get<{ Querystring: { limit?: string } }>('/analytics/top-tenants', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const limit = Math.min(20, parseInt(request.query.limit || '5', 10));

    try {
      // Get all tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('status', 'active');

      if (!tenants || tenants.length === 0) {
        return { success: true, data: [] };
      }

      // Get booking counts per tenant
      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('tenant_id');

      // Get revenue per tenant
      const { data: revenues } = await supabase
        .from('transactions')
        .select('tenant_id, amount')
        .eq('status', 'completed')
        .eq('type', 'credit_purchase');

      // Aggregate stats per tenant
      const tenantStats: Record<string, { bookings: number; revenue: number }> = {};

      bookingCounts?.forEach((b: any) => {
        if (!tenantStats[b.tenant_id]) {
          tenantStats[b.tenant_id] = { bookings: 0, revenue: 0 };
        }
        tenantStats[b.tenant_id].bookings++;
      });

      revenues?.forEach((r: any) => {
        if (!tenantStats[r.tenant_id]) {
          tenantStats[r.tenant_id] = { bookings: 0, revenue: 0 };
        }
        tenantStats[r.tenant_id].revenue += r.amount || 0;
      });

      // Merge with tenant data and sort by revenue
      const topTenants = tenants
        .map((t: any) => ({
          ...t,
          bookings: tenantStats[t.id]?.bookings || 0,
          revenue: tenantStats[t.id]?.revenue || 0,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, limit);

      return { success: true, data: topTenants };
    } catch (error) {
      logger.error({ error }, 'Failed to get top tenants');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get top tenants',
      });
    }
  });

  // Get billing stats
  app.get('/billing/stats', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      // Get total revenue (all completed transactions)
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('type', 'credit_purchase')
        .eq('status', 'completed');

      const totalRevenue = allTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      // Calculate MRR (Monthly Recurring Revenue) - last 30 days average
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = allTransactions?.filter(
        (tx) => new Date(tx.created_at) >= thirtyDaysAgo
      ) || [];
      const mrr = recentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Get active subscriptions (active tenants count)
      const { count: activeSubscriptions } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get pending and overdue counts (placeholder - would need invoice table)
      // For now, return 0 as we don't have invoicing implemented yet
      const pendingInvoices = 0;
      const overdueInvoices = 0;

      return {
        success: true,
        data: {
          mrr,
          totalRevenue,
          activeSubscriptions: activeSubscriptions || 0,
          pendingInvoices,
          overdueInvoices,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get billing stats');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get billing stats',
      });
    }
  });

  // Get all tenants
  app.get('/tenants', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*');

      if (error) {
        logger.error({ error }, 'Failed to get tenants');
        return reply.code(500).send({
          success: false,
          error: error.message,
        });
      }

      // Filter and sort in JS to avoid Supabase query issues
      const filtered = (data || [])
        .filter((t: any) => t.status !== 'deleted')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { success: true, data: filtered };
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Exception getting tenants');
      return reply.code(500).send({
        success: false,
        error: err?.message || 'Failed to get tenants',
      });
    }
  });

  // Get tenant by ID
  app.get<{ Params: { id: string } }>('/tenants/:id', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.getTenantById(request.params.id);

    if (!result.success) {
      return reply.code(404).send(result);
    }

    return result;
  });

  // Get tenant statistics
  app.get<{ Params: { id: string } }>('/tenants/:id/stats', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.getTenantStats(request.params.id);

    if (!result.success) {
      return reply.code(500).send(result);
    }

    return result;
  });

  // ===========================================
  // Protected Routes (require super admin auth)
  // ===========================================

  // Create tenant (protected)
  app.post('/tenants', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const validation = createTenantSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await tenantsService.createTenant(validation.data);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return reply.code(201).send(result);
  });

  // Update tenant (protected)
  app.put<{ Params: { id: string } }>('/tenants/:id', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const validation = updateTenantSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await tenantsService.updateTenant(request.params.id, validation.data);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return result;
  });

  // Activate tenant (protected)
  app.post<{ Params: { id: string } }>('/tenants/:id/activate', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.activateTenant(request.params.id);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return { success: true, message: 'Tenant activated' };
  });

  // Suspend tenant (protected)
  app.post<{ Params: { id: string } }>('/tenants/:id/suspend', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.suspendTenant(request.params.id);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return { success: true, message: 'Tenant suspended' };
  });

  // Regenerate API key (protected)
  app.post<{ Params: { id: string } }>('/tenants/:id/regenerate-api-key', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.regenerateApiKey(request.params.id);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return { success: true, apiKey: result.apiKey };
  });

  // Delete tenant (protected)
  app.delete<{ Params: { id: string } }>('/tenants/:id', { preHandler: verifySuperAdmin }, async (request, reply) => {
    const result = await tenantsService.deleteTenant(request.params.id);

    if (!result.success) {
      return reply.code(500).send(result);
    }

    return result;
  });

  // ===========================================
  // User Management (Cross-Tenant)
  // ===========================================

  // Get all super admins
  app.get('/admins', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'super_admin');

      if (error) {
        return reply.code(500).send({
          success: false,
          error: error.message,
        });
      }

      return { success: true, data };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch admins',
      });
    }
  });

  // Promote user to super admin (protected)
  app.post<{ Params: { userId: string } }>('/admins/:userId/promote', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', request.params.userId);

      if (error) {
        return reply.code(400).send({
          success: false,
          error: error.message,
        });
      }

      logger.info({ userId: request.params.userId }, 'User promoted to super admin');
      return { success: true, message: 'User promoted to super admin' };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to promote user',
      });
    }
  });

  // Demote super admin (protected)
  app.post<{ Params: { userId: string } }>('/admins/:userId/demote', { preHandler: verifySuperAdmin }, async (request, reply) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', request.params.userId);

      if (error) {
        return reply.code(400).send({
          success: false,
          error: error.message,
        });
      }

      logger.info({ userId: request.params.userId }, 'Super admin demoted');
      return { success: true, message: 'User demoted from super admin' };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to demote user',
      });
    }
  });
};
