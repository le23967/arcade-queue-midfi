import {
  Avatar,
  BestBadge,
  Body,
  GameDot,
  Info,
  Screen,
  StaleBadge,
  TopBar,
} from '../components/ui.jsx'
import { Chevron, Clock } from '../components/Icons.jsx'
import { GAMES, gameLabel } from '../data.js'
import {
  bestArcadeId,
  estimateWaitMin,
  freshnessLabel,
  isStale,
  PAIR_TURN_MIN,
  SOLO_TURN_MIN,
  STALE_AFTER_MIN,
} from '../lib/queue.js'
import { presentAt } from '../lib/social.js'

/* Arcades is a decision screen. It brings the quickest option, travel cost
   and familiar players into one place, then lets the user compare the rest. */
export default function Arcades({
  arcades,
  venueCount,
  game,
  onGame,
  view,
  onView,
  onOpen,
  following,
}) {
  return (
    <Screen>
      <TopBar
        title="Arcades"
        right={
          <Info>
            Queue counts groups, not individual players. A solo turn is about{' '}
            {SOLO_TURN_MIN} minutes. A pair takes about {PAIR_TURN_MIN} minutes,
            then the total is shared across the available cabinets.
          </Info>
        }
      />

      <GamePicker game={game} onGame={onGame} />

      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <div className="flex rounded-full bg-sunken p-0.5">
          <ModeButton on={view === 'list'} onClick={() => onView('list')}>
            Discover
          </ModeButton>
          <ModeButton on={view === 'compare'} onClick={() => onView('compare')}>
            Compare
          </ModeButton>
        </div>

      </div>

      {arcades.length < venueCount && (
        <p className="border-b border-line bg-stale-bg px-4 py-2 text-xs text-ink-muted">
          {arcades.length} of {venueCount} arcades have {gameLabel(game)}.
        </p>
      )}

      {view === 'list' ? (
        <DiscoverView arcades={arcades} onOpen={onOpen} following={following} />
      ) : (
        <CompareView arcades={arcades} onOpen={onOpen} following={following} />
      )}
    </Screen>
  )
}

