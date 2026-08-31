import {
  Avatar,
  BestBadge,
  Body,
  GameDot,
  Info,
  LiveBadge,
  Screen,
  Seg,
  StaleBadge,
  TopBar,
} from '../components/ui.jsx'
import { Chevron, Clock, Users } from '../components/Icons.jsx'
import { GAMES, gameLabel } from '../data.js'
import {
  bestArcadeId,
  estimateWaitMin,
  freshnessLabel,
  isStale,
  PAIR_TURN_MIN,
  SOLO_TURN_MIN,
  sortArcades,
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
  sort,
  onSort,
  onOpen,
}) {
  return (
    <Screen>
      <TopBar
        title="Arcades"
        subtitle="Choose where your next game starts"
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

        {view === 'list' && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Order
            </span>
            <Seg
              className="px-2.5 py-1"
              on={sort === 'distance'}
              onClick={() => onSort('distance')}
            >
              Near
            </Seg>
            <Seg
              className="px-2.5 py-1"
              on={sort === 'wait'}
              onClick={() => onSort('wait')}
            >
              Fast
            </Seg>
          </div>
        )}
      </div>

      {arcades.length < venueCount && (
        <p className="border-b border-line bg-stale-bg px-4 py-2 text-xs text-ink-muted">
          {arcades.length} of {venueCount} arcades have {gameLabel(game)}.
        </p>
      )}

      {view === 'list' ? (
        <DiscoverView arcades={arcades} sort={sort} onOpen={onOpen} />
      ) : (
        <CompareView arcades={arcades} onOpen={onOpen} />
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

function DiscoverView({ arcades, sort, onOpen }) {
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
  const others = sortArcades(
    arcades.filter((a) => a.id !== best.id),
    sort
  )

  return (
    <Body className="bg-page/70">
      <div className="p-3">
        <BestVenue arcade={best} onOpen={onOpen} />

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
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                {sort === 'wait' ? 'Fast first' : 'Near first'}
              </span>
            </div>

            <div className="no-scrollbar -mx-3 flex snap-x gap-2.5 overflow-x-auto px-3 pb-1">
              {others.map((arcade) => (
                <VenueCard key={arcade.id} arcade={arcade} onOpen={onOpen} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Body>
  )
}

function BestVenue({ arcade, onOpen }) {
  const wait = estimateWaitMin(arcade)
  const friends = presentAt(arcade.id)

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
            {arcade.game} · {arcade.suburb}
          </span>
        </span>

        <span className="flex h-20 w-20 flex-none flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-inner backdrop-blur">
          <span className="font-display text-2xl font-bold tabular-nums">{wait}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
            min wait
          </span>
        </span>
      </span>

      <span className="relative mt-4 grid grid-cols-3 gap-2">
        <HeroMetric label="Queue" value={arcade.queue} />
        <HeroMetric label="Cabinets" value={arcade.cabinets} />
        <HeroMetric label="Away" value={`${arcade.distanceKm.toFixed(1)} km`} />
      </span>

      <span className="relative mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5">
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

function HeroMetric({ label, value }) {
  return (
    <span className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
      <span className="block font-display text-sm font-bold tabular-nums">{value}</span>
      <span className="block text-[10px] text-white/65">{label}</span>
    </span>
  )
}

function VenueCard({ arcade, onOpen }) {
  const wait = estimateWaitMin(arcade)
  const stale = isStale(arcade)
  const friends = presentAt(arcade.id)

  return (
    <button
      type="button"
      onClick={() => onOpen(arcade.id)}
      className="w-[252px] flex-none snap-start rounded-2xl border border-line bg-surface p-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md active:translate-y-0"
    >
      <span className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl"
          style={{ backgroundColor: `${arcade.gameColor}18`, color: arcade.gameColor }}
        >
          <GameDot color={arcade.gameColor} className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-semibold text-ink">
            {arcade.short}
          </span>
          <span className="block truncate text-[11px] text-ink-muted">{arcade.suburb}</span>
        </span>
        {stale ? <StaleBadge /> : <LiveBadge label="live" />}
      </span>

      <span className="mt-3 grid grid-cols-3 divide-x divide-line rounded-xl bg-sunken py-2">
        <CardMetric label="Wait" value={`${wait}m`} />
        <CardMetric label="Queue" value={arcade.queue} />
        <CardMetric label="Away" value={`${arcade.distanceKm.toFixed(1)} km`} />
      </span>

      <span className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          {friends.length > 0 ? (
            <>
              <span className="flex -space-x-1.5">
                {friends.slice(0, 2).map((friend) => (
                  <Avatar key={friend.handle} handle={friend.handle} size={20} live />
                ))}
              </span>
              {friends.length} here
            </>
          ) : (
            freshnessLabel(arcade)
          )}
        </span>
        <Chevron size={15} />
      </span>
    </button>
  )
}

function CardMetric({ label, value }) {
  return (
    <span className="text-center">
      <span className="block font-display text-sm font-bold tabular-nums text-ink">{value}</span>
      <span className="block text-[9px] uppercase tracking-wide text-ink-subtle">{label}</span>
    </span>
  )
}

function CompareView({ arcades, onOpen }) {
  const bestId = bestArcadeId(arcades)
  const maxWait = Math.max(...arcades.map(estimateWaitMin), 1)
  const anyStale = arcades.some(isStale)
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
            Fresh reports are ranked by estimated wait. Reports older than{' '}
            {STALE_AFTER_MIN} minutes stay visible, but they cannot be the best option.
          </Info>
        </div>

        <div className="mt-3 space-y-2.5">
          {rows.map((arcade) => (
            <CompareCard
              key={arcade.id}
              arcade={arcade}
              best={arcade.id === bestId}
              maxWait={maxWait}
              onOpen={onOpen}
            />
          ))}
        </div>
      </section>

      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3">
        <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-white">
          <Clock size={15} />
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-700">Why the shortest queue can lose</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            More cabinets move several groups at once. That can make a busy arcade the quicker
            choice.
            {anyStale && ' One report is old, so check it before travelling.'}
          </p>
        </div>
      </div>
    </Body>
  )
}

function CompareCard({ arcade, best, maxWait, onOpen }) {
  const wait = estimateWaitMin(arcade)
  const stale = isStale(arcade)
  const friends = presentAt(arcade.id)

  return (
    <button
      type="button"
      onClick={() => onOpen(arcade.id)}
      className={`w-full rounded-2xl border p-3 text-left transition-all duration-150 hover:border-brand-200 active:scale-[0.99] ${
        best ? 'border-brand-200 bg-brand-50' : 'border-line bg-surface'
      }`}
    >
      <span className="flex items-center gap-2">
        <GameDot color={arcade.gameColor} className="h-2.5 w-2.5" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
          {arcade.short}
        </span>
        {best && <BestBadge />}
        {stale && <StaleBadge />}
      </span>

      <span className="mt-2.5 flex items-end gap-3">
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex items-center justify-between text-[10px] text-ink-muted">
            <span>
              {arcade.queue} groups · {arcade.cabinets} cabs
            </span>
            <span>{arcade.distanceKm.toFixed(1)} km away</span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-line">
            <span
              className={`block h-full rounded-full ${stale ? 'bg-stale' : 'bg-brand-500'}`}
              style={{ width: `${Math.max(12, (wait / maxWait) * 100)}%` }}
            />
          </span>
        </span>
        <span className="w-12 text-right">
          <span className="block font-display text-lg font-bold leading-none tabular-nums text-ink">
            {stale ? '~' : ''}{wait}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-ink-subtle">min</span>
        </span>
      </span>

      <span className="mt-2 flex items-center justify-between text-[10px] text-ink-muted">
        <span className="inline-flex items-center gap-1">
          {friends.length > 0 ? <Users size={12} /> : <Clock size={12} />}
          {friends.length > 0
            ? `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'} here`
            : freshnessLabel(arcade)}
        </span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-ink">
          Details <Chevron size={12} />
        </span>
      </span>
    </button>
  )
}
