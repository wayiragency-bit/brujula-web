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
        paper: '#fdf9ee',
        'paper-card': '#fbf9f3',
        ink: '#15302c',
        'ink-soft': '#5c6b66',
        teal: '#11433f',
        amber: '#e29a22',
        line: '#c0c8c6',
        'status-accepted': '#16a34a',
        'status-expired': '#d97706',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-ui)'],
        mono: ['var(--font-data)'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(21, 48, 44, 0.08)',
        floating: '0 16px 40px -16px rgba(21, 48, 44, 0.25)',
      },
      maxWidth: {
        content: '1400px',
      },
    },
  },
  plugins: [],
};

export default config;
