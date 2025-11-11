/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        burgundy: {
          50: '#fdf4f8',
          100: '#fce7f0',
          200: '#fccfe3',
          300: '#fda4ca',
          400: '#fb6ba7',
          500: '#f43f86',
          600: '#e11d63',
          700: '#c51250',
          800: '#a30f43',
          900: '#87103a',
          950: '#520320',
        },
        maroon: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fbd0d9',
          300: '#f7aab9',
          400: '#f17793',
          500: '#e5446e',
          600: '#d0285c',
          700: '#ae1d4a',
          800: '#921b43',
          900: '#7d1a3e',
          950: '#46091d',
        },
      },
    },
  },
  plugins: [],
}
