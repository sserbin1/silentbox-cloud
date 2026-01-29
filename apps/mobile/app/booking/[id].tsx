// ===========================================
// Booking Detail Screen
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { bookingsApi } from '../../src/lib/api';
import { useBookingsStore } from '../../src/store/bookings';
import { Button } from '../../src/components/ui/Button';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { unlockDoor, extendBooking, cancelBooking } = useBookingsStore();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) return;

    setLoading(true);
    const res = await bookingsApi.getById(id);
    if (res.success && res.data) {
      setBooking(res.data);
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
        Alert.alert('Door Unlocked!', 'The door has been unlocked remotely.');
      } else {
        Alert.alert(
          'Bluetooth Unlock',
          'Please enable Bluetooth and hold your phone near the lock to unlock.',
          [{ text: 'OK' }]
        );
      }

      // Refresh booking status
      loadBooking();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Unlock Failed', result.error || 'Failed to unlock door');
    }

    setUnlocking(false);
  };

  const handleExtend = () => {
    Alert.alert('Extend Booking', 'How much time would you like to add?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '15 min',
        onPress: () => confirmExtend(15),
      },
      {
        text: '30 min',
        onPress: () => confirmExtend(30),
      },
      {
        text: '1 hour',
        onPress: () => confirmExtend(60),
      },
    ]);
  };

  const confirmExtend = async (minutes: number) => {
    if (!id) return;

    const result = await extendBooking(id, minutes);
    if (result.success) {
      Alert.alert('Booking Extended', `Your booking has been extended by ${minutes} minutes.`);
      loadBooking();
    } else {
      Alert.alert('Extension Failed', result.error || 'Failed to extend booking');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? You may receive a refund depending on the cancellation policy.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            const result = await cancelBooking(id);
            if (result.success) {
              Alert.alert(
                'Booking Cancelled',
                result.refundAmount
                  ? `You will receive a refund of ${result.refundAmount} credits.`
                  : 'Your booking has been cancelled.'
              );
              router.back();
            } else {
              Alert.alert('Cancellation Failed', result.error || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const isActive = booking.status === 'active';
  const isConfirmed = booking.status === 'confirmed';
  const canUnlock = isActive || isConfirmed;
  const canExtend = isActive;
  const canCancel = isConfirmed || booking.status === 'pending';

  const timeRemaining = isActive
    ? Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000 / 60))
    : null;

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: booking.booths?.images?.[0] || 'https://placehold.co/800x400',
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        <SafeAreaView style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.imageContent}>
          <StatusBadge status={booking.status} />
          <Text style={styles.boothName}>{booking.booths?.name || 'Booth'}</Text>
          <Text style={styles.locationName}>
            {booking.booths?.locations?.name || 'Location'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Remaining Card (for active bookings) */}
        {isActive && timeRemaining !== null && (
          <View style={styles.timeCard}>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Time Remaining</Text>
              <Text style={styles.timeValue}>
                {Math.floor(timeRemaining / 60)}h {timeRemaining % 60}m
              </Text>
            </View>
            <Button
              title="Extend"
              onPress={handleExtend}
              variant="outline"
              size="small"
            />
          </View>
        )}

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {startTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {endTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="hourglass-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {booking.duration_minutes} minutes
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="wallet-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total Price</Text>
              <Text style={styles.detailValue}>
                {booking.total_price} {booking.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Access Code */}
        {booking.access_code && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Code</Text>
            <View style={styles.accessCodeCard}>
              <Text style={styles.accessCode}>{booking.access_code}</Text>
              <Text style={styles.accessCodeHint}>
                Use this code for manual keypad entry
              </Text>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationCardName}>
                {booking.booths?.locations?.name}
              </Text>
              <Text style={styles.locationCardAddress}>
                {booking.booths?.locations?.address}
              </Text>
            </View>
            <Ionicons name="navigate-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Unlock Button */}
      {canUnlock && (
        <View style={styles.unlockContainer}>
          <Button
            title={unlocking ? 'Unlocking...' : 'Unlock Door'}
            onPress={handleUnlock}
            loading={unlocking}
            size="large"
            fullWidth
            icon={<Ionicons name="lock-open-outline" size={20} color="#fff" />}
          />
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#D97706', bg: 'rgba(254, 243, 199, 0.9)' },
    confirmed: { label: 'Confirmed', color: '#059669', bg: 'rgba(209, 250, 229, 0.9)' },
    active: { label: 'In Progress', color: '#4F46E5', bg: 'rgba(238, 242, 255, 0.9)' },
    completed: { label: 'Completed', color: '#6B7280', bg: 'rgba(243, 244, 246, 0.9)' },
    cancelled: { label: 'Cancelled', color: '#DC2626', bg: 'rgba(254, 226, 226, 0.9)' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  boothName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F46E5',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  timeInfo: {},
  timeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailContent: {},
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  accessCodeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  accessCode: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 8,
    marginBottom: 8,
  },
  accessCodeHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationCardAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
  bottomPadding: {
    height: 120,
  },
  unlockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
