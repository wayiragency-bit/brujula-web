import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper:          '#0d1117',
        'paper-card':   '#111827',
        'paper-elevated': '#1a2236',
        ink:            '#e2e8f0',
        'ink-soft':     '#8899b8',
        'ink-muted':    '#3d5070',
        teal:           '#11433f',
        'teal-light':   '#0ea5e9',
        amber:          '#feb23b',
        line:           'rgba(255,255,255,0.08)',
        'status-accepted': '#22c55e',
        'status-expired':  '#f59e0b',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-ui)'],
        mono:    ['var(--font-data)'],
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
        floating: '0 24px 48px -12px rgba(0,0,0,0.6)',
      },
      maxWidth: {
        content: '1400px',
      },
    },
  },
  plugins: [],
};

export default config;
