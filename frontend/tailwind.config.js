/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './node_modules/shadcn-ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#D9D9D9',
          DEFAULT: '#2C2C2C', // Default shade
          dark: '#000000',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        content: ['Open Sans', 'sans-serif'],
        sans: ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
  ],
};
