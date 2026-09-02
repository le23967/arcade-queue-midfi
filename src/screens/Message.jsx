import { useEffect, useRef, useState } from 'react'
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
   actually raises.

   It is a thread rather than a send box because the previous version replaced
   the composer with "Sent" and a Done button, and then forgot the message: you
   could not tell whether it had arrived, and reopening the person gave you a
   blank screen again. The history and the delivery state now live in App
   state, so closing this sheet does not lose the conversation. */
const OPENERS = [
  'How long is the wait really?',
  'Save me a spot, on my way',
  'Nice score, what did you change?',
  'Are you around later this week?',
]

const STATUS_LABEL = { sent: 'Sent', delivered: 'Delivered', read: 'Read' }

function timeOf(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Message({ handle, messages = [], onSend, onClose }) {
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const canSend = text.trim().length > 0

  /* Reopening a conversation should land on the newest message, the way any
     thread does. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  function send() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="anim-scrim absolute inset-0 z-20 flex items-end bg-ink/40">
      <div className="anim-sheet flex max-h-[88%] w-full flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl">
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

        <div className="min-h-[92px] flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-subtle">
              No messages yet. Anything you send stays here.
            </p>
          ) : (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <span className="max-w-[78%]">
                    <span
                      className={`block rounded-2xl px-3 py-2 text-sm ${
                        m.sender === 'me'
                          ? 'rounded-br-md bg-brand-600 text-white'
                          : 'rounded-bl-md bg-sunken text-ink'
                      }`}
                    >
                      {m.text}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] tabular-nums text-ink-subtle ${
                        m.sender === 'me' ? 'text-right' : ''
                      }`}
                    >
                      {timeOf(m.timestamp)}
                      {m.sender === 'me' && ` · ${STATUS_LABEL[m.status] ?? m.status}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div ref={endRef} />
        </div>

        {/* The composer stays put after sending, so the thread never ends in a
            dead end you have to back out of. */}
        <div className="border-t border-line p-4">
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
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Say something"
            className="mb-3 w-full rounded-xl border border-line-strong px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle focus:border-brand-500"
          />

          <div className="space-y-2">
            <PrimaryButton disabled={!canSend} onClick={send}>
              Send
            </PrimaryButton>
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
