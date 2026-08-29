import { Screen, TopBar, Body, StaleBadge, Note } from '../components/ui.jsx'
import { Pin, Chevron } from '../components/Icons.jsx'
import { estimateWaitMin, isStale, freshnessLabel, sortArcades } from '../lib/queue.js'

/* SCREEN 1 - Nearby Arcade.

   The lo-fi list showed name, queue count and distance. Two things are added,
   both straight out of the interviews:

   - an estimated wait, so the list can be ranked by the thing players
     actually optimise for
   - the age of every report, because the number is worthless if nobody knows
     when it was last confirmed */
export default function Nearby({ arcades, sort, onSort, onOpen }) {
  const rows = sortArcades(arcades, sort)

  return (
    <Screen>
      <TopBar title="Nearby Arcade" />

      <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-2">
        <span className="text-xs text-gray-600">Sort</span>
        <SortButton on={sort === 'distance'} onClick={() => onSort('distance')}>
          Distance
        </SortButton>
        <SortButton on={sort === 'wait'} onClick={() => onSort('wait')}>
          Wait
        </SortButton>
      </div>

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

        <div className="space-y-2 px-4 py-4">
          <Note>
            <span className="font-semibold text-gray-900">Q</span> counts parties
            waiting, not people &mdash; players who came together take one machine
            between them. <span className="font-semibold text-gray-900">Solo</span>{' '}
            is how many of those parties are a single player.
          </Note>
          <Note>
            Anything last confirmed more than 15 minutes ago is marked{' '}
            <span className="font-semibold text-gray-900">Stale</span> and is not
            ranked.
          </Note>
        </div>
      </Body>
    </Screen>
  )
}

function SortButton({ on, children, ...rest }) {
  return (
    <button
      type="button"
      className={`rounded-md border px-2 py-1 text-xs font-medium ${
        on
          ? 'border-gray-900 bg-gray-100 text-gray-900'
          : 'border-gray-300 bg-white text-gray-600'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}
