/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        pos: {
          surface: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          active: '#3b82f6',
        }
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
  plugins: [],
}
