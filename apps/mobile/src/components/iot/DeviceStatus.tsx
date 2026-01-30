// ===========================================
// Device Status Component - Lock/IoT status display
// ===========================================

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, borderRadius, shadows } from '../../theme';

export type DeviceState = 'online' | 'offline' | 'unlocked' | 'locked' | 'unknown';

interface DeviceStatusProps {
  state: DeviceState;
  batteryLevel?: number;
  signalStrength?: 'strong' | 'medium' | 'weak';
  lastSeen?: Date;
  onRefresh?: () => void;
  compact?: boolean;
}

const stateConfig: Record<
  DeviceState,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
  }
> = {
  online: {
    label: 'Online',
    icon: 'wifi',
    color: colors.success.main,
    bgColor: colors.success.light,
  },
  offline: {
    label: 'Offline',
    icon: 'wifi-outline',
    color: colors.error.main,
    bgColor: colors.error.light,
  },
  unlocked: {
    label: 'Unlocked',
    icon: 'lock-open',
    color: colors.success.main,
    bgColor: colors.success.light,
  },
  locked: {
    label: 'Locked',
    icon: 'lock-closed',
    color: colors.primary[600],
    bgColor: colors.primary[50],
  },
  unknown: {
    label: 'Unknown',
    icon: 'help-circle-outline',
    color: colors.gray[500],
    bgColor: colors.gray[100],
  },
};

export function DeviceStatus({
  state,
  batteryLevel,
  signalStrength,
  lastSeen,
  onRefresh,
  compact = false,
}: DeviceStatusProps) {
  const config = stateConfig[state];
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (state === 'unlocked') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        3,
        false
      );
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const getBatteryIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!batteryLevel) return 'battery-half-outline';
    if (batteryLevel > 80) return 'battery-full';
    if (batteryLevel > 50) return 'battery-half';
    if (batteryLevel > 20) return 'battery-half-outline';
    return 'battery-dead';
  };

  const getBatteryColor = () => {
    if (!batteryLevel) return colors.gray[500];
    if (batteryLevel > 50) return colors.success.main;
    if (batteryLevel > 20) return colors.warning.main;
    return colors.error.main;
  };

  const getSignalIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (signalStrength) {
      case 'strong':
        return 'cellular';
      case 'medium':
        return 'cellular-outline';
      case 'weak':
        return 'cellular-outline';
      default:
        return 'cellular-outline';
    }
  };

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'strong':
        return colors.success.main;
      case 'medium':
        return colors.warning.main;
      case 'weak':
        return colors.error.main;
      default:
        return colors.gray[400];
    }
  };

  const formatLastSeen = () => {
    if (!lastSeen) return null;
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.compactLabel, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <Animated.View
          style={[styles.iconContainer, { backgroundColor: config.bgColor }, pulseStyle]}
        >
          <Ionicons name={config.icon} size={24} color={config.color} />
        </Animated.View>

        <View style={styles.infoContainer}>
          <Text style={styles.stateLabel}>{config.label}</Text>
          {lastSeen && (
            <Text style={styles.lastSeen}>Last seen: {formatLastSeen()}</Text>
          )}
        </View>

        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>

      {(batteryLevel !== undefined || signalStrength) && (
        <View style={styles.indicatorsRow}>
          {batteryLevel !== undefined && (
            <View style={styles.indicator}>
              <Ionicons name={getBatteryIcon()} size={16} color={getBatteryColor()} />
              <Text style={[styles.indicatorText, { color: getBatteryColor() }]}>
                {batteryLevel}%
              </Text>
            </View>
          )}

          {signalStrength && (
            <View style={styles.indicator}>
              <Ionicons name={getSignalIcon()} size={16} color={getSignalColor()} />
              <Text style={[styles.indicatorText, { color: getSignalColor() }]}>
                {signalStrength}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Compact inline status for lists
export function DeviceStatusBadge({
  state,
  size = 'medium',
}: {
  state: DeviceState;
  size?: 'small' | 'medium';
}) {
  const config = stateConfig[state];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={config.color}
      />
      <Text
        style={[
          styles.badgeText,
          { color: config.color },
          isSmall && styles.badgeTextSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

// Lock animation component for unlock feedback
export function UnlockAnimation({ isUnlocking }: { isUnlocking: boolean }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isUnlocking) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 200 })
        ),
        -1,
        false
      );
    } else {
      rotation.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [isUnlocking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.unlockAnimationContainer, animatedStyle]}>
      <View style={styles.unlockIconOuter}>
        <View style={styles.unlockIconInner}>
          <Ionicons
            name={isUnlocking ? 'lock-open-outline' : 'lock-open'}
            size={32}
            color={isUnlocking ? colors.primary[600] : colors.success.main}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 16,
    ...shadows.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lastSeen: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  indicatorText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  badgeTextSmall: {
    fontSize: 11,
    marginLeft: 4,
  },
  unlockAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
