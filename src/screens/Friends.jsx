import { Screen, TopBar, Body, Info, Seg, Chip } from '../components/ui.jsx'
import { Chevron, Pin } from '../components/Icons.jsx'
import { FRIENDS, SONGS, OLD_SITE_FAVOURITE_CAP, ACTIVITY } from '../social.js'
import {
  leaderboard,
  belowOldCap,
  presentFriends,
  gradeOf,
  formatAchievement,
  ago,
} from '../lib/social.js'

/* Friends tab. Three sections, one per interview finding.

   "Here now" answers the request to see "where your friends are and all of
   that", at venue level only.

   "Scores" answers the one social pain point a participant raised without
   being prompted: the official maimai site lets you favourite 20 people and
   stops there. */
export default function Friends({ arcades, section, onSection, song, onSong, onOpenPlayer, onOpenClip }) {
  return (
    <Screen>
      <TopBar
        title="Friends"
        right={
          <Info >
            Presence is venue level and mutual-only: you appear here to people
            you follow back, and only while checked in and visible.
          </Info>
        }
      />

      <div className="flex gap-2 border-b border-gray-300 px-4 py-2">
        <Seg on={section === 'here'} onClick={() => onSection('here')}>
          Here now
        </Seg>
        <Seg on={section === 'activity'} onClick={() => onSection('activity')}>
          Activity
        </Seg>
        <Seg on={section === 'scores'} onClick={() => onSection('scores')}>
          Scores
        </Seg>
      </div>

      {section === 'here' && (
        <HereNow arcades={arcades} onOpenPlayer={onOpenPlayer} />
      )}
      {section === 'activity' && (
        <Activity
          arcades={arcades}
          onOpenPlayer={onOpenPlayer}
          onOpenClip={onOpenClip}
        />
      )}
      {section === 'scores' && (
        <Scores song={song} onSong={onSong} onOpenPlayer={onOpenPlayer} />
      )}
    </Screen>
  )
}


function HereNow({ arcades, onOpenPlayer }) {
  const here = presentFriends()
  const venues = arcades
    .map((a) => ({ arcade: a, players: here.filter((p) => p.at === a.id) }))
    .filter((v) => v.players.length > 0)

  return (
    <Body>
      <div className="border-b border-gray-300 px-4 py-3">
        <p className="text-sm text-gray-900">
          <span className="font-semibold tabular-nums">{here.length}</span> of the{' '}
          <span className="tabular-nums">{FRIENDS.length}</span> people you follow
          are at an arcade now.
        </p>
      </div>

      {venues.map(({ arcade, players }) => (
        <div key={arcade.id}>
          <div className="flex items-center gap-2 border-b border-gray-300 bg-gray-100 px-4 py-2">
            <Pin size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              {arcade.short}
            </span>
            <span className="text-xs tabular-nums text-gray-600">
              {players.length} here
            </span>
          </div>
          {players.map((p) => (
            <button
              key={p.handle}
              type="button"
              onClick={() => onOpenPlayer(p.handle)}
              className="flex w-full items-center gap-3 border-b border-gray-300 px-4 py-3 text-left"
            >
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  {p.handle}
                </span>
                <span className="block text-xs text-gray-600">
                  {p.games.join(' · ')}
                </span>
              </span>
              <span className="text-xs tabular-nums text-gray-600">
                {p.sinceMin}m
              </span>
              <Chevron size={16} />
            </button>
          ))}
        </div>
      ))}

    </Body>
  )
}

/* Activity. Plain sentences in reverse time order - a mid-fi feed is a list,
   not a timeline graphic. Each line names the player, what they did, and how
   long ago, because "did I just miss them" is the question it answers. */
