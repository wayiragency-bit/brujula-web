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
        paper:            'var(--paper)',
        'paper-card':     'var(--paper-card)',
        'paper-elevated': 'var(--paper-elevated)',
        ink:              'var(--ink)',
        'ink-soft':       'var(--ink-soft)',
        'ink-muted':      'var(--ink-muted)',
        teal:             'var(--teal)',
        'teal-light':     'var(--teal-light)',
        amber:            'var(--amber)',
        line:             'var(--line)',
        'status-accepted': 'var(--status-accepted)',
        'status-expired':  'var(--status-expired)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-ui)'],
        mono:    ['var(--font-data)'],
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.2)',
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
