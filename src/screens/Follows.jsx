import { useEffect, useState } from 'react'
import { Screen, TopBar, Body, Seg, Info, Avatar } from '../components/ui.jsx'
import { Chevron, Qr } from '../components/Icons.jsx'
import { searchProfiles, hueFromProfile, describeError } from '../lib/accounts.js'

/* Followers / Following.

   Kept as a plain roster. The only thing it adds beyond a count is which
   direction each relationship runs, because presence is only shared between
   mutuals - so "follows you" and "you follow" are functional states here, not
   vanity numbers.

   The roster on its own was a dead end, though: several features are
   mutual-only and there was no way to make a relationship mutual from inside
   the app. You had to physically stand in an arcade next to someone before
   they could be found. Search by username is the missing half - it lets a
   relationship be started deliberately rather than by coincidence.

   Everyone on this screen is a real account. The search runs against real
   profiles, the two lists are your real follow edges, and Follow writes a
   real row. The seeded players on the map and the leaderboard are prototype
   data and are deliberately not mixed in here. */
export default function Follows({
  tabName,
  onTab,
  onBack,
  myId,
  configured,
  follows,
  onOpenProfile,
  onAddPerson,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const trimmed = query.trim()
  const signedIn = Boolean(myId)

  /* A short pause after the last keystroke, so a handle typed at speed is one
     query rather than one per letter. Stale responses are dropped. */
  useEffect(() => {
    if (!signedIn || trimmed === '') return undefined
    let active = true
    const timer = window.setTimeout(() => {
      setSearching(true)
      searchProfiles(trimmed, myId)
        .then((list) => {
          if (!active) return
          setResults(list)
          setSearchError(null)
        })
        .catch((e) => {
          if (active) setSearchError(describeError(e, 'Search did not go through.'))
        })
        .finally(() => {
          if (active) setSearching(false)
        })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [trimmed, myId, signedIn])

  const rows = tabName === 'followers' ? follows.followers : follows.following

  async function toggle(profile) {
    setActionError(null)
    const result = await follows.toggle(profile.id)
    if (result?.error) setActionError(result.error)
  }

  return (
    <Screen>
      <TopBar
        title="People"
        onBack={onBack}
        right={
          <Info >
            You only share your arcade with people you follow back. Following
            someone who does not follow you back shows you nothing until they do.
          </Info>
        }
      />

      {/* Typing a username only works if you already know it, letter for
          letter. Standing next to the person, you do not - so the code comes
          first and the field is the fallback. */}
      <button
        type="button"
        onClick={onAddPerson}
        className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Qr size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">
            Add someone by code
          </span>
          <span className="block text-xs text-ink-muted">
            Scan theirs, or show yours
          </span>
        </span>
        <Chevron size={16} />
      </button>

      <div className="border-b border-line px-4 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          aria-label="Search people by username"
          disabled={!signedIn}
          className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle focus:border-brand-500 disabled:bg-sunken"
        />
      </div>

      {!signedIn ? (
        <Body>
          <p className="px-6 py-10 text-center text-xs leading-relaxed text-ink-muted">
            {configured
              ? 'Sign in to find and follow people.'
              : 'Accounts are not set up on this build, so there is nobody to find yet.'}
          </p>
        </Body>
      ) : trimmed !== '' ? (
        <Body>
          <p className="border-b border-line bg-sunken px-4 py-2 text-xs text-ink-muted">
            {searchError
              ? searchError
              : searching
                ? 'Searching…'
                : results.length === 0
                  ? `No account matches “${trimmed}”.`
                  : `${results.length} ${results.length === 1 ? 'account' : 'accounts'} matching “${trimmed}”`}
          </p>
          {actionError && <ActionError text={actionError} />}
          <ul>
            {results.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                relationship={follows.relationship(p.id)}
                onOpen={() => onOpenProfile(p)}
                onToggleFollow={() => toggle(p)}
              />
            ))}
          </ul>
        </Body>
      ) : (
        <>
          <div className="flex gap-2 border-b border-line px-4 py-2">
            <Seg on={tabName === 'followers'} onClick={() => onTab('followers')}>
              Followers {follows.followers.length}
            </Seg>
            <Seg on={tabName === 'following'} onClick={() => onTab('following')}>
              Following {follows.following.length}
            </Seg>
          </div>

          <Body>
            {follows.error && <ActionError text={follows.error} />}
            {actionError && <ActionError text={actionError} />}
            {follows.loading ? (
              <p role="status" className="px-6 py-10 text-center text-xs text-ink-subtle">
                Loading…
              </p>
            ) : rows.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs leading-relaxed text-ink-muted">
                {tabName === 'followers'
                  ? 'Nobody follows you yet. Share your username, or your code above.'
                  : 'You are not following anyone yet. Search a username above.'}
              </p>
            ) : (
              <ul>
                {rows.map((p) => (
                  <PersonRow
                    key={p.id}
                    person={p}
                    relationship={follows.relationship(p.id)}
                    onOpen={() => onOpenProfile(p)}
                    onToggleFollow={() => toggle(p)}
                  />
                ))}
              </ul>
            )}
          </Body>
        </>
      )}
    </Screen>
  )
}

function ActionError({ text }) {
  return (
    <p role="alert" className="border-b border-line bg-live-bg px-4 py-2 text-xs font-medium text-live">
      {text}
    </p>
  )
}

/* The row is two controls, not one. Opening the profile and changing the
   relationship are different intents, so the follow button is a sibling of the
   profile button rather than sitting inside it. */
function PersonRow({ person, relationship, onOpen, onToggleFollow }) {
  const { youFollow, action, label } = relationship

  return (
    <li className="flex items-center gap-2 border-b border-line pr-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
      >
        <Avatar handle={person.handle} hue={hueFromProfile(person)} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {person.handle}
          </span>
          <span className="block truncate text-xs text-ink-muted">{label}</span>
        </span>
        <Chevron size={16} />
      </button>

      <button
        type="button"
        onClick={onToggleFollow}
        aria-label={`${youFollow ? 'Unfollow' : 'Follow'} ${person.handle}`}
        className={`flex-none rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          youFollow
            ? 'border-line-strong bg-surface text-ink-muted hover:border-ink-subtle hover:text-ink'
            : 'border-brand-200 bg-brand-600 text-white hover:bg-brand-700'
        }`}
      >
        {action}
      </button>
    </li>
  )
}
