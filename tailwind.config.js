/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      /* Tokens that are ever used at an opacity (bg-ink/40, bg-surface/95,
         shadow-brand-600/25) are declared from their channel variables so
         Tailwind can mix the alpha in; the rest stay as plain variables. */
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          400: 'rgb(var(--brand-400-rgb) / <alpha-value>)',
          500: 'var(--brand-500)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          700: 'var(--brand-700)',
        },
        page: 'var(--page)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        sunken: 'var(--sunken)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        'line-strong': 'var(--line-strong)',
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
        },
        fresh: { DEFAULT: 'var(--fresh)', bg: 'var(--fresh-bg)' },
        stale: { DEFAULT: 'var(--stale)', bg: 'var(--stale-bg)' },
        live: { DEFAULT: 'rgb(var(--live-rgb) / <alpha-value>)', bg: 'var(--live-bg)' },
      },
      transitionTimingFunction: {
        soft: 'var(--ease)',
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
