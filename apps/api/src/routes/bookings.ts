// ===========================================
// Bookings Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { createBookingSchema, extendBookingSchema, cancelBookingSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { ERROR_CODES, MIN_BOOKING_DURATION_MINUTES } from '@silentbox/shared';
import { ttlockService } from '../services/ttlock.js';
import { notificationService } from '../services/notifications.js';
import { calendarService } from '../services/calendar.js';
import { logger } from '../lib/logger.js';

export const bookingsRoutes = async (app: FastifyInstance) => {
  // Create booking
  app.post('/', { preHandler: authMiddleware }, async (request, reply) => {
    const body = createBookingSchema.parse(request.body);
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    // Get booth details
    const { data: booth, error: boothError } = await supabaseAdmin
      .from('booths')
      .select('*, locations(timezone)')
      .eq('id', body.boothId)
      .eq('tenant_id', tenantId)
      .single();

    if (boothError || !booth) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Booth not found',
        },
      });
    }

    if (booth.status !== 'available') {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.SLOT_NOT_AVAILABLE,
          message: 'Booth is not available',
        },
      });
    }

    // Calculate end time and price
    const startTime = new Date(body.startTime);
    const endTime = new Date(startTime.getTime() + body.durationMinutes * 60 * 1000);
    const slots = body.durationMinutes / 15;
    const totalPrice = slots * booth.price_per_15min;

    // Check user credits
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (userError || !user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    if (user.credits < totalPrice) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_CREDITS,
          message: `Insufficient credits. Required: ${totalPrice}, Available: ${user.credits}`,
        },
      });
    }

    // Generate access code
    const accessCode = generateAccessCode();

    // Create booking (exclusion constraint will prevent double booking)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        booth_id: body.boothId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: body.durationMinutes,
        total_price: totalPrice,
        currency: booth.currency,
        status: 'confirmed',
        access_code: accessCode,
        unlock_method: booth.has_gateway ? 'remote' : 'bluetooth',
      })
      .select()
      .single();

    if (bookingError) {
      // Check if it's a conflict error (double booking)
      if (bookingError.code === '23P01') {
        return reply.status(409).send({
          success: false,
          error: {
            code: ERROR_CODES.SLOT_NOT_AVAILABLE,
            message: 'Time slot is no longer available',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create booking',
        },
      });
    }

    // Deduct credits
    const { error: creditError } = await supabaseAdmin
      .from('users')
      .update({ credits: user.credits - totalPrice })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (creditError) {
      // Rollback booking
      await supabaseAdmin.from('bookings').delete().eq('id', booking.id);
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to process payment',
        },
      });
    }

    // Create transaction record
    await supabaseAdmin.from('transactions').insert({
      tenant_id: tenantId,
      user_id: userId,
      booking_id: booking.id,
      type: 'booking_charge',
      amount: -totalPrice,
      currency: booth.currency,
      payment_provider: 'credits',
      status: 'completed',
    });

    // Background integrations (don't block response)
    setImmediate(async () => {
      try {
        // Create TTLock passcode if lock is configured
        if (booth.lock_id) {
          const ttlockToken = await getTenantTTLockToken(tenantId);
          if (ttlockToken) {
            const passcode = await ttlockService.generatePasscode(
              ttlockToken,
              booth.lock_id,
              startTime,
              endTime,
              `Booking-${booking.id}`
            );
            if (passcode) {
              await supabaseAdmin
                .from('bookings')
                .update({
                  access_code: passcode.keyboardPwd,
                  passcode_id: passcode.keyboardPwdId,
                })
                .eq('id', booking.id);
              logger.info({ bookingId: booking.id }, 'TTLock passcode created');
            }
          }
        }

        // Create Google Calendar event
        const calendarToken = await getTenantCalendarToken(tenantId);
        if (calendarToken) {
          const calendarEvent = await calendarService.createBookingEvent(
            calendarToken.accessToken,
            calendarToken.calendarId,
            {
              summary: `Silentbox: ${booth.name}`,
              description: `Booking ID: ${booking.id}\nAccess Code: ${booking.access_code}`,
              startTime,
              endTime,
              location: booth.locations?.address,
            }
          );
          if (calendarEvent) {
            await supabaseAdmin
              .from('bookings')
              .update({ calendar_event_id: calendarEvent.id })
              .eq('id', booking.id);
          }
        }

        // Send push notification
        await notificationService.onBookingConfirmed(
          booking.id,
          userId,
          booth.name,
          startTime
        );
      } catch (error) {
        logger.error({ error, bookingId: booking.id }, 'Background booking integrations failed');
      }
    });

    return reply.status(201).send({
      success: true,
      data: {
        ...booking,
        booth: {
          name: booth.name,
          locationName: booth.locations?.name,
        },
      },
    });
  });

  // Get user's bookings
  app.get('/', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;
    const { status, page = 1, limit = 20 } = request.query as {
      status?: string;
      page?: number;
      limit?: number;
    };
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('bookings')
      .select('*, booths(name, images, locations(name, address))', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('start_time', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch bookings',
        },
      });
    }

    return reply.send({
      success: true,
      data: bookings,
      meta: {
        page,
        limit,
        total: count || 0,
      },
    });
  });

  // Get single booking
  app.get('/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, booths(*, locations(name, address, latitude, longitude))')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !booking) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: booking,
    });
  });

  // Extend booking
  app.post('/:id/extend', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = extendBookingSchema.parse(request.body);
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, booths(price_per_15min, currency)')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (bookingError || !booking) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found',
        },
      });
    }

    if (booking.status !== 'active' && booking.status !== 'confirmed') {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_CANNOT_CANCEL,
          message: 'Cannot extend this booking',
        },
      });
    }

    // Calculate new end time and additional price
    const currentEndTime = new Date(booking.end_time);
    const newEndTime = new Date(currentEndTime.getTime() + body.additionalMinutes * 60 * 1000);
    const additionalSlots = body.additionalMinutes / 15;
    const additionalPrice = additionalSlots * booking.booths.price_per_15min;

    // Check credits
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!user || user.credits < additionalPrice) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_CREDITS,
          message: 'Insufficient credits for extension',
        },
      });
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        end_time: newEndTime.toISOString(),
        duration_minutes: booking.duration_minutes + body.additionalMinutes,
        total_price: booking.total_price + additionalPrice,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to extend booking',
        },
      });
    }

    // Deduct credits
    await supabaseAdmin
      .from('users')
      .update({ credits: user.credits - additionalPrice })
      .eq('id', userId);

    // Create transaction
    await supabaseAdmin.from('transactions').insert({
      tenant_id: tenantId,
      user_id: userId,
      booking_id: id,
      type: 'booking_charge',
      amount: -additionalPrice,
      currency: booking.booths.currency,
      payment_provider: 'credits',
      status: 'completed',
    });

    return reply.send({
      success: true,
      data: updatedBooking,
    });
  });

  // Cancel booking
  app.post('/:id/cancel', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = cancelBookingSchema.parse(request.body);
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (bookingError || !booking) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found',
        },
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_CANNOT_CANCEL,
          message: 'Cannot cancel this booking',
        },
      });
    }

    // Calculate refund (full refund if more than 1 hour before start)
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const refundAmount = hoursUntilStart >= 1 ? booking.total_price : 0;

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancellation_reason: body.reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to cancel booking',
        },
      });
    }

    // Refund credits if applicable
    if (refundAmount > 0) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (user) {
        await supabaseAdmin
          .from('users')
          .update({ credits: user.credits + refundAmount })
          .eq('id', userId);

        await supabaseAdmin.from('transactions').insert({
          tenant_id: tenantId,
          user_id: userId,
          booking_id: id,
          type: 'refund',
          amount: refundAmount,
          currency: booking.currency,
          payment_provider: 'credits',
          status: 'completed',
        });
      }
    }

    // Background cleanup (don't block response)
    setImmediate(async () => {
      try {
        // Delete TTLock passcode
        if (booking.passcode_id && booking.booth_id) {
          const { data: booth } = await supabaseAdmin
            .from('booths')
            .select('lock_id')
            .eq('id', booking.booth_id)
            .single();

          if (booth?.lock_id) {
            const ttlockToken = await getTenantTTLockToken(tenantId);
            if (ttlockToken) {
              await ttlockService.deletePasscode(
                ttlockToken,
                booth.lock_id,
                booking.passcode_id
              );
              logger.info({ bookingId: id }, 'TTLock passcode deleted');
            }
          }
        }

        // Delete Google Calendar event
        if (booking.calendar_event_id) {
          const calendarToken = await getTenantCalendarToken(tenantId);
          if (calendarToken) {
            await calendarService.deleteEvent(
              calendarToken.accessToken,
              calendarToken.calendarId,
              booking.calendar_event_id
            );
          }
        }
      } catch (error) {
        logger.error({ error, bookingId: id }, 'Background booking cleanup failed');
      }
    });

    return reply.send({
      success: true,
      data: {
        ...updatedBooking,
        refundAmount,
      },
    });
  });
};

