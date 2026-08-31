import { useState } from 'react'
import { PrimaryButton, SecondaryButton, Avatar } from '../components/ui.jsx'
import { ME } from '../social.js'

/* Message, scoped to mutuals.

   An earlier version deliberately had no contact action at all, on the team's
   own finding that "the app can't force our users to just go up to someone
   they haven't met". That was about strangers, and it still holds: nothing
   here reaches a person you do not already follow both ways.

   Consultation feedback was that presence has to lead somewhere: reaching out,
   joining them, or asking about the venue they are at. Between mutuals that is
   an ordinary message, so the openers are the three questions the feed
   actually raises. */
const OPENERS = [
  'How long is the wait really?',
  'Save me a spot, on my way',
  'Nice score — what did you change?',
  'Are you around later this week?',
]

export default function Message({ handle, onClose }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const canSend = text.trim().length > 0

  return (
    <div className="anim-scrim absolute inset-0 z-20 flex items-end bg-ink/40">
      <div className="anim-sheet w-full rounded-t-2xl border-t border-line bg-surface shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Avatar handle={handle} size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-ink">{handle}</p>
            <p className="text-xs text-ink-muted">You follow each other</p>
          </div>
        </div>

        {sent ? (
          <div className="p-4">
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Sent
              </p>
              <p className="mt-1 text-sm text-ink">{text}</p>
            </div>
            <div className="mt-4">
              <PrimaryButton onClick={onClose}>Done</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setText(o)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors duration-150 hover:border-brand-400 hover:text-brand-600"
                >
                  {o}
                </button>
              ))}
            </div>

            <label className="mt-3 mb-2 block text-xs text-ink-muted" htmlFor="msg">
              As {ME.handle}
            </label>
            <input
              id="msg"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSend && setSent(true)}
              placeholder="Say something"
              className="mb-3 w-full rounded-xl border border-line-strong px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle focus:border-brand-500"
            />

            <div className="space-y-2">
              <PrimaryButton disabled={!canSend} onClick={() => setSent(true)}>
                Send
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
