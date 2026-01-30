// ===========================================
// Login Screen - Futuristic Edition
// ===========================================

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuthStore();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error || 'Please check your credentials');
    }
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
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={styles.orb2}>
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.05)']}
          style={styles.orbGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <BlurView intensity={20} style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </BlurView>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue to Silentbox</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.glassCard}>
                <BlurView intensity={30} style={styles.formBlur}>
                  <View style={styles.formContent}>
                    <Input
                      label="Email"
                      placeholder="your@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoComplete="email"
                      leftIcon="mail-outline"
                      error={errors.email}
                    />

                    <Input
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="password"
                      leftIcon="lock-closed-outline"
                      error={errors.password}
                    />

                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={() => router.push('/(auth)/forgot-password')}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <Button
                      title="Sign In"
                      onPress={handleLogin}
                      loading={isLoading}
                      size="large"
                      fullWidth
                    />
                  </View>
                </BlurView>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <BlurView intensity={20} style={styles.socialButtonBlur}>
                  <Ionicons name="logo-google" size={24} color="#fff" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <BlurView intensity={20} style={styles.socialButtonBlur}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },

  // Orbs
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    top: -50,
    right: -80,
    borderRadius: 9999,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    bottom: '20%',
    left: -60,
    borderRadius: 9999,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 9999,
  },

  // Back button
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  backButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },

  // Header
  header: {
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },

  // Form
  form: {
    marginBottom: spacing['2xl'],
  },
  glassCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  formBlur: {
    backgroundColor: colors.glass.dark,
  },
  formContent: {
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.medium,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glass.border,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    marginHorizontal: spacing.lg,
  },

  // Social buttons
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  socialButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
  },
  footerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.semibold,
  },
});
