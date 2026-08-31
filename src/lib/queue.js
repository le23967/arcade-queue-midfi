import { gameLabel, gameColor } from '../data.js'

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

/* Flatten a venue plus one of its game queues into the single object every
   screen already consumes. Returns null when the venue does not run the game,
   which is what filters the lists. */
export function venueGame(arcade, gameId) {
  const g = arcade.games[gameId]
  if (!g) return null
  return {
    id: arcade.id,
    name: arcade.name,
    short: arcade.short,
    suburb: arcade.suburb,
    address: arcade.address,
    distanceKm: arcade.distanceKm,
    map: arcade.map,
    gameId,
    game: gameLabel(gameId),
    gameColor: gameColor(gameId),
    ...g,
  }
}

export function venuesForGame(arcades, gameId) {
  return arcades.map((a) => venueGame(a, gameId)).filter(Boolean)
}

/* Other games the same venue runs, for the detail screen. */
export function otherGamesAt(arcade, gameId) {
  return Object.keys(arcade.games)
    .filter((id) => id !== gameId)
    .map((id) => venueGame(arcade, id))
}

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
  if (list.length === 0) return null
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

/* ---------------------------------------------------------------------------
   Queue roster.

   Expands a queue count into the actual line. Named parties come from the
   venue's roster - the people who checked in through the app. Everyone else is
   a guest: counted in the number, but not identified, because they are not
   running this. Showing that split honestly is the point. A venue where nobody
   uses the app shows an all-guest line, which is also why its number goes
   stale.

   Party sizes are reconciled against `solo` so the derived guests carry the
   same solo/pair split the report described.
--------------------------------------------------------------------------- */
export function queueRoster(a, { mePosition = null } = {}) {
  const known = (a.roster ?? []).slice(0, a.queue)
  const knownPairs = known.filter((k) => Boolean(k.plus)).length

  let guestPairs = Math.max(0, pairsOf(a) - knownPairs)
  const rows = known.map((k) => ({ ...k, app: true }))

  /* Unaccounted pairs are placed first; whatever is left over is solo by
     construction, since queue = pairs + solo. */
  while (rows.length < a.queue) {
    const isPair = guestPairs > 0
    if (isPair) guestPairs -= 1
    rows.push(isPair ? { app: false, plus: 1 } : { app: false })
  }

  return rows.map((r, i) => ({
    ...r,
    position: i + 1,
    /* Every cabinet is busy, so the parties at the front are playing, not
       waiting. */
    state:
      i < a.cabinets ? 'Playing now' : i === a.cabinets ? 'Next' : 'Waiting',
    you: mePosition === i + 1,
  }))
}

export function rosterKnownCount(a, mePosition = null) {
  const named = Math.min((a.roster ?? []).length, a.queue)
  return mePosition ? named + 1 : named
}

/* Resolve a venue for display when a specific game is not the point.

   The Circle tab is about people, not about one cabinet, so it must show every
   venue someone is at - including venues that do not run whatever game is
   selected over on Arcades. Prefer the selected game, fall back to the first
   game the venue actually runs. */
export function resolveVenue(arcade, preferredGameId) {
  return (
    venueGame(arcade, preferredGameId) ??
    venueGame(arcade, Object.keys(arcade.games)[0])
  )
}

export function resolveVenues(arcades, preferredGameId) {
  return arcades.map((a) => resolveVenue(a, preferredGameId)).filter(Boolean)
}
