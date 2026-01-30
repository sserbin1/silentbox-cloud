// ===========================================
// Explore Screen (Home) - Silentbox
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/auth';
import { useBookingsStore } from '../../src/store/bookings';
import { boothsApi, locationsApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const { activeBooking, fetchActiveBooking } = useBookingsStore();

  const [nearbyBooths, setNearbyBooths] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadData();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      loadNearbyBooths(loc.coords.latitude, loc.coords.longitude);
    }
  };

  const loadData = async () => {
    fetchActiveBooking();

    const locationsRes = await locationsApi.getAll();
    if (locationsRes.success && locationsRes.data) {
      setLocations(locationsRes.data);
    }
  };

  const loadNearbyBooths = async (lat: number, lng: number) => {
    const res = await boothsApi.getNearby(lat, lng);
    if (res.success && res.data) {
      setNearbyBooths(res.data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (location) {
      await loadNearbyBooths(location.coords.latitude, location.coords.longitude);
    }
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'there'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.gray[700]} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.creditsButton}
              onPress={() => router.push('/credits')}
            >
              <LinearGradient
                colors={[colors.primary[600], colors.primary[700]]}
                style={styles.creditsGradient}
              >
                <Ionicons name="wallet" size={16} color="#fff" />
                <Text style={styles.creditsText}>{user?.credits || 0}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Booking Card */}
        {activeBooking && (
          <TouchableOpacity
            style={styles.activeBookingCard}
            onPress={() => router.push(`/booking/${activeBooking.id}`)}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={[colors.primary[600], colors.primary[700]]}
              style={styles.activeBookingGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activeBookingHeader}>
                <View style={styles.activeBookingBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeBookingBadgeText}>
                    {activeBooking.status === 'active' ? 'Session Active' : 'Upcoming'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>

              <Text style={styles.activeBookingName}>
                {activeBooking.booth?.name || 'Your Booth'}
              </Text>
              <Text style={styles.activeBookingLocation}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />{' '}
                {activeBooking.booth?.locations?.name}
              </Text>

              <View style={styles.activeBookingTimeRow}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.activeBookingTime}>
                  {new Date(activeBooking.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(activeBooking.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => router.push(`/booking/${activeBooking.id}`)}
              >
                <Ionicons name="lock-open" size={18} color={colors.primary[600]} />
                <Text style={styles.unlockButtonText}>Unlock Door</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
          </View>
          <Text style={styles.searchPlaceholder}>Search locations, booths...</Text>
          <View style={styles.searchFilter}>
            <Ionicons name="options-outline" size={18} color={colors.primary[600]} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(tabs)/map')}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="navigate" size={22} color={colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Nearby</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accent[50] }]}>
              <Ionicons name="star" size={22} color={colors.accent[500]} />
            </View>
            <Text style={styles.quickActionText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success.light }]}>
              <Ionicons name="flash" size={22} color={colors.success.main} />
            </View>
            <Text style={styles.quickActionText}>Quick Book</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.info.light }]}>
              <Ionicons name="gift" size={22} color={colors.info.main} />
            </View>
            <Text style={styles.quickActionText}>Offers</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Booths */}
        {nearbyBooths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Nearby</Text>
                <Text style={styles.sectionSubtitle}>Based on your location</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAll}>See all</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              decelerationRate="fast"
              snapToInterval={236}
            >
              {nearbyBooths.slice(0, 5).map((booth) => (
                <TouchableOpacity
                  key={booth.id}
                  style={styles.boothCard}
                  onPress={() => router.push(`/booth/${booth.id}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: booth.images?.[0] || 'https://placehold.co/300x200' }}
                    style={styles.boothImage}
                    contentFit="cover"
                  />
                  <View style={styles.boothImageOverlay}>
                    {booth.status === 'available' && (
                      <View style={styles.availableBadge}>
                        <View style={styles.availableDot} />
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.favoriteButton}>
                      <Ionicons name="heart-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.boothInfo}>
                    <Text style={styles.boothName} numberOfLines={1}>
                      {booth.name}
                    </Text>
                    <View style={styles.boothLocationRow}>
                      <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
                      <Text style={styles.boothLocation} numberOfLines={1}>
                        {booth.locations?.name}
                      </Text>
                    </View>
                    <View style={styles.boothFooter}>
                      <Text style={styles.boothPrice}>
                        <Text style={styles.boothPriceValue}>{booth.price_per_15min}</Text>
                        <Text style={styles.boothPriceCurrency}> {booth.currency}</Text>
                        <Text style={styles.boothPriceUnit}>/15min</Text>
                      </Text>
                      <View style={styles.boothRating}>
                        <Ionicons name="star" size={14} color={colors.accent[500]} />
                        <Text style={styles.ratingText}>4.8</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Locations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular Locations</Text>
              <Text style={styles.sectionSubtitle}>Explore our venues</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/map')}
            >
              <Text style={styles.seeAll}>View map</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
          {locations.map((loc, index) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.locationCard, index === locations.length - 1 && styles.lastCard]}
              onPress={() => router.push(`/booth/${loc.id}`)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: loc.images?.[0] || 'https://placehold.co/400x200' }}
                style={styles.locationImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.locationImageGradient}
              />
              <View style={styles.locationBadges}>
                <View style={styles.boothCountBadge}>
                  <Ionicons name="cube-outline" size={14} color="#fff" />
                  <Text style={styles.boothCountText}>{loc.booth_count || 0} booths</Text>
                </View>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <View style={styles.locationMeta}>
                  <Ionicons name="location-outline" size={14} color={colors.gray[500]} />
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {loc.address}, {loc.city}
                  </Text>
                </View>
                <View style={styles.locationAmenities}>
                  {loc.amenities?.slice(0, 3).map((amenity: string) => (
                    <View key={amenity} style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                  {loc.amenities?.length > 3 && (
                    <View style={styles.moreAmenitiesBadge}>
                      <Text style={styles.moreAmenitiesText}>+{loc.amenities.length - 3}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  headerLeft: {},
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error.main,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  creditsButton: {},
  creditsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  creditsText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },

  // Active Booking
  activeBookingCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing['2xl'],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  activeBookingGradient: {
    padding: spacing.xl,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activeBookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success.main,
  },
  activeBookingBadgeText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.semibold,
  },
  activeBookingName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  activeBookingLocation: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  activeBookingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  activeBookingTime: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  unlockButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },

  // Search
  searchBar: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    ...shadows.md,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[400],
  },
  searchFilter: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  quickActionItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  horizontalScroll: {
    paddingLeft: spacing['2xl'],
    paddingRight: spacing.sm,
  },

  // Booth Card
  boothCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginRight: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  boothImage: {
    width: '100%',
    height: 130,
  },
  boothImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  availableText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boothInfo: {
    padding: spacing.md,
  },
  boothName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  boothLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  boothLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  boothFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boothPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  boothPriceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  boothPriceCurrency: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  boothPriceUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  boothRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },

  // Location Card
  locationCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  lastCard: {
    marginBottom: 0,
  },
  locationImage: {
    width: '100%',
    height: 160,
  },
  locationImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  locationBadges: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  boothCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  boothCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  locationInfo: {
    padding: spacing.lg,
  },
  locationName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  locationAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  moreAmenitiesBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  moreAmenitiesText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
});
