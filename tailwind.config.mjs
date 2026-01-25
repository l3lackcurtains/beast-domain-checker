/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#d4ffdb',
          100: '#a8ffb5',
          200: '#7cff8f',
          300: '#50ff69',
          400: '#33ff55',
          500: '#00ff41', // Matrix green
          600: '#00cc34',
          700: '#009927',
          800: '#00661a',
          900: '#00330d',
        },
        dark: {
          50: '#4a4a4a',
          100: '#3a3a3a',
          200: '#2a2a2a',
          300: '#1a1a1a',
          400: '#0f0f0f',
          500: '#0a0a0a',
          600: '#050505',
          700: '#030303',
          800: '#020202',
          900: '#000000',
        },
        hacker: {
          green: '#00ff41',
          dim: '#00aa2a',
          glow: '#00ff4180',
          amber: '#ffb000',
          red: '#ff3333',
          cyan: '#00ffff',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 65, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 255, 65, 0.4)',
        'glow-amber': '0 0 20px rgba(255, 176, 0, 0.3)',
        'glow-red': '0 0 20px rgba(255, 51, 51, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px #00ff41' },
          '50%': { opacity: '0.8', textShadow: '0 0 20px #00ff41, 0 0 30px #00ff41' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
