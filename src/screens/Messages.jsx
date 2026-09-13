import { Screen, TopBar, Body, Avatar } from '../components/ui.jsx'
import { Chevron } from '../components/Icons.jsx'
import { hueFromProfile } from '../lib/accounts.js'

/* Conversations.

   The evaluation asked where the chat history was, and the first fix only
   answered half of it: messages survived, but the only ways back to one were
   the map card and the profile. Both need the other person to be findable -
   and the map card disappears the moment they check out. So a conversation you
   had an hour ago could only be reached by remembering who it was with and
   going to look for them in your follows, which is recall, not recognition.

   This is the list that was missing. Every conversation is here, newest first,
   whether or not the person is at an arcade right now.

   Threads come from the database now: each one is a real conversation with
   another account, carrying the other person's profile and the last message.
   Seeded sample players never appear here, because there is nobody behind
   them to have written back. */
const STATUS_MARK = { sent: '✓', read: '✓✓' }

function timeOf(timestamp) {
  const then = new Date(timestamp)
  const sameDay = new Date().toDateString() === then.toDateString()
  return sameDay
    ? then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : then.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function Messages({
  threads = [],
  loading = false,
  error = null,
  signedIn = true,
  onOpen,
  onBack,
}) {
  return (
    <Screen>
      <TopBar title="Messages" onBack={onBack} />

      <Body>
        {!signedIn ? (
          <div className="px-6 py-10 text-center">
            <p className="font-display text-sm font-semibold text-ink">Sign in to message</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Messages are between real accounts that follow each other.
            </p>
          </div>
        ) : error ? (
          <p role="alert" className="px-6 py-10 text-center text-xs font-medium text-live">
            {error}
          </p>
        ) : loading ? (
          <p role="status" className="px-6 py-10 text-center text-xs text-ink-subtle">
            Loading messages…
          </p>
        ) : threads.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-display text-sm font-semibold text-ink">
              No conversations yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Open someone you follow both ways from People or their profile
              and tap Message. Whatever you send stays here.
            </p>
          </div>
        ) : (
          <ul>
            {threads.map(({ id, partner, last }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onOpen(partner)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
                >
                  <Avatar handle={partner.handle} hue={hueFromProfile(partner)} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink">
                        {partner.handle}
                      </span>
                      {last && (
                        <span className="flex-none text-[11px] tabular-nums text-ink-subtle">
                          {timeOf(last.timestamp)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                      {last?.sender === 'me' && (
                        <span
                          className={`flex-none tabular-nums ${
                            last.status === 'read' ? 'text-brand-600' : 'text-ink-subtle'
                          }`}
                        >
                          {STATUS_MARK[last.status] ?? ''}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {last ? last.text : 'No messages yet'}
                      </span>
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
