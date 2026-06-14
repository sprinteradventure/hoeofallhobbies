import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#f5f1ed',
        blush: '#ead6ce',
        taupe: '#9b8a7e',
        charcoal: '#3d4451',
        'french-blue': '#4a5f7f',
        gold: '#c9a876',
        champagne: '#d4af37',
        cream: '#faf8f5',
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#a78bfa',
          600: '#9370db',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#581c87',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        cormorant: ['var(--font-cormorant)', 'serif'],
        lora: ['var(--font-lora)', 'serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
