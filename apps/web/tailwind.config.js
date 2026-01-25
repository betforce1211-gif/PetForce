/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Pet-friendly teal
        primary: {
          50: '#EEF8F7',
          100: '#D6EEE9',
          200: '#ADDDD3',
          300: '#7FC9BB',
          400: '#4DB4A3',
          500: '#2D9B87',
          600: '#238075',
          700: '#1A655F',
          800: '#124A47',
          900: '#0F3D3A',
          DEFAULT: '#2D9B87',
        },
        // Secondary - Warm accent
        secondary: {
          50: '#FFF5E6',
          100: '#FFE6CC',
          200: '#FFCC99',
          300: '#FFB366',
          400: '#FF9F40',
          500: '#E68A2E',
          600: '#CC7629',
          700: '#B36623',
          800: '#99561E',
          900: '#804619',
          DEFAULT: '#FF9F40',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
