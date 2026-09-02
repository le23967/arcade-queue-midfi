import { useState } from 'react'
import { Screen, TopBar, Body, Seg, Info } from '../components/ui.jsx'
import { Chevron } from '../components/Icons.jsx'
import {
  followingList,
  followerList,
  relationshipOf,
  searchPeople,
} from '../lib/social.js'

/* Followers / Following.

   Kept as a plain roster. The only thing it adds beyond a count is which
   direction each relationship runs, because presence is only shared between
   mutuals - so "follows you" and "you follow" are functional states here, not
   vanity numbers.

   The roster on its own was a dead end, though: several features are
   mutual-only and there was no way to make a relationship mutual from inside
   the app. You had to physically stand in an arcade next to someone before
   they could be found. Search by username is the missing half - it lets a
   relationship be started deliberately rather than by coincidence. */
export default function Follows({
  tabName,
  onTab,
  onBack,
  onOpenPlayer,
  following,
  onToggleFollow,
}) {
  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0
  const results = searching ? searchPeople(query, following) : []
  const rows = tabName === 'followers' ? followerList(following) : followingList(following)

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

      <div className="border-b border-line px-4 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          aria-label="Search people by username"
          className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle focus:border-brand-500"
        />
      </div>

      {searching ? (
        <Body>
          <p className="border-b border-line bg-sunken px-4 py-2 text-xs text-ink-muted">
            {results.length === 0
              ? `No player matches “${query.trim()}”.`
              : `${results.length} ${results.length === 1 ? 'player' : 'players'} matching “${query.trim()}”`}
          </p>
          <ul>
            {results.map((p) => (
              <PersonRow
                key={p.handle}
                person={p}
                relationship={p}
                onOpen={() => onOpenPlayer(p.handle)}
                onToggleFollow={() => onToggleFollow(p.handle)}
              />
            ))}
          </ul>
        </Body>
      ) : (
        <>
          <div className="flex gap-2 border-b border-line px-4 py-2">
            <Seg on={tabName === 'followers'} onClick={() => onTab('followers')}>
              Followers {followerList(following).length}
            </Seg>
            <Seg on={tabName === 'following'} onClick={() => onTab('following')}>
              Following {followingList(following).length}
            </Seg>
          </div>

          <Body>
            <ul>
              {rows.map((p) => (
                <PersonRow
                  key={p.handle}
                  person={p}
                  relationship={relationshipOf(p.handle, following)}
                  onOpen={() => onOpenPlayer(p.handle)}
                  onToggleFollow={() => onToggleFollow(p.handle)}
                />
              ))}
            </ul>
          </Body>
        </>
      )}
    </Screen>
  )
}

/* The row is two controls, not one. Opening the profile and changing the
   relationship are different intents, so the follow button is a sibling of the
   profile button rather than sitting inside it. */
function PersonRow({ person, relationship, onOpen, onToggleFollow }) {
  const { youFollow, action } = relationship
  const games = person.games ?? []

  return (
    <li className="flex items-center gap-2 border-b border-line pr-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
      >
        <span className="h-9 w-9 flex-none rounded-md border border-line bg-sunken" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {person.handle}
          </span>
          <span className="block truncate text-xs text-ink-muted">
            {games.length > 0 ? games.join(' · ') : 'No games listed'}
          </span>
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
