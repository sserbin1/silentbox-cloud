// ===========================================
// Welcome Screen - Futuristic Edition
// ===========================================

import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, borderRadius, typography } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animated values for floating orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation for orbs
    const createFloatAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -20,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    createFloatAnimation(orb1Y, 4000).start();
    createFloatAnimation(orb2Y, 5000).start();
    createFloatAnimation(orb3Y, 3500).start();
    pulseAnimation.start();

    return () => {
      orb1Y.stopAnimation();
      orb2Y.stopAnimation();
      orb3Y.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={colors.gradients.aurora}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { transform: [{ translateY: orb1Y }] },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          { transform: [{ translateY: orb2Y }] },
        ]}
      >
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.3)', 'rgba(6, 182, 212, 0.05)']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          { transform: [{ translateY: orb3Y }] },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 0, 110, 0.25)', 'rgba(255, 0, 110, 0.05)']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header with logo */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradients.neonPrimary}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>S</Text>
            </LinearGradient>
            <View style={styles.logoGlow} />
          </Animated.View>
          <Text style={styles.brandName}>Silentbox</Text>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>THE FUTURE OF WORK</Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Your private{'\n'}
            <Text style={styles.titleGradient}>workspace</Text>,{'\n'}
            anywhere
          </Text>
          <Text style={styles.subtitle}>
            Find and book premium silent work booths near you.{'\n'}
            Focus on what matters.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="navigate"
            text="Find booths nearby"
            color={colors.primary[500]}
          />
          <FeatureItem
            icon="flash"
            text="Book in seconds"
            color={colors.accent[500]}
          />
          <FeatureItem
            icon="lock-open"
            text="Unlock with your phone"
            color={colors.neon.green}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/register')}
            variant="primary"
            size="large"
            fullWidth
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            size="large"
            fullWidth
            textStyle={styles.ghostButtonText}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({
  icon,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.featureItem}>
      <BlurView intensity={20} style={styles.featureBlur}>
        <View style={styles.featureContent}>
          <View style={[styles.featureIconContainer, { backgroundColor: `${color}30` }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <Text style={styles.featureText}>{text}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
  },

  // Floating orbs
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: '5%',
    left: '-20%',
  },
  orb2: {
    width: 250,
    height: 250,
    bottom: '15%',
    right: '-15%',
  },
  orb3: {
    width: 180,
    height: 180,
    top: '45%',
    left: '50%',
    marginLeft: -90,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 9999,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primary[500],
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
    zIndex: -1,
  },
  logoText: {
    fontSize: 44,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  brandName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  taglineBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glass.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  taglineText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent[400],
    letterSpacing: 2,
  },

  // Content
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: spacing.lg,
  },
  titleGradient: {
    color: colors.accent[400],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.lg,
  },

  // Features
  features: {
    gap: spacing.md,
  },
  featureItem: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featureBlur: {
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: '#fff',
    fontWeight: typography.fontWeight.medium,
  },

  // Buttons
  buttons: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  ghostButtonText: {
    color: colors.text.secondary,
  },
});
