// ===========================================
// Booth Detail & Booking Screen - Futuristic Edition
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { boothsApi } from '../../src/lib/api';
import { useBookingsStore } from '../../src/store/bookings';
import { useAuthStore } from '../../src/store/auth';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

const { width } = Dimensions.get('window');

const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
];

export default function BoothDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { createBooking, isLoading: bookingLoading } = useBookingsStore();

  const [booth, setBooth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [availability, setAvailability] = useState<any[]>([]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    loadBooth();
  }, [id]);

  useEffect(() => {
    if (booth) {
      loadAvailability();
    }
  }, [booth, selectedDate]);

  const loadBooth = async () => {
    if (!id) return;

    setLoading(true);
    const res = await boothsApi.getById(id);
    if (res.success && res.data) {
      setBooth(res.data);
    }
    setLoading(false);
  };

  const loadAvailability = async () => {
    if (!id) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const res = await boothsApi.getAvailability(id, dateStr);
    if (res.success && res.data) {
      setAvailability(res.data.slots || []);
    }
  };

  const calculatePrice = () => {
    if (!booth) return 0;
    const slots = selectedDuration / 15;
    return slots * booth.price_per_15min;
  };

  const handleBook = async () => {
    if (!id || !selectedTime) {
      Alert.alert('Select Time', 'Please select a start time for your booking.');
      return;
    }

    const price = calculatePrice();
    if ((user?.credits || 0) < price) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${price} credits but have ${user?.credits || 0}. Would you like to buy more?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => router.push('/(tabs)/profile') },
        ]
      );
      return;
    }

    const startTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`);

    Alert.alert(
      'Confirm Booking',
      `Book ${booth.name} for ${selectedDuration} minutes at ${selectedTime}?\n\nTotal: ${price} ${booth.currency}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const result = await createBooking(
              id,
              startTime.toISOString(),
              selectedDuration
            );

            if (result.success && result.booking) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Booking Confirmed!', 'Your booth is ready.', [
                {
                  text: 'View Booking',
                  onPress: () => router.replace(`/booking/${result.booking!.id}`),
                },
              ]);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Booking Failed', result.error || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading || !booth) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={colors.gradients.aurora}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const images = booth.images?.length > 0 ? booth.images : ['https://placehold.co/800x600'];
  const price = calculatePrice();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={colors.gradients.aurora}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setImageIndex(index);
          }}
        >
          {images.map((img: string, idx: number) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={styles.image}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        <LinearGradient
          colors={['rgba(15, 12, 41, 0.8)', 'transparent', 'rgba(15, 12, 41, 0.95)']}
          style={styles.imageOverlay}
        />

        <SafeAreaView style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <BlurView intensity={20} style={styles.headerButtonBlur}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <BlurView intensity={20} style={styles.headerButtonBlur}>
                <Ionicons name="share-outline" size={22} color="#fff" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <BlurView intensity={20} style={styles.headerButtonBlur}>
                <Ionicons name="heart-outline" size={22} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Image Indicators */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.indicator,
                  idx === imageIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booth Info */}
        <View style={styles.boothHeader}>
          <View style={styles.boothTitleRow}>
            <Text style={styles.boothName}>{booth.name}</Text>
            {booth.status === 'available' && (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.locationText}>{booth.locations?.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <BlurView intensity={20} style={styles.priceCardBlur}>
            <View style={styles.priceContent}>
              <View>
                <Text style={styles.priceLabel}>Price per session</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>{booth.price_per_15min}</Text>
                  <Text style={styles.priceCurrency}>{booth.currency}</Text>
                  <Text style={styles.priceUnit}>/ 15 min</Text>
                </View>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={colors.accent[400]} />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(booth.amenities || []).map((amenity: string) => (
              <View key={amenity} style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <Ionicons name={getAmenityIcon(amenity)} size={20} color={colors.primary[400]} />
                </View>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        {booth.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.descriptionCard}>
              <BlurView intensity={15} style={styles.descriptionBlur}>
                <Text style={styles.description}>{booth.description}</Text>
              </BlurView>
            </View>
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {generateDates().map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={colors.gradients.neonPrimary}
                      style={styles.dateGradient}
                    >
                      <Text style={styles.dateDaySelected}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={styles.dateNumberSelected}>{date.getDate()}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.dateContent}>
                      <Text style={styles.dateDay}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={styles.dateNumber}>{date.getDate()}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationsGrid}>
            {DURATIONS.map((dur) => {
              const isSelected = dur.value === selectedDuration;
              return (
                <TouchableOpacity
                  key={dur.value}
                  style={[styles.durationItem, isSelected && styles.durationItemSelected]}
                  onPress={() => setSelectedDuration(dur.value)}
                >
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {dur.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Time</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timesContainer}
          >
            {generateTimeSlots().map((time) => {
              const isSelected = time === selectedTime;
              const isAvailable = true; // TODO: Check availability
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeItem,
                    isSelected && styles.timeItemSelected,
                    !isAvailable && styles.timeItemDisabled,
                  ]}
                  onPress={() => isAvailable && setSelectedTime(time)}
                  disabled={!isAvailable}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.timeTextSelected,
                      !isAvailable && styles.timeTextDisabled,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookingBar}>
        <BlurView intensity={30} style={styles.bookingBarBlur}>
          <View style={styles.bookingBarContent}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingLabel}>Total</Text>
              <View style={styles.bookingTotalRow}>
                <Text style={styles.bookingTotal}>{price}</Text>
                <Text style={styles.bookingCurrency}>{booth.currency}</Text>
              </View>
              <Text style={styles.bookingDuration}>{selectedDuration} min</Text>
            </View>
            <Button
              title="Book Now"
              onPress={handleBook}
              loading={bookingLoading}
              disabled={!selectedTime}
              size="large"
              variant="neon"
              style={styles.bookButton}
            />
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function generateDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour < 23; hour++) {
    for (const min of ['00', '15', '30', '45']) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min}`);
    }
  }
  return slots;
}

function getAmenityIcon(amenity: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    wifi: 'wifi-outline',
    power_outlet: 'flash-outline',
    air_conditioning: 'snow-outline',
    soundproof: 'volume-mute-outline',
    desk: 'desktop-outline',
    chair: 'accessibility-outline',
    monitor: 'tv-outline',
    webcam: 'videocam-outline',
    whiteboard: 'easel-outline',
    keyboard: 'keypad-outline',
    usb_charger: 'battery-charging-outline',
    led_light: 'bulb-outline',
  };
  return icons[amenity] || 'checkmark-outline';
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
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },

  // Image
  imageContainer: {
    height: 320,
    position: 'relative',
  },
  image: {
    width,
    height: 320,
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
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glass.white,
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },

  // Content
  content: {
    flex: 1,
    marginTop: -spacing['3xl'],
  },

  // Booth Header
  boothHeader: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  boothTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  boothName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 212, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },

  // Price Card
  priceCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  priceCardBlur: {
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  priceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[400],
  },
  priceCurrency: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[400],
    marginLeft: spacing.xs,
  },
  priceUnit: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accent[500],
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent[400],
  },

  // Sections
  section: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.sm,
  },
  amenityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },

  // Description
  descriptionCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  descriptionBlur: {
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },

  // Dates
  datesContainer: {
    gap: spacing.md,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  dateItemSelected: {
    borderColor: colors.primary[500],
  },
  dateGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dateDaySelected: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  dateNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  dateNumberSelected: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },

  // Durations
  durationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  durationItem: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  durationItemSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[500],
    ...shadows.glow.primary,
  },
  durationText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  durationTextSelected: {
    color: '#fff',
  },

  // Times
  timesContainer: {
    gap: spacing.sm,
    paddingRight: spacing['2xl'],
  },
  timeItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  timeItemSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[500],
  },
  timeItemDisabled: {
    opacity: 0.4,
  },
  timeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  timeTextSelected: {
    color: '#fff',
  },
  timeTextDisabled: {
    color: colors.text.disabled,
  },
  bottomPadding: {
    height: 140,
  },

  // Booking Bar
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  bookingBarBlur: {
    backgroundColor: colors.glass.darkMedium,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  bookingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  bookingInfo: {},
  bookingLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  bookingTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bookingTotal: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bookingCurrency: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  bookingDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  bookButton: {
    minWidth: 150,
  },
});
