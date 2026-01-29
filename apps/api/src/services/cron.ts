// ===========================================
// Cron Job Scheduler Service
// ===========================================

import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { notificationService, processBookingReminders, processSessionEndingWarnings } from './notifications.js';
import { ttlockService } from './ttlock.js';

interface CronJobConfig {
  name: string;
  interval: number; // milliseconds
  handler: () => Promise<void>;
  enabled: boolean;
}

class CronScheduler {
  private jobs: Map<string, NodeJS.Timer> = new Map();
  private isRunning = false;

  // Start all cron jobs
  start() {
    if (this.isRunning) {
      logger.warn('Cron scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting cron scheduler');

    const jobs: CronJobConfig[] = [
      {
        name: 'booking-reminders-30min',
        interval: 60 * 1000, // Every 1 minute
        handler: processBookingReminders,
        enabled: true,
      },
      {
        name: 'session-ending-warnings',
        interval: 60 * 1000, // Every 1 minute
        handler: processSessionEndingWarnings,
        enabled: true,
      },
      {
        name: 'session-auto-start',
        interval: 60 * 1000, // Every 1 minute
        handler: this.processSessionAutoStart.bind(this),
        enabled: true,
      },
      {
        name: 'session-auto-end',
        interval: 60 * 1000, // Every 1 minute
        handler: this.processSessionAutoEnd.bind(this),
        enabled: true,
      },
      {
        name: 'expired-bookings-cleanup',
        interval: 5 * 60 * 1000, // Every 5 minutes
        handler: this.processExpiredBookings.bind(this),
        enabled: true,
      },
      {
        name: 'passcode-cleanup',
        interval: 15 * 60 * 1000, // Every 15 minutes
        handler: this.cleanupExpiredPasscodes.bind(this),
        enabled: true,
      },
      {
        name: 'device-status-check',
        interval: 30 * 60 * 1000, // Every 30 minutes
        handler: this.checkDeviceStatus.bind(this),
        enabled: true,
      },
    ];

    for (const job of jobs) {
      if (!job.enabled) continue;

      const timer = setInterval(async () => {
        try {
          logger.debug({ job: job.name }, 'Running cron job');
          await job.handler();
        } catch (error) {
          logger.error({ error, job: job.name }, 'Cron job failed');
        }
      }, job.interval);

      this.jobs.set(job.name, timer);
      logger.info({ job: job.name, intervalMs: job.interval }, 'Cron job registered');
    }

    // Run immediate checks on startup
    this.runImmediateChecks();
  }

  // Stop all cron jobs
  stop() {
    for (const [name, timer] of this.jobs) {
      clearInterval(timer);
      logger.info({ job: name }, 'Cron job stopped');
    }
    this.jobs.clear();
    this.isRunning = false;
    logger.info('Cron scheduler stopped');
  }

  // Run critical checks immediately on startup
  private async runImmediateChecks() {
    try {
      await this.processSessionAutoStart();
      await this.processSessionAutoEnd();
      await processBookingReminders();
      await processSessionEndingWarnings();
    } catch (error) {
      logger.error({ error }, 'Immediate cron checks failed');
    }
  }

  // ===========================================
  // Session Auto-Start
  // ===========================================
  // Automatically start sessions when booking time begins

  private async processSessionAutoStart() {
    const now = new Date();
    const bufferTime = new Date(now.getTime() - 60 * 1000); // 1 min grace period

    // Find confirmed bookings that should start
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, user_id, tenant_id,
        booths(id, name, lock_id),
        start_time
      `)
      .eq('status', 'confirmed')
      .lte('start_time', now.toISOString())
      .gte('start_time', bufferTime.toISOString());

    if (error) {
      logger.error({ error }, 'Failed to fetch bookings for auto-start');
      return;
    }

    for (const booking of bookings || []) {
      try {
        const booth = booking.booths as any;

        // Update booking status to active
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'active',
            actual_start_time: now.toISOString(),
          })
          .eq('id', booking.id);

        // Update booth status
        await supabaseAdmin
          .from('booths')
          .update({ status: 'occupied' })
          .eq('id', booth.id);

        // Generate access code if lock is configured
        let accessCode: string | undefined;
        if (booth.lock_id) {
          // Get TTLock access token for tenant
          const tokenData = await this.getTenantTTLockToken(booking.tenant_id);
          if (tokenData) {
            const endTime = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
            const passcode = await ttlockService.generatePasscode(
              tokenData.accessToken,
              booth.lock_id,
              now,
              endTime,
              `Booking-${booking.id}`
            );
            if (passcode) {
              accessCode = passcode.keyboardPwd;

              // Save passcode to booking
              await supabaseAdmin
                .from('bookings')
                .update({
                  access_code: accessCode,
                  passcode_id: passcode.keyboardPwdId,
                })
                .eq('id', booking.id);
            }
          }
        }

        // Notify user
        await notificationService.onSessionStarting(
          booking.id,
          booking.user_id,
          booth.name,
          accessCode || 'N/A'
        );

        logger.info({ bookingId: booking.id }, 'Session auto-started');
      } catch (error) {
        logger.error({ error, bookingId: booking.id }, 'Failed to auto-start session');
      }
    }
  }

  // ===========================================
  // Session Auto-End
  // ===========================================
  // Automatically end sessions when booking time ends

  private async processSessionAutoEnd() {
    const now = new Date();

    // Find active sessions that should end
    const { data: sessions, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, user_id, tenant_id, passcode_id,
        booths(id, name, lock_id)
      `)
      .eq('status', 'active')
      .lte('end_time', now.toISOString());

    if (error) {
      logger.error({ error }, 'Failed to fetch sessions for auto-end');
      return;
    }

    for (const session of sessions || []) {
      try {
        const booth = session.booths as any;

        // Update booking status to completed
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'completed',
            actual_end_time: now.toISOString(),
          })
          .eq('id', session.id);

        // Update booth status to available
        await supabaseAdmin
          .from('booths')
          .update({ status: 'available' })
          .eq('id', booth.id);

        // Delete passcode if exists
        if (booth.lock_id && session.passcode_id) {
          const tokenData = await this.getTenantTTLockToken(session.tenant_id);
          if (tokenData) {
            await ttlockService.deletePasscode(
              tokenData.accessToken,
              booth.lock_id,
              session.passcode_id
            );
          }
        }

        // Notify user
        await notificationService.onSessionEnded(session.id, session.user_id);

        logger.info({ bookingId: session.id }, 'Session auto-ended');
      } catch (error) {
        logger.error({ error, bookingId: session.id }, 'Failed to auto-end session');
      }
    }
  }

  // ===========================================
  // Expired Bookings Cleanup
  // ===========================================
  // Cancel bookings that were never activated

  private async processExpiredBookings() {
    const now = new Date();
    const graceEnd = new Date(now.getTime() - 15 * 60 * 1000); // 15 min grace period

    // Find confirmed bookings that are past their start time + grace
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, tenant_id, credits_used, booths(id, name)')
      .eq('status', 'confirmed')
      .lt('start_time', graceEnd.toISOString());

    if (error) {
      logger.error({ error }, 'Failed to fetch expired bookings');
      return;
    }

    for (const booking of bookings || []) {
      try {
        const booth = booking.booths as any;

        // Mark as no-show
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'no_show' })
          .eq('id', booking.id);

        // Refund credits (partial - 50%)
        if (booking.credits_used > 0) {
          const refundAmount = Math.floor(booking.credits_used * 0.5);
          await supabaseAdmin.rpc('add_user_credits', {
            p_user_id: booking.user_id,
            p_amount: refundAmount,
          });
        }

        // Free up the booth
        await supabaseAdmin
          .from('booths')
          .update({ status: 'available' })
          .eq('id', booth.id);

        logger.info({ bookingId: booking.id }, 'Expired booking processed');
      } catch (error) {
        logger.error({ error, bookingId: booking.id }, 'Failed to process expired booking');
      }
    }
  }

  // ===========================================
  // Passcode Cleanup
  // ===========================================
  // Clean up any stale passcodes from TTLock

  private async cleanupExpiredPasscodes() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Find completed/cancelled bookings with passcodes not yet deleted
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, tenant_id, passcode_id, booths(lock_id)')
      .in('status', ['completed', 'cancelled', 'no_show'])
      .not('passcode_id', 'is', null)
      .lt('end_time', cutoff.toISOString());

    if (error) {
      logger.error({ error }, 'Failed to fetch bookings for passcode cleanup');
      return;
    }

    for (const booking of bookings || []) {
      try {
        const booth = booking.booths as any;
        if (!booth.lock_id || !booking.passcode_id) continue;

        const tokenData = await this.getTenantTTLockToken(booking.tenant_id);
        if (!tokenData) continue;

        const deleted = await ttlockService.deletePasscode(
          tokenData.accessToken,
          booth.lock_id,
          booking.passcode_id
        );

        if (deleted) {
          await supabaseAdmin
            .from('bookings')
            .update({ passcode_id: null })
            .eq('id', booking.id);

          logger.debug({ bookingId: booking.id }, 'Cleaned up stale passcode');
        }
      } catch (error) {
        logger.error({ error, bookingId: booking.id }, 'Failed to cleanup passcode');
      }
    }
  }

  // ===========================================
  // Device Status Check
  // ===========================================
  // Check battery levels and connectivity for all locks

  private async checkDeviceStatus() {
    // Get all tenants with TTLock configured
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id, settings')
      .not('settings->ttlock_access_token', 'is', null);

    if (error || !tenants) {
      logger.error({ error }, 'Failed to fetch tenants for device check');
      return;
    }

    for (const tenant of tenants) {
      try {
        const settings = tenant.settings as any;
        const accessToken = settings?.ttlock_access_token;
        if (!accessToken) continue;

        // Get all booths with locks for this tenant
        const { data: booths } = await supabaseAdmin
          .from('booths')
          .select('id, lock_id, name')
          .eq('tenant_id', tenant.id)
          .not('lock_id', 'is', null);

        for (const booth of booths || []) {
          const batteryLevel = await ttlockService.getBatteryLevel(accessToken, booth.lock_id);

          if (batteryLevel !== null) {
            // Update device status
            await supabaseAdmin
              .from('devices')
              .update({
                battery_level: batteryLevel,
                last_ping: new Date().toISOString(),
                status: batteryLevel < 20 ? 'low_battery' : 'online',
              })
              .eq('booth_id', booth.id);

            // Alert if battery is low
            if (batteryLevel < 20) {
              logger.warn({ boothId: booth.id, batteryLevel }, 'Low battery on lock');
              // TODO: Send alert to admin
            }
          }
        }
      } catch (error) {
        logger.error({ error, tenantId: tenant.id }, 'Failed to check device status');
      }
    }
  }

  // ===========================================
  // Helpers
  // ===========================================

  private async getTenantTTLockToken(tenantId: string): Promise<{ accessToken: string } | null> {
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

      return { accessToken: newTokens.accessToken };
    }

    return { accessToken };
  }
}

export const cronScheduler = new CronScheduler();
