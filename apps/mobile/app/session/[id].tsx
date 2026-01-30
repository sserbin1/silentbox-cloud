// ===========================================
// Active Session Screen - Live booth session view
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { bookingsApi, accessApi } from '../../src/lib/api';
import { useBookingsStore } from '../../src/store/bookings';
import { Button } from '../../src/components/ui/Button';
import { colors, borderRadius, shadows } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { unlockDoor, extendBooking } = useBookingsStore();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    loadBooking();

    // Pulse animation for active indicator
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      false
    );
  }, [id]);

  useEffect(() => {
    if (!booking) return;

    // Update time remaining every second
    const timer = setInterval(() => {
      const endTime = new Date(booking.end_time);
      const remaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);

      // Warn when 5 minutes remaining
      if (remaining === 300) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Session Ending Soon',
          'Your booth session will end in 5 minutes. Would you like to extend?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Extend', onPress: handleExtend },
          ]
        );
      }

      // Session ended
      if (remaining === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Session Ended', 'Your booth session has ended. Please exit the booth.');
        router.replace({ pathname: '/booking/[id]' as any, params: { id } });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  const loadBooking = async () => {
    if (!id) return;

    setLoading(true);
    const res = await bookingsApi.getById(id);
    if (res.success && res.data) {
      setBooking(res.data);

      const endTime = new Date(res.data.end_time);
      const remaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!id) return;

    setUnlocking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = await unlockDoor(id);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.method === 'remote') {
        Alert.alert('Door Unlocked!', 'The door has been unlocked.');
      } else {
        Alert.alert(
          'Bluetooth Unlock',
          'Hold your phone near the lock to unlock.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Unlock Failed', result.error || 'Failed to unlock door');
    }

    setUnlocking(false);
  };

  const handleExtend = () => {
    Alert.alert('Extend Session', 'How much time would you like to add?', [
      { text: 'Cancel', style: 'cancel' },
      { text: '15 min', onPress: () => confirmExtend(15) },
      { text: '30 min', onPress: () => confirmExtend(30) },
      { text: '1 hour', onPress: () => confirmExtend(60) },
    ]);
  };

  const confirmExtend = async (minutes: number) => {
    if (!id) return;

    const result = await extendBooking(id, minutes);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Session Extended', `Your session has been extended by ${minutes} minutes.`);
      loadBooking();
    } else {
      Alert.alert('Extension Failed', result.error || 'Failed to extend session');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return colors.error.main; // 5 min warning
    if (timeRemaining <= 600) return colors.warning.main; // 10 min warning
    return colors.primary[600];
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (!booking || booking.status !== 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.gray[400]} />
          <Text style={styles.errorTitle}>No Active Session</Text>
          <Text style={styles.errorText}>You don't have an active booth session.</Text>
          <Button title="View Bookings" onPress={() => router.replace('/(tabs)/bookings')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with booth image */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: booking.booths?.images?.[0] || 'https://placehold.co/800x400' }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.headerGradient}
        />
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.statusPulse, pulseStyle]}>
              <Animated.View style={[styles.statusGlow, glowStyle]} />
              <View style={styles.statusDot} />
            </Animated.View>
            <Text style={styles.statusText}>Session Active</Text>
          </View>
        </SafeAreaView>
        <View style={styles.boothInfo}>
          <Text style={styles.boothName}>{booking.booths?.name || 'Booth'}</Text>
          <Text style={styles.locationName}>{booking.booths?.locations?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Remaining Card */}
        <View style={[styles.timeCard, { borderColor: getTimeColor() }]}>
          <View style={styles.timeHeader}>
            <Ionicons name="time-outline" size={24} color={getTimeColor()} />
            <Text style={[styles.timeLabel, { color: getTimeColor() }]}>Time Remaining</Text>
          </View>
          <Text style={[styles.timeValue, { color: getTimeColor() }]}>
            {formatTime(timeRemaining)}
          </Text>
          {timeRemaining <= 600 && (
            <TouchableOpacity style={styles.extendButton} onPress={handleExtend}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.extendButtonText}>Extend Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, unlocking && styles.actionCardDisabled]}
            onPress={handleUnlock}
            disabled={unlocking}
          >
            {unlocking ? (
              <ActivityIndicator color={colors.primary[600]} />
            ) : (
              <View style={[styles.actionIcon, { backgroundColor: colors.success.light }]}>
                <Ionicons name="lock-open" size={28} color={colors.success.main} />
              </View>
            )}
            <Text style={styles.actionTitle}>Unlock Door</Text>
            <Text style={styles.actionSubtitle}>Remote unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowAccessCode(!showAccessCode)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="keypad" size={28} color={colors.primary[600]} />
            </View>
            <Text style={styles.actionTitle}>Access Code</Text>
            <Text style={styles.actionSubtitle}>Manual entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleExtend}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent[50] }]}>
              <Ionicons name="timer-outline" size={28} color={colors.accent[600]} />
            </View>
            <Text style={styles.actionTitle}>Extend</Text>
            <Text style={styles.actionSubtitle}>Add time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/access/[bookingId]' as any, params: { bookingId: id } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info.light }]}>
              <Ionicons name="qr-code" size={28} color={colors.info.main} />
            </View>
            <Text style={styles.actionTitle}>Full Access</Text>
            <Text style={styles.actionSubtitle}>All options</Text>
          </TouchableOpacity>
        </View>

        {/* Access Code Reveal */}
        {showAccessCode && booking.access_code && (
          <View style={styles.accessCodeCard}>
            <Text style={styles.accessCodeLabel}>Your Access Code</Text>
            <Text style={styles.accessCode}>{booking.access_code}</Text>
            <Text style={styles.accessCodeHint}>Enter this on the door keypad</Text>
          </View>
        )}

        {/* Session Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Session Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.detailText}>
              {new Date(booking.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.detailText}>
              {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.detailText}>{booking.booths?.locations?.address}</Text>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary[600]} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>
              If you're having trouble with the door or your session, tap for support options.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Unlock Button */}
      <View style={styles.bottomAction}>
        <Button
          title={unlocking ? 'Unlocking...' : 'Unlock Door'}
          onPress={handleUnlock}
          loading={unlocking}
          size="large"
          fullWidth
          icon={<Ionicons name="lock-open-outline" size={22} color="#fff" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  headerContainer: {
    height: 240,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPulse: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success.main,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  boothInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  boothName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  timeCard: {
    margin: 20,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    alignItems: 'center',
    ...shadows.lg,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  extendButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    margin: 8,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  actionCardDisabled: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  accessCodeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  accessCodeLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  accessCode: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 8,
    marginBottom: 8,
  },
  accessCodeHint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 15,
    color: colors.text.secondary,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
  },
  helpContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  helpText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  bottomPadding: {
    height: 120,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
});
