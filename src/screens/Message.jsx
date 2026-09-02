import { useEffect, useRef, useState } from 'react'
import { Screen, Avatar } from '../components/ui.jsx'
import { Send, ArrowLeft } from '../components/Icons.jsx'

/* A conversation, scoped to mutuals.

   An earlier version deliberately had no contact action at all, on the team's
   own finding that "the app can't force our users to just go up to someone
   they haven't met". That was about strangers, and it still holds: nothing
   here reaches a person you do not already follow both ways.

   Consultation feedback was that presence has to lead somewhere: reaching out,
   joining them, or asking about the venue they are at. Between mutuals that is
   an ordinary message, so the openers are the three questions the feed
   actually raises.

   It is a thread rather than a send box because the first version replaced the
   composer with "Sent" and a Done button, and then forgot the message.

   It is a screen rather than a sheet because a conversation is a place you go
   to, not a panel that covers where you were. As a sheet it was neither: tall
   enough to hide the screen underneath, short enough to leave a strip of it
   showing, and opened from the inbox it sat on top of the very row you had
   just tapped. Pushing a screen is also what every messaging app does, so back
   goes where back always goes.

   Sending is the round button at the end of the field for the same reason: a
   full-width Send stacked over a full-width Cancel is the shape of a form, and
   sending a message is not submitting one. */
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

export default function Message({
  handle,
  messages = [],
  opener = '',
  mutual = true,
  onSend,
  onOpenProfile,
  onBack,
}) {
  const [text, setText] = useState(opener)
  const endRef = useRef(null)
  const canSend = text.trim().length > 0
  /* Openers are for opening. Once there is a conversation, or once you have
     started typing, they are just clutter above the field. */
  const showOpeners = messages.length === 0 && text === ''

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  function send() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  return (
    <Screen>
      <div className="flex items-center gap-2.5 border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-2 rounded-full p-1.5 text-ink transition-colors duration-150 hover:bg-sunken active:bg-line"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Tapping who you are talking to opens who you are talking to. That
            is what the header does in every messaging app, so leaving it inert
            reads as a broken tap rather than as a design decision. */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Open ${handle}'s profile`}
          className="-mx-1.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-colors duration-150 hover:bg-sunken"
        >
          <Avatar handle={handle} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[15px] font-semibold leading-tight text-ink">
              {handle}
            </span>
            <span className="block truncate text-[11px] leading-tight text-ink-muted">
              {mutual ? 'You follow each other' : 'You no longer follow each other'}
            </span>
          </span>
        </button>
      </div>

      {/* The conversation sits on its own ground, so it reads as a place
          rather than as the middle of a form. */}
      <div className="flex-1 overflow-y-auto bg-sunken px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-subtle">
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
                    className={`block rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.sender === 'me'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-surface text-ink'
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

      {mutual ? (
        <div className="border-t border-line bg-surface px-3 pb-3 pt-2.5">
          {showOpeners && (
            <div className="no-scrollbar -mx-3 mb-2.5 flex gap-1.5 overflow-x-auto px-3">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setText(o)}
                  className="flex-none whitespace-nowrap rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors duration-150 hover:border-brand-400 hover:text-brand-600"
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              id="msg"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Message"
              aria-label={`Message ${handle}`}
              className="min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle focus:border-brand-500"
            />
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              aria-label="Send"
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-all duration-150 ease-soft ${
                canSend
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 active:scale-95'
                  : 'bg-sunken text-ink-subtle'
              }`}
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      ) : (
        /* The rule holds - you cannot reach someone you no longer follow both
           ways - but your own history stays readable, and says why. */
        <p className="border-t border-line bg-surface px-4 py-4 text-center text-xs leading-relaxed text-ink-muted">
          You and {handle} no longer follow each other, so you can&rsquo;t send
          messages. Follow them back to carry on.
        </p>
      )}
    </Screen>
  )
}
