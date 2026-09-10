import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        paper2: 'var(--paper2)',
        card: 'var(--card)',
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)' },
        terra: { DEFAULT: 'var(--terra)', deep: 'var(--terra-deep)', soft: 'var(--terra-soft)' },
        sage: { DEFAULT: 'var(--sage)', deep: 'var(--sage-deep)' },
        butter: 'var(--butter)',
        blush: 'var(--blush)',
        line: 'var(--line)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(62,42,28,.06), 0 8px 24px -8px rgba(62,42,28,.14)',
        'paper-lift': '0 2px 4px rgba(62,42,28,.08), 0 20px 44px -12px rgba(62,42,28,.28)',
        glow: '0 0 40px -8px var(--glow)',
      },
      maxWidth: { content: '72rem' },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0) rotate(var(--tilt,0deg))' },
          '50%': { transform: 'translateY(-6px) rotate(var(--tilt,0deg))' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
