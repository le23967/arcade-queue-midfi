import { Screen, TopBar, Body, Placeholder, Note } from '../components/ui.jsx'
import { Pin } from '../components/Icons.jsx'
import { estimateWaitMin, isStale } from '../lib/queue.js'

/* Maps tab. The map itself is a gray block with pins on it - a mid-fi map is
   a rectangle, not a tile server. */
export default function MapsTab({ arcades, onOpen }) {
  const spots = [
    { top: '38%', left: '30%' },
    { top: '55%', left: '58%' },
    { top: '24%', left: '70%' },
  ]

  return (
    <Screen>
      <TopBar title="Maps" />

      <Body>
        <div className="p-4">
          <div className="relative">
            <Placeholder className="h-64 w-full">
              <span className="absolute bottom-2 left-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Map &mdash; placeholder
              </span>
            </Placeholder>
            {arcades.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onOpen(a.id)}
                style={spots[i % spots.length]}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md border border-gray-900 bg-white px-1.5 py-1"
              >
                <Pin size={14} />
                <span className="text-[11px] font-semibold tabular-nums text-gray-900">
                  {estimateWaitMin(a)}m
                </span>
              </button>
            ))}
          </div>
        </div>

        <ul className="border-t border-gray-300">
          {arcades.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onOpen(a.id)}
                className="flex w-full items-center justify-between border-b border-gray-300 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {a.short}
                  </span>
                  <span className="block text-xs text-gray-600">
                    {a.suburb} &middot; {a.distanceKm.toFixed(1)} km
                    {isStale(a) && ' · stale'}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  ~{estimateWaitMin(a)} min
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 py-4">
          <Note>
            Pins sit on the venue, never on a person. Position is recorded at
            venue level only.
          </Note>
        </div>
      </Body>
    </Screen>
  )
}
