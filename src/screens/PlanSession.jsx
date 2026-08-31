import { useState } from 'react'
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
   tab as an invitation. */
const TIMES = ['Tonight, 6:30 PM', 'Tomorrow, 2:00 PM', 'Saturday, 1:00 PM']

export default function PlanSession({ arcades, preset, onBack, onDone }) {
  const [venue, setVenue] = useState(preset?.venue ?? arcades[0]?.id)
  const [gameId, setGameId] = useState(preset?.gameId ?? 'maimai')
  const [when, setWhen] = useState(TIMES[0])
  const [invited, setInvited] = useState(preset?.invite ? [preset.invite] : [])
  const [sent, setSent] = useState(false)

  const mutuals = FRIENDS.filter((f) => f.followsYou)
  const arcade = arcades.find((a) => a.id === venue) ?? arcades[0]

  function toggle(handle) {
    setInvited((v) =>
      v.includes(handle) ? v.filter((h) => h !== handle) : [...v, handle]
    )
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
            {arcade?.short} &middot; {when}
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
          <div className="flex flex-wrap gap-1.5">
            {TIMES.map((t) => (
              <Seg key={t} on={t === when} onClick={() => setWhen(t)}>
                {t}
              </Seg>
            ))}
          </div>
        </Section>

        <Section title={`Who — ${invited.length} asked`}>
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
            {arcade?.short} &middot; {when}
          </p>
        </div>
        <PrimaryButton disabled={invited.length === 0} onClick={() => setSent(true)}>
          {invited.length === 0 ? 'Pick who to ask' : `Send to ${invited.length}`}
        </PrimaryButton>
        <SecondaryButton onClick={onBack}>Cancel</SecondaryButton>
      </div>
    </Screen>
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
