// ===========================================
// Silentbox Mobile Design System - Futuristic Edition
// ===========================================
// Style: Cyber Aurora + Glassmorphism + Neon
// Vibe: Premium tech, innovative, futuristic workspace

export const colors = {
  // Brand Colors - Cyber Violet
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Main brand
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Accent - Cyber Cyan
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main accent
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // Neon highlights
  neon: {
    pink: '#ff006e',
    blue: '#3a86ff',
    green: '#00f5d4',
    purple: '#9b5de5',
    orange: '#fb5607',
    cyan: '#06b6d4',
  },

  // Semantic Colors - Neon variants
  success: {
    light: 'rgba(0, 245, 212, 0.2)',
    main: '#00f5d4',
    dark: '#00d4b8',
  },

  warning: {
    light: 'rgba(251, 86, 7, 0.2)',
    main: '#fb5607',
    dark: '#e04e06',
  },

  error: {
    light: 'rgba(255, 0, 110, 0.2)',
    main: '#ff006e',
    dark: '#e00062',
  },

  info: {
    light: 'rgba(58, 134, 255, 0.2)',
    main: '#3a86ff',
    dark: '#2f74e0',
  },

  // Dark theme neutrals
  gray: {
    50: 'rgba(255, 255, 255, 0.05)',
    100: 'rgba(255, 255, 255, 0.1)',
    200: 'rgba(255, 255, 255, 0.15)',
    300: 'rgba(255, 255, 255, 0.2)',
    400: 'rgba(255, 255, 255, 0.4)',
    500: 'rgba(255, 255, 255, 0.5)',
    600: 'rgba(255, 255, 255, 0.6)',
    700: 'rgba(255, 255, 255, 0.7)',
    800: 'rgba(255, 255, 255, 0.8)',
    900: 'rgba(255, 255, 255, 0.9)',
  },

  // Glass effects
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    whiteMedium: 'rgba(255, 255, 255, 0.15)',
    whiteStrong: 'rgba(255, 255, 255, 0.25)',
    dark: 'rgba(15, 23, 42, 0.8)',
    darkMedium: 'rgba(15, 23, 42, 0.9)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
  },

  // UI Colors - Dark theme
  background: '#0f0c29', // Deep space
  backgroundGradientStart: '#0f0c29',
  backgroundGradientMid: '#302b63',
  backgroundGradientEnd: '#24243e',
  surface: 'rgba(30, 27, 75, 0.8)', // Dark glass
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.4)',
    inverse: '#0f0c29',
  },
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.05)',

  // Gradients (as arrays for LinearGradient)
  gradients: {
    aurora: ['#0f0c29', '#302b63', '#24243e'] as const,
    cyber: ['#0c1445', '#1a0533', '#0d0d0d'] as const,
    neonPrimary: ['#8b5cf6', '#7c3aed'] as const,
    neonAccent: ['#06b6d4', '#0891b2'] as const,
    neonPink: ['#ff006e', '#9b5de5'] as const,
    card: ['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)'] as const,
    button: ['#8b5cf6', '#06b6d4'] as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const typography = {
  // Font Family (system fonts)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  // Neon glow shadows
  glow: {
    primary: {
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    accent: {
      shadowColor: '#06b6d4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    pink: {
      shadowColor: '#ff006e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    success: {
      shadowColor: '#00f5d4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Common component styles - Futuristic
export const componentStyles = {
  // Glass card
  glassCard: {
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden' as const,
  },

  // Glass card light
  glassCardLight: {
    backgroundColor: colors.glass.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    overflow: 'hidden' as const,
  },

  // Neon card
  neonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[500],
    ...shadows.glow.primary,
  },

  // Input
  input: {
    backgroundColor: colors.glass.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },

  // Input focused
  inputFocused: {
    borderColor: colors.primary[500],
    ...shadows.sm,
  },

  // Button variants
  button: {
    primary: {
      backgroundColor: colors.primary[600],
      borderRadius: borderRadius.lg,
      ...shadows.glow.primary,
    },
    secondary: {
      backgroundColor: colors.glass.whiteMedium,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.glass.border,
    },
    accent: {
      backgroundColor: colors.accent[500],
      borderRadius: borderRadius.lg,
      ...shadows.glow.accent,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary[500],
      borderRadius: borderRadius.lg,
    },
  },

  // Badge variants - Neon style
  badge: {
    success: {
      backgroundColor: colors.success.light,
      borderWidth: 1,
      borderColor: colors.success.main,
      color: colors.success.main,
    },
    warning: {
      backgroundColor: colors.warning.light,
      borderWidth: 1,
      borderColor: colors.warning.main,
      color: colors.warning.main,
    },
    error: {
      backgroundColor: colors.error.light,
      borderWidth: 1,
      borderColor: colors.error.main,
      color: colors.error.main,
    },
    info: {
      backgroundColor: colors.info.light,
      borderWidth: 1,
      borderColor: colors.info.main,
      color: colors.info.main,
    },
    primary: {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderWidth: 1,
      borderColor: colors.primary[500],
      color: colors.primary[400],
    },
    accent: {
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
      borderWidth: 1,
      borderColor: colors.accent[500],
      color: colors.accent[400],
    },
  },
};

// Export a unified theme object
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animation,
  componentStyles,
};

export default theme;
