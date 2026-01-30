// ===========================================
// Access Code Screen - Full access options
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
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { bookingsApi, accessApi } from '../../src/lib/api';
import { useBookingsStore } from '../../src/store/bookings';
import { Button } from '../../src/components/ui/Button';
import { colors, borderRadius, shadows } from '../../src/theme';

type UnlockMethod = 'remote' | 'bluetooth' | 'code';

interface AccessInfo {
  accessCode: string;
  validFrom: string;
  validUntil: string;
  booking: any;
}

export default function AccessCodeScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { unlockDoor } = useBookingsStore();

  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [activeMethod, setActiveMethod] = useState<UnlockMethod | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Animation
  const unlockScale = useSharedValue(1);
  const unlockRotation = useSharedValue(0);

  useEffect(() => {
    loadAccessInfo();
  }, [bookingId]);

  const loadAccessInfo = async () => {
    if (!bookingId) return;

    setLoading(true);
    try {
      // Get access code
      const accessRes = await accessApi.getCode(bookingId);
      // Get booking details
      const bookingRes = await bookingsApi.getById(bookingId);

      if (accessRes.success && accessRes.data && bookingRes.success && bookingRes.data) {
        setAccessInfo({
          accessCode: accessRes.data.accessCode,
          validFrom: accessRes.data.validFrom,
          validUntil: accessRes.data.validUntil,
          booking: bookingRes.data,
        });
      }
    } catch (error) {
      console.error('Failed to load access info:', error);
    }
    setLoading(false);
  };

  const handleUnlock = async (method: UnlockMethod) => {
    if (!bookingId) return;

    setUnlocking(true);
    setActiveMethod(method);

    // Animate unlock button
    unlockRotation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 50 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (method === 'code') {
      // Just show code highlight
      setUnlocking(false);
      setActiveMethod(null);
      return;
    }

    const result = await unlockDoor(bookingId);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (method === 'remote') {
        Alert.alert(
          'Door Unlocked!',
          'The door has been unlocked remotely. You can enter now.',
          [{ text: 'OK' }]
        );
      } else if (method === 'bluetooth') {
        if (result.credentials) {
          Alert.alert(
            'Bluetooth Ready',
            'Hold your phone near the lock. Bluetooth unlocking will happen automatically.',
            [{ text: 'OK' }]
          );
          // Here we would trigger the TTLock Bluetooth SDK
          // This requires native module integration
        } else {
          Alert.alert(
            'Bluetooth Not Available',
            'Remote unlock was used instead. The door is now unlocked.',
            [{ text: 'OK' }]
          );
        }
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Unlock Failed',
        result.error || 'Failed to unlock. Try using the access code on the keypad.',
        [{ text: 'OK' }]
      );
    }

    setUnlocking(false);
    setActiveMethod(null);
  };

  const handleCopyCode = () => {
    if (!accessInfo?.accessCode) return;

    Clipboard.setString(accessInfo.accessCode);
    setCodeCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!accessInfo) return;

    try {
      await Share.share({
        message: `Silentbox Access Code: ${accessInfo.accessCode}\n\nBooth: ${accessInfo.booking?.booths?.name}\nValid: ${formatTime(accessInfo.validFrom)} - ${formatTime(accessInfo.validUntil)}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isCodeValid = () => {
    if (!accessInfo) return false;
    const now = new Date();
    const validFrom = new Date(accessInfo.validFrom);
    const validUntil = new Date(accessInfo.validUntil);
    // Allow 5 min early access
    return now >= new Date(validFrom.getTime() - 5 * 60 * 1000) && now <= validUntil;
  };

  const unlockStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: unlockScale.value },
      { rotate: `${unlockRotation.value}deg` },
    ],
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading access info...</Text>
      </View>
    );
  }

  if (!accessInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.gray[400]} />
          <Text style={styles.errorTitle}>Access Unavailable</Text>
          <Text style={styles.errorText}>
            Access code is not available for this booking.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Access Options</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booth Info */}
        <View style={styles.boothCard}>
          <View style={styles.boothIcon}>
            <Ionicons name="cube" size={28} color={colors.primary[600]} />
          </View>
          <View style={styles.boothInfo}>
            <Text style={styles.boothName}>{accessInfo.booking?.booths?.name}</Text>
            <Text style={styles.boothLocation}>
              {accessInfo.booking?.booths?.locations?.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isCodeValid() ? colors.success.light : colors.warning.light },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isCodeValid() ? colors.success.dark : colors.warning.dark },
              ]}
            >
              {isCodeValid() ? 'Active' : 'Upcoming'}
            </Text>
          </View>
        </View>

        {/* Validity Period */}
        <View style={styles.validityCard}>
          <View style={styles.validityRow}>
            <View style={styles.validityItem}>
              <Text style={styles.validityLabel}>Valid From</Text>
              <Text style={styles.validityValue}>{formatTime(accessInfo.validFrom)}</Text>
              <Text style={styles.validityDate}>{formatDate(accessInfo.validFrom)}</Text>
            </View>
            <View style={styles.validityDivider}>
              <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
            </View>
            <View style={styles.validityItem}>
              <Text style={styles.validityLabel}>Valid Until</Text>
              <Text style={styles.validityValue}>{formatTime(accessInfo.validUntil)}</Text>
              <Text style={styles.validityDate}>{formatDate(accessInfo.validUntil)}</Text>
            </View>
          </View>
        </View>

        {/* Access Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>Access Code</Text>
          <View style={styles.codeContainer}>
            {accessInfo.accessCode.split('').map((digit, index) => (
              <View key={index} style={styles.codeDigit}>
                <Text style={styles.codeDigitText}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.codeHint}>Enter this code on the door keypad</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons
              name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={codeCopied ? colors.success.main : colors.primary[600]}
            />
            <Text
              style={[
                styles.copyButtonText,
                { color: codeCopied ? colors.success.main : colors.primary[600] },
              ]}
            >
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Unlock Methods */}
        <Text style={styles.sectionTitle}>Unlock Methods</Text>

        {/* Remote Unlock */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            activeMethod === 'remote' && styles.methodCardActive,
          ]}
          onPress={() => handleUnlock('remote')}
          disabled={unlocking || !isCodeValid()}
        >
          <Animated.View style={[styles.methodIcon, unlockStyle]}>
            {unlocking && activeMethod === 'remote' ? (
              <ActivityIndicator color={colors.success.main} />
            ) : (
              <Ionicons name="wifi" size={28} color={colors.success.main} />
            )}
          </Animated.View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Remote Unlock</Text>
            <Text style={styles.methodDescription}>
              Unlock instantly via internet (requires gateway)
            </Text>
          </View>
          <View
            style={[
              styles.methodBadge,
              { backgroundColor: colors.success.light },
            ]}
          >
            <Text style={[styles.methodBadgeText, { color: colors.success.dark }]}>
              Recommended
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bluetooth Unlock */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            activeMethod === 'bluetooth' && styles.methodCardActive,
          ]}
          onPress={() => handleUnlock('bluetooth')}
          disabled={unlocking || !isCodeValid()}
        >
          <View style={styles.methodIcon}>
            {unlocking && activeMethod === 'bluetooth' ? (
              <ActivityIndicator color={colors.info.main} />
            ) : (
              <Ionicons name="bluetooth" size={28} color={colors.info.main} />
            )}
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Bluetooth Unlock</Text>
            <Text style={styles.methodDescription}>
              Hold phone near the lock (works offline)
            </Text>
          </View>
        </TouchableOpacity>

        {/* Keypad Code */}
        <TouchableOpacity
          style={styles.methodCard}
          onPress={handleCopyCode}
        >
          <View style={styles.methodIcon}>
            <Ionicons name="keypad" size={28} color={colors.primary[600]} />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Keypad Entry</Text>
            <Text style={styles.methodDescription}>
              Enter {accessInfo.accessCode} on the door keypad
            </Text>
          </View>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle-outline" size={22} color={colors.primary[600]} />
            <Text style={styles.instructionsTitle}>How to Enter</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Tap "Remote Unlock" for instant access (fastest)
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              If remote fails, try Bluetooth with phone near lock
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              As backup, enter {accessInfo.accessCode} on the keypad
            </Text>
          </View>
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-buoy-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.helpButtonText}>Having trouble? Get help</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  boothCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  boothIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  boothInfo: {
    flex: 1,
    marginLeft: 14,
  },
  boothName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  boothLocation: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  validityCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityItem: {
    flex: 1,
    alignItems: 'center',
  },
  validityLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  validityValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  validityDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  validityDivider: {
    paddingHorizontal: 16,
  },
  codeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
    ...shadows.md,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  codeDigit: {
    width: 44,
    height: 56,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigitText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  codeHint: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  copyButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  methodCardActive: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
    marginLeft: 14,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 20,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
  },
  helpButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary[600],
  },
  bottomPadding: {
    height: 40,
  },
});
