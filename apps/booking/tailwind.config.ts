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
          50: 'var(--color-primary-50, #EEF2FF)',
          100: 'var(--color-primary-100, #E0E7FF)',
          200: 'var(--color-primary-200, #C7D2FE)',
          300: 'var(--color-primary-300, #A5B4FC)',
          400: 'var(--color-primary-400, #818CF8)',
          500: 'var(--color-primary-500, #6366F1)',
          600: 'var(--color-primary-600, #4F46E5)',
          700: 'var(--color-primary-700, #4338CA)',
          800: 'var(--color-primary-800, #3730A3)',
          900: 'var(--color-primary-900, #312E81)',
        },
        accent: {
          50: 'var(--color-accent-50, #FFFBEB)',
          500: 'var(--color-accent-500, #F59E0B)',
          600: 'var(--color-accent-600, #D97706)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans, Inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
