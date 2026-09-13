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

/* --- requests ------------------------------------------------------------ */

/* What a conversation is, from one side of it.

   Mutual overrides whatever the row says: two people who follow each other
   can always talk, even if one of them once sent the other a request. The
   requester is shown the same thing whether a request is unanswered or
   declined - "sent" - so declining tells the other person nothing. A
   request with no message in it is not a request yet, and is not shown.

     chat      an ordinary conversation, listed under Chats
     sent      your own request, listed under Chats as "Request sent"
     request   someone else's request to you, listed under Requests
     hidden    nothing to show */
export function classifyThread({ status, requestedBy, myId, mutual, hasMessage = true }) {
  if (mutual || status === 'accepted') return 'chat'
  if (status === 'pending' || status === 'declined') {
    if (requestedBy === myId) return hasMessage ? 'sent' : 'hidden'
    return status === 'pending' && hasMessage ? 'request' : 'hidden'
  }
  return 'hidden'
}

/* What the open thread offers at the bottom. `status` is null before the
   conversation exists, which is the case for a first message to anyone.

     chat              the composer
     request-compose   the composer, sending as a request
     request-sent      no composer; waiting on them
     request-received  Accept / Decline / Block
     blocked           no composer; you blocked them */
export function threadMode({ status, requestedBy, myId, mutual, blocked = false, sentByMe = 0 }) {
  if (blocked) return 'blocked'
  if (mutual || status === 'accepted') return 'chat'
  if (!status) return 'request-compose'
  if (requestedBy === myId) return sentByMe > 0 ? 'request-sent' : 'request-compose'
  return 'request-received'
}

/* --- QR codes ------------------------------------------------------------ */

/* What another person's phone reads off your screen: your account id and
   nothing else. The id is the one thing about an account that never changes,
   so a code printed today still resolves after a username change, and it
   carries no email, no token and nothing that reads as a secret. */
const PROFILE_CODE_PREFIX = 'arcadecircle://profile/'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function encodeProfileCode(id) {
  return `${PROFILE_CODE_PREFIX}${id}`
}

/* The id inside a scanned code, or null if the code is not one of ours. A
   bare id is accepted too, so a code pasted as text still works. */
export function decodeProfileCode(text) {
  const raw = String(text ?? '').trim()
  const body = raw.toLowerCase().startsWith(PROFILE_CODE_PREFIX)
    ? raw.slice(PROFILE_CODE_PREFIX.length)
    : raw
  const id = body.replace(/\/+$/, '').toLowerCase()
  return UUID.test(id) ? id : null
}

