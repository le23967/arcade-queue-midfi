import { Avatar } from './ui.jsx'
import { Chevron } from './Icons.jsx'
import { hueFromProfile } from '../lib/accounts.js'

/* One real account in a list: who they are, how you stand with them, and
   the one thing you can change about that from here.

   The row is two controls, not one. Opening the profile and changing the
   relationship are different intents, so the follow button is a sibling of
   the profile button rather than sitting inside it. The button's text is
   the state - Follow, Follow back, Following, Mutual - and its accessible
   name is the verb a tap performs. */
export default function PersonRow({ person, relationship, onOpen, onToggleFollow, busy = false }) {
  const { youFollow, mutual, action, label } = relationship

  return (
    <li className="flex items-center gap-2 border-b border-line pr-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left transition-colors duration-150 hover:bg-sunken"
      >
        <Avatar handle={person.handle} hue={hueFromProfile(person)} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{person.handle}</span>
          {/* The button already says Following or Mutual; the line under
              the name only earns its place when it says something the
              button does not - that they follow you, or that nobody does. */}
          {label !== action && (
            <span className="block truncate text-xs text-ink-muted">{label}</span>
          )}
        </span>
        <Chevron size={16} className="flex-none text-ink-subtle" />
      </button>

      <button
        type="button"
        onClick={onToggleFollow}
        disabled={busy}
        aria-label={`${youFollow ? 'Unfollow' : 'Follow'} ${person.handle}`}
        className={`min-h-[36px] flex-none rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          mutual
            ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
            : youFollow
              ? 'border-line-strong bg-surface text-ink-muted hover:border-ink-subtle hover:text-ink'
              : 'border-brand-200 bg-brand-600 text-white hover:bg-brand-700'
        } ${busy ? 'opacity-60' : ''}`}
      >
        {action}
      </button>
    </li>
  )
}
