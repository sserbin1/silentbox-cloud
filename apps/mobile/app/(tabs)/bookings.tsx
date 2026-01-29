// ===========================================
// Bookings Screen - Silentbox
// ===========================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBookingsStore } from '../../src/store/bookings';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';

type TabType = 'upcoming' | 'past';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { bookings, isLoading, fetchBookings } = useBookingsStore();

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'upcoming') {
      return ['pending', 'confirmed', 'active'].includes(booking.status);
    }
    return ['completed', 'cancelled'].includes(booking.status);
  });

  const onRefresh = async () => {
    await fetchBookings();
  };

  const upcomingCount = bookings.filter((b) =>
    ['pending', 'confirmed', 'active'].includes(b.status)
  ).length;
  const pastCount = bookings.filter((b) =>
    ['completed', 'cancelled'].includes(b.status)
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Manage your reservations</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
            {upcomingCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
                  {upcomingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past
            </Text>
            {pastCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'past' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'past' && styles.tabBadgeTextActive]}>
                  {pastCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={[colors.primary[50], colors.primary[100]]}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="calendar-outline" size={48} color={colors.primary[600]} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming'
                ? 'No upcoming bookings'
                : 'No past bookings'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Find a booth nearby and start working'
                : 'Your booking history will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <Button
                title="Find a Booth"
                onPress={() => router.push('/(tabs)')}
                style={styles.emptyButton}
                icon={<Ionicons name="search" size={18} color="#fff" />}
              />
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const isActive = booking.status === 'active';
  const isUpcoming = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <TouchableOpacity
      style={[styles.bookingCard, isCancelled && styles.bookingCardCancelled]}
      onPress={() => router.push(`/booking/${booking.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.bookingImageContainer}>
        <Image
          source={{
            uri: booking.booth?.images?.[0] || 'https://placehold.co/200x200',
          }}
          style={styles.bookingImage}
          contentFit="cover"
        />
        {isActive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>
      <View style={styles.bookingInfo}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingTitleRow}>
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.booth?.name || 'Booth'}
            </Text>
            <StatusBadge status={booking.status} />
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.gray[400]} />
            <Text style={styles.bookingLocation} numberOfLines={1}>
              {booking.booth?.locations?.name || 'Location'}
            </Text>
          </View>
        </View>

        <View style={styles.bookingMeta}>
          <View style={styles.metaItem}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="calendar" size={14} color={colors.primary[600]} />
            </View>
            <Text style={styles.metaText}>{formatDate(startTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="time" size={14} color={colors.primary[600]} />
            </View>
            <Text style={styles.metaText}>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="hourglass" size={14} color={colors.primary[600]} />
            </View>
            <Text style={styles.metaText}>{getDuration()}</Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.bookingPriceLabel}>Total</Text>
            <Text style={styles.bookingPrice}>
              {booking.totalPrice} <Text style={styles.currency}>{booking.currency}</Text>
            </Text>
          </View>
          {(isActive || isUpcoming) && (
            <Button
              title={isActive ? 'Unlock' : 'View Details'}
              onPress={() => router.push(`/booking/${booking.id}`)}
              size="small"
              variant={isActive ? 'primary' : 'outline'}
              icon={
                isActive ? (
                  <Ionicons name="lock-open" size={16} color="#fff" />
                ) : undefined
              }
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    pending: { label: 'Pending', color: colors.warning.dark, bg: colors.warning.light, icon: 'time-outline' },
    confirmed: { label: 'Confirmed', color: colors.success.dark, bg: colors.success.light, icon: 'checkmark-circle' },
    active: { label: 'Active', color: colors.primary[700], bg: colors.primary[50], icon: 'radio-button-on' },
    completed: { label: 'Completed', color: colors.gray[600], bg: colors.gray[100], icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: colors.error.dark, bg: colors.error.light, icon: 'close-circle' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[500],
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabBadgeActive: {
    backgroundColor: colors.primary[600],
  },
  tabBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  list: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 120,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  bookingCardCancelled: {
    opacity: 0.6,
  },
  bookingImageContainer: {
    position: 'relative',
  },
  bookingImage: {
    width: '100%',
    height: 140,
  },
  liveIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  bookingInfo: {
    padding: spacing.lg,
  },
  bookingHeader: {
    marginBottom: spacing.md,
  },
  bookingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bookingName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bookingLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  // Meta
  bookingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaIconContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },

  // Footer
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {},
  bookingPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginBottom: 2,
  },
  bookingPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  currency: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[500],
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing['2xl'],
  },
  emptyIconContainer: {
    marginBottom: spacing.xl,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing['2xl'],
  },
});
