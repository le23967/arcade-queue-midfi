/* ---------------------------------------------------------------------------
   Seed data.

   VENUES AND CABINET COUNTS ARE REAL, checked August 2026 against the SEGA
   maimai DX International location finder, the Timezone venue pages, and the
   community machine lists on Zenius-i-vanisher. Sources are listed in README.
   Arcade line-ups change often, so treat the counts as a snapshot.

   Two corrections came out of that check:

   - "Timezone George St" does not exist. The Timezone at 505 George Street
     closed. The George Street rhythm arcade is KOKO Amusement Town Hall at
     614 George Street, and it is the biggest of the three by a wide margin.

   - Central Park runs neither GITADORA nor Dance Dance Revolution, so it
     genuinely drops out of those two filters.

   Queues belong to a GAME, not to a venue. Every interview is about a specific
   cabinet's queue - the Sound Voltex player queues for Sound Voltex, the
   maimai players queue for maimai - so a venue carries one queue record per
   game it runs.

   Queue counts and wait times are invented; only the venues, the games and the
   cabinet counts are real.
--------------------------------------------------------------------------- */

/* Order matters: this is the order the filter chips appear in. */
export const GAMES = [
  { id: 'maimai', label: 'maimai DX' },
  { id: 'chunithm', label: 'CHUNITHM' },
  { id: 'sdvx', label: 'Sound Voltex' },
  { id: 'gitadora', label: 'GITADORA' },
  { id: 'taiko', label: 'Taiko' },
  { id: 'ddr', label: 'DDR' },
]

export const DEFAULT_GAME = 'maimai'

export function gameLabel(id) {
  return GAMES.find((g) => g.id === id)?.label ?? id
}

/* cabinets = real count. queue = parties waiting, solo = how many of those are
   a single player. Distances are walking distance from UTS Broadway, since the
   interviews were run by students based there.

   `roster` is the front of the queue in order, naming only the parties that
   checked in through the app. It is deliberately shorter than `queue`: the
   count comes from reports, and most people in a physical arcade queue are not
   running this app. The rest of the list is filled with unnamed guests, which
   is the honest picture rather than a flattering one.

   `plus: 1` marks a party of two - they hold one machine between them. */
const q = (cabinets, queue, solo, updatedMinsAgo, updatedAt, roster = []) => ({
  cabinets,
  queue,
  solo,
  updatedMinsAgo,
  updatedAt,
  roster,
})

export const ARCADES = [
  {
    id: 'central-park',
    name: 'Timezone Central Park',
    short: 'Central Park',
    suburb: 'Chippendale',
    address: 'Level 2, Central Park Mall, 28 Broadway, Chippendale NSW 2008',
    distanceKm: 0.3,
    games: {
      maimai: q(2, 7, 2, 2, '12:38 PM', [
        { handle: 'rin_9' },
        { handle: 'kzt', plus: 1 },
        { handle: 'nori', plus: 1 },
      ]),
      chunithm: q(1, 2, 1, 9, '12:31 PM', [{ handle: 'yuzu_' }]),
      sdvx: q(1, 2, 2, 4, '12:36 PM', [{ handle: 'rvn_' }]),
      taiko: q(2, 0, 0, 12, '12:28 PM'),
      /* No GITADORA and no DDR here - confirmed absent. */
    },
  },
  {
    id: 'market-city',
    name: 'Timezone Haymarket',
    short: 'Market City',
    suburb: 'Haymarket',
    address: 'Level 3, Market City, 9-13 Hay Street, Haymarket NSW 2000',
    distanceKm: 0.7,
    games: {
      /* Nobody here is on the app, which is exactly why this venue's number is
         41 minutes old. */
      maimai: q(2, 11, 2, 41, '11:59 AM'),
      chunithm: q(2, 4, 2, 7, '12:33 PM'),
      sdvx: q(1, 3, 1, 5, '12:35 PM'),
      gitadora: q(2, 0, 0, 8, '12:32 PM'),
      taiko: q(1, 4, 2, 3, '12:37 PM'),
      ddr: q(2, 2, 2, 31, '12:09 PM'),
    },
  },
  {
    id: 'koko-town-hall',
    name: 'KOKO Amusement Town Hall',
    short: 'KOKO Town Hall',
    suburb: 'Sydney CBD',
    address: '614 George Street, Sydney NSW 2000',
    distanceKm: 1.4,
    games: {
      maimai: q(5, 10, 4, 6, '12:34 PM', [
        { handle: 'ovo_' },
        { handle: 'p0lar', plus: 1 },
        { handle: 'tsuki' },
      ]),
      chunithm: q(3, 5, 3, 4, '12:36 PM', [{ handle: 'ovo_' }, { handle: 'hnr' }]),
      sdvx: q(2, 2, 2, 26, '12:14 PM'),
      gitadora: q(1, 1, 1, 11, '12:29 PM'),
      taiko: q(5, 6, 3, 3, '12:37 PM'),
      ddr: q(2, 3, 3, 18, '12:22 PM'),
    },
  },
]

/* The queue ahead of you once you check in. Handles only - players report and
   queue without having to speak to anyone, which matters for the interviewee
   who described themselves as "very introverted". (Wednesday interview) */
export const QUEUE_AHEAD = [
  { handle: 'rin_9', state: 'Playing now' },
  { handle: 'kzt', state: 'Next' },
  { handle: 'ovo / pair', state: 'Waiting' },
]
