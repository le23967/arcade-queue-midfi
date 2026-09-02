import { useState } from 'react'
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  Stepper,
  Info,
} from '../components/ui.jsx'
import { CheckCircle } from '../components/Icons.jsx'
import {
  estimateWaitMin,
  pairsOf,
  partiesLabel,
  peopleOf,
  playersLabel,
} from '../lib/queue.js'

/* SCREEN 4B - Report.

   Two steppers and Submit, as sketched. Three details are load-bearing:

   - Pairs and solo players are reported separately, because a pair queues as
     one party but holds the machine longer than a solo player
   - the wait recalculates live as you step, so the reporter can see their
     report is worth making
   - it is anonymous and needs no conversation, for the interviewee who
     described themselves as "very introverted"

   The two steppers ask for the same two things the arcade page displays. They
   used to ask for total parties and a solo subset while the arcade page showed
   pairs and solo, which is the same line described two ways - and since a solo
   player is a party but not a pair, the numbers looked like they disagreed. */
export default function Report({ arcade, onCancel, onSubmit }) {
  const [pairs, setPairs] = useState(pairsOf(arcade))
  const [solo, setSolo] = useState(arcade.solo)
  const [done, setDone] = useState(false)

  const queue = pairs + solo
  const next = { ...arcade, queue, solo }
  const preview = estimateWaitMin(next)

  if (done) {
    return (
      <Modal title="Thank you">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-ink">
            <CheckCircle size={28} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Queue updated</p>
            <p className="text-xs text-ink-muted">
              {arcade.short}: {partiesLabel(queue)} waiting &middot;{' '}
              {playersLabel(peopleOf(next))} &middot; ~{preview} min, timestamped
              now.
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
    <Modal title={`Report queue, ${arcade.short}`}>
      <Stepper
        label="Pairs waiting"
        hint="Two players sharing one queue position"
        value={pairs}
        onChange={(v) => setPairs(Math.max(0, v))}
      />
      <Stepper
        label="Solo players waiting"
        hint="One player in one queue position"
        value={solo}
        onChange={(v) => setSolo(Math.max(0, v))}
      />

      <div className="mt-3 rounded-md border border-line bg-sunken px-3 py-2">
        <p className="text-xs text-ink-muted">
          {partiesLabel(queue)} waiting &middot; {playersLabel(peopleOf(next))}
        </p>
        <p className="text-lg font-semibold tabular-nums text-ink">
          ~{preview} min estimated wait
        </p>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
        Submitted anonymously
        <Info>
          Nobody has to be asked &ldquo;who&rsquo;s next?&rdquo; and nobody has
          to answer &middot; which matters for players who would rather not talk
          to a stranger.
        </Info>
      </p>

      <div className="mt-4 space-y-2">
        <PrimaryButton
          onClick={() => {
            onSubmit({ queue, solo })
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
