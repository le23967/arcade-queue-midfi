/* ---------------------------------------------------------------------------
   Seed data.

   Arcade names, queue counts and solo counts are taken straight from the
   lo-fi sketch (Fig 3). Two fields are new:

   - `cabinets`   how many machines the venue runs. Interviewees pick a venue
                  on throughput, not on queue length: "I'll go mostly to
                  [the emptier one] just because there's more cabs, so it can
                  move more quickly ... even if it is comparatively bad, it's
                  the moving cost."  (21 Aug, arcade)

   - `updatedMinsAgo`  how old the report is. Today a player finds this out by
                  messaging the group chat an hour before they travel and
                  waiting "thirty or forty five minutes" for a reply, if one
                  comes at all. (21 Aug, arcade)  Freshness is therefore shown
                  next to every number rather than assumed.
--------------------------------------------------------------------------- */

export const ARCADES = [
  {
    id: 'central-park',
    name: 'Central Park Mall',
    short: 'Central Park',
    suburb: 'Chippendale',
    game: 'maimai DX',
    distanceKm: 1.8,
    cabinets: 1,
    queue: 3, // parties waiting
    solo: 1, // of those parties, how many are a single player
    updatedMinsAgo: 2,
    updatedAt: '12:38 PM',
  },
  {
    id: 'timezone',
    name: 'Timezone George St',
    short: 'Timezone',
    suburb: 'Haymarket',
    game: 'maimai DX',
    distanceKm: 2.4,
    cabinets: 4,
    queue: 8,
    solo: 3,
    updatedMinsAgo: 6,
    updatedAt: '12:34 PM',
  },
  {
    id: 'market-city',
    name: 'Market City',
    short: 'Market City',
    suburb: 'Haymarket',
    game: 'maimai DX',
    distanceKm: 3.8,
    cabinets: 2,
    queue: 11,
    solo: 2,
    updatedMinsAgo: 41,
    updatedAt: '11:59 AM',
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
