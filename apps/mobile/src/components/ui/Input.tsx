// ===========================================
// Input Component - Futuristic Edition
// ===========================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing, shadows } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'tel' | 'off';
  error?: string;
  hint?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  error,
  hint,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  size = 'medium',
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecure = isPassword && !showPassword;

  const inputHeight = size === 'small' ? 44 : size === 'large' ? 56 : 50;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {hint && !error && <Text style={styles.hint}>{hint}</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { height: multiline ? undefined : inputHeight, minHeight: multiline ? 100 : undefined },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary[400] : colors.text.disabled}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            size === 'small' && styles.inputSmall,
            size === 'large' && styles.inputLarge,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={actualSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.primary[400]}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.disabled}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={20} color={colors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.error.main} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },

  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },

  inputFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.glass.whiteMedium,
    ...shadows.sm,
  },

  inputError: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.light,
  },

  inputDisabled: {
    backgroundColor: colors.glass.white,
    opacity: 0.5,
  },

  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },

  inputSmall: {
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  inputLarge: {
    fontSize: typography.fontSize.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },

  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },

  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },

  leftIconContainer: {
    paddingLeft: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rightIconButton: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },

  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    fontWeight: typography.fontWeight.medium,
  },
});
