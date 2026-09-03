import {
  ACTIVITY,
  FRIENDS,
  FOLLOWERS_ONLY,
  ME,
  OLD_SITE_FAVOURITE_CAP,
  PLANNED,
} from '../social.js'

/* maimai grades the achievement percentage, so the leaderboard shows the same
   thing a player would see on the cabinet. */
export function gradeOf(achievement) {
  if (achievement >= 100.5) return 'SSS+'
  if (achievement >= 100.0) return 'SSS'
  if (achievement >= 99.5) return 'SS+'
  if (achievement >= 99.0) return 'SS'
  if (achievement >= 98.0) return 'S+'
  if (achievement >= 97.0) return 'S'
  return 'A'
}

export function formatAchievement(a) {
  return `${a.toFixed(4)}%`
}

/* --- the roster -----------------------------------------------------------

   Two seed lists describe one population: people you already follow, and
   people who follow you and whom you have not followed back. The second list
   only ever carried a handle and a game, so anything reading a profile has to
   treat songs, scores and presence as optional. Normalising both lists into
   one shape here is what stops an optional field turning into an undefined at
   the call site. */
function normalise(person, { followsYou }) {
  return {
    handle: person.handle,
    games: person.games ?? [],
    songs: person.songs ?? [],
    scores: person.scores ?? null,
    at: person.at ?? null,
    sinceMin: person.sinceMin ?? 0,
    followsYou,
  }
}

const PEOPLE = [
  ...FRIENDS.map((p) => normalise(p, { followsYou: p.followsYou })),
  ...FOLLOWERS_ONLY.map((p) => normalise(p, { followsYou: true })),
]

/* Who you follow when the prototype starts. Follows are App state from here
   on, because you can now add one from the People screen. */
export const INITIAL_FOLLOWING = FRIENDS.map((p) => p.handle)

export function allPeople() {
  return PEOPLE
}

export function findPerson(handle) {
  return PEOPLE.find((p) => p.handle === handle) ?? null
}

/* Relationship is stated explicitly rather than inferred from a missing field,
   so "we have no data on this person" can never read as "mutual". */
export function relationshipOf(handle, following = INITIAL_FOLLOWING) {
  const person = findPerson(handle)
  const youFollow = following.includes(handle)
  const followsYou = Boolean(person?.followsYou)

  return {
    youFollow,
    followsYou,
    mutual: youFollow && followsYou,
    label: youFollow
      ? followsYou
        ? 'Mutual'
        : 'Following'
      : followsYou
        ? 'Follows you'
        : 'Not connected',
    /* What the follow button should say next. */
    action: youFollow ? (followsYou ? 'Mutual' : 'Following') : followsYou ? 'Follow back' : 'Follow',
  }
}

/* Who a scanned code resolves to.

   There is no camera and no second phone, so the scan has to land on somebody
   real from the seed data. It picks the first person you are not following
   yet, which is deterministic - the same demo twice runs the same way - and
   true to the situation the feature is for: the person in front of you is
   someone the app does not yet connect you to. Null once you follow everyone,
   and the screen says so rather than inventing a stranger. */
export function nextUnfollowed(following = INITIAL_FOLLOWING) {
  return PEOPLE.find((p) => !following.includes(p.handle)) ?? null
}

export function searchPeople(query, following = INITIAL_FOLLOWING) {
  const q = query.trim().toLowerCase()
  if (q === '') return []
  return PEOPLE.filter(
    (p) =>
      p.handle.toLowerCase().includes(q) ||
      p.games.some((g) => g.toLowerCase().includes(q))
  ).map((p) => ({ ...p, ...relationshipOf(p.handle, following) }))
}

/* Everyone you follow, plus you, ranked on one song. No cap. */
export function leaderboard(songId) {
  const rows = [
    ...FRIENDS.map((p) => ({
      handle: p.handle,
      achievement: p.scores[songId],
      at: p.at,
      me: false,
    })),
    { handle: ME.handle, achievement: ME.scores[songId], at: null, me: true },
  ]
  return rows
    .sort((a, b) => b.achievement - a.achievement)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

/* Who would have been invisible on the official site, and how many of them are
   standing in the arcade with you right now. That second number is the whole
   argument for lifting the cap. */
export function belowOldCap(rows) {
  const cut = rows.filter((r) => r.rank > OLD_SITE_FAVOURITE_CAP)
  return { count: cut.length, hereNow: cut.filter((r) => r.at).length }
}

/* Presence is mutual-only, so it is derived from the live follow state rather
   than from the seed list: unfollow someone and their pin goes with them. */
export function presentFriends(following = INITIAL_FOLLOWING) {
  return PEOPLE.filter(
    (p) => p.at !== null && p.followsYou && following.includes(p.handle)
  )
}

export function presentAt(venueId, following = INITIAL_FOLLOWING) {
  return presentFriends(following).filter((p) => p.at === venueId)
}

/* What someone has just been playing, if the feed knows.

   A presence row that only says "plays maimai DX" cannot answer the question
   people actually ask before walking over, which is whether they would want to
   play with this person. A set somebody finished a few minutes ago answers it
   in a way a stored number does not: it says what they are doing right now,
   not what they once managed.

   Nothing new is invented for it - this is the same Activity feed the Circle
   tab renders. A best-score fallback was tried for the people the feed has
   nothing recent on and taken back out: a grade is a boast rather than an
   invitation, and half of it is on the leaderboard anyway. So this returns
   null for them, and the row simply carries one line less. */
export function playerSignal(handle) {
  const played = ACTIVITY.find((e) => e.type === 'played' && e.handle === handle)
  return played?.songs?.length > 0 ? `Just played ${played.songs[0]}` : null
}

/* A shared favourite is a reason to talk that neither person had to invent.
   "if two people have the same favorite song ... they could talk about that"

   Songs and games are optional on a profile, so both helpers fall back to an
   empty list rather than reading `.filter` off undefined. */
export function sharedSongs(player) {
  return (player?.songs ?? []).filter((s) => ME.songs.includes(s))
}

export function sharedGames(player) {
  return (player?.games ?? []).filter((g) => ME.games.includes(g))
}

/* --- follows ------------------------------------------------------------ */

export function followingList(following = INITIAL_FOLLOWING) {
  return PEOPLE.filter((p) => following.includes(p.handle))
}

export function followerList(following = INITIAL_FOLLOWING) {
  return PEOPLE.filter((p) => p.followsYou).map((p) => ({
    ...p,
    youFollow: following.includes(p.handle),
  }))
}

export function followCounts(following = INITIAL_FOLLOWING) {
  return {
    following: followingList(following).length,
    followers: followerList(following).length,
  }
}

export function isMutual(handle, following = INITIAL_FOLLOWING) {
  return relationshipOf(handle, following).mutual
}

/* --- shared formatting -------------------------------------------------- */

export function ago(min) {
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function plannedSessions() {
  return PLANNED
}
