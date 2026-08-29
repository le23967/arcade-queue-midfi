import { useLayoutEffect, useRef, useState } from 'react'

/* Shared primitives.

   Palette rule for the whole prototype: black, white and gray only, with
   blue-600 reserved exclusively for the primary action on a screen. Anything
   that is not a primary action - including the "best option" marker and the
   stale-data warning - has to earn attention with weight and border, not
   with colour. */

export function Screen({ children }) {
  return <div className="flex h-full flex-col bg-white">{children}</div>
}

export function TopBar({ title, onBack, right }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 p-1 text-gray-900"
        >
          <BackGlyph />
        </button>
      ) : (
        <span className="w-1" />
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900">{title}</h1>
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
      strokeWidth="1.6"
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
  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>
  )
}

/* The one blue element per screen. */
export function PrimaryButton({ children, className = '', disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`w-full rounded-md px-4 py-3 text-sm font-semibold ${
        disabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'
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
      className={`w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* Not blue: "best" is structural information, not an action. */
export function BestBadge() {
  return (
    <span className="inline-block rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Best
    </span>
  )
}

/* Not red either - the palette has no alarm colour, so staleness is carried
   by a dashed border and an explicit word. */
export function StaleBadge() {
  return (
    <span className="inline-block rounded-md border border-dashed border-gray-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
      Stale
    </span>
  )
}

const TOOLTIP_WIDTH = 224
const EDGE_GUTTER = 8

/* ---------------------------------------------------------------------------
   Info tooltip.

   Rationale, caveats and privacy detail used to sit on the screen as
   paragraphs. In testing that reads as documentation, and people skip it,
   which is the worst of both outcomes: the screen looks cluttered AND the
   explanation goes unread.

   It lives behind a "?" instead. Opens on hover for a mouse, on tap for a
   phone, and on focus for a keyboard. Appears and disappears on the same
   frame - no fade.

   Anything that does not fit in a tooltip belongs in the code or the README,
   not on the screen.
--------------------------------------------------------------------------- */
export function Info({ children, label = 'More information', above = false }) {
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const ref = useRef(null)

  /* The popup is anchored to a 16px button, so on a 390px frame it can easily
     hang off the edge - and the scroll container clips it, which is how the
     text ends up half-readable. Measure on open and flip the side rather than
     hand-tuning an alignment prop per call site. */
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
        className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border text-[10px] font-bold leading-none ${
          open
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-500 bg-white text-gray-600'
        }`}
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          style={{ width: TOOLTIP_WIDTH }}
          className={`absolute z-20 rounded-md border border-gray-400 bg-white p-2 text-xs font-normal leading-relaxed text-gray-700 ${
            above ? 'bottom-6' : 'top-6'
          } ${alignRight ? 'right-0' : 'left-0'}`}
        >
          <span
            className={`absolute h-2 w-2 rotate-45 border-gray-400 bg-white ${
              above ? '-bottom-1 border-b border-r' : '-top-1 border-l border-t'
            } ${alignRight ? 'right-1.5' : 'left-1.5'}`}
          />
          {children}
        </span>
      )}
    </span>
  )
}

/* Segmented control. Selected state is a black border, not a colour. */
export function Seg({ on, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
        on
          ? 'border-gray-900 bg-gray-100 text-gray-900'
          : 'border-gray-300 bg-white text-gray-600'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* Small bordered label. Gray only - a grade is information, not an action. */
export function Chip({ children, className = '' }) {
  return (
    <span
      className={`inline-block rounded-md border border-gray-400 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-700 ${className}`}
    >
      {children}
    </span>
  )
}

export function Placeholder({ label, className = '', children }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md border border-gray-300 bg-gray-200 ${className}`}
    >
      {children || (
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
      )}
    </div>
  )
}


/* Modals appear and disappear on the same frame - no fade, no slide. */
export function Modal({ title, children }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end bg-gray-900/40">
      <div className="w-full rounded-t-md border-t border-gray-300 bg-white">
        <div className="border-b border-gray-300 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Stepper({ label, hint, value, min = 0, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-300 py-3 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {hint && <div className="text-xs text-gray-600">{hint}</div>}
      </div>
      <div className="flex items-center gap-2">
        <StepButton
          label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          &minus;
        </StepButton>
        <span className="w-8 text-center text-lg font-semibold tabular-nums text-gray-900">
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
      className={`h-9 w-9 rounded-md border text-lg font-semibold leading-none ${
        disabled
          ? 'border-gray-300 bg-gray-100 text-gray-400'
          : 'border-gray-400 bg-white text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

/* A checkbox, not a switch: a switch implies a slide. */
export function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-md border border-gray-300 p-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${
          checked ? 'border-gray-900 bg-gray-900' : 'border-gray-400 bg-white'
        }`}
      >
        {checked && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {hint && <span className="block text-xs text-gray-600">{hint}</span>}
      </span>
    </button>
  )
}
