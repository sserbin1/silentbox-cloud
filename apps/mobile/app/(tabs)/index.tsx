// ===========================================
// Explore Screen (Home) - Futuristic Edition
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
import { BlurView } from 'expo-blur';
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
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={colors.gradients.aurora}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Decorative orbs */}
      <View style={styles.orb1}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.02)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={styles.orb2}>
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.15)', 'rgba(6, 182, 212, 0.02)']}
          style={styles.orbGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[400]}
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
                style={styles.iconButton}
                onPress={() => router.push('/notifications')}
              >
                <BlurView intensity={20} style={styles.iconButtonBlur}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  <View style={styles.notificationBadge} />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.creditsButton}
                onPress={() => router.push('/credits')}
              >
                <LinearGradient
                  colors={colors.gradients.neonAccent}
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
                colors={colors.gradients.neonPrimary}
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
            <BlurView intensity={20} style={styles.searchBarBlur}>
              <View style={styles.searchContent}>
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={20} color={colors.primary[400]} />
                </View>
                <Text style={styles.searchPlaceholder}>Search locations, booths...</Text>
                <View style={styles.searchFilter}>
                  <Ionicons name="options-outline" size={18} color={colors.accent[400]} />
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <QuickActionItem
              icon="navigate"
              text="Nearby"
              color={colors.primary[500]}
              onPress={() => router.push('/(tabs)/map')}
            />
            <QuickActionItem
              icon="star"
              text="Favorites"
              color={colors.accent[500]}
              onPress={() => {}}
            />
            <QuickActionItem
              icon="flash"
              text="Quick Book"
              color={colors.neon.green}
              onPress={() => {}}
            />
            <QuickActionItem
              icon="gift"
              text="Offers"
              color={colors.neon.pink}
              onPress={() => {}}
            />
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
                  <Ionicons name="arrow-forward" size={16} color={colors.primary[400]} />
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
                  <BoothCard key={booth.id} booth={booth} />
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
                <Ionicons name="arrow-forward" size={16} color={colors.primary[400]} />
              </TouchableOpacity>
            </View>
            {locations.map((loc, index) => (
              <LocationCard key={loc.id} location={loc} isLast={index === locations.length - 1} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function QuickActionItem({
  icon,
  text,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionItem} onPress={onPress}>
      <View style={styles.quickActionIconWrapper}>
        <BlurView intensity={20} style={styles.quickActionBlur}>
          <View style={[styles.quickActionIcon, { backgroundColor: `${color}30` }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
        </BlurView>
      </View>
      <Text style={styles.quickActionText}>{text}</Text>
    </TouchableOpacity>
  );
}

function BoothCard({ booth }: { booth: any }) {
  return (
    <TouchableOpacity
      style={styles.boothCard}
      onPress={() => router.push(`/booth/${booth.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.boothCardInner}>
        <Image
          source={{ uri: booth.images?.[0] || 'https://placehold.co/300x200' }}
          style={styles.boothImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(15, 12, 41, 0.9)']}
          style={styles.boothImageGradient}
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
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
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
              <Ionicons name="star" size={14} color={colors.accent[400]} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LocationCard({ location, isLast }: { location: any; isLast: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.locationCard, isLast && styles.lastCard]}
      onPress={() => router.push(`/booth/${location.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.locationCardInner}>
        <Image
          source={{ uri: location.images?.[0] || 'https://placehold.co/400x200' }}
          style={styles.locationImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(15, 12, 41, 0.95)']}
          style={styles.locationImageGradient}
        />
        <View style={styles.locationBadges}>
          <View style={styles.boothCountBadge}>
            <Ionicons name="cube-outline" size={14} color="#fff" />
            <Text style={styles.boothCountText}>{location.booth_count || 0} booths</Text>
          </View>
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{location.name}</Text>
          <View style={styles.locationMeta}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.locationAddress} numberOfLines={1}>
              {location.address}, {location.city}
            </Text>
          </View>
          <View style={styles.locationAmenities}>
            {location.amenities?.slice(0, 3).map((amenity: string) => (
              <View key={amenity} style={styles.amenityBadge}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {location.amenities?.length > 3 && (
              <View style={styles.moreAmenitiesBadge}>
                <Text style={styles.moreAmenitiesText}>+{location.amenities.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Orbs
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    borderRadius: 9999,
  },
  orb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    bottom: '30%',
    left: -80,
    borderRadius: 9999,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 9999,
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
    color: colors.text.secondary,
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  iconButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neon.pink,
    borderWidth: 2,
    borderColor: colors.background,
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
    backgroundColor: colors.neon.green,
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  searchBarBlur: {
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.disabled,
  },
  searchFilter: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
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
  quickActionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  quickActionBlur: {
    flex: 1,
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.semibold,
  },
  horizontalScroll: {
    paddingLeft: spacing['2xl'],
    paddingRight: spacing.sm,
  },

  // Booth Card
  boothCard: {
    width: 220,
    marginRight: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  boothCardInner: {
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
  boothImage: {
    width: '100%',
    height: 130,
  },
  boothImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: 'rgba(0, 245, 212, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neon.green,
    gap: spacing.xs,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neon.green,
  },
  availableText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neon.green,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
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
    color: colors.text.secondary,
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
    color: colors.primary[400],
  },
  boothPriceCurrency: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[400],
  },
  boothPriceUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  lastCard: {
    marginBottom: 0,
  },
  locationCardInner: {
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
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
    backgroundColor: colors.glass.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
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
    color: colors.text.secondary,
    flex: 1,
  },
  locationAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityBadge: {
    backgroundColor: colors.glass.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  moreAmenitiesBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  moreAmenitiesText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.semibold,
  },
});
