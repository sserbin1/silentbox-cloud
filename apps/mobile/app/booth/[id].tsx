// ===========================================
// Booth Detail & Booking Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { boothsApi } from '../../src/lib/api';
import { useBookingsStore } from '../../src/store/bookings';
import { useAuthStore } from '../../src/store/auth';
import { Button } from '../../src/components/ui/Button';

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
                  onPress: () => router.replace(`/booking/${result.booking.id}`),
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
        <Text>Loading...</Text>
      </View>
    );
  }

  const images = booth.images?.length > 0 ? booth.images : ['https://placehold.co/800x600'];
  const price = calculatePrice();

  return (
    <View style={styles.container}>
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
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']}
          style={styles.imageOverlay}
        />

        <SafeAreaView style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
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
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{booth.locations?.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>
            {booth.price_per_15min} {booth.currency}
          </Text>
          <Text style={styles.priceUnit}>/ 15 min</Text>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(booth.amenities || []).map((amenity: string) => (
              <View key={amenity} style={styles.amenityItem}>
                <Ionicons name={getAmenityIcon(amenity)} size={20} color="#4F46E5" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        {booth.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{booth.description}</Text>
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
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[styles.dateDay, isSelected && styles.dateDaySelected]}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      isSelected && styles.dateNumberSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
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
                  style={[
                    styles.durationItem,
                    isSelected && styles.durationItemSelected,
                  ]}
                  onPress={() => setSelectedDuration(dur.value)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      isSelected && styles.durationTextSelected,
                    ]}
                  >
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
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTotal}>{price} {booth.currency}</Text>
          <Text style={styles.bookingDuration}>{selectedDuration} min</Text>
        </View>
        <Button
          title="Book Now"
          onPress={handleBook}
          loading={bookingLoading}
          disabled={!selectedTime}
          size="large"
          style={styles.bookButton}
        />
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width,
    height: 300,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 100,
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  content: {
    flex: 1,
  },
  boothHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  boothTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boothName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4F46E5',
  },
  priceUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#4B5563',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
  },
  datesContainer: {
    gap: 10,
  },
  dateItem: {
    width: 56,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateItemSelected: {
    backgroundColor: '#4F46E5',
  },
  dateDay: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateNumberSelected: {
    color: '#fff',
  },
  durationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  durationItemSelected: {
    backgroundColor: '#4F46E5',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  durationTextSelected: {
    color: '#fff',
  },
  timesContainer: {
    gap: 8,
    paddingRight: 20,
  },
  timeItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  timeItemSelected: {
    backgroundColor: '#4F46E5',
  },
  timeItemDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.4,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  timeTextSelected: {
    color: '#fff',
  },
  timeTextDisabled: {
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 120,
  },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bookingInfo: {},
  bookingTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  bookingDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookButton: {
    minWidth: 140,
  },
});
