// ===========================================
// Push Notification Service (Mobile)
// ===========================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from '../lib/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialize push notifications
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.pushToken = token.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('silentbox_default', {
          name: 'Silentbox Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('silentbox_reminders', {
          name: 'Booking Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('silentbox_sessions', {
          name: 'Session Updates',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Register token with backend
  async registerWithBackend(): Promise<boolean> {
    if (!this.pushToken) {
      await this.initialize();
    }

    if (!this.pushToken) return false;

    try {
      const response = await api.post('/notifications/register', {
        token: this.pushToken,
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
      });

      return response.success;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return false;
    }
  }

  // Listen for incoming notifications
  setupListeners(): () => void {
    // Handle notification received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // You can update UI, show in-app toast, etc.
      }
    );

    // Handle notification tap (user interaction)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        this.handleNotificationTap(data);
      }
    );

    // Return cleanup function
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }

  // Handle notification tap navigation
  private handleNotificationTap(data: Record<string, unknown>) {
    const type = data.type as string;

    switch (type) {
      case 'booking_confirmed':
      case 'booking_reminder':
      case 'session_starting':
      case 'session_ending':
        if (data.bookingId) {
          router.push(`/booking/${data.bookingId}`);
        }
        break;

      case 'credits_low':
      case 'credits_purchased':
        router.push('/(tabs)/profile');
        break;

      case 'unlock_failed':
        if (data.bookingId) {
          router.push(`/booking/${data.bookingId}`);
        }
        break;

      default:
        // Navigate to home
        router.push('/(tabs)');
    }
  }

  // Get current push token
  getToken(): string | null {
    return this.pushToken;
  }

  // Schedule a local notification (for testing or local reminders)
  async scheduleLocalNotification(
    title: string,
    body: string,
    triggerSeconds: number,
    data?: Record<string, unknown>
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: {
        seconds: triggerSeconds,
      },
    });

    return id;
  }

  // Cancel a scheduled notification
  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const pushService = PushNotificationService.getInstance();
