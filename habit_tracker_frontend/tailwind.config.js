// tailwind.config.js
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
        primary: '#0EA5E9',
        secondary: '#1A1A1A',
        light: '#F9FAFB',
        accent: '#A855F7',
        habit: '#E5E7EB',

        // Flattened text colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
      },
    },
  },
  plugins: [],
};