// ===========================================
// Helper Functions
// ===========================================

async function getTenantTTLockToken(tenantId: string): Promise<string | null> {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  if (!tenant?.settings) return null;

  const settings = tenant.settings as any;
  const accessToken = settings.ttlock_access_token;
  const refreshToken = settings.ttlock_refresh_token;
  const expiresAt = settings.ttlock_expires_at;

  if (!accessToken) return null;

  // Check if token needs refresh
  if (expiresAt && new Date(expiresAt) < new Date()) {
    if (!refreshToken) return null;

    const newTokens = await ttlockService.refreshAccessToken(refreshToken);
    if (!newTokens) return null;

    // Update stored tokens
    await supabaseAdmin
      .from('tenants')
      .update({
        settings: {
          ...settings,
          ttlock_access_token: newTokens.accessToken,
          ttlock_refresh_token: newTokens.refreshToken,
          ttlock_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
        },
      })
      .eq('id', tenantId);

    return newTokens.accessToken;
  }

  return accessToken;
}

async function getTenantCalendarToken(tenantId: string): Promise<{ accessToken: string; calendarId: string } | null> {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  if (!tenant?.settings) return null;

  const settings = tenant.settings as any;
  const accessToken = settings.google_calendar_access_token;
  const calendarId = settings.google_calendar_id;

  if (!accessToken || !calendarId) return null;

  return { accessToken, calendarId };
}

// Helper to generate 6-digit access code
function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
