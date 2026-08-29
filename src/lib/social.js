import { FRIENDS, FOLLOWERS_ONLY, ME, OLD_SITE_FAVOURITE_CAP } from '../social.js'

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

export function presentFriends() {
  return FRIENDS.filter((p) => p.at !== null)
}

export function presentAt(venueId) {
  return FRIENDS.filter((p) => p.at === venueId)
}

/* A shared favourite is a reason to talk that neither person had to invent.
   "if two people have the same favorite song ... they could talk about that" */
export function sharedSongs(player) {
  return player.songs.filter((s) => ME.songs.includes(s))
}

export function sharedGames(player) {
  return player.games.filter((g) => ME.games.includes(g))
}

/* --- follows ------------------------------------------------------------ */

export function followingList() {
  return FRIENDS
}

export function followerList() {
  return [
    ...FRIENDS.filter((p) => p.followsYou),
    ...FOLLOWERS_ONLY.map((p) => ({ ...p, followsYou: true, youFollow: false })),
  ]
}

export function followCounts() {
  return { following: FRIENDS.length, followers: followerList().length }
}

export function isMutual(handle) {
  const p = FRIENDS.find((x) => x.handle === handle)
  return Boolean(p && p.followsYou)
}

/* --- shared formatting -------------------------------------------------- */

export function ago(min) {
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}
