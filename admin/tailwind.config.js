/** @type {import('tailwindcss').Config} */

module.exports = {

  darkMode: ['class'],

  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {

    extend: {

      colors: {

        border: 'hsl(var(--border))',

        input: 'hsl(var(--input))',

        ring: 'hsl(var(--ring))',

        background: 'hsl(var(--background))',

        foreground: 'hsl(var(--foreground))',

        primary: {

          DEFAULT: 'hsl(var(--primary))',

          foreground: 'hsl(var(--primary-foreground))',

        },

        secondary: {

          DEFAULT: 'hsl(var(--secondary))',

          foreground: 'hsl(var(--secondary-foreground))',

        },

        destructive: {

          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',

          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',

        },

        muted: {

          DEFAULT: 'hsl(var(--muted))',

          foreground: 'hsl(var(--muted-foreground))',

        },

        accent: {

          DEFAULT: 'hsl(var(--accent))',

          foreground: 'hsl(var(--accent-foreground))',

        },

        popover: {

          DEFAULT: 'hsl(var(--popover))',

          foreground: 'hsl(var(--popover-foreground))',

        },

        card: {

          DEFAULT: 'hsl(var(--card))',

          foreground: 'hsl(var(--card-foreground))',

        },

        burgundy: {

          DEFAULT: '#2C1A14',

          dark: '#1F120E',

          light: '#3D261C',

          card: '#2C1A14',

        },

        cream: {

          DEFAULT: '#FAF5EE',

          warm: '#F3EBD8',

        },

        yellow: {

          brand: '#E8B838',

          dark: '#D4A52E',

        },

        gold: {

          DEFAULT: '#E8B838',

          light: '#F0C85A',

          dark: '#C99A28',

        },

        brown: {

          DEFAULT: '#2C1A14',

          muted: '#4A3228',

        },

        crimson: {

          DEFAULT: '#931F1D',

          dark: '#7A1917',

          light: '#B02A27',

        },

        beige: {

          DEFAULT: '#E5D9C8',

        },

        green: {

          brand: '#5C6B3A',

        },

        orange: {

          brand: '#E8B838',

        },

      },

      fontFamily: {

        display: ['Oswald', 'sans-serif'],

        body: ['Inter', 'sans-serif'],

      },

      borderRadius: {

        xl: 'calc(var(--radius) + 4px)',

        lg: 'var(--radius)',

        md: 'calc(var(--radius) - 2px)',

        sm: 'calc(var(--radius) - 4px)',

        xs: 'calc(var(--radius) - 6px)',

        '2xl': '16px',

        '3xl': '24px',

      },

      keyframes: {

        'accordion-down': {

          from: { height: '0' },

          to: { height: 'var(--radix-accordion-content-height)' },

        },

        'accordion-up': {

          from: { height: 'var(--radix-accordion-content-height)' },

          to: { height: '0' },

        },

        'fade-in': {

          from: { opacity: '0', transform: 'translateY(10px)' },

          to: { opacity: '1', transform: 'translateY(0)' },

        },

      },

      animation: {

        'accordion-down': 'accordion-down 0.2s ease-out',

        'accordion-up': 'accordion-up 0.2s ease-out',

        'fade-in': 'fade-in 0.3s ease-out forwards',

      },

    },

  },

  plugins: [require('tailwindcss-animate')],

}

