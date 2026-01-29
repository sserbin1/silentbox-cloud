// ===========================================
// Notification Triggers Service
// ===========================================

import { supabaseAdmin } from '../lib/supabase.js';
import { pushService, NotificationTemplates } from './push.js';
import { logger } from '../lib/logger.js';

export class NotificationService {
  // Send booking confirmation
  async onBookingConfirmed(bookingId: string, userId: string, boothName: string, startTime: Date) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.bookingConfirmed(boothName, startTime);
    await pushService.sendToDevice(token, {
      ...message,
      data: { ...message.data, bookingId },
    });

    await this.saveNotification(userId, 'booking_confirmed', message.title, message.body, { bookingId });
  }

  // Send session starting notification (5 min before)
  async onSessionStarting(bookingId: string, userId: string, boothName: string, accessCode: string) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.sessionStarting(boothName, accessCode);
    await pushService.sendToDevice(token, {
      ...message,
      data: { ...message.data, bookingId },
    });

    await this.saveNotification(userId, 'session_starting', message.title, message.body, { bookingId, accessCode });
  }

  // Send session ending warning (15 min before, 5 min before)
  async onSessionEnding(bookingId: string, userId: string, minutesLeft: number) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.sessionEnding(minutesLeft);
    await pushService.sendToDevice(token, {
      ...message,
      data: { ...message.data, bookingId },
    });

    await this.saveNotification(userId, 'session_ending', message.title, message.body, { bookingId });
  }

  // Send session ended notification
  async onSessionEnded(bookingId: string, userId: string) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.sessionEnded();
    await pushService.sendToDevice(token, {
      ...message,
      data: { ...message.data, bookingId },
    });

    await this.saveNotification(userId, 'session_ended', message.title, message.body, { bookingId });
  }

  // Send credits purchased notification
  async onCreditsPurchased(userId: string, amount: number) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.creditsPurchased(amount);
    await pushService.sendToDevice(token, message);

    await this.saveNotification(userId, 'credits_purchased', message.title, message.body, { amount });
  }

  // Send low credits warning (when below 30)
  async onCreditsLow(userId: string, credits: number) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.creditsLow(credits);
    await pushService.sendToDevice(token, message);

    await this.saveNotification(userId, 'credits_low', message.title, message.body, { credits });
  }

  // Send unlock failed notification with PIN fallback
  async onUnlockFailed(userId: string, accessCode: string) {
    const token = await this.getUserPushToken(userId);
    if (!token) return;

    const message = NotificationTemplates.unlockFailed(accessCode);
    await pushService.sendToDevice(token, message);

    await this.saveNotification(userId, 'unlock_failed', message.title, message.body, { accessCode });
  }

  // Helper: Get user's push token
  private async getUserPushToken(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error || !data?.push_token) {
      return null;
    }

    return data.push_token;
  }

  // Helper: Save notification to database
  private async saveNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data: Record<string, any>
  ) {
    try {
      // Get user's tenant_id
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      if (!user) return;

      await supabaseAdmin.from('notifications').insert({
        tenant_id: user.tenant_id,
        user_id: userId,
        type,
        title,
        body,
        data,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error, userId, type }, 'Failed to save notification');
    }
  }
}

export const notificationService = new NotificationService();

// ===========================================
// Scheduled Notification Jobs (to be called by cron)
// ===========================================

export async function processBookingReminders() {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now

  // Find bookings starting in ~30 min that haven't been reminded
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, booths(name), users(push_token)')
    .eq('status', 'confirmed')
    .gte('start_time', now.toISOString())
    .lte('start_time', reminderTime.toISOString());

  if (error || !bookings) return;

  for (const booking of bookings) {
    const token = (booking.users as any)?.push_token;
    if (!token) continue;

    const boothName = (booking.booths as any)?.name || 'your booth';
    const message = NotificationTemplates.bookingReminder(boothName, 30);

    await pushService.sendToDevice(token, {
      ...message,
      data: { ...message.data, bookingId: booking.id },
    });
  }
}

export async function processSessionEndingWarnings() {
  const now = new Date();
  const warningTime15 = new Date(now.getTime() + 15 * 60 * 1000);
  const warningTime5 = new Date(now.getTime() + 5 * 60 * 1000);

  // Find active sessions ending in ~15 min
  const { data: sessions15 } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, users(push_token)')
    .eq('status', 'active')
    .gte('end_time', warningTime15.toISOString())
    .lte('end_time', new Date(warningTime15.getTime() + 60000).toISOString());

  for (const session of sessions15 || []) {
    await notificationService.onSessionEnding(session.id, session.user_id, 15);
  }

  // Find active sessions ending in ~5 min
  const { data: sessions5 } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, users(push_token)')
    .eq('status', 'active')
    .gte('end_time', warningTime5.toISOString())
    .lte('end_time', new Date(warningTime5.getTime() + 60000).toISOString());

  for (const session of sessions5 || []) {
    await notificationService.onSessionEnding(session.id, session.user_id, 5);
  }
}
