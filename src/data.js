/* ---------------------------------------------------------------------------
   Seed data.

   Queues belong to a GAME, not to a venue. Every interview is about a specific
   cabinet's queue - the Sound Voltex player queues for Sound Voltex, the
   maimai players queue for maimai - so a venue carries one queue record per
   game it runs, and no venue runs all six.

   Within each record, two fields go beyond the lo-fi sketch:

   - `cabinets`   how many machines the venue runs for that game. Players pick
                  on throughput: "I'll go mostly to [the emptier one] just
                  because there's more cabs, so it can move more quickly ...
                  even if it is comparatively bad, it's the moving cost."
                  (21 Aug, arcade)

   - `updatedMinsAgo`  how old the report is. Today a player finds this out by
                  messaging the group chat an hour before they travel and
                  waiting "thirty or forty five minutes" for a reply, if one
                  comes at all. (21 Aug, arcade)
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

/* queue = parties waiting, solo = how many of those are a single player. */
const q = (cabinets, queue, solo, updatedMinsAgo, updatedAt) => ({
  cabinets,
  queue,
  solo,
  updatedMinsAgo,
  updatedAt,
})

export const ARCADES = [
  {
    id: 'central-park',
    name: 'Central Park Mall',
    short: 'Central Park',
    suburb: 'Chippendale',
    distanceKm: 1.8,
    games: {
      maimai: q(1, 3, 1, 2, '12:38 PM'),
      chunithm: q(1, 1, 1, 9, '12:31 PM'),
      sdvx: q(1, 2, 2, 4, '12:36 PM'),
      taiko: q(1, 0, 0, 12, '12:28 PM'),
    },
  },
  {
    id: 'timezone',
    name: 'Timezone George St',
    short: 'Timezone',
    suburb: 'Haymarket',
    distanceKm: 2.4,
    games: {
      maimai: q(4, 8, 3, 6, '12:34 PM'),
      chunithm: q(2, 4, 2, 7, '12:33 PM'),
      taiko: q(2, 5, 2, 3, '12:37 PM'),
      sdvx: q(1, 1, 1, 22, '12:18 PM'),
      ddr: q(2, 3, 3, 18, '12:22 PM'),
    },
  },
  {
    id: 'market-city',
    name: 'Market City',
    short: 'Market City',
    suburb: 'Haymarket',
    distanceKm: 3.8,
    games: {
      maimai: q(2, 11, 2, 41, '11:59 AM'),
      sdvx: q(2, 3, 1, 5, '12:35 PM'),
      gitadora: q(1, 0, 0, 8, '12:32 PM'),
      ddr: q(1, 2, 2, 31, '12:09 PM'),
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
