/* ---------------------------------------------------------------------------
   Social layer seed data.

   Scope is deliberately narrow. Only three things in the interviews had a
   participant volunteer them without being prompted with a concept first:

   - the 20-person favourite cap on the official maimai score site
   - being able to see which players are around
   - what game someone mainly plays, and what songs they like

   Everything else in the social space (matchmaking with strangers, icebreaker
   prompts, invite rewards) came out of the team's own brainstorm, so it is not
   built here. See README for the evidence grading.
--------------------------------------------------------------------------- */

/* The official maimai score site lets you favourite 20 people and no more:
   "the website lets you favorite up to 20 people ... but you can't have more
   than that" - and, unprompted, "if you make something [to] get around that,
   that would actually be like-". This constant exists so the prototype can
   draw the line and show who falls below it. */
export const OLD_SITE_FAVOURITE_CAP = 20

export const SONGS = [
  { id: 'neon', title: 'Neon Cascade', chart: 'Master 13+' },
  { id: 'gravity', title: 'Gravity Well', chart: 'Master 14' },
  { id: 'lantern', title: 'Paper Lantern', chart: 'Expert 12+' },
]

export const ME = {
  handle: 'kntt',
  games: ['maimai DX', 'Taiko'],
  songs: ['Neon Cascade', 'Gravity Well', 'Copper Sky'],
  scores: { neon: 100.4921, gravity: 99.8812, lantern: 100.7734 },
  visible: true,
}

/* handle, games, favourite songs, per-song achievement, and where they are
   now. `at` is a venue id or null - venue level only, never a coordinate. */
const f = (handle, games, songs, neon, gravity, lantern, at = null, sinceMin = 0) => ({
  handle,
  games,
  songs,
  scores: { neon, gravity, lantern },
  at,
  sinceMin,
})

const FOLLOWING = [
  f('mtsk', ['maimai DX'], ['Halcyon Drift', 'Static Bloom'], 101.0, 100.4021, 100.9912),
  f('yuzu_', ['maimai DX', 'CHUNITHM'], ['Neon Cascade', 'Copper Sky'], 100.9812, 100.1144, 100.8003),
  f('0xC0', ['maimai DX', 'Sound Voltex'], ['Gravity Well', 'Midnight Ferry'], 100.9455, 100.0087, 100.6621),
  f('hnr', ['maimai DX'], ['Static Bloom', 'Paper Lantern'], 100.8901, 99.9310, 100.9004),
  f('sable', ['maimai DX', 'DDR'], ['Halcyon Drift', 'Copper Sky'], 100.8534, 99.8776, 100.4415),
  f('qwl', ['maimai DX'], ['Neon Cascade', 'Midnight Ferry'], 100.7998, 99.7420, 100.2288),
  f('nagi', ['maimai DX', 'Taiko'], ['Paper Lantern', 'Static Bloom'], 100.7412, 99.6903, 100.5570),
  f('ovo_', ['maimai DX', 'CHUNITHM'], ['Gravity Well', 'Halcyon Drift'], 100.687, 99.6015, 100.1192, 'timezone', 11),
  f('tmk', ['maimai DX'], ['Copper Sky', 'Neon Cascade'], 100.6103, 99.5338, 99.9840),
  f('lyn', ['maimai DX', 'GITADORA'], ['Midnight Ferry', 'Paper Lantern'], 100.5488, 99.4901, 100.3306),
  f('brz', ['maimai DX'], ['Static Bloom', 'Gravity Well'], 100.4102, 99.4177, 99.8812),
  f('rvn_', ['maimai DX', 'Sound Voltex'], ['Halcyon Drift', 'Neon Cascade'], 100.3577, 99.3560, 100.0451),
  f('mky', ['maimai DX'], ['Copper Sky', 'Midnight Ferry'], 100.2914, 99.2884, 99.7723),
  f('sora', ['maimai DX', 'Taiko'], ['Paper Lantern', 'Halcyon Drift'], 100.1806, 99.2011, 100.1938),
  f('dpr', ['maimai DX'], ['Neon Cascade', 'Static Bloom'], 100.0455, 99.1350, 99.6604),
  f('teo', ['maimai DX', 'DDR'], ['Gravity Well', 'Copper Sky'], 99.9218, 99.0702, 99.9017),
  f('wsp', ['maimai DX'], ['Midnight Ferry', 'Halcyon Drift'], 99.8004, 98.9945, 99.5528),
  f('jun_', ['maimai DX', 'CHUNITHM'], ['Static Bloom', 'Paper Lantern'], 99.6531, 98.9211, 99.8140),
  f('hako', ['maimai DX'], ['Copper Sky', 'Gravity Well'], 99.5117, 98.8503, 99.4462),
  f('mkr_', ['maimai DX'], ['Neon Cascade', 'Midnight Ferry'], 99.3842, 98.7790, 99.7005),
  f('rin_9', ['maimai DX', 'Taiko'], ['Neon Cascade', 'Midnight Ferry'], 99.2015, 98.7044, 99.3311, 'central-park', 24),
  f('cyn', ['maimai DX', 'Sound Voltex'], ['Halcyon Drift', 'Static Bloom'], 99.0778, 98.6320, 99.1877),
  f('kzt', ['maimai DX'], ['Static Bloom', 'Copper Sky'], 98.9341, 98.5588, 99.0244, 'central-park', 8),
  f('pnt', ['maimai DX', 'DDR'], ['Paper Lantern', 'Gravity Well'], 98.762, 98.4802, 98.8619),
  f('lvo', ['maimai DX'], ['Midnight Ferry', 'Copper Sky'], 98.4193, 98.3115, 98.5530),
  f('zed', ['maimai DX', 'GITADORA'], ['Gravity Well', 'Halcyon Drift'], 98.0055, 98.1006, 98.2201),
]

