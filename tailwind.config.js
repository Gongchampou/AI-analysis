/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        anime: {
          bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
          primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
          'text-main': 'rgb(var(--text-main-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--text-muted-rgb) / <alpha-value>)',
          'border': 'rgb(var(--border-rgb) / <alpha-value>)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'slide-in-from-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-from-right': 'slideInRight 0.5s ease-out forwards',
        'zoom-in': 'zoomIn 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}