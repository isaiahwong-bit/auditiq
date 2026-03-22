/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1D9E75',
          'green-light': '#E1F5EE',
          amber: '#BA7517',
          'amber-light': '#FAEEDA',
          red: '#E24B4A',
          'red-light': '#FCEBEB',
          blue: '#378ADD',
          'blue-light': '#E6F1FB',
          gray: '#888780',
          'gray-light': '#F1EFE8',
        },
      },
    },
  },
  plugins: [],
};
