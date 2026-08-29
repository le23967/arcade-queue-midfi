import { useState } from 'react'
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  Stepper,
  Info,
} from '../components/ui.jsx'
import { CheckCircle } from '../components/Icons.jsx'
import { estimateWaitMin } from '../lib/queue.js'

/* SCREEN 4B - Report.

   Two steppers and Submit, as sketched. Three details are load-bearing:

   - Queue and Solo are reported separately, because a pair queues as one party
     but holds the machine longer than a solo player
   - the wait recalculates live as you step, so the reporter can see their
     report is worth making
   - it is anonymous and needs no conversation, for the interviewee who
     described themselves as "very introverted" */
export default function Report({ arcade, onCancel, onSubmit }) {
  const [queue, setQueue] = useState(arcade.queue)
  const [solo, setSolo] = useState(arcade.solo)
  const [done, setDone] = useState(false)

  const clampedSolo = Math.min(solo, queue)
  const preview = estimateWaitMin({ ...arcade, queue, solo: clampedSolo })

  if (done) {
    return (
      <Modal title="Thank you">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-gray-900">
            <CheckCircle size={28} />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Queue updated</p>
            <p className="text-xs text-gray-600">
              {arcade.short}: {queue} waiting, ~{preview} min, timestamped now.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <PrimaryButton onClick={onCancel}>Done</PrimaryButton>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Report queue — ${arcade.short}`}>
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

      <div className="mt-3 rounded-md border border-gray-300 bg-gray-100 px-3 py-2">
        <p className="text-xs text-gray-600">New estimated wait</p>
        <p className="text-lg font-semibold tabular-nums text-gray-900">
          ~{preview} min
        </p>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
        Submitted anonymously
        <Info>
          Nobody has to be asked &ldquo;who&rsquo;s next?&rdquo; and nobody has
          to answer &mdash; which matters for players who would rather not talk
          to a stranger.
        </Info>
      </p>

      <div className="mt-4 space-y-2">
        <PrimaryButton
          onClick={() => {
            onSubmit({ queue, solo: clampedSolo })
            setDone(true)
          }}
        >
          Submit
        </PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </Modal>
  )
}
