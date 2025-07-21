/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode via class
  theme: {
    extend: {
      colors: {
        primary: '#FEC400',     // Bright yellow
        secondary: '#1A1A1A',   // Deep black
        light: '#F9FAFB',       // Light gray background
        accent: '#A855F7',      // Optional vibrant color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // You can replace this with your own
      },
      borderRadius: {
        xl: '1.5rem',
        '2xl': '2rem',
      },
    },
  },
  plugins: [],
};