/* Following is not symmetric. A few of the people you follow do not follow
   back, and some people follow you that you have not followed. Presence is
   only ever shared between mutuals, so this distinction is load-bearing
   rather than decorative. */
const NOT_FOLLOWING_BACK = new Set(['0xC0', 'sable', 'dpr', 'wsp', 'pnt'])

export const FRIENDS = FOLLOWING.map((p) => ({
  ...p,
  followsYou: !NOT_FOLLOWING_BACK.has(p.handle),
}))

/* People who follow you that you have not followed back. They cannot see your
   presence until you follow them too. */
export const FOLLOWERS_ONLY = [
  { handle: 'aki_', games: ['maimai DX'] },
  { handle: 'nori', games: ['maimai DX', 'Taiko'] },
  { handle: 'p0lar', games: ['maimai DX', 'Sound Voltex'] },
  { handle: 'hsk', games: ['maimai DX'] },
  { handle: 'vex_', games: ['maimai DX', 'CHUNITHM'] },
  { handle: 'tsuki', games: ['maimai DX', 'DDR'] },
  { handle: 'orb', games: ['maimai DX'] },
  { handle: 'nine_', games: ['maimai DX', 'Taiko'] },
  { handle: 'kmr', games: ['maimai DX'] },
]

/* ---------------------------------------------------------------------------
   Clips.

   A feed is in here for one reason: watching is already what these players do
   with the wait. Asked what he does while queued, one player answered "watch
   videos", and the interviewer noted "I'm guessing that's the general trend."
   The problem is that they watch somewhere else - "scrolling phones and
   they're not paying attention" - and then miss their turn, which is why
   people keep having to ask "who's next?".

   Putting the watching inside the app that holds your place is what makes the
   feed worth building rather than a borrowed pattern. It is also the on-ramp
   the team said they wanted for people outside the community: the introverted
   player got in by watching first - "I'd watch like my friends play for ages
   ... I was really interested 'cause it looked so cool."
--------------------------------------------------------------------------- */
export const CLIPS = [
  { id: 'c1', handle: 'rin_9', song: 'Neon Cascade', chart: 'Master 13+', achievement: 99.2015, venue: 'central-park', postedMin: 12, seconds: 24, likes: 34, comments: 5 },
  { id: 'c2', handle: 'ovo_', song: 'Gravity Well', chart: 'Master 14', achievement: 99.6015, venue: 'timezone', postedMin: 41, seconds: 31, likes: 88, comments: 12 },
  { id: 'c3', handle: 'mtsk', song: 'Paper Lantern', chart: 'Expert 12+', achievement: 100.9912, venue: 'central-park', postedMin: 96, seconds: 19, likes: 210, comments: 27 },
  { id: 'c4', handle: 'kzt', song: 'Static Bloom', chart: 'Master 13', achievement: 99.0244, venue: 'central-park', postedMin: 143, seconds: 28, likes: 19, comments: 2 },
  { id: 'c5', handle: 'yuzu_', song: 'Neon Cascade', chart: 'Master 13+', achievement: 100.9812, venue: 'market-city', postedMin: 260, seconds: 22, likes: 156, comments: 18 },
  { id: 'c6', handle: 'nagi', song: 'Halcyon Drift', chart: 'Master 14', achievement: 100.557, venue: 'timezone', postedMin: 380, seconds: 35, likes: 74, comments: 9 },
  { id: 'c7', handle: 'lyn', song: 'Midnight Ferry', chart: 'Expert 12', achievement: 100.3306, venue: 'central-park', postedMin: 610, seconds: 27, likes: 41, comments: 6 },
  { id: 'c8', handle: 'sora', song: 'Paper Lantern', chart: 'Expert 12+', achievement: 100.1938, venue: 'market-city', postedMin: 900, seconds: 30, likes: 63, comments: 8 },
]
