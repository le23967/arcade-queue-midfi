import { Screen, TopBar, Body, BestBadge, StaleBadge, Info, Seg } from '../components/ui.jsx'
import { GAMES, gameLabel } from '../data.js'
import { Pin, Chevron } from '../components/Icons.jsx'
import {
  estimateWaitMin,
  isStale,
  freshnessLabel,
  sortArcades,
  bestArcadeId,
  STALE_AFTER_MIN,
  SOLO_TURN_MIN,
  PAIR_TURN_MIN,
} from '../lib/queue.js'

/* SCREENS 1 + 2 - Arcades.

   The lo-fi sheet drew Nearby and Compare as separate tabs, but they are the
   same three venues carrying the same four numbers; only the layout differs.
   Splitting them costs a tab and makes the user navigate to answer one
   question. They are one screen with a view switch. */
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
        right={
          <Info >
            <b>Queue</b> counts parties waiting, not people &mdash; players who
            came together take one machine between them. <b>Solo</b> is how many
            of those are a single player. Wait allows {SOLO_TURN_MIN} min for a
            solo turn and {PAIR_TURN_MIN} min for a pair, since pairing buys an
            extra song.
          </Info>
        }
      />

      {/* Queues belong to a game, not a venue, so the game is picked first and
          every number below is that game's queue at that venue. */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-300 px-4 py-2">
        <span className="mr-0.5 text-xs text-gray-600">Game</span>
        {GAMES.map((g) => (
          <Seg key={g.id} on={g.id === game} onClick={() => onGame(g.id)}>
            {g.label}
          </Seg>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-2">
        <Seg on={view === 'list'} onClick={() => onView('list')}>
          List
        </Seg>
        <Seg on={view === 'compare'} onClick={() => onView('compare')}>
          Compare
        </Seg>

        {view === 'list' && (
          <span className="ml-auto flex items-center gap-1">
            <span className="text-xs text-gray-600">Sort</span>
            <Seg on={sort === 'distance'} onClick={() => onSort('distance')}>
              Distance
            </Seg>
            <Seg on={sort === 'wait'} onClick={() => onSort('wait')}>
              Wait
            </Seg>
          </span>
        )}
      </div>

      {arcades.length < venueCount && (
        <p className="border-b border-gray-300 px-4 py-2 text-xs text-gray-600">
          <span className="tabular-nums">{arcades.length}</span> of{' '}
          <span className="tabular-nums">{venueCount}</span> arcades run{' '}
          {gameLabel(game)}.
        </p>
      )}

      {view === 'list' ? (
        <ListView arcades={arcades} sort={sort} onOpen={onOpen} />
      ) : (
        <CompareView arcades={arcades} onOpen={onOpen} />
      )}
    </Screen>
  )
}

function ListView({ arcades, sort, onOpen }) {
  const rows = sortArcades(arcades, sort)

  return (
    <Body>
      <ul>
        {rows.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onOpen(a.id)}
              className="flex w-full items-center gap-3 border-b border-gray-300 px-4 py-3 text-left"
            >
              <Pin size={18} />

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {a.name}
                  </span>
                  {isStale(a) && <StaleBadge />}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-gray-700">
                  Q {a.queue} &middot; Solo {a.solo} &middot; {a.cabinets}{' '}
                  {a.cabinets === 1 ? 'cab' : 'cabs'} &middot; ~
                  {estimateWaitMin(a)} min
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {freshnessLabel(a)}
                </span>
              </span>

              <span className="flex flex-none items-center gap-1">
                <span className="text-xs tabular-nums text-gray-700">
                  {a.distanceKm.toFixed(1)} km
                </span>
                <Chevron size={16} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Body>
  )
}

function CompareView({ arcades, onOpen }) {
  const bestId = bestArcadeId(arcades)
  const anyStale = arcades.some(isStale)

  return (
    <Body>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <Th className="pl-4">Arcade</Th>
            <Th className="text-right">Queue</Th>
            <Th className="text-right">Solo</Th>
            <Th className="pr-4 text-right">Wait</Th>
          </tr>
        </thead>
        <tbody>
          {arcades.map((a) => {
            const best = a.id === bestId
            const stale = isStale(a)
            return (
              <tr
                key={a.id}
                onClick={() => onOpen(a.id)}
                className={`cursor-pointer border-b border-gray-300 ${
                  best ? 'bg-gray-100' : ''
                }`}
              >
                <td
                  className={`py-3 pl-4 pr-2 border-l-4 ${
                    best ? 'border-gray-900' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {a.short}
                    </span>
                    {best && <BestBadge />}
                    {stale && <StaleBadge />}
                  </div>
                  <div className="text-xs tabular-nums text-gray-600">
                    {a.cabinets} {a.cabinets === 1 ? 'cab' : 'cabs'} &middot;{' '}
                    {a.distanceKm.toFixed(1)} km
                  </div>
                </td>
                <td className="py-3 text-right tabular-nums text-gray-900">
                  {a.queue}
                </td>
                <td className="py-3 text-right tabular-nums text-gray-900">
                  {a.solo}
                </td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums text-gray-900">
                  {estimateWaitMin(a)} min{stale ? '*' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-start gap-1.5 px-4 py-3">
        <p className="text-xs text-gray-600">
          <b className="text-gray-900">Best</b> is the shortest wait, not the
          shortest queue.
          {anyStale && ' * older than 15 min, shown but not ranked.'}
        </p>
        <Info >
          Wait is queue load divided by machines, so a venue with more people
          waiting can still be the faster choice if it runs more cabinets.
          Anything last confirmed over {STALE_AFTER_MIN} minutes ago is marked
          stale and left out of the ranking.
        </Info>
      </div>
    </Body>
  )
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 ${className}`}
    >
      {children}
    </th>
  )
}
