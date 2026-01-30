// ===========================================
// Silentbox Cloud - Futuristic Design System
// ===========================================
// Style: Aurora Glassmorphism + Cyber Neon
// Vibe: Premium tech, innovative, futuristic workspace

export const designSystem = {
  // Brand Colors - Cyber Aurora Palette
  colors: {
    // Primary - Electric Violet/Indigo
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
    },
    // Glass effects
    glass: {
      white: 'rgba(255, 255, 255, 0.1)',
      whiteMedium: 'rgba(255, 255, 255, 0.15)',
      whiteStrong: 'rgba(255, 255, 255, 0.25)',
      dark: 'rgba(0, 0, 0, 0.3)',
      darkMedium: 'rgba(0, 0, 0, 0.5)',
    },
    // Gradients
    gradients: {
      aurora: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B73FF 100%)',
      cyber: 'linear-gradient(135deg, #0c1445 0%, #1a0533 50%, #0d0d0d 100%)',
      neonGlow: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #00f5d4 100%)',
      midnight: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      sunrise: 'linear-gradient(135deg, #ff006e 0%, #8b5cf6 50%, #06b6d4 100%)',
    },
  },

  // Typography - Modern Tech
  typography: {
    fontFamily: {
      heading: '"Space Grotesk", "Inter", system-ui, sans-serif',
      body: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    },
  },

  // Effects
  effects: {
    // Glassmorphism
    glass: {
      light: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      dark: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    },
    // Neon glow
    glow: {
      primary: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
      accent: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
      white: '0 0 20px rgba(255, 255, 255, 0.3)',
    },
    // Shadows
    shadow: {
      soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      large: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      neon: '0 0 30px rgba(139, 92, 246, 0.4)',
    },
  },

  // Border radius
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Animations
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

// CSS Custom Properties to inject
export const cssVariables = `
  :root {
    /* Primary */
    --color-primary-50: #f5f3ff;
    --color-primary-100: #ede9fe;
    --color-primary-200: #ddd6fe;
    --color-primary-300: #c4b5fd;
    --color-primary-400: #a78bfa;
    --color-primary-500: #8b5cf6;
    --color-primary-600: #7c3aed;
    --color-primary-700: #6d28d9;
    --color-primary-800: #5b21b6;
    --color-primary-900: #4c1d95;

    /* Accent */
    --color-accent-50: #ecfeff;
    --color-accent-100: #cffafe;
    --color-accent-200: #a5f3fc;
    --color-accent-300: #67e8f9;
    --color-accent-400: #22d3ee;
    --color-accent-500: #06b6d4;
    --color-accent-600: #0891b2;
    --color-accent-700: #0e7490;

    /* Neon */
    --neon-pink: #ff006e;
    --neon-blue: #3a86ff;
    --neon-green: #00f5d4;
    --neon-purple: #9b5de5;

    /* Glass */
    --glass-white: rgba(255, 255, 255, 0.1);
    --glass-white-strong: rgba(255, 255, 255, 0.25);
    --glass-border: rgba(255, 255, 255, 0.2);

    /* Gradients */
    --gradient-aurora: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B73FF 100%);
    --gradient-cyber: linear-gradient(135deg, #0c1445 0%, #1a0533 50%, #0d0d0d 100%);
    --gradient-neon: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #00f5d4 100%);
    --gradient-midnight: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);

    /* Typography */
    --font-heading: "Space Grotesk", "Inter", system-ui, sans-serif;
    --font-body: "Inter", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", monospace;

    /* Effects */
    --glow-primary: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3);
    --glow-accent: 0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3);
  }
`;

export default designSystem;
