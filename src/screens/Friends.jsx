import {
  Screen,
  TopBar,
  Body,
  Info,
  Seg,
  Chip,
  Avatar,
  GameDot,
  ActionButton,
  LiveBadge,
} from '../components/ui.jsx'
import { Plus } from '../components/Icons.jsx'
import { FRIENDS, SONGS, OLD_SITE_FAVOURITE_CAP, ACTIVITY, PLANNED } from '../social.js'
import { gameColor, gameLabel } from '../data.js'
import { resolveVenues } from '../lib/queue.js'
import {
  leaderboard,
  belowOldCap,
  presentFriends,
  gradeOf,
  formatAchievement,
  ago,
} from '../lib/social.js'
import FriendsMap from './FriendsMap.jsx'

/* Circle tab. Four views over the same community.

   The underlying request was "seeing where your friends are and all of that",
   and the temporal half of it - whether you have just missed someone - is what
   Activity answers.

   Consultation feedback drove two changes. First, every row now ends in
   something you can do: knowing where someone is only counts once it lets you
   join them, ask them about the venue, or arrange to meet. Second, the map
   view exists at all - people were only ever in a list before. */
export default function Friends({
  arcades,
  game,
  section,
  onSection,
  song,
  onSong,
  onOpenPlayer,
  onOpenClip,
  onOpenArcade,
  onPlan,
  onMessage,
}) {
  /* Resolved here, once: raw venues carry their queues nested per game, so
     anything reading a wait or a game colour needs the flattened form. */
  const venues = resolveVenues(arcades, game)

  return (
    <Screen>
      <TopBar
        title="Circle"
        subtitle="See who's out, then go join them"
        right={
          <Info>
            Presence is venue level and mutual-only: you appear here to people
            you follow back, and only while checked in and visible.
          </Info>
        }
      />

      <div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2">
        <Seg on={section === 'map'} onClick={() => onSection('map')}>
          Map
        </Seg>
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

      {section === 'map' && (
        <FriendsMap
          arcades={venues}
          onOpenPlayer={onOpenPlayer}
          onOpenArcade={onOpenArcade}
        />
      )}
      {section === 'here' && (
        <HereNow
          arcades={venues}
          onOpenPlayer={onOpenPlayer}
          onOpenArcade={onOpenArcade}
          onPlan={onPlan}
        />
      )}
      {section === 'activity' && (
        <Activity
          arcades={venues}
          onOpenPlayer={onOpenPlayer}
          onOpenClip={onOpenClip}
          onOpenArcade={onOpenArcade}
          onPlan={onPlan}
          onMessage={onMessage}
        />
      )}
      {section === 'scores' && (
        <Scores song={song} onSong={onSong} onOpenPlayer={onOpenPlayer} />
      )}
    </Screen>
  )
}

function HereNow({ arcades, onOpenPlayer, onOpenArcade, onPlan }) {
  const here = presentFriends()
  const venues = arcades
    .map((a) => ({ arcade: a, players: here.filter((p) => p.at === a.id) }))
    .filter((v) => v.players.length > 0)

  return (
    <Body>
      {/* An invitation is the clearest thing presence can lead to, so it sits
          at the top rather than buried in a menu. */}
      <Planned arcades={arcades} onOpenArcade={onOpenArcade} />

      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <LiveBadge label={`${here.length} out now`} />
        <p className="flex-1 text-xs text-ink-muted">
          of the <span className="tabular-nums">{FRIENDS.length}</span> people you
          follow
        </p>
        <ActionButton icon={<Plus size={13} />} onClick={() => onPlan({})}>
          Plan
        </ActionButton>
      </div>

      {venues.map(({ arcade, players }) => (
        <div key={arcade.id}>
          <button
            type="button"
            onClick={() => onOpenArcade(arcade.id)}
            className="flex w-full items-center gap-2 border-b border-line bg-sunken px-4 py-2 text-left transition-colors duration-150 hover:bg-line/40"
          >
            <GameDot color={arcade.gameColor} />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {arcade.short}
            </span>
            <span className="flex-1 text-xs tabular-nums text-ink-subtle">
              {players.length} here
            </span>
            <span className="text-xs font-semibold text-brand-600">Enter</span>
          </button>

          {players.map((p, i) => (
            <div
              key={p.handle}
              className="anim-row flex items-center gap-3 border-b border-line px-4 py-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => onOpenPlayer(p.handle)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar handle={p.handle} size={38} live />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {p.handle}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {p.games.join(' · ')} &middot; {p.sinceMin}m
                  </span>
                </span>
              </button>
              <ActionButton
                onClick={() => onOpenArcade(arcade.id)}
                aria-label={`Join ${p.handle} at ${arcade.short}`}
              >
                Join
              </ActionButton>
            </div>
          ))}
        </div>
      ))}
    </Body>
  )
}

