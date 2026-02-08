import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#ff3131',
          600: '#f03e3e',
          700: '#c92a2a',
          800: '#a61e1e',
          900: '#801414',
          950: '#4a0808',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
          950: '#050505',
        },
        accent: {
          gold: '#F5C518',
          amber: '#FFB800',
          emerald: '#00D68F',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          coral: '#FF6B6B',
        },
        live: '#FF3131',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'display-xl': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-2xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.05em' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
};

export default config;
