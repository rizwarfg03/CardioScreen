/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern Clean Bisfit Health UI Theme
        background: '#F4F6FA',
        'on-background': '#0F172A',
        surface: '#FFFFFF',
        'surface-subtle': '#F8FAFC',
        'surface-card': '#FFFFFF',
        'surface-container': '#EDF2F7',
        'surface-container-low': '#F8FAFC',
        'surface-container-lowest': '#FFFFFF',
        'surface-variant': '#E2E8F0',
        'on-surface': '#0F172A',
        'on-surface-variant': '#64748B',

        outline: '#CBD5E1',
        'outline-variant': '#E2E8F0',

        // Deep Medical Blue - Clinical Healthcare Accent (#0057B8)
        primary: '#0057B8',
        'primary-hover': '#00479E',
        'on-primary': '#FFFFFF',
        'primary-container': '#EBF2FF',
        'on-primary-container': '#003A7C',

        // Secondary & neutral tones
        secondary: '#0F172A',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#F1F5F9',
        'on-secondary-container': '#334155',

        // Success / Normal indicator
        tertiary: '#10B981',
        'tertiary-container': '#D1FAE5',
        'on-tertiary-container': '#065F46',

        // Clinical abnormal / warning
        error: '#EF4444',
        'error-container': '#FEE2E2',
        'on-error': '#FFFFFF',
        'on-error-container': '#991B1B',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'metric-display': ['40px', { lineHeight: '46px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-2xl': ['32px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['26px', { lineHeight: '34px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'headline-sm': ['15px', { lineHeight: '22px', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-xs': ['11px', { lineHeight: '14px', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card-soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
      },
      spacing: {
        base: '4px',
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        gutter: '16px',
        margin: '24px',
      },
    },
  },
  plugins: [],
};
