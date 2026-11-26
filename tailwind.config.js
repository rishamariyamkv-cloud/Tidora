/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#243B53', light: '#334E68', dark: '#1A2B3D' },
        teal: { DEFAULT: '#2A9D8F', light: '#3DB5A6', dark: '#21867A' },
        sea: '#EAF2F8',
        success: '#2E9D62',
        warning: '#F4B942',
        danger: '#E76F51',
        page: v('page'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        soft: v('soft'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 42, 67, 0.04), 0 4px 16px rgba(16, 42, 67, 0.06)',
      },
    },
  },
  plugins: [],
};
