import { useLayoutEffect, useRef, useState } from 'react'

/* Shared primitives.

   Colour carries meaning here rather than decoration: brand indigo for the
   primary action, a hue per game, and semantic tokens for fresh / stale /
   live. Elevation separates sheets and bars from the page. Motion is short
   and always opt-out via prefers-reduced-motion (see index.css). */

const TOOLTIP_WIDTH = 224
const EDGE_GUTTER = 8

export function Screen({ children }) {
  return <div className="anim-screen flex h-full flex-col bg-surface">{children}</div>
}

export function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-2 rounded-full p-1.5 text-ink transition-colors duration-150 hover:bg-sunken active:bg-line"
        >
          <BackGlyph />
        </button>
      ) : (
        <span className="w-1" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[17px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {/* Consultation feedback asked that every feature state what it is for.
            This line is where each screen answers that. */}
        {subtitle && (
          <p className="truncate text-[11px] leading-tight text-ink-muted">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  )
}

function BackGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5l-7 7 7 7" />
      <path d="M8 12h11" />
    </svg>
  )
}

export function Body({ children, className = '' }) {
  return <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>
}

export function PrimaryButton({ children, className = '', disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3.5 font-display text-sm font-semibold transition-all duration-150 ease-soft ${
        disabled
          ? 'bg-line text-ink-subtle'
          : 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 active:scale-[0.98]'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`w-full rounded-xl border border-line-strong bg-surface px-4 py-3.5 font-display text-sm font-semibold text-ink transition-all duration-150 ease-soft hover:bg-sunken active:scale-[0.98] ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* A compact action that ends a piece of information in something you can do.
   Consultation feedback: knowing where people are is not engagement unless it
   leads somewhere. */
export function ActionButton({ children, className = '', icon, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-all duration-150 ease-soft hover:bg-brand-100 active:scale-95 ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function BestBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Best
    </span>
  )
}

export function StaleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stale-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stale">
      <span className="h-1.5 w-1.5 rounded-full bg-stale" />
      Stale
    </span>
  )
}

export function LiveBadge({ label = 'Live' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-fresh-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fresh">
      <span className="relative flex h-1.5 w-1.5">
        <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-fresh" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fresh" />
      </span>
      {label}
    </span>
  )
}

/* A dot in the game's hue. Cheap, and it makes a list of venues scannable
   before any label is read. */
export function GameDot({ color, className = '' }) {
  return (
    <span
      className={`inline-block h-2 w-2 flex-none rounded-full ${className}`}
      style={{ backgroundColor: color }}
    />
  )
}

/* Consultation feedback asked for an icon or an avatar rather than a plain
   clickable name. Deterministic from the handle, so the same person is the
   same colour everywhere. */
const AVATAR_HUES = [
  ['#eef2ff', '#4338ca'],
  ['#fff1f2', '#be123c'],
  ['#ecfdf5', '#047857'],
  ['#fff7ed', '#c2410c'],
  ['#f5f3ff', '#6d28d9'],
  ['#ecfeff', '#0e7490'],
  ['#fefce8', '#a16207'],
]

function hueFor(handle) {
  let n = 0
  for (let i = 0; i < handle.length; i += 1) n = (n * 31 + handle.charCodeAt(i)) >>> 0
  return AVATAR_HUES[n % AVATAR_HUES.length]
}

export function Avatar({ handle = '?', size = 36, live = false, className = '' }) {
  const [bg, fg] = hueFor(handle)
  const initials = handle.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '?'

  return (
    <span className={`relative inline-flex flex-none ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-full font-display font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          color: fg,
          fontSize: Math.round(size * 0.36),
        }}
      >
        {initials}
      </span>
      {live && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-fresh" />
      )}
    </span>
  )
}

export function Info({ children, label = 'More information', above = false }) {
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const ref = useRef(null)

  /* The popup is anchored to a 16px button, so on a 390px frame it can hang
     off the edge and get clipped by the scroll container. Measure on open and
     flip the side rather than hand-tuning an alignment prop per call site. */
  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const frame = ref.current.closest('[data-frame]')
    if (!frame) return
    const t = ref.current.getBoundingClientRect()
    const f = frame.getBoundingClientRect()
    setAlignRight(t.left + TOOLTIP_WIDTH > f.right - EDGE_GUTTER)
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full border text-[10px] font-bold leading-none transition-colors duration-150 ${
          open
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-line-strong bg-surface text-ink-muted hover:border-brand-400 hover:text-brand-600'
        }`}
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          style={{ width: TOOLTIP_WIDTH }}
          className={`anim-row absolute z-30 rounded-xl border border-line bg-surface p-2.5 text-xs font-normal leading-relaxed text-ink-muted shadow-xl ${
            above ? 'bottom-7' : 'top-7'
          } ${alignRight ? 'right-0' : 'left-0'}`}
        >
          <span
            className={`absolute h-2.5 w-2.5 rotate-45 border-line bg-surface ${
              above ? '-bottom-[5px] border-b border-r' : '-top-[5px] border-l border-t'
            } ${alignRight ? 'right-2' : 'left-2'}`}
          />
          {children}
        </span>
      )}
    </span>
  )
}

export function Seg({ on, children, className = '', accent, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ease-soft active:scale-95 ${
        on
          ? 'border-transparent bg-ink text-white'
          : 'border-line-strong bg-surface text-ink-muted hover:border-ink-subtle hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {accent && <GameDot color={accent} className={on ? 'ring-2 ring-white/40' : ''} />}
      {children}
    </button>
  )
}

export function Chip({ children, className = '', tone = 'default' }) {
  const tones = {
    default: 'border-line-strong text-ink-muted bg-surface',
    brand: 'border-brand-200 text-brand-700 bg-brand-50',
    quiet: 'border-transparent text-ink-muted bg-sunken',
  }
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Placeholder({ label, className = '', children }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-line bg-sunken ${className}`}
    >
      {children || (
        <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          {label}
        </span>
      )}
    </div>
  )
}

export function Modal({ title, children }) {
  return (
    <div className="anim-scrim absolute inset-0 z-20 flex items-end bg-ink/40">
      <div className="anim-sheet w-full rounded-t-2xl border-t border-line bg-surface shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Stepper({ label, hint, value, min = 0, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {hint && <div className="text-xs text-ink-muted">{hint}</div>}
      </div>
      <div className="flex items-center gap-2">
        <StepButton
          label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          &minus;
        </StepButton>
        <span className="w-9 text-center font-display text-xl font-semibold tabular-nums text-ink">
          {value}
        </span>
        <StepButton label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
          +
        </StepButton>
      </div>
    </div>
  )
}

function StepButton({ children, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-9 w-9 rounded-full border text-lg font-semibold leading-none transition-all duration-150 ease-soft ${
        disabled
          ? 'border-line bg-sunken text-ink-subtle'
          : 'border-line-strong bg-surface text-ink hover:border-brand-400 hover:text-brand-600 active:scale-90'
      }`}
    >
      {children}
    </button>
  )
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-150 ${
        checked ? 'border-brand-200 bg-brand-50' : 'border-line bg-surface hover:bg-sunken'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition-colors duration-200 ease-soft ${
          checked ? 'bg-brand-600' : 'bg-line-strong'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-soft ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
    </button>
  )
}
