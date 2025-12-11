/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      black: '#000000',
      white: '#FFFFFF',
      gray: {
        DEFAULT: '#E5E5E5', // Only for borders
        light: '#E5E5E5', 
      },
      transparent: 'transparent',
      current: 'currentColor',
    },
    borderRadius: {
      none: '0',
      sm: '0',
      DEFAULT: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      '3xl': '0',
      full: '0',
    },
    boxShadow: {
      none: 'none',
      DEFAULT: 'none',
      sm: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      '2xl': 'none',
      inner: 'none',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}
