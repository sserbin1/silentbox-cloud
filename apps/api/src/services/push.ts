// ===========================================
// Push Notification Service (Firebase Cloud Messaging)
// ===========================================

import { logger } from '../lib/logger.js';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendOptions {
  token?: string;
  tokens?: string[];
  topic?: string;
}

// Firebase Admin SDK initialization
let firebaseApp: any = null;
let messaging: any = null;

async function initializeFirebase() {
  if (firebaseApp) return;

  try {
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');

    const env = await import('../lib/env.js').then((m) => m.env);

    // Parse the private key (handles escaped newlines)
    const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!env.FIREBASE_PROJECT_ID || !privateKey || !env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('Firebase credentials not configured, push notifications disabled');
      return;
    }

    firebaseApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    messaging = getMessaging(firebaseApp);
    logger.info('Firebase initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Firebase');
  }
}

// Initialize on module load
initializeFirebase();

export class PushNotificationService {
  // Send to a single device
  async sendToDevice(token: string, message: PushMessage): Promise<boolean> {
    if (!messaging) {
      logger.warn('Push notifications not available');
      return false;
    }

    try {
      const result = await messaging.send({
        token,
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.imageUrl,
        },
        data: message.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'silentbox_default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      logger.debug({ messageId: result }, 'Push notification sent');
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        logger.warn({ token }, 'Push token no longer valid');
        // TODO: Mark token as invalid in database
      } else {
        logger.error({ error, token }, 'Failed to send push notification');
      }
      return false;
    }
  }

  // Send to multiple devices
  async sendToDevices(tokens: string[], message: PushMessage): Promise<{ success: number; failure: number }> {
    if (!messaging || tokens.length === 0) {
      return { success: 0, failure: tokens.length };
    }

    try {
      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.imageUrl,
        },
        data: message.data,
      });

      logger.info({
        success: result.successCount,
        failure: result.failureCount,
      }, 'Multicast push sent');

      return {
        success: result.successCount,
        failure: result.failureCount,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to send multicast push');
      return { success: 0, failure: tokens.length };
    }
  }

  // Send to a topic (all subscribers)
  async sendToTopic(topic: string, message: PushMessage): Promise<boolean> {
    if (!messaging) return false;

    try {
      await messaging.send({
        topic,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data,
      });

      logger.debug({ topic }, 'Topic push sent');
      return true;
    } catch (error) {
      logger.error({ error, topic }, 'Failed to send topic push');
      return false;
    }
  }

  // Subscribe device to topic
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!messaging) return;

    try {
      await messaging.subscribeToTopic(tokens, topic);
      logger.debug({ topic, count: tokens.length }, 'Subscribed to topic');
    } catch (error) {
      logger.error({ error, topic }, 'Failed to subscribe to topic');
    }
  }

  // Unsubscribe device from topic
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!messaging) return;

    try {
      await messaging.unsubscribeFromTopic(tokens, topic);
      logger.debug({ topic, count: tokens.length }, 'Unsubscribed from topic');
    } catch (error) {
      logger.error({ error, topic }, 'Failed to unsubscribe from topic');
    }
  }
}

// Singleton instance
export const pushService = new PushNotificationService();

// ===========================================
// Notification Templates
// ===========================================

export const NotificationTemplates = {
  bookingConfirmed: (boothName: string, startTime: Date) => ({
    title: 'Booking Confirmed! ✅',
    body: `Your booking at ${boothName} is confirmed for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    data: { type: 'booking_confirmed' },
  }),

  bookingReminder: (boothName: string, minutesUntil: number) => ({
    title: `Reminder: ${minutesUntil} min to your session`,
    body: `Your booking at ${boothName} starts soon. Don't forget!`,
    data: { type: 'booking_reminder' },
  }),

  sessionStarting: (boothName: string, accessCode: string) => ({
    title: 'Your Session is Starting! 🚀',
    body: `Time to use ${boothName}. Your access code: ${accessCode}`,
    data: { type: 'session_starting', accessCode },
  }),

  sessionEnding: (minutesLeft: number) => ({
    title: `${minutesLeft} minutes remaining`,
    body: 'Your session is ending soon. Extend now if you need more time.',
    data: { type: 'session_ending' },
  }),

  sessionEnded: () => ({
    title: 'Session Ended',
    body: 'Thank you for using Silentbox! Hope to see you again.',
    data: { type: 'session_ended' },
  }),

  creditsLow: (credits: number) => ({
    title: 'Low Credits Balance',
    body: `You have ${credits} credits remaining. Top up to continue booking.`,
    data: { type: 'credits_low' },
  }),

  creditsPurchased: (amount: number) => ({
    title: 'Credits Added! 💰',
    body: `${amount} credits have been added to your account.`,
    data: { type: 'credits_purchased' },
  }),

  unlockFailed: (accessCode: string) => ({
    title: 'Unlock Failed',
    body: `Please use PIN code: ${accessCode} at the keypad.`,
    data: { type: 'unlock_failed', accessCode },
  }),
};
