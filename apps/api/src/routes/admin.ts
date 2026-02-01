// ===========================================
// Admin API Routes (Tenant Admin Dashboard)
// ===========================================

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { z } from 'zod';
import * as jose from 'jose';
import { env } from '../lib/env.js';

// ===========================================
// Schemas
// ===========================================
const settingsSchema = z.object({
  business_name: z.string().min(1).max(200).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  notifications: z.object({
    email_booking_confirmation: z.boolean().optional(),
    email_booking_reminder: z.boolean().optional(),
    email_booking_cancellation: z.boolean().optional(),
    sms_booking_confirmation: z.boolean().optional(),
    sms_booking_reminder: z.boolean().optional(),
  }).optional(),
  integrations: z.object({
    google_calendar_enabled: z.boolean().optional(),
    ttlock_enabled: z.boolean().optional(),
    push_notifications_enabled: z.boolean().optional(),
  }).optional(),
});

const discountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  conditions: z.record(z.unknown()).optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
});

const peakHoursSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  multiplier: z.number().min(1).max(5),
});

const creditPackageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  credits: z.number().min(1),
  price: z.number().min(0),
  currency: z.string().length(3).default('PLN'),
  bonus_credits: z.number().min(0).default(0),
  is_popular: z.boolean().default(false),
  sort_order: z.number().optional(),
});

