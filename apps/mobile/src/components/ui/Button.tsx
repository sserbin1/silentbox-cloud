// ===========================================
// Button Component - Futuristic Edition
// ===========================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, typography, spacing, shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent' | 'neon';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (!loading && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const isGradient = variant === 'primary' || variant === 'neon' || variant === 'accent';

  const buttonStyles = [
    styles.base,
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    !isGradient && variantStyles[variant],
    style,
  ];

  const textStyles = [
    styles.text,
    variantTextStyles[variant],
    sizeTextStyles[size],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost' || variant === 'secondary'
              ? colors.primary[400]
              : '#fff'
          }
          size="small"
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );
  };

  // Gradient buttons (primary, neon, accent)
  if (isGradient && !disabled) {
    const gradientColors =
      variant === 'neon'
        ? colors.gradients.button
        : variant === 'accent'
        ? colors.gradients.neonAccent
        : colors.gradients.neonPrimary;

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            sizeStyles[size],
            styles.gradientButton,
            variant === 'primary' && shadows.glow.primary,
            variant === 'accent' && shadows.glow.accent,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  gradientButton: {
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  disabledText: {
    opacity: 0.8,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary[600],
    ...shadows.glow.primary,
  },
  secondary: {
    backgroundColor: colors.glass.whiteMedium,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error.main,
    ...shadows.glow.pink,
  },
  success: {
    backgroundColor: colors.success.main,
    ...shadows.glow.success,
  },
  accent: {
    backgroundColor: colors.accent[500],
    ...shadows.glow.accent,
  },
  neon: {
    // Handled by gradient
  },
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: '#fff',
  },
  secondary: {
    color: colors.text.primary,
  },
  outline: {
    color: colors.primary[400],
  },
  ghost: {
    color: colors.primary[400],
  },
  danger: {
    color: '#fff',
  },
  success: {
    color: colors.background,
  },
  accent: {
    color: '#fff',
  },
  neon: {
    color: '#fff',
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.xl,
  },
});

const sizeTextStyles = StyleSheet.create({
  small: {
    fontSize: typography.fontSize.sm,
  },
  medium: {
    fontSize: typography.fontSize.base,
  },
  large: {
    fontSize: typography.fontSize.lg,
  },
});
