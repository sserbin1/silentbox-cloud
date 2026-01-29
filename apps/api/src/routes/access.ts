// ===========================================
// Access Control Routes (Door Unlock)
// ===========================================

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';
import { ttlockService } from '../services/ttlock.js';
import { notificationService } from '../services/notifications.js';
import { logger } from '../lib/logger.js';

export const accessRoutes = async (app: FastifyInstance) => {
  // Request door unlock
  app.post('/unlock/:bookingId', { preHandler: authMiddleware }, async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    // Get booking with booth details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, booths(id, name, lock_id, has_gateway)')
      .eq('id', bookingId)
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

    // Check booking is active or within grace period
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const gracePeriodMinutes = 5;

    const canUnlock =
      (booking.status === 'confirmed' &&
        now >= new Date(startTime.getTime() - gracePeriodMinutes * 60 * 1000) &&
        now <= startTime) ||
      (booking.status === 'active' && now <= endTime);

    if (!canUnlock) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.ACCESS_DENIED,
          message: 'Cannot unlock outside booking time window',
        },
      });
    }

    const booth = booking.booths as any;

    if (!booth.lock_id) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.DEVICE_NOT_FOUND,
          message: 'No lock device configured for this booth',
        },
      });
    }

    let unlockResult: UnlockResult;

    // Get TTLock token
    const ttlockToken = await getTenantTTLockToken(tenantId);

    if (!ttlockToken) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Lock service not configured',
        },
      });
    }

    if (booth.has_gateway && booking.unlock_method === 'remote') {
      // Remote unlock via TTLock API (requires gateway)
      unlockResult = await performRemoteUnlock(ttlockToken, booth.lock_id, booking);
    } else {
      // Bluetooth unlock - return credentials for app to use
      unlockResult = await getBluetoothCredentials(ttlockToken, booth.lock_id, booking);
    }

    // Log access attempt
    await supabaseAdmin.from('access_logs').insert({
      tenant_id: tenantId,
      booking_id: bookingId,
      booth_id: booth.id,
      user_id: userId,
      access_type: unlockResult.method,
      status: unlockResult.success ? 'granted' : 'denied',
      metadata: {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    // If first unlock and booking is confirmed, activate it
    if (booking.status === 'confirmed' && unlockResult.success) {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'active',
          actual_start_time: now.toISOString(),
        })
        .eq('id', bookingId);

      // Update booth status
      await supabaseAdmin
        .from('booths')
        .update({ status: 'occupied' })
        .eq('id', booth.id);

      logger.info({ bookingId, userId }, 'Booking activated on first unlock');
    }

    if (!unlockResult.success) {
      // Send notification about unlock failure with PIN fallback
      await notificationService.onUnlockFailed(userId, booking.access_code);

      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.UNLOCK_FAILED,
          message: unlockResult.error || 'Failed to unlock door',
        },
        data: {
          fallbackCode: booking.access_code,
          message: 'Use PIN code on keypad as fallback',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        method: unlockResult.method,
        accessCode: booking.access_code,
        ...(unlockResult.method === 'bluetooth' && {
          bluetoothCredentials: unlockResult.credentials,
        }),
        message: unlockResult.method === 'remote' ? 'Door unlocked' : 'Use Bluetooth to unlock',
      },
    });
  });

  // Get access code for manual entry
  app.get('/code/:bookingId', { preHandler: authMiddleware }, async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('access_code, status, start_time, end_time')
      .eq('id', bookingId)
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

    if (booking.status !== 'confirmed' && booking.status !== 'active') {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.ACCESS_DENIED,
          message: 'Access code not available for this booking status',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        accessCode: booking.access_code,
        validFrom: booking.start_time,
        validUntil: booking.end_time,
      },
    });
  });

  // Get access history
  app.get('/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const offset = (page - 1) * limit;

    const { data: logs, error, count } = await supabaseAdmin
      .from('access_logs')
      .select('*, booths(name), bookings(start_time, end_time)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch access history',
        },
      });
    }

    return reply.send({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total: count || 0,
      },
    });
  });
};

// ===========================================
// TTLock Integration Helpers
// ===========================================

interface UnlockResult {
  success: boolean;
  method: 'remote' | 'bluetooth';
  credentials?: BluetoothCredentials;
  error?: string;
}

interface BluetoothCredentials {
  lockId: number;
  lockData: string;
  lockMac: string;
  aesKey: string;
  accessToken: string;
  startDate: number;
  endDate: number;
}

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

async function performRemoteUnlock(
  accessToken: string,
  lockId: number,
  booking: any
): Promise<UnlockResult> {
  try {
    const success = await ttlockService.unlockRemote(accessToken, lockId);

    if (success) {
      logger.info({ lockId, bookingId: booking.id }, 'Remote unlock successful');
      return { success: true, method: 'remote' };
    } else {
      return {
        success: false,
        method: 'remote',
        error: 'Remote unlock failed - try Bluetooth or use PIN code',
      };
    }
  } catch (error) {
    logger.error({ error, lockId }, 'Remote unlock error');
    return {
      success: false,
      method: 'remote',
      error: 'Failed to communicate with lock gateway',
    };
  }
}

async function getBluetoothCredentials(
  accessToken: string,
  lockId: number,
  booking: any
): Promise<UnlockResult> {
  try {
    // Get lock details for Bluetooth SDK
    const lockDetail = await ttlockService.getLockDetail(accessToken, lockId);

    if (!lockDetail) {
      return {
        success: false,
        method: 'bluetooth',
        error: 'Failed to get lock credentials',
      };
    }

    const startDate = new Date(booking.start_time).getTime();
    const endDate = new Date(booking.end_time).getTime();

    return {
      success: true,
      method: 'bluetooth',
      credentials: {
        lockId: lockDetail.lockId,
        lockData: lockDetail.lockData,
        lockMac: lockDetail.lockMac,
        aesKey: lockDetail.aesKeyStr,
        accessToken,
        startDate,
        endDate,
      },
    };
  } catch (error) {
    logger.error({ error, lockId }, 'Bluetooth credentials error');
    return {
      success: false,
      method: 'bluetooth',
      error: 'Failed to get Bluetooth credentials',
    };
  }
}
