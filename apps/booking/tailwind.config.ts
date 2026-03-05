import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // These can be overridden by CSS variables for tenant branding
        primary: {
          50: 'var(--color-primary-50, #1E1B4B)',
          100: 'var(--color-primary-100, #2E1065)',
          200: 'var(--color-primary-200, #4C1D95)',
          300: 'var(--color-primary-300, #6D28D9)',
          400: 'var(--color-primary-400, #818CF8)',
          500: 'var(--color-primary-500, #8B5CF6)',
          600: 'var(--color-primary-600, #7C3AED)',
          700: 'var(--color-primary-700, #6D28D9)',
          800: 'var(--color-primary-800, #5B21B6)',
          900: 'var(--color-primary-900, #4C1D95)',
        },
        accent: {
          50: 'var(--color-accent-50, #1E1B4B)',
          500: 'var(--color-accent-500, #818CF8)',
          600: 'var(--color-accent-600, #6366F1)',
        },
        // Dark theme surface colors
        surface: {
          DEFAULT: '#09090B',
          secondary: '#0F0F11',
          card: '#18181B',
          elevated: '#1F1F23',
        },
        border: {
          DEFAULT: '#27272A',
          hover: '#3F3F46',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans, Inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #A78BFA, #818CF8, #60A5FA)',
        'gradient-accent-hover': 'linear-gradient(135deg, #C4B5FD, #A5B4FC, #93C5FD)',
        'gradient-accent-subtle': 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(129,140,248,0.1), rgba(96,165,250,0.1))',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.15)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.4)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.3), 0 8px 24px rgba(0, 0, 0, 0.5)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(96, 165, 250, 0.1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
