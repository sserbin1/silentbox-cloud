// ===========================================
// Super Admin Routes (Platform Management)
// ===========================================

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { tenantsService } from '../services/tenants.js';
import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

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

// Super Admin middleware - verify super admin role
const verifySuperAdmin = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();

    // Check if user is super admin
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', request.user.sub)
      .single();

    if (error || user?.role !== 'super_admin') {
      return reply.code(403).send({
        success: false,
        error: 'Super admin access required',
      });
    }
  } catch (err) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication required',
    });
  }
};

export const superadminRoutes: FastifyPluginAsync = async (app) => {
  // ===========================================
  // Public Read Routes (for dashboard display)
  // ===========================================

  // Get platform overview (public for now - TODO: add auth when login is implemented)
  app.get('/stats/overview', async (request, reply) => {
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

  // Get recent activity (public for now)
  app.get('/activity', async (request, reply) => {
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

  // Get all tenants (public read for listing)
  app.get('/tenants', async (request, reply) => {
    try {
      logger.info('Getting all tenants - v2');
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, status, contact_email, created_at')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      logger.info({ count: data?.length, error: error?.message }, 'Tenants query result');

      if (error) {
        logger.error({ error }, 'Failed to get tenants');
        return reply.code(500).send({
          success: false,
          error: error.message,
        });
      }

      return { success: true, data: data || [] };
    } catch (err: any) {
      logger.error({ error: err?.message, stack: err?.stack }, 'Exception getting tenants');
      return reply.code(500).send({
        success: false,
        error: err?.message || 'Failed to get tenants',
      });
    }
  });

  // Get tenant by ID (public read)
  app.get<{ Params: { id: string } }>('/tenants/:id', async (request, reply) => {
    const result = await tenantsService.getTenantById(request.params.id);

    if (!result.success) {
      return reply.code(404).send(result);
    }

    return result;
  });

  // Get tenant statistics (public read)
  app.get<{ Params: { id: string } }>('/tenants/:id/stats', async (request, reply) => {
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
  app.get('/admins', async (request, reply) => {
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

  // Promote user to super admin
  app.post<{ Params: { userId: string } }>('/admins/:userId/promote', async (request, reply) => {
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

  // Demote super admin
  app.post<{ Params: { userId: string } }>('/admins/:userId/demote', async (request, reply) => {
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
