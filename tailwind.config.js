/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        background: '#f8fafc',
        surface: '#ffffff',
      }
    },
  },
  plugins: [],
}