// Audit log helper
const logAuditEvent = async (
  tenantId: string,
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  details: Record<string, unknown> = {}
) => {
  try {
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, action, resource }, 'Failed to log audit event');
  }
};

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
  // Booking Management
  // ===========================================

  // Get all bookings with filters
  app.get<{ Querystring: { status?: string; locationId?: string; date?: string } }>(
    '/bookings',
    async (request: any, reply) => {
      const tenantId = request.adminTenantId;
      const { status, locationId, date } = request.query;

      try {
        let query = supabase
          .from('bookings')
          .select(`
            id,
            user_id,
            booth_id,
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

        if (status) {
          query = query.eq('status', status);
        }
        if (locationId) {
          query = query.eq('booths.location_id', locationId);
        }
        if (date) {
          // Filter by date (start of day to end of day)
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          query = query.gte('start_time', startOfDay.toISOString()).lte('start_time', endOfDay.toISOString());
        }

        const { data, error } = await query.order('start_time', { ascending: false });

        if (error) {
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        logger.error({ error, tenantId }, 'Failed to get bookings');
        return reply.code(500).send({
          success: false,
          error: 'Failed to get bookings',
        });
      }
    }
  );

  // Get single booking
  app.get<{ Params: { bookingId: string } }>('/bookings/:bookingId', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const { bookingId } = request.params;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users(full_name, email, phone),
          booths(name, locations(name, address))
        `)
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId, bookingId }, 'Failed to get booking');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get booking',
      });
    }
  });

  // Cancel booking
  app.post<{ Params: { bookingId: string } }>('/bookings/:bookingId/cancel', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const { bookingId } = request.params;

    try {
      // Verify booking belongs to tenant and can be cancelled
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, user_id, total_price')
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !booking) {
        return reply.code(404).send({
          success: false,
          error: 'Booking not found',
        });
      }

      if (['cancelled', 'completed'].includes(booking.status)) {
        return reply.code(400).send({
          success: false,
          error: `Cannot cancel booking with status: ${booking.status}`,
        });
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (updateError) {
        throw updateError;
      }

      logger.info({ bookingId, tenantId }, 'Booking cancelled by admin');

      return { success: true, data: { id: bookingId, status: 'cancelled' } };
    } catch (error) {
      logger.error({ error, tenantId, bookingId }, 'Failed to cancel booking');
      return reply.code(500).send({
        success: false,
        error: 'Failed to cancel booking',
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

  // ===========================================
  // Settings Management (Task 10)
  // ===========================================

  // Get tenant settings
  app.get('/settings', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, settings, contact_email, contact_phone, address, city, country')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        return reply.code(404).send({
          success: false,
          error: 'Tenant not found',
        });
      }

      return {
        success: true,
        data: {
          business_name: tenant.name,
          contact_email: tenant.contact_email,
          contact_phone: tenant.contact_phone,
          address: tenant.address,
          city: tenant.city,
          country: tenant.country,
          ...tenant.settings,
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get settings');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get settings',
      });
    }
  });

  // Update tenant settings
  app.patch('/settings', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;

    const validation = settingsSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const updates: Record<string, unknown> = {};
      const settingsUpdates: Record<string, unknown> = {};

      // Separate top-level fields from settings
      if (validation.data.business_name !== undefined) {
        updates.name = validation.data.business_name;
      }
      if (validation.data.contact_email !== undefined) {
        updates.contact_email = validation.data.contact_email;
      }
      if (validation.data.contact_phone !== undefined) {
        updates.contact_phone = validation.data.contact_phone;
      }
      if (validation.data.address !== undefined) {
        updates.address = validation.data.address;
      }
      if (validation.data.notifications !== undefined) {
        settingsUpdates.notifications = validation.data.notifications;
      }
      if (validation.data.integrations !== undefined) {
        settingsUpdates.integrations = validation.data.integrations;
      }

      // Get current settings and merge
      if (Object.keys(settingsUpdates).length > 0) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('settings')
          .eq('id', tenantId)
          .single();

        updates.settings = {
          ...(tenant?.settings || {}),
          ...settingsUpdates,
        };
      }

      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId);

      if (error) {
        throw error;
      }

      // Log audit event
      await logAuditEvent(tenantId, userId, 'settings_update', 'tenant', tenantId, { updates });

      logger.info({ tenantId }, 'Tenant settings updated');

      return { success: true, message: 'Settings updated' };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to update settings');
      return reply.code(500).send({
        success: false,
        error: 'Failed to update settings',
      });
    }
  });

  // ===========================================
  // Pricing Management (Tasks 11-14)
  // ===========================================

  // GET /pricing - combined pricing config (Task 11)
  app.get('/pricing', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      // Get general pricing from booths (base prices)
      const { data: booths } = await supabase
        .from('booths')
        .select('id, name, price_per_15min, currency')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Get discounts
      const { data: discounts } = await supabase
        .from('discounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Get peak hours
      const { data: peakHours } = await supabase
        .from('peak_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('day_of_week', { ascending: true });

      // Get credit packages
      const { data: packages } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });

      return {
        success: true,
        data: {
          general: {
            booths: booths || [],
          },
          discounts: discounts || [],
          peak_hours: peakHours || [],
          packages: packages || [],
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get pricing');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get pricing configuration',
      });
    }
  });

  // Discounts CRUD (Task 12)
  app.post('/pricing/discounts', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;

    const validation = discountSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('discounts')
        .insert({
          tenant_id: tenantId,
          ...validation.data,
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'discount_create', 'discount', data.id, validation.data);

      return reply.code(201).send({ success: true, data });
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to create discount');
      return reply.code(500).send({
        success: false,
        error: 'Failed to create discount',
      });
    }
  });

  app.patch<{ Params: { id: string } }>('/pricing/discounts/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    const validation = discountSchema.partial().safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('discounts')
        .update(validation.data)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'discount_update', 'discount', id, validation.data);

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to update discount');
      return reply.code(500).send({
        success: false,
        error: 'Failed to update discount',
      });
    }
  });

  app.delete<{ Params: { id: string } }>('/pricing/discounts/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'discount_delete', 'discount', id, {});

      return { success: true, message: 'Discount deleted' };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to delete discount');
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete discount',
      });
    }
  });

  // Peak Hours CRUD (Task 13)
  app.post('/pricing/peak-hours', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;

    const validation = peakHoursSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('peak_hours')
        .insert({
          tenant_id: tenantId,
          ...validation.data,
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'peak_hours_create', 'peak_hours', data.id, validation.data);

      return reply.code(201).send({ success: true, data });
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to create peak hours');
      return reply.code(500).send({
        success: false,
        error: 'Failed to create peak hours',
      });
    }
  });

  app.patch<{ Params: { id: string } }>('/pricing/peak-hours/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    const validation = peakHoursSchema.partial().safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('peak_hours')
        .update(validation.data)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'peak_hours_update', 'peak_hours', id, validation.data);

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to update peak hours');
      return reply.code(500).send({
        success: false,
        error: 'Failed to update peak hours',
      });
    }
  });

  app.delete<{ Params: { id: string } }>('/pricing/peak-hours/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    try {
      const { error } = await supabase
        .from('peak_hours')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'peak_hours_delete', 'peak_hours', id, {});

      return { success: true, message: 'Peak hours config deleted' };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to delete peak hours');
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete peak hours',
      });
    }
  });

  // Credit Packages CRUD (Task 14)
  app.post('/pricing/packages', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;

    const validation = creditPackageSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .insert({
          tenant_id: tenantId,
          ...validation.data,
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'package_create', 'credit_package', data.id, validation.data);

      return reply.code(201).send({ success: true, data });
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to create credit package');
      return reply.code(500).send({
        success: false,
        error: 'Failed to create credit package',
      });
    }
  });

  app.patch<{ Params: { id: string } }>('/pricing/packages/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    const validation = creditPackageSchema.partial().safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .update(validation.data)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'package_update', 'credit_package', id, validation.data);

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to update credit package');
      return reply.code(500).send({
        success: false,
        error: 'Failed to update credit package',
      });
    }
  });

  app.delete<{ Params: { id: string } }>('/pricing/packages/:id', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    try {
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      await logAuditEvent(tenantId, userId, 'package_delete', 'credit_package', id, {});

      return { success: true, message: 'Credit package deleted' };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to delete credit package');
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete credit package',
      });
    }
  });

  // ===========================================
  // Transactions (Task 15)
  // ===========================================

  // Get transactions with pagination
  app.get<{
    Querystring: {
      page?: string;
      limit?: string;
      date_from?: string;
      date_to?: string;
      type?: string;
      search?: string;
    };
  }>('/transactions', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const {
      page = '1',
      limit = '20',
      date_from,
      date_to,
      type,
      search,
    } = request.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    try {
      // Build query
      let query = supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          currency,
          payment_provider,
          status,
          metadata,
          created_at,
          users(id, email, full_name)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }
      if (type) {
        query = query.eq('type', type);
      }

      // Get total for pagination
      const { count: total } = await query;

      // Apply pagination and ordering
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) throw error;

      // Filter by search (user email) - done in JS since Supabase nested search is limited
      let filteredData = data || [];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter((tx: any) =>
          tx.users?.email?.toLowerCase().includes(searchLower) ||
          tx.users?.full_name?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate summary
      const completedTxs = (data || []).filter((tx: any) => tx.status === 'completed');
      const summary = {
        total_amount: completedTxs.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0),
        count_by_type: (data || []).reduce((acc: Record<string, number>, tx: any) => {
          acc[tx.type] = (acc[tx.type] || 0) + 1;
          return acc;
        }, {}),
      };

      return {
        success: true,
        data: filteredData,
        meta: {
          total: total || 0,
          page: pageNum,
          limit: limitNum,
          summary,
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get transactions');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get transactions',
      });
    }
  });

  // Export transactions as CSV
  app.get<{
    Querystring: {
      format?: string;
      date_from?: string;
      date_to?: string;
      type?: string;
    };
  }>('/transactions/export', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const { format = 'csv', date_from, date_to, type } = request.query;

    if (format !== 'csv') {
      return reply.code(400).send({
        success: false,
        error: 'Only CSV format is supported',
      });
    }

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
          users(email, full_name)
        `)
        .eq('tenant_id', tenantId);

      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Generate CSV
      const headers = ['ID', 'Type', 'Amount', 'Currency', 'Provider', 'Status', 'User Email', 'User Name', 'Created At'];
      const rows = (data || []).map((tx: any) => [
        tx.id,
        tx.type,
        tx.amount,
        tx.currency,
        tx.payment_provider || '',
        tx.status,
        tx.users?.email || '',
        tx.users?.full_name || '',
        tx.created_at,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);

      return csv;
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to export transactions');
      return reply.code(500).send({
        success: false,
        error: 'Failed to export transactions',
      });
    }
  });

  // ===========================================
  // Analytics (Task 19)
  // ===========================================

  // Get bookings analytics
  app.get<{ Querystring: { period?: string } }>('/analytics/bookings', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const period = request.query.period || '7d';

    try {
      const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const byDate: Record<string, { date: string; total: number; completed: number; cancelled: number }> = {};

      (data || []).forEach((booking: any) => {
        const date = new Date(booking.created_at).toISOString().split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { date, total: 0, completed: 0, cancelled: 0 };
        }
        byDate[date].total++;
        if (booking.status === 'completed') byDate[date].completed++;
        if (booking.status === 'cancelled') byDate[date].cancelled++;
      });

      return {
        success: true,
        data: Object.values(byDate),
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get bookings analytics');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get bookings analytics',
      });
    }
  });

  // Get revenue analytics
  app.get<{ Querystring: { period?: string } }>('/analytics/revenue', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const period = request.query.period || '7d';

    try {
      const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('tenant_id', tenantId)
        .eq('type', 'credit_purchase')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const byDate: Record<string, { date: string; revenue: number; count: number }> = {};

      (data || []).forEach((tx: any) => {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { date, revenue: 0, count: 0 };
        }
        byDate[date].revenue += tx.amount || 0;
        byDate[date].count++;
      });

      return {
        success: true,
        data: Object.values(byDate),
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get revenue analytics');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get revenue analytics',
      });
    }
  });

  // Get occupancy analytics
  app.get('/analytics/occupancy', async (request: any, reply) => {
    const tenantId = request.adminTenantId;

    try {
      // Get last 30 days of bookings
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('booth_id, start_time, end_time, duration_minutes')
        .eq('tenant_id', tenantId)
        .in('status', ['confirmed', 'active', 'completed'])
        .gte('start_time', startDate.toISOString());

      // Get booths
      const { data: booths } = await supabase
        .from('booths')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Calculate occupancy per booth
      const boothOccupancy = (booths || []).map((booth: any) => {
        const boothBookings = (bookings || []).filter((b: any) => b.booth_id === booth.id);
        const totalMinutes = boothBookings.reduce((sum: number, b: any) => sum + (b.duration_minutes || 0), 0);
        // Assume 12 hours of operation per day (720 minutes)
        const maxMinutes = 30 * 720;
        const occupancyRate = maxMinutes > 0 ? (totalMinutes / maxMinutes) * 100 : 0;

        return {
          booth_id: booth.id,
          booth_name: booth.name,
          total_bookings: boothBookings.length,
          total_minutes: totalMinutes,
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
        };
      });

      return {
        success: true,
        data: boothOccupancy,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get occupancy analytics');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get occupancy analytics',
      });
    }
  });

  // ===========================================
  // Device Actions (Task 20)
  // ===========================================

  // Unlock device
  app.post<{ Params: { id: string } }>('/devices/:id/unlock', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    try {
      // Verify device belongs to tenant
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id, external_id, device_type, booth_id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (deviceError || !device) {
        return reply.code(404).send({
          success: false,
          error: 'Device not found',
        });
      }

      // Import TTLock service dynamically to avoid circular deps
      const { ttlockService } = await import('../services/ttlock.js');

      // Send unlock command with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await ttlockService.unlockDevice(device.external_id);

        clearTimeout(timeoutId);

        // Log audit event
        await logAuditEvent(tenantId, userId, 'device_unlock', 'device', id, {
          device_type: device.device_type,
          booth_id: device.booth_id,
          result: result.success ? 'success' : 'failed',
        });

        if (!result.success) {
          return reply.code(400).send({
            success: false,
            error: result.error || 'Failed to unlock device',
          });
        }

        logger.info({ deviceId: id, tenantId }, 'Device unlocked by admin');

        return { success: true, message: 'Device unlocked successfully' };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          return reply.code(504).send({
            success: false,
            error: 'TTLock operation timed out',
          });
        }
        throw err;
      }
    } catch (error: any) {
      logger.error({ error, tenantId, deviceId: id }, 'Failed to unlock device');

      // Handle TTLock unavailable
      if (error.message?.includes('TTLock') || error.code === 'ECONNREFUSED') {
        return reply.code(503).send({
          success: false,
          error: 'TTLock service unavailable. Please try again later.',
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to unlock device',
      });
    }
  });

  // Sync device status
  app.post<{ Params: { id: string } }>('/devices/:id/sync', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const userId = request.user?.sub || null;
    const { id } = request.params;

    try {
      // Verify device belongs to tenant
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id, external_id, device_type')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (deviceError || !device) {
        return reply.code(404).send({
          success: false,
          error: 'Device not found',
        });
      }

      // Import TTLock service dynamically
      const { ttlockService } = await import('../services/ttlock.js');

      // Sync with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const status = await ttlockService.getDeviceStatus(device.external_id);

        clearTimeout(timeoutId);

        // Update device status in database
        const { error: updateError } = await supabase
          .from('devices')
          .update({
            status: status.locked ? 'locked' : 'unlocked',
            battery_level: status.batteryLevel,
            last_seen: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          logger.warn({ updateError, deviceId: id }, 'Failed to update device status in DB');
        }

        // Log audit event
        await logAuditEvent(tenantId, userId, 'device_sync', 'device', id, {
          device_type: device.device_type,
          status: status,
        });

        logger.info({ deviceId: id, tenantId, status }, 'Device status synced');

        return {
          success: true,
          message: 'Device synced successfully',
          data: {
            status: status.locked ? 'locked' : 'unlocked',
            battery_level: status.batteryLevel,
            last_seen: new Date().toISOString(),
          },
        };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          return reply.code(504).send({
            success: false,
            error: 'TTLock operation timed out',
          });
        }
        throw err;
      }
    } catch (error: any) {
      logger.error({ error, tenantId, deviceId: id }, 'Failed to sync device');

      // Handle TTLock unavailable
      if (error.message?.includes('TTLock') || error.code === 'ECONNREFUSED') {
        return reply.code(503).send({
          success: false,
          error: 'TTLock service unavailable. Please try again later.',
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to sync device status',
      });
    }
  });

  // ===========================================
  // Audit Logs (Phase 2)
  // ===========================================

  // Get audit logs with pagination and filtering
  app.get<{
    Querystring: {
      page?: string;
      limit?: string;
      action?: string;
      resource?: string;
      date_from?: string;
      date_to?: string;
    };
  }>('/audit-logs', async (request: any, reply) => {
    const tenantId = request.adminTenantId;
    const {
      page = '1',
      limit = '50',
      action,
      resource,
      date_from,
      date_to,
    } = request.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          resource,
          resource_id,
          details,
          created_at,
          users(id, email, full_name)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (action) {
        query = query.eq('action', action);
      }
      if (resource) {
        query = query.eq('resource', resource);
      }
      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const { count: total } = await query;

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) throw error;

      // Get unique actions and resources for filter dropdowns
      const { data: actionsData } = await supabase
        .from('audit_logs')
        .select('action')
        .eq('tenant_id', tenantId);

      const { data: resourcesData } = await supabase
        .from('audit_logs')
        .select('resource')
        .eq('tenant_id', tenantId);

      const uniqueActions = [...new Set(actionsData?.map((a: any) => a.action) || [])];
      const uniqueResources = [...new Set(resourcesData?.map((r: any) => r.resource) || [])];

      return {
        success: true,
        data,
        meta: {
          total: total || 0,
          page: pageNum,
          limit: limitNum,
          filters: {
            actions: uniqueActions,
            resources: uniqueResources,
          },
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get audit logs');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get audit logs',
      });
    }
  });
};
