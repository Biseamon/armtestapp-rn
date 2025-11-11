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
        primary: '#E63946',
        secondary: '#2A7DE1',
        premium: '#FFD700',
        success: '#10B981',
        error: '#FF6B6B',
        background: {
          light: '#FFFFFF',
          dark: '#1A1A1A',
        },
        surface: {
          light: '#F5F5F5',
          dark: '#2A2A2A',
        },
        text: {
          light: '#1A1A1A',
          dark: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