function Activity({ arcades, onOpenPlayer, onOpenClip }) {
  const venueName = (id) =>
    arcades.find((a) => a.id === id)?.short ?? 'an arcade'

  return (
    <Body>
      <ul>
        {ACTIVITY.map((e) => (
          <li
            key={e.id}
            className="border-b border-gray-300 px-4 py-3"
          >
            <p className="text-sm leading-relaxed text-gray-900">
              <button
                type="button"
                onClick={() => onOpenPlayer(e.handle)}
                className="font-semibold underline decoration-gray-400 underline-offset-2"
              >
                {e.handle}
              </button>{' '}
              {e.type === 'checkin' && <>checked into {venueName(e.venue)}</>}
              {e.type === 'checkout' && <>left {venueName(e.venue)}</>}
              {e.type === 'played' && (
                <>
                  played a set at {venueName(e.venue)} &mdash;{' '}
                  {e.songs.map((t, i) => (
                    <span key={t}>
                      {i > 0 && ', '}
                      &ldquo;{t}&rdquo;
                    </span>
                  ))}
                </>
              )}
              {e.type === 'best' && (
                <>
                  set a new best on &ldquo;{e.song}&rdquo; &mdash;{' '}
                  <span className="tabular-nums">
                    {formatAchievement(e.achievement)}
                  </span>{' '}
                  {gradeOf(e.achievement)}
                </>
              )}
              {e.type === 'clip' && (
                <>
                  posted a clip of &ldquo;{e.song}&rdquo;
                </>
              )}
            </p>

            <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
              <span className="tabular-nums">{ago(e.minsAgo)}</span>
              {e.type === 'clip' && (
                <button
                  type="button"
                  onClick={() => onOpenClip(e.clipId)}
                  className="font-semibold text-gray-900 underline decoration-gray-400 underline-offset-2"
                >
                  Watch
                </button>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Body>
  )
}

function Scores({ song, onSong, onOpenPlayer }) {
  const rows = leaderboard(song)
  const cut = belowOldCap(rows)
  const current = SONGS.find((s) => s.id === song)

  return (
    <Body>
      <div className="flex flex-wrap gap-2 border-b border-gray-300 px-4 py-2">
        {SONGS.map((s) => (
          <Seg key={s.id} on={s.id === song} onClick={() => onSong(s.id)}>
            {s.title}
          </Seg>
        ))}
      </div>

      <div className="border-b border-gray-300 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{current.title}</p>
        <p className="text-xs text-gray-600">
          {current.chart} &middot; ranked against all{' '}
          <span className="tabular-nums">{FRIENDS.length}</span> people you
          follow
        </p>
      </div>

      <ol>
        {rows.map((r) => (
          <li key={r.handle}>
            {r.rank === OLD_SITE_FAVOURITE_CAP + 1 && <CapLine cut={cut} />}
            <button
              type="button"
              onClick={() => !r.me && onOpenPlayer(r.handle)}
              className={`flex w-full items-center gap-3 border-b border-gray-300 px-4 py-2 text-left ${
                r.me ? 'bg-gray-100' : ''
              }`}
            >
              <span className="w-6 text-xs tabular-nums text-gray-600">
                {r.rank}
              </span>
              <span className="flex-1">
                <span
                  className={`text-sm ${
                    r.me ? 'font-semibold text-gray-900' : 'text-gray-900'
                  }`}
                >
                  {r.me ? 'You' : r.handle}
                </span>
                {r.at && (
                  <span className="ml-2 text-xs text-gray-600">at an arcade now</span>
                )}
              </span>
              <span className="w-24 text-right text-sm tabular-nums text-gray-900">
                {formatAchievement(r.achievement)}
              </span>
              <Chip>{gradeOf(r.achievement)}</Chip>
            </button>
          </li>
        ))}
      </ol>


    </Body>
  )
}

/* The single most useful thing this screen draws: where the old tool stopped. */
function CapLine({ cut }) {
  return (
    <div className="border-b border-dashed border-gray-500 bg-gray-100 px-4 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        Official site&rsquo;s {OLD_SITE_FAVOURITE_CAP}-favourite limit
      </p>
      <p className="text-xs text-gray-600">
        Everyone below this line is invisible on the official site &mdash;{' '}
        {cut.count} {cut.count === 1 ? 'player' : 'players'}, {cut.hereNow} of
        them at an arcade now.
      </p>
    </div>
  )
}
