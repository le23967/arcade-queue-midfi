import { Screen, TopBar, Body, BestBadge, StaleBadge, Note } from '../components/ui.jsx'
import { estimateWaitMin, isStale, bestArcadeId, freshnessLabel } from '../lib/queue.js'

/* SCREEN 2 - Compare.

   The sketch's four columns (Arcade / Queue / Solo / Wait) are kept exactly.
   What is new is that the starred "best option" is COMPUTED from wait rather
   than assumed to be the shortest queue - which is the whole point of the
   screen. On this data Timezone wins with 8 parties queued while Central Park
   loses with 3, because Timezone runs four machines to Central Park's one.

   That inversion is the interview finding made visible: "I'll go mostly to
   [the emptier one] just because there's more cabs, so it can move more
   quickly ... even if it is comparatively bad, it's the moving cost." */
export default function Compare({ arcades, onOpen }) {
  const bestId = bestArcadeId(arcades)
  const anyStale = arcades.some(isStale)

  return (
    <Screen>
      <TopBar title="Compare" />

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
                  <td className={`py-3 pl-4 pr-2 ${best ? 'border-l-4 border-gray-900' : 'border-l-4 border-transparent'}`}>
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

        <div className="space-y-2 px-4 py-4">
          <Note>
            <span className="font-semibold text-gray-900">Best option</span> is the
            shortest wait, not the shortest queue. Timezone has more parties
            waiting than Central Park and is still faster, because it runs four
            machines to Central Park&rsquo;s one.
          </Note>
          {anyStale && (
            <Note>
              * Market City&rsquo;s numbers are 41 minutes old, so they are shown
              but not ranked.
            </Note>
          )}
          <Note>
            Wait assumes {4} min for a solo turn and {6} min for a pair &mdash;
            pairing buys an extra song, so a pair holds the machine longer.
          </Note>
        </div>

        <div className="border-t border-gray-300 px-4 py-3">
          <p className="text-xs text-gray-600">
            Freshness &mdash;{' '}
            {arcades.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ' · '}
                {a.short}: {freshnessLabel(a).replace('Updated ', '')}
              </span>
            ))}
          </p>
        </div>
      </Body>
    </Screen>
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
