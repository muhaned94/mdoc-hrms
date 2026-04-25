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
        primary: '#0ea5e9', // Sky 500
        secondary: '#64748b', // Slate 500
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'progress-buffer': 'progress-buffer 2s ease-in-out infinite',
      },
      keyframes: {
        'progress-buffer': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
