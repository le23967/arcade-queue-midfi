import { useState } from 'react'
import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  Stepper,
  Info,
} from '../components/ui.jsx'
import { estimateWaitMin, freshnessLabel, isStale } from '../lib/queue.js'

/* Check-in, step two: confirm what you can see.

   Reporting used to be a second button sitting next to Check In at the same
   visual weight, which is wrong twice over - it competes with the primary
   action, and it asks for a report at a moment when the person is not
   necessarily looking at the queue.

   This is the moment they are. They have just scanned at the cabinet, so they
   are standing in front of the line and can count it. The steppers arrive
   pre-filled with the last report, so if it is already right this stays a
   single tap, which is the bar check-in has to clear: the arcade's paper queue
   board failed because anything slower than one tap gets skipped.

   The payoff is that every check-in now carries a verified count rather than a
   blind +1 on top of a number nobody has confirmed. */
export default function ConfirmQueue({ arcade, onBack, onConfirm }) {
  const [queue, setQueue] = useState(arcade.queue)
  const [solo, setSolo] = useState(arcade.solo)

  const clampedSolo = Math.min(solo, queue)
  const withYou = { ...arcade, queue: queue + 1, solo: clampedSolo + 1 }
  const changed = queue !== arcade.queue || clampedSolo !== arcade.solo

  return (
    <Screen>
      <TopBar
        title="Check-In"
        onBack={onBack}
        right={
          <Info>
            You are at the cabinet, so you can see the line. Confirming it here
            means the next person reads a number somebody actually checked,
            instead of one that has been drifting since the last report.
          </Info>
        }
      />

      <Body>
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm text-ink">
            {arcade.name} &middot; {arcade.game}
          </p>
          <p className="text-xs text-ink-muted">
            {freshnessLabel(arcade)}
            {isStale(arcade) && ' — worth a second look'}
          </p>
        </div>

        <div className="px-4">
          <p className="pt-3 text-sm font-semibold text-ink">
            How many are waiting, not counting you?
          </p>
          <Stepper
            label="Queue"
            hint="Parties waiting, not people"
            value={queue}
            onChange={(v) => {
              const next = Math.max(0, v)
              setQueue(next)
              if (solo > next) setSolo(next)
            }}
          />
          <Stepper
            label="Solo"
            hint="How many of those are one player"
            value={clampedSolo}
            onChange={(v) => setSolo(Math.max(0, Math.min(v, queue)))}
          />
        </div>

        <div className="mx-4 mt-3 rounded-md border border-line bg-sunken px-3 py-2">
          <p className="text-xs text-ink-muted">Once you join</p>
          <p className="text-lg font-semibold tabular-nums text-ink">
            #{queue + 1} &middot; ~{estimateWaitMin(withYou)} min
          </p>
        </div>

        <p className="px-4 py-3 text-xs text-ink-muted">
          {changed
            ? 'Your correction replaces the current count for everyone.'
            : 'Leave it as is if the count looks right.'}
        </p>
      </Body>

      <div className="border-t border-line p-4">
        <PrimaryButton onClick={() => onConfirm({ queue, solo: clampedSolo })}>
          Check in
        </PrimaryButton>
      </div>
    </Screen>
  )
}
