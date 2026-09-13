/* The rules of real accounts, with nothing attached to them.

   Kept apart from accounts.js so they can be exercised under plain Node -
   the data layer imports the Supabase client, which needs Vite's environment
   to exist. Every rule here mirrors a constraint in the migration, so what
   the client accepts is what the server accepts. */

export const HANDLE_MIN = 2
export const HANDLE_MAX = 16
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{2,16}$/
export const MESSAGE_MAX = 1000

/* The same rule as the database check constraint, so a handle the client
   accepts is one the server will accept. */
export function validateHandle(raw) {
  const handle = (raw ?? '').trim()
  if (handle === '') return { ok: false, handle, problem: 'Pick a username.' }
  if (/[^A-Za-z0-9_]/.test(handle))
    return { ok: false, handle, problem: 'Letters, numbers and underscores only.' }
  if (handle.length < HANDLE_MIN)
    return { ok: false, handle, problem: `At least ${HANDLE_MIN} characters.` }
  if (handle.length > HANDLE_MAX)
    return { ok: false, handle, problem: `At most ${HANDLE_MAX} characters.` }
  return { ok: true, handle, problem: null }
}

/* Trimmed, non-empty, within the column limit - or a reason it is not. */
export function prepareMessage(raw) {
  const text = (raw ?? '').trim()
  if (text === '') return { ok: false, text, problem: 'Type something first.' }
  if (text.length > MESSAGE_MAX)
    return { ok: false, text, problem: `Keep it under ${MESSAGE_MAX} characters.` }
  return { ok: true, text, problem: null }
}

/* Mutual is derived from two follow edges, never stored. */
export function relationshipFrom({ youFollow, followsYou }) {
  const mutual = Boolean(youFollow && followsYou)
  return {
    youFollow: Boolean(youFollow),
    followsYou: Boolean(followsYou),
    mutual,
    label: youFollow
      ? followsYou
        ? 'Mutual'
        : 'Following'
      : followsYou
        ? 'Follows you'
        : 'Not connected',
    action: youFollow ? (followsYou ? 'Mutual' : 'Following') : followsYou ? 'Follow back' : 'Follow',
  }
}

/* avatar_hue is stored as text; the Avatar component wants an index or null. */
export function hueFromProfile(profile) {
  const raw = profile?.avatar_hue
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/* A database row into the shape the Message screen already renders. */
export function toThreadMessage(row, myId) {
  return {
    id: row.id,
    sender: row.sender_id === myId ? 'me' : 'them',
    text: row.text,
    timestamp: new Date(row.created_at).getTime(),
    status: row.read_at ? 'read' : 'sent',
  }
}

/* The other person in a two-person conversation row. */
export function partnerOf(conversation, myId) {
  return conversation.user_a === myId ? conversation.b : conversation.a
}

