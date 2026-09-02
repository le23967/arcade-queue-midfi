import { Screen, TopBar, Body, Avatar } from '../components/ui.jsx'
import { Chevron } from '../components/Icons.jsx'

/* Conversations.

   The evaluation asked where the chat history was, and the first fix only
   answered half of it: messages survived, but the only ways back to one were
   the map card and the profile. Both need the other person to be findable -
   and the map card disappears the moment they check out. So a conversation you
   had an hour ago could only be reached by remembering who it was with and
   going to look for them in your follows, which is recall, not recognition.

   This is the list that was missing. Every conversation is here, newest first,
   whether or not the person is at an arcade right now. */
const STATUS_MARK = { sent: '✓', delivered: '✓✓', read: '✓✓' }

function timeOf(timestamp) {
  const then = new Date(timestamp)
  const sameDay = new Date().toDateString() === then.toDateString()
  return sameDay
    ? then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : then.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function Messages({ conversations, onOpen, onBack }) {
  const threads = Object.entries(conversations)
    .map(([handle, messages]) => ({
      handle,
      last: messages[messages.length - 1],
      count: messages.length,
    }))
    .filter((t) => t.last)
    .sort((a, b) => b.last.timestamp - a.last.timestamp)

  return (
    <Screen>
      <TopBar title="Messages" onBack={onBack} />

      <Body>
        {threads.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-display text-sm font-semibold text-ink">
              No conversations yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Open someone you follow both ways &mdash; from the map, from Now,
              or from their profile &mdash; and tap Message. Whatever you send
              stays here.
            </p>
          </div>
        ) : (
          <ul>
            {threads.map(({ handle, last, count }) => (
              <li key={handle}>
                <button
                  type="button"
                  onClick={() => onOpen(handle)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
                >
                  <Avatar handle={handle} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink">
                        {handle}
                      </span>
                      <span className="flex-none text-[11px] tabular-nums text-ink-subtle">
                        {timeOf(last.timestamp)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                      {last.sender === 'me' && (
                        <span
                          className={`flex-none tabular-nums ${
                            last.status === 'sent' ? 'text-ink-subtle' : 'text-brand-600'
                          }`}
                        >
                          {STATUS_MARK[last.status] ?? ''}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{last.text}</span>
                      {count > 1 && (
                        <span className="flex-none tabular-nums text-ink-subtle">
                          {count}
                        </span>
                      )}
                    </span>
                  </span>
                  <Chevron size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Screen>
  )
}
