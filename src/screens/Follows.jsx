import { Screen, TopBar, Body, Seg, Chip, Info } from '../components/ui.jsx'
import { Chevron } from '../components/Icons.jsx'
import { followingList, followerList } from '../lib/social.js'

/* Followers / Following.

   Kept as a plain roster. The only thing it adds beyond a count is which
   direction each relationship runs, because presence is only shared between
   mutuals - so "follows you" and "you follow" are functional states here, not
   vanity numbers. */
export default function Follows({ tabName, onTab, onBack, onOpenPlayer }) {
  const rows = tabName === 'followers' ? followerList() : followingList()

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

      <div className="flex gap-2 border-b border-line px-4 py-2">
        <Seg on={tabName === 'followers'} onClick={() => onTab('followers')}>
          Followers {followerList().length}
        </Seg>
        <Seg on={tabName === 'following'} onClick={() => onTab('following')}>
          Following {followingList().length}
        </Seg>
      </div>

      <Body>
        <ul>
          {rows.map((p) => {
            const mutual =
              tabName === 'followers' ? p.youFollow !== false : p.followsYou
            return (
              <li key={p.handle}>
                <button
                  type="button"
                  onClick={() => onOpenPlayer(p.handle)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left"
                >
                  <span className="h-9 w-9 flex-none rounded-md border border-line bg-sunken" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {p.handle}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {p.games.join(' · ')}
                    </span>
                  </span>
                  <Chip>{mutual ? 'Mutual' : tabName === 'followers' ? 'Follows you' : 'Not mutual'}</Chip>
                  <Chevron size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      </Body>
    </Screen>
  )
}
