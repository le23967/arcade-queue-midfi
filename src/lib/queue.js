/* ---------------------------------------------------------------------------
   Wait estimation.

   The lo-fi sketch shows Queue, Solo and Wait as three separate columns but
   does not say how they relate. They relate like this:

   `queue` counts PARTIES, not people. Players who came together queue together
   and take one machine between them: "there's two cabinets that you can play
   together, so people like playing together, so they queue together"
   (Wednesday interview). `solo` is how many of those parties are one player.

   A pair holds the machine longer than a solo player, because pairing buys an
   extra song: "if you play as two people, you get like an extra song, so you
   get to play more" (21 Aug, arcade).

   So the wait is total load divided by machines - which is why a venue with a
   longer queue can still be the faster choice.
--------------------------------------------------------------------------- */

export const SOLO_TURN_MIN = 4 // one credit, single player
export const PAIR_TURN_MIN = 6 // pair: one credit plus the bonus song
export const STALE_AFTER_MIN = 15 // past this, treat a report as unreliable

export function pairsOf(a) {
  return Math.max(0, a.queue - a.solo)
}

export function estimateWaitMin(a) {
  const load = a.solo * SOLO_TURN_MIN + pairsOf(a) * PAIR_TURN_MIN
  return Math.round(load / Math.max(1, a.cabinets))
}

export function isStale(a) {
  return a.updatedMinsAgo >= STALE_AFTER_MIN
}

export function freshnessLabel(a) {
  if (a.updatedMinsAgo <= 0) return 'Updated just now'
  if (a.updatedMinsAgo === 1) return 'Updated 1 min ago'
  return `Updated ${a.updatedMinsAgo} min ago`
}

/* The best option is the shortest WAIT, not the shortest queue - and a report
   nobody has confirmed for 15 minutes is not allowed to win. */
export function bestArcadeId(list) {
  const fresh = list.filter((a) => !isStale(a))
  const pool = fresh.length > 0 ? fresh : list
  return pool.reduce((best, a) =>
    estimateWaitMin(a) < estimateWaitMin(best) ? a : best
  ).id
}

export function sortArcades(list, mode) {
  const copy = [...list]
  if (mode === 'wait') {
    // Stale rows sink to the bottom: an unverified number is not a ranking.
    return copy.sort((a, b) => {
      if (isStale(a) !== isStale(b)) return isStale(a) ? 1 : -1
      return estimateWaitMin(a) - estimateWaitMin(b)
    })
  }
  return copy.sort((a, b) => a.distanceKm - b.distanceKm)
}