function GamePicker({ game, onGame }) {
  return (
    <div className="border-b border-line bg-surface py-2">
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4">
        {GAMES.map((item) => {
          const active = item.id === game
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onGame(item.id)}
              className={`flex flex-none snap-start items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-150 active:scale-95 ${
                active
                  ? 'border-brand-200 bg-brand-50 shadow-sm'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-sunken'
              }`}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: item.color }}
              >
                {item.label.slice(0, 2).toUpperCase()}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold ${
                  active ? 'text-brand-700' : 'text-ink-muted'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModeButton({ on, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        on ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function DiscoverView({ arcades, onOpen, following }) {
  if (arcades.length === 0) {
    return (
      <Body className="flex items-center justify-center p-6 text-center">
        <div>
          <p className="font-display text-base font-semibold text-ink">No local cabinets yet</p>
          <p className="mt-1 text-xs text-ink-muted">Try another game to see nearby arcades.</p>
        </div>
      </Body>
    )
  }

  const bestId = bestArcadeId(arcades)
  const best = arcades.find((a) => a.id === bestId) ?? arcades[0]
  /* The hero is the fastest, so the rest read as next fastest downward. */
  const others = arcades
    .filter((a) => a.id !== best.id)
    .sort((a, b) => estimateWaitMin(a) - estimateWaitMin(b))

  return (
    <Body className="bg-page/70">
      <div className="p-3">
        <BestVenue arcade={best} onOpen={onOpen} following={following} />

        {others.length > 0 && (
          <section className="mt-4" aria-labelledby="other-options">
            <div className="mb-2 flex items-end justify-between px-0.5">
              <div>
                <h2 id="other-options" className="font-display text-sm font-semibold text-ink">
                  Other good options
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Swipe across, then open one to check the full queue.
                </p>
              </div>
            </div>

            <div className="no-scrollbar -mx-3 flex snap-x gap-2.5 overflow-x-auto px-3 pb-1">
              {others.map((arcade) => (
                <VenueCard
                  key={arcade.id}
                  arcade={arcade}
                  onOpen={onOpen}
                  following={following}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Body>
  )
}

function BestVenue({ arcade, onOpen, following }) {
  const wait = estimateWaitMin(arcade)
  const friends = presentAt(arcade.id, following)

  return (
    <button
      type="button"
      onClick={() => onOpen(arcade.id)}
      className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-[#7c3aed] p-4 text-left text-white shadow-xl shadow-brand-600/20 transition-transform duration-200 active:scale-[0.98]"
    >
      <span className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[22px] border-white/10" />
      <span className="absolute -bottom-14 left-10 h-28 w-28 rounded-full border-[18px] border-white/5" />

      <span className="relative flex items-start justify-between gap-3">
        <span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-white" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Fastest now
          </span>
          <span className="mt-3 block max-w-[220px] font-display text-xl font-bold leading-tight">
            {arcade.name}
          </span>
          <span className="mt-1 block text-xs text-white/75">
            {arcade.game} · <span className="tabular-nums">{arcade.distanceKm.toFixed(1)} km away</span>
          </span>
        </span>

        <span className="flex h-20 w-20 flex-none flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-inner backdrop-blur">
          <span className="font-display text-2xl font-bold tabular-nums">{wait}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
            min wait
          </span>
        </span>
      </span>

      <span className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          {friends.length > 0 ? (
            <span className="flex -space-x-2">
              {friends.slice(0, 3).map((friend) => (
                <Avatar
                  key={friend.handle}
                  handle={friend.handle}
                  size={24}
                  className="ring-2 ring-brand-600"
                  live
                />
              ))}
            </span>
          ) : (
            <Clock size={16} />
          )}
          <span className="truncate text-xs font-medium text-white/90">
            {friends.length > 0
              ? `${friends.map((friend) => friend.handle).join(', ')} here now`
              : freshnessLabel(arcade)}
          </span>
        </span>
        <span className="ml-2 inline-flex flex-none items-center gap-1 text-xs font-bold">
          Open <Chevron size={14} />
        </span>
      </span>
    </button>
  )
}

function VenueCard({ arcade, onOpen, following }) {
  const wait = estimateWaitMin(arcade)
  const stale = isStale(arcade)
  const friends = presentAt(arcade.id, following)

  return (
    <button
      type="button"
      onClick={() => onOpen(arcade.id)}
      className="w-[210px] flex-none snap-start rounded-2xl border border-line bg-surface p-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md active:translate-y-0"
    >
      <span className="flex items-center gap-2">
        <GameDot color={arcade.gameColor} className="h-2.5 w-2.5" />
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink">
          {arcade.short}
        </span>
        {stale && <StaleBadge />}
      </span>

      <span className="mt-2 flex items-end justify-between">
        <span className="text-[11px] text-ink-muted">
          <span className="tabular-nums">{arcade.distanceKm.toFixed(1)} km</span>
        </span>
        <span className="text-right">
          <span className="block font-display text-2xl font-bold leading-none tabular-nums text-ink">
            {stale ? '~' : ''}
            {wait}
          </span>
          <span className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-subtle">
            min wait
          </span>
        </span>
      </span>

      {friends.length > 0 && (
        <span className="mt-2 flex items-center gap-1.5">
          <span className="flex -space-x-1.5">
            {friends.slice(0, 3).map((friend) => (
              <Avatar key={friend.handle} handle={friend.handle} size={18} live />
            ))}
          </span>
          <span className="text-[11px] text-ink">{friends.length} here</span>
        </span>
      )}
    </button>
  )
}

function CompareView({ arcades, onOpen, following }) {
  const bestId = bestArcadeId(arcades)
  const rows = [...arcades].sort((a, b) => estimateWaitMin(a) - estimateWaitMin(b))

  return (
    <Body className="bg-page/70 p-3">
      <section className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink">Time against travel</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
              A longer trip may still get you playing sooner.
            </p>
          </div>
          <Info>
            More cabinets move several groups at once, so a busy arcade can
            still be the quicker choice. Reports older than {STALE_AFTER_MIN}{' '}
            minutes stay visible but cannot be the best option, so check one
            before travelling.
          </Info>
        </div>

        <div className="mt-3 space-y-2.5">
          {rows.map((arcade) => (
            <CompareCard
              key={arcade.id}
              arcade={arcade}
              best={arcade.id === bestId}
              onOpen={onOpen}
              following={following}
            />
          ))}
        </div>
      </section>
    </Body>
  )
}

/* Deliberately sparse. Choosing a venue needs four things: how long, how far,
   whether friends are there, and whether the number can be trusted. Cabinet
   counts and exact report ages are a level down, on the detail screen. */
function CompareCard({ arcade, best, onOpen, following }) {
  const wait = estimateWaitMin(arcade)
  const stale = isStale(arcade)
  const friends = presentAt(arcade.id, following)

  return (
    <button
      type="button"
      onClick={() => onOpen(arcade.id)}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 hover:border-brand-200 active:scale-[0.99] ${
        best ? 'border-brand-200 bg-brand-50' : 'border-line bg-surface'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <GameDot color={arcade.gameColor} className="h-2.5 w-2.5" />
          <span className="min-w-0 truncate font-display text-sm font-semibold text-ink">
            {arcade.short}
          </span>
          {best && <BestBadge />}
          {stale && <StaleBadge />}
        </span>
        <span className="mt-1 block text-[11px] text-ink-muted">
          <span className="tabular-nums">{arcade.distanceKm.toFixed(1)} km</span>
          {friends.length > 0 && (
            <span className="text-ink">
              {' · '}
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'} here
            </span>
          )}
        </span>
      </span>

      <span className="flex-none text-right">
        <span className="block font-display text-2xl font-bold leading-none tabular-nums text-ink">
          {stale ? '~' : ''}
          {wait}
        </span>
        <span className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-subtle">
          min wait
        </span>
      </span>
      <Chevron size={16} />
    </button>
  )
}
