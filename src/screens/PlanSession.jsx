import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  SecondaryButton,
  Seg,
  Avatar,
  GameDot,
} from '../components/ui.jsx'
import { Check } from '../components/Icons.jsx'
import { GAMES } from '../data.js'
import { FRIENDS } from '../social.js'

/* Plan a session.

   Consultation feedback was that presence only pays off when it lets you
   arrange something: knowing where people are is not engagement until it turns
   into a time and a place. This screen is that turn.

   Venue, game, time, and who you are asking - then it lands on their Circle
   tab as an invitation.

   When used to be three hardcoded strings, which is fine for clicking through
   a demo and useless for planning anything: the screen could not express next
   Thursday. Choosing a date and time is therefore the main control: the date
   uses the platform's familiar typed/calendar field, while hour and minute can
   be typed or moved with phone-style wheels. Common times remain as clearly
   labelled shortcuts rather than being mixed with the custom choice. */

export default function PlanSession({ arcades, preset, onBack, onDone }) {
  const [venue, setVenue] = useState(preset?.venue ?? arcades[0]?.id)
  const [gameId, setGameId] = useState(preset?.gameId ?? 'maimai')
  /* Computed once, so the options do not shift under the user mid-plan. */
  const [now] = useState(() => new Date())
  const quickPicks = useMemo(() => presetTimes(now), [now])
  const [when, setWhen] = useState(quickPicks[0])
  const [draftWhen, setDraftWhen] = useState(quickPicks[0])
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerTriggerRef = useRef(null)
  const [invited, setInvited] = useState(preset?.invite ? [preset.invite] : [])
  const [sent, setSent] = useState(false)

  const mutuals = FRIENDS.filter((f) => f.followsYou)
  const arcade = arcades.find((a) => a.id === venue) ?? arcades[0]

  function toggle(handle) {
    setInvited((v) =>
      v.includes(handle) ? v.filter((h) => h !== handle) : [...v, handle]
    )
  }

  function closePicker() {
    setPickerOpen(false)
    window.requestAnimationFrame(() => pickerTriggerRef.current?.focus())
  }

  function sendInvites() {
    if (when.getTime() <= Date.now()) {
      setDraftWhen(when)
      setPickerOpen(true)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Screen>
        <TopBar title="Session planned" onBack={onDone} />
        <Body className="flex flex-col items-center justify-center p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-fresh-bg text-fresh">
            <Check size={32} />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Invitation sent
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {arcade?.short} &middot; {formatWhen(when, now)}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            {invited.length} {invited.length === 1 ? 'person' : 'people'} asked. It
            shows on their Circle tab.
          </p>
          <div className="mt-6 w-full">
            <PrimaryButton onClick={onDone}>Done</PrimaryButton>
          </div>
        </Body>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        title="Plan a session"
        subtitle="Turn who's around into a time and a place"
        onBack={onBack}
      />

      <Body>
        <Section title="Where">
          <div className="flex flex-wrap gap-1.5">
            {arcades.map((a) => (
              <Seg key={a.id} on={a.id === venue} onClick={() => setVenue(a.id)}>
                {a.short}
              </Seg>
            ))}
          </div>
        </Section>

        <Section title="What">
          <div className="flex flex-wrap gap-1.5">
            {GAMES.map((g) => (
              <Seg
                key={g.id}
                on={g.id === gameId}
                accent={g.color}
                onClick={() => setGameId(g.id)}
              >
                {g.label}
              </Seg>
            ))}
          </div>
        </Section>

        <Section title="When">
          <button
            ref={pickerTriggerRef}
            type="button"
            onClick={() => {
              setDraftWhen(when)
              setPickerOpen(true)
            }}
            aria-label={`Choose date and time. Currently ${formatWhen(when, now)}`}
            className="flex w-full items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-3 py-3 text-left transition-all duration-150 hover:border-brand-400 hover:bg-brand-100 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface text-brand-600 shadow-sm">
              <CalendarGlyph />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-brand-700">
                Choose your date and time
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink">
                {formatWhen(when, now)}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">
                Type it, open the calendar, or scroll the time
              </span>
            </span>
            <span className="text-brand-600" aria-hidden="true">
              <ChevronGlyph />
            </span>
          </button>

          <div className="mb-1.5 mt-3 flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Or use a suggestion
            </p>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPicks.map((t) => (
              <Seg
                key={t.getTime()}
                on={t.getTime() === when.getTime()}
                onClick={() => setWhen(t)}
              >
                {formatWhen(t, now)}
              </Seg>
            ))}
          </div>
        </Section>

        <Section title={`Who, ${invited.length} asked`}>
          <ul className="-mx-1">
            {mutuals.slice(0, 8).map((f) => {
              const on = invited.includes(f.handle)
              return (
                <li key={f.handle}>
                  <button
                    type="button"
                    onClick={() => toggle(f.handle)}
                    className={`flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors duration-150 ${
                      on ? 'bg-brand-50' : 'hover:bg-sunken'
                    }`}
                  >
                    <Avatar handle={f.handle} size={32} live={Boolean(f.at)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {f.handle}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {f.games.join(' · ')}
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors duration-150 ${
                        on
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-line-strong bg-surface'
                      }`}
                    >
                      {on && <Check size={13} />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>
      </Body>

      <div className="space-y-2 border-t border-line p-4">
        <div className="flex items-center gap-2 rounded-xl bg-sunken px-3 py-2">
          <GameDot color={GAMES.find((g) => g.id === gameId)?.color} />
          <p className="text-xs text-ink-muted">
            {arcade?.short} &middot; {formatWhen(when, now)}
          </p>
        </div>
        <PrimaryButton disabled={invited.length === 0} onClick={sendInvites}>
          {invited.length === 0 ? 'Pick who to ask' : `Send to ${invited.length}`}
        </PrimaryButton>
        <SecondaryButton onClick={onBack}>Cancel</SecondaryButton>
      </div>

      {pickerOpen && (
        <DateTimeSheet
          value={draftWhen}
          now={now}
          onChange={setDraftWhen}
          onCancel={closePicker}
          onDone={() => {
            if (draftWhen.getTime() <= Date.now()) return
            setWhen(draftWhen)
            closePicker()
          }}
        />
      )}
    </Screen>
  )
}

/* --- time -----------------------------------------------------------------

   Real Date objects rather than labels, so a quick pick and a picked time are
   the same kind of thing and one formatter renders both. --------------------- */
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function at(from, hours, minutes, addDays = 0) {
  const date = new Date(from)
  date.setDate(date.getDate() + addDays)
  date.setHours(hours, minutes, 0, 0)
  return date
}

/* Tonight, tomorrow afternoon, and the coming Saturday - the three shapes a
   session actually takes. Each one is pushed forward if it has already been
   and gone, so a quick pick is never a time in the past. */
function presetTimes(now) {
  const tonight = at(now, 18, 30)
  if (tonight <= now) tonight.setDate(tonight.getDate() + 1)

  const daysToSaturday = (6 - now.getDay() + 7) % 7 || 7

  return [tonight, at(now, 14, 0, 1), at(now, 13, 0, daysToSaturday)]
}

function midnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function clock(date) {
  const hours = date.getHours()
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(date.getMinutes()).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

export function formatWhen(date, now = new Date()) {
  const days = Math.round((midnight(date) - midnight(now)) / 86400000)

  if (days === 0) return `${date.getHours() >= 17 ? 'Tonight' : 'Today'}, ${clock(date)}`
  if (days === 1) return `Tomorrow, ${clock(date)}`
  if (days > 1 && days < 7) return `${DAY_NAMES[date.getDay()]}, ${clock(date)}`
  return `${DAY_NAMES[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()]}, ${clock(date)}`
}

function dateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateFromKey(key, time) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(
    year,
    month - 1,
    day,
    time.getHours(),
    time.getMinutes(),
    0,
    0
  )
}

function withHour(date, hour12) {
  const next = new Date(date)
  const afternoon = date.getHours() >= 12
  next.setHours((hour12 % 12) + (afternoon ? 12 : 0))
  return next
}

function withMinute(date, minute) {
  const next = new Date(date)
  next.setMinutes(minute)
  return next
}

function withPeriod(date, period) {
  const next = new Date(date)
  const hour12 = date.getHours() % 12
  next.setHours(hour12 + (period === 'PM' ? 12 : 0))
  return next
}

function DateTimeSheet({ value, now, onChange, onCancel, onDone }) {
  const titleId = useId()
  const dateInputId = useId()
  const dialogRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [dateInput, setDateInput] = useState(() => dateKey(value))
  const [timeEntriesValid, setTimeEntriesValid] = useState({
    hour: true,
    minute: true,
  })
  const hours = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: i + 1 })),
    []
  )
  const minutes = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        value: i,
        label: String(i).padStart(2, '0'),
      })),
    []
  )
  const periods = useMemo(
    () => [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
    []
  )
  const dateComplete = Boolean(dateInput)
  const timeComplete = timeEntriesValid.hour && timeEntriesValid.minute
  const future = dateComplete && timeComplete && value.getTime() > currentTime.getTime()
  const error = !dateComplete
    ? 'Type or choose a date to continue.'
    : !timeComplete
      ? 'Enter an hour from 1–12 and a minute from 00–59.'
      : !future
        ? 'Choose a time in the future to continue.'
        : ''

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault()
        const returnTarget = event.shiftKey ? last : first
        returnTarget.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  function finish() {
    const latest = new Date()
    setCurrentTime(latest)
    if (dateComplete && timeComplete && value.getTime() > latest.getTime()) onDone()
  }

  return (
    <div
      className="anim-scrim absolute inset-0 z-30 flex items-end bg-ink/40"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="anim-sheet max-h-[calc(100%-1rem)] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border-t border-line bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <span className="mx-auto mt-2 block h-1 w-10 rounded-full bg-line-strong" />
        <div className="grid grid-cols-[64px_1fr_64px] items-center border-b border-line px-3 pb-2 pt-1">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="justify-self-start rounded-lg px-1 py-2 text-sm font-medium text-brand-600"
          >
            Cancel
          </button>
          <h2 id={titleId} className="text-center font-display text-sm font-semibold text-ink">
            Choose date and time
          </h2>
          <button
            type="button"
            disabled={!future}
            onClick={finish}
            className="justify-self-end rounded-lg px-1 py-2 text-sm font-semibold text-brand-600 disabled:text-ink-subtle"
          >
            Done
          </button>
        </div>

        <p className="mx-4 mt-3 rounded-xl bg-brand-50 px-3 py-2 text-center text-sm font-semibold text-brand-700">
          {formatWhen(value, now)}
        </p>

        <div className="px-4 pt-3">
          <label
            htmlFor={dateInputId}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-muted"
          >
            Date
          </label>
          <input
            id={dateInputId}
            type="date"
            value={dateInput}
            min={dateKey(currentTime)}
            required
            aria-invalid={!dateComplete}
            onChange={(event) => {
              const next = event.target.value
              setDateInput(next)
              if (next) onChange(dateFromKey(next, value))
            }}
            className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 font-display text-sm font-semibold text-ink outline-none transition-colors duration-150 focus:border-brand-500"
          />
        </div>

        <div className="px-4 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Time
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)_12px_minmax(0,1fr)_104px] items-end gap-2">
            <WheelColumn
              label="Hour"
              options={hours}
              value={value.getHours() % 12 || 12}
              min={1}
              max={12}
              onChange={(next) => onChange(withHour(value, next))}
              onValidityChange={(valid) =>
                setTimeEntriesValid((state) =>
                  state.hour === valid ? state : { ...state, hour: valid }
                )
              }
            />
            <span
              className="flex h-[120px] items-center justify-center font-display text-lg font-semibold text-ink-muted"
              aria-hidden="true"
            >
              :
            </span>
            <WheelColumn
              label="Minute"
              options={minutes}
              value={value.getMinutes()}
              min={0}
              max={59}
              onChange={(next) => onChange(withMinute(value, next))}
              onValidityChange={(valid) =>
                setTimeEntriesValid((state) =>
                  state.minute === valid ? state : { ...state, minute: valid }
                )
              }
            />
            <fieldset className="min-w-0">
              <legend className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                AM/PM
              </legend>
              <div className="flex h-[120px] items-center rounded-xl bg-sunken p-1">
                <div className="grid h-11 w-full grid-cols-2 rounded-xl bg-surface/50 p-1">
                  {periods.map((period) => {
                    const selected = value.getHours() >= 12 ? 'PM' : 'AM'
                    const on = period.value === selected
                    return (
                      <button
                        key={period.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(withPeriod(value, period.value))}
                        className={`rounded-lg text-xs font-semibold transition-colors duration-150 ${
                          on
                            ? 'bg-surface text-brand-700 shadow-sm'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {period.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {error && (
          <p
            className="px-4 pt-2 text-center text-[11px] font-medium text-live"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

const WHEEL_ROW_HEIGHT = 40
const formatWheelValue = (number) => String(number).padStart(2, '0')

function WheelColumn({
  label,
  options,
  value,
  min,
  max,
  onChange,
  onValidityChange,
}) {
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const scrollDriven = useRef(false)
  const [text, setText] = useState(() => formatWheelValue(value))
  const number = Number(text)
  const valid = text !== '' && Number.isInteger(number) && number >= min && number <= max
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setText(formatWheelValue(value))
    }
  }, [value])

  useEffect(() => {
    /* Native momentum and scroll snapping should finish a gesture themselves.
       Re-centering on every scroll-driven state update would fight the finger. */
    if (scrollDriven.current) {
      scrollDriven.current = false
      return
    }

    listRef.current?.scrollTo({
      top: activeIndex * WHEEL_ROW_HEIGHT,
    })
  }, [activeIndex])

  function choose(index) {
    const nextIndex = Math.min(Math.max(index, 0), options.length - 1)
    const next = options[nextIndex].value
    setText(formatWheelValue(next))
    onValidityChange(true)
    onChange(next)
  }

  function commit() {
    if (valid) {
      setText(formatWheelValue(number))
      onChange(number)
    } else {
      setText(formatWheelValue(value))
    }
    onValidityChange(true)
  }

  function step(direction) {
    const start = valid ? number : value
    const next = Math.min(Math.max(start + direction, min), max)
    setText(formatWheelValue(next))
    onValidityChange(true)
    onChange(next)
  }

  function beginTyping() {
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.select()
  }

  return (
    <div className="min-w-0">
      <p className="mb-1 truncate text-center text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      <div className="relative overflow-hidden rounded-xl bg-sunken">
        <span className="pointer-events-none absolute inset-x-1 top-1/2 z-0 h-10 -translate-y-1/2 rounded-lg border-y border-brand-200 bg-brand-50" />
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-sunken to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-t from-sunken to-transparent" />
        <div
          ref={listRef}
          aria-hidden="true"
          onPointerDown={() => inputRef.current?.blur()}
          onWheel={() => inputRef.current?.blur()}
          onScroll={(event) => {
            const nextIndex = Math.min(
              Math.max(Math.round(event.currentTarget.scrollTop / WHEEL_ROW_HEIGHT), 0),
              options.length - 1
            )
            if (nextIndex !== activeIndex) {
              const next = options[nextIndex].value
              scrollDriven.current = true
              setText(formatWheelValue(next))
              onValidityChange(true)
              onChange(next)
            }
          }}
          className="no-scrollbar relative z-10 h-[120px] touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain py-10"
        >
          {options.map((option, index) => {
            const selected = index === activeIndex
            return (
              <div
                key={option.value}
                onClick={() => {
                  if (selected) beginTyping()
                  else choose(index)
                }}
                className={`flex h-10 snap-center items-center justify-center truncate px-1 text-center tabular-nums transition-colors duration-150 ${
                  selected
                    ? 'cursor-text font-display text-sm font-semibold text-transparent'
                    : 'cursor-pointer text-xs text-ink-muted'
                }`}
              >
                {option.label}
              </div>
            )
          })}
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          role="spinbutton"
          maxLength={2}
          value={text}
          required
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valid ? number : undefined}
          aria-invalid={!valid}
          aria-label={`${label}, swipe to adjust or type a number from ${min} to ${max}`}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, '').slice(0, 2)
            const nextNumber = Number(next)
            const nextValid =
              next !== '' &&
              Number.isInteger(nextNumber) &&
              nextNumber >= min &&
              nextNumber <= max

            setText(next)
            onValidityChange(nextValid)
            if (nextValid) onChange(nextNumber)
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault()
              step(event.key === 'ArrowUp' ? 1 : -1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              choose(0)
            } else if (event.key === 'End') {
              event.preventDefault()
              choose(options.length - 1)
            }
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-9 w-[calc(100%-0.5rem)] max-w-20 -translate-x-1/2 -translate-y-1/2 rounded-md border border-transparent bg-transparent px-1 text-center font-display text-base font-semibold tabular-nums text-ink outline-none transition-colors duration-150 focus:border-brand-500 focus:bg-surface"
        />
      </div>
    </div>
  )
}

function CalendarGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 13h3M13 13h3M8 17h3M13 17h3" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      {children}
    </div>
  )
}
