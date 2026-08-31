/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
        },
        page: 'var(--page)',
        surface: 'var(--surface)',
        sunken: 'var(--sunken)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
        },
        fresh: { DEFAULT: 'var(--fresh)', bg: 'var(--fresh-bg)' },
        stale: { DEFAULT: 'var(--stale)', bg: 'var(--stale-bg)' },
        live: { DEFAULT: 'var(--live)', bg: 'var(--live-bg)' },
      },
      transitionTimingFunction: {
        soft: 'var(--ease)',
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