function Planned({ arcades, onOpenArcade }) {
  if (PLANNED.length === 0) return null

  return (
    <div className="border-b border-line">
      {PLANNED.map((s) => {
        const venue = arcades.find((a) => a.id === s.venue)
        return (
          <div key={s.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex -space-x-2">
              {s.going.slice(0, 3).map((h) => (
                <Avatar key={h} handle={h} size={26} className="ring-2 ring-surface" />
              ))}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                <span className="font-semibold">{s.host}</span> is getting people
                together
              </p>
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <GameDot color={gameColor(s.gameId)} />
                {venue?.short ?? 'an arcade'} &middot; {gameLabel(s.gameId)} &middot;{' '}
                {s.whenLabel}
              </p>
              <p className="text-xs text-ink-subtle">{s.note}</p>
            </div>
            {s.invitedMe ? (
              <ActionButton onClick={() => onOpenArcade(s.venue)}>
                I&rsquo;m in
              </ActionButton>
            ) : (
              <Chip tone="quiet">{s.going.length} going</Chip>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* Activity. Every line ends in the action it enables, because a feed of facts
   about where people are is not engagement on its own. */
function Activity({ arcades, onOpenPlayer, onOpenClip, onOpenArcade, onPlan, onMessage }) {
  const venueName = (id) => arcades.find((a) => a.id === id)?.short ?? 'an arcade'

  return (
    <Body>
      <ul>
        {ACTIVITY.map((e, i) => (
          <li
            key={e.id}
            className="anim-row flex gap-3 border-b border-line px-4 py-3"
            style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
          >
            <button
              type="button"
              onClick={() => onOpenPlayer(e.handle)}
              aria-label={`Open ${e.handle}`}
              className="mt-0.5 transition-transform duration-150 ease-soft hover:scale-105 active:scale-95"
            >
              <Avatar handle={e.handle} size={38} live={e.type === 'checkin'} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-semibold">{e.handle}</span>{' '}
                {e.type === 'checkin' && <>checked into {venueName(e.venue)}</>}
                {e.type === 'checkout' && <>left {venueName(e.venue)}</>}
                {e.type === 'played' && (
                  <>
                    played a set at {venueName(e.venue)} &mdash;{' '}
                    {e.songs.map((t, k) => (
                      <span key={t}>
                        {k > 0 && ', '}
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
                {e.type === 'clip' && <>posted a clip of &ldquo;{e.song}&rdquo;</>}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs tabular-nums text-ink-subtle">
                  {ago(e.minsAgo)}
                </span>

                {e.type === 'checkin' && (
                  <>
                    <ActionButton onClick={() => onOpenArcade(e.venue)}>
                      Join them
                    </ActionButton>
                    <ActionButton onClick={() => onMessage(e.handle)}>
                      What&rsquo;s it like?
                    </ActionButton>
                  </>
                )}
                {e.type === 'checkout' && (
                  <ActionButton onClick={() => onPlan({ invite: e.handle })}>
                    Plan the next one
                  </ActionButton>
                )}
                {e.type === 'played' && (
                  <ActionButton onClick={() => onOpenArcade(e.venue)}>
                    See that venue
                  </ActionButton>
                )}
                {e.type === 'best' && (
                  <ActionButton onClick={() => onMessage(e.handle)}>
                    Send congrats
                  </ActionButton>
                )}
                {e.type === 'clip' && (
                  <ActionButton onClick={() => onOpenClip(e.clipId)}>
                    Watch
                  </ActionButton>
                )}
              </div>
            </div>
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
      <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2">
        {SONGS.map((s) => (
          <Seg key={s.id} on={s.id === song} onClick={() => onSong(s.id)}>
            {s.title}
          </Seg>
        ))}
      </div>

      <div className="border-b border-line px-4 py-3">
        <p className="font-display text-sm font-semibold text-ink">{current.title}</p>
        <p className="text-xs text-ink-muted">
          {current.chart} &middot; ranked against all{' '}
          <span className="tabular-nums">{FRIENDS.length}</span> people you follow
        </p>
      </div>

      <ol>
        {rows.map((r) => (
          <li key={r.handle}>
            {r.rank === OLD_SITE_FAVOURITE_CAP + 1 && <CapLine cut={cut} />}
            <button
              type="button"
              onClick={() => !r.me && onOpenPlayer(r.handle)}
              className={`flex w-full items-center gap-2.5 border-b border-line px-4 py-2 text-left transition-colors duration-150 ${
                r.me ? 'bg-brand-50' : 'hover:bg-sunken'
              }`}
            >
              <span className="w-5 text-xs tabular-nums text-ink-subtle">{r.rank}</span>
              <Avatar handle={r.me ? 'kntt' : r.handle} size={28} live={Boolean(r.at)} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${
                    r.me ? 'font-bold text-brand-700' : 'text-ink'
                  }`}
                >
                  {r.me ? 'You' : r.handle}
                </span>
                {r.at && (
                  <span className="block text-[11px] text-fresh">at an arcade now</span>
                )}
              </span>
              <span className="text-right font-display text-sm tabular-nums text-ink">
                {formatAchievement(r.achievement)}
              </span>
              <Chip tone={r.achievement >= 100.5 ? 'brand' : 'default'}>
                {gradeOf(r.achievement)}
              </Chip>
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
    <div className="border-y border-dashed border-stale bg-stale-bg px-4 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-stale">
        Official site&rsquo;s {OLD_SITE_FAVOURITE_CAP}-favourite limit
      </p>
      <p className="text-xs text-ink-muted">
        Everyone below is invisible on the official site &mdash; {cut.count}{' '}
        {cut.count === 1 ? 'player' : 'players'}, {cut.hereNow} of them at an arcade
        now.
      </p>
    </div>
  )
}
