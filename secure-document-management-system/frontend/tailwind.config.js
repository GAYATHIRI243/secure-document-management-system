/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#080D17',
          900: '#0B1120',
          800: '#111A2E',
          700: '#182338',
          600: '#26324A',
        },
        line: '#243046',
        accent: {
          DEFAULT: '#22D3EE',
          dim: '#0E7490',
        },
        risk: {
          low: '#34D399',
          medium: '#F5A623',
          high: '#F0475C',
        },
        ink: {
          DEFAULT: '#E7ECF5',
          dim: '#93A1BD',
          faint: '#5C6A88',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        pulseLine: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        rowIn: {
          from: { opacity: 0, transform: 'translateY(-6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseLine: 'pulseLine 2s ease-in-out infinite',
        rowIn: 'rowIn 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
