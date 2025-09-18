/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        accent: '#15803D',
        warning: '#EAB308',
        error: '#EF4444',
        neutral: '#9CA3AF',
        background: '#ffffff',
        foreground: '#000000',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}