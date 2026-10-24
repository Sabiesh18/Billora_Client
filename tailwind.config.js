/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff9f6',
          100: '#ffede5',
          200: '#fdeee6',
          300: '#fcdccb',
          400: '#F88D3A',
          500: '#F67009',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#F67009',
        },
        theme: {
          bg: '#FFF9F6',
          card: '#FFFFFF',
          primary: '#F67009',
          secondary: '#F88D3A',
          border: '#F3E5DC',
          accent: '#FFF0E6',
        },
        pos: {
          surface: '#FFF9F6',
          card: '#FFFFFF',
          border: '#F3E5DC',
          active: '#F67009',
        }
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
  plugins: [],
}
