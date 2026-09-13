import { supabase } from './supabase.js'
import { validateHandle, toThreadMessage, partnerOf } from './accountRules.js'

/* Real accounts: profiles, follows, conversations, messages.

   Everything in this file talks to Supabase and is scoped by row level
   security on the server. The seeded players in social.js are a different
   population - prototype data with no account behind them - and nothing here
   ever treats a seeded handle as a real user. A real profile always carries a
   uuid `id`; a seeded person never does. That is the boundary. */

export {
  HANDLE_MIN,
  HANDLE_MAX,
  HANDLE_PATTERN,
  MESSAGE_MAX,
  validateHandle,
  prepareMessage,
  relationshipFrom,
  hueFromProfile,
  toThreadMessage,
  partnerOf,
  classifyThread,
  threadMode,
  encodeProfileCode,
  decodeProfileCode,
} from './accountRules.js'

/* --- profiles ------------------------------------------------------------ */

const PROFILE_COLUMNS = 'id, handle, avatar_hue, created_at, updated_at'

export async function fetchProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

/* The database trigger creates a profile at sign-up. This is the fallback for
   a project where the trigger was not applied, or a user created before it
   was: without it a signed-in person would have no handle anywhere. */
export async function ensureProfile(user) {
  const existing = await fetchProfile(user.id)
  if (existing) return existing

  const wanted = validateHandle(user.user_metadata?.handle)
  const fallback = `player_${user.id.replace(/-/g, '').slice(0, 8)}`
  const attempt = async (handle) =>
    supabase
      .from('profiles')
      .insert({ id: user.id, handle })
      .select(PROFILE_COLUMNS)
      .single()

  let result = await attempt(wanted.ok ? wanted.handle : fallback)
  if (result.error?.code === '23505' && wanted.ok) result = await attempt(fallback)
  if (result.error) {
    /* A concurrent tab may have won the race; read what is there. */
    const again = await fetchProfile(user.id)
    if (again) return again
    throw result.error
  }
  return result.data
}

export async function updateProfile(id, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function handleAvailable(handle) {
  const { data, error } = await supabase.rpc('handle_available', { p_handle: handle })
  if (error) throw error
  return Boolean(data)
}

/* Handle search, and nothing cleverer. You are left out of your own results. */
export async function searchProfiles(query, excludeId, limit = 20) {
  const q = query.trim().replace(/[%_]/g, '')
  if (q === '') return []
  let request = supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .ilike('handle', `%${q}%`)
    .order('handle')
    .limit(limit)
  if (excludeId) request = request.neq('id', excludeId)
  const { data, error } = await request
  if (error) throw error
  return data ?? []
}

/* --- follows ------------------------------------------------------------- */

/* Every edge that touches you, split into the two directions, each carrying
   the other person's profile. */
export async function fetchFollows(myId) {
  const [outgoing, incoming] = await Promise.all([
    supabase
      .from('follows')
      .select(`following_id, profile:profiles!follows_following_id_fkey (${PROFILE_COLUMNS})`)
      .eq('follower_id', myId),
    supabase
      .from('follows')
      .select(`follower_id, profile:profiles!follows_follower_id_fkey (${PROFILE_COLUMNS})`)
      .eq('following_id', myId),
  ])
  if (outgoing.error) throw outgoing.error
  if (incoming.error) throw incoming.error
  return {
    following: (outgoing.data ?? []).map((r) => r.profile).filter(Boolean),
    followers: (incoming.data ?? []).map((r) => r.profile).filter(Boolean),
  }
}

export async function follow(myId, otherId) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: myId, following_id: otherId })
  /* Already following is not an error worth showing. */
  if (error && error.code !== '23505') throw error
}

export async function unfollow(myId, otherId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', myId)
    .eq('following_id', otherId)
  if (error) throw error
}

/* A notice arrives whenever an edge touching you is created or removed, from
   either side, in any browser. The row itself is not interesting - the
   caller refetches the graph. Returns the unsubscribe function. */
export function subscribeToFollowChanges(myId, onChange) {
  const channel = supabase
    .channel(`follow_changes:${myId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'follow_changes',
        filter: `user_id=eq.${myId}`,
      },
      (payload) => onChange?.(payload.new)
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* --- blocks -------------------------------------------------------------- */

/* The people you have blocked. Nobody can read the other direction: being
   blocked is not something the app ever tells you. */
export async function fetchBlocks(myId) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', myId)
  if (error) throw error
  return (data ?? []).map((r) => r.blocked_id)
}

/* Both go through database functions: blocking also drops the follow in
   each direction, and the table itself takes no writes from a client. */
export async function blockUser(otherId) {
  const { error } = await supabase.rpc('block_user', { p_other: otherId })
  if (error) throw error
}

export async function unblockUser(otherId) {
  const { error } = await supabase.rpc('unblock_user', { p_other: otherId })
  if (error) throw error
}

/* --- conversations and messages ------------------------------------------ */

const CONVERSATION_COLUMNS = `
  id, user_a, user_b, status, requested_by, accepted_at, created_at,
  a:profiles!conversations_user_a_fkey (${PROFILE_COLUMNS}),
  b:profiles!conversations_user_b_fkey (${PROFILE_COLUMNS})
`

/* The conversation between you and one other person if there is one, or
   null. Nothing is created by looking. */
export async function findConversation(myId, otherId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .or(`and(user_a.eq.${myId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${myId})`)
    .maybeSingle()
  if (error) throw error
  return data
}

/* Called when the first message is about to be sent. The database function
   orders the pair, refuses a conversation with yourself or with anyone
   either of you has blocked, and decides the state: accepted between people
   who follow each other, otherwise a pending request from you. Returns the
   row, existing or new. */
export async function getOrCreateConversation(otherId) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_other: otherId,
  })
  if (error) throw error
  return data
}

/* Answering someone else's request. Each returns the row as it now stands;
   the database refuses anyone who is not the person the request was sent
   to. Blocking is above, because it is about the person, not the thread. */
export async function acceptRequest(conversationId) {
  const { data, error } = await supabase.rpc('accept_request', { p_conversation: conversationId })
  if (error) throw error
  return data
}

export async function declineRequest(conversationId) {
  const { data, error } = await supabase.rpc('decline_request', { p_conversation: conversationId })
  if (error) throw error
  return data
}

/* Your conversations with the latest message on each, newest first. What
   each one is - a chat, a request to you, a request from you - is worked
   out by the caller, which also knows who you follow. */
export async function fetchInbox(myId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`${CONVERSATION_COLUMNS}, messages (id, sender_id, text, created_at, read_at)`)
    .order('created_at', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' })
  if (error) throw error
  return (data ?? [])
    .map((c) => ({
      id: c.id,
      status: c.status,
      requestedBy: c.requested_by,
      partner: partnerOf(c, myId),
      last: c.messages?.[0] ? toThreadMessage(c.messages[0], myId) : null,
    }))
    .filter((t) => t.partner)
    .sort((x, y) => (y.last?.timestamp ?? 0) - (x.last?.timestamp ?? 0))
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, text, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertMessage(conversationId, senderId, text) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select('id, conversation_id, sender_id, text, created_at, read_at')
    .single()
  if (error) throw error
  return data
}

/* Marks what the other person sent you as read. The grant on messages allows
   this column only, and the policy allows it only on rows sent to you. */
export async function markConversationRead(conversationId, myId) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', myId)
    .is('read_at', null)
  if (error) throw error
}

/* One channel per open conversation: new messages, read receipts, and the
   conversation row itself changing state - which is how the person who
   sent a request sees it accepted. Returns the unsubscribe function. */
export function subscribeToConversation(conversationId, { onInsert, onUpdate, onConversation }) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onUpdate?.(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => onConversation?.(payload.new)
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* One channel for the whole inbox: any message or conversation you are
   allowed to see, arriving or changing. Realtime applies the same row level
   security as a query, so nothing about anyone else's threads comes down
   the socket. The payload is not used - the caller refetches. Returns the
   unsubscribe function. */
export function subscribeToInboxChanges(myId, onChange) {
  const channel = supabase.channel(`inbox:${myId}`)
  for (const table of ['messages', 'conversations']) {
    for (const event of ['INSERT', 'UPDATE']) {
      channel.on('postgres_changes', { event, schema: 'public', table }, () => onChange?.())
    }
  }
  channel.subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* --- sessions ------------------------------------------------------------ */

const SESSION_COLUMNS = `
  id, host_id, venue_id, game_id, starts_at, note, open, created_at, updated_at,
  host:profiles!sessions_host_id_fkey (${PROFILE_COLUMNS}),
  members:session_members (
    user_id, status, by_host, created_at,
    profile:profiles!session_members_user_id_fkey (${PROFILE_COLUMNS})
  )
`

/* Every session you can see - yours, the ones you were asked to or said
   yes to, and every open one - from a little before now onwards. */
export async function fetchSessions() {
  const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createSession(hostId, { venueId, gameId, startsAt, note, open }) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      host_id: hostId,
      venue_id: venueId,
      game_id: gameId,
      starts_at: new Date(startsAt).toISOString(),
      note: note ?? '',
      open: Boolean(open),
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateSession(id, { venueId, gameId, startsAt, note, open }) {
  const { error } = await supabase
    .from('sessions')
    .update({
      venue_id: venueId,
      game_id: gameId,
      starts_at: new Date(startsAt).toISOString(),
      note: note ?? '',
      open: Boolean(open),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

/* The host's list of who is asked. People no longer on it are removed;
   people newly on it are added as invited; anyone already answering stays
   as they are. Returns the ids that were newly asked. */
export async function setSessionInvitees(sessionId, userIds, currentMemberIds = []) {
  const wanted = new Set(userIds)
  const current = new Set(currentMemberIds)
  const toAdd = userIds.filter((id) => !current.has(id))
  const toRemove = currentMemberIds.filter((id) => !wanted.has(id))
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('session_members')
      .delete()
      .eq('session_id', sessionId)
      .in('user_id', toRemove)
    if (error) throw error
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('session_members')
      .insert(toAdd.map((user_id) => ({ session_id: sessionId, user_id, status: 'invited', by_host: true })))
    if (error) throw error
  }
  return toAdd
}

/* Saying you are in, or taking it back. Someone the host asked keeps their
   row as invited when they withdraw; someone who joined an open session on
   their own leaves no row behind. */
export async function setGoing(sessionId, myId, going, { byHost = false } = {}) {
  if (going && byHost) {
    const { error } = await supabase
      .from('session_members')
      .update({ status: 'going' })
      .eq('session_id', sessionId)
      .eq('user_id', myId)
    if (error) throw error
    return
  }
  if (going) {
    const { error } = await supabase
      .from('session_members')
      .insert({ session_id: sessionId, user_id: myId, status: 'going', by_host: false })
    if (error) throw error
    return
  }
  if (byHost) {
    const { error } = await supabase
      .from('session_members')
      .update({ status: 'invited' })
      .eq('session_id', sessionId)
      .eq('user_id', myId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('session_members')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', myId)
    if (error) throw error
  }
}

/* Any session or membership you are allowed to see, changing. The caller
   refetches. Returns the unsubscribe function. */
export function subscribeToSessionChanges(myId, onChange) {
  const channel = supabase.channel(`sessions:${myId}`)
  for (const table of ['sessions', 'session_members']) {
    for (const event of ['INSERT', 'UPDATE', 'DELETE']) {
      channel.on('postgres_changes', { event, schema: 'public', table }, () => onChange?.())
    }
  }
  channel.subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* --- presence ------------------------------------------------------------ */

const PRESENCE_COLUMNS = `
  user_id, venue_id, game_id, position, active, visible, checked_in_at, updated_at,
  profile:profiles!presence_user_id_fkey (${PROFILE_COLUMNS})
`

/* Yours, plus every mutual who is checked in and visible. Row level
   security does the scoping; the age cut-off keeps a forgotten check-in
   from haunting the map. */
export async function fetchPresence() {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('presence')
    .select(PRESENCE_COLUMNS)
    .gte('checked_in_at', since)
  if (error) throw error
  return data ?? []
}

export async function checkInPresence(myId, { venueId, gameId, position, visible = true }) {
  const { data, error } = await supabase
    .from('presence')
    .upsert(
      {
        user_id: myId,
        venue_id: venueId,
        game_id: gameId,
        position: position ?? null,
        active: true,
        visible,
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select(PRESENCE_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function checkOutPresence(myId) {
  const { error } = await supabase
    .from('presence')
    .update({ active: false })
    .eq('user_id', myId)
  if (error) throw error
}

export async function setPresenceVisible(myId, visible) {
  const { error } = await supabase
    .from('presence')
    .update({ visible })
    .eq('user_id', myId)
  if (error) throw error
}

/* A notice arrives whenever a mutual's presence changes - or your own, from
   another tab. The caller refetches. Returns the unsubscribe function. */
export function subscribeToPresenceChanges(myId, onChange) {
  const channel = supabase
    .channel(`presence_changes:${myId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'presence_changes', filter: `user_id=eq.${myId}` },
      () => onChange?.()
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* --- account ------------------------------------------------------------- */

/* Deletion happens on the server. The function reads who is calling from
   the session token it is sent and deletes that account and nothing else;
   the browser never holds anything that could delete an account directly. */
export async function deleteOwnAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
  if (error) {
    /* The function's own message is more useful than the transport's. */
    const detail = await describeFunctionError(error)
    throw new Error(detail)
  }
  if (data && data.ok === false) throw new Error(data.error || 'Could not delete your account.')
  return data
}

async function describeFunctionError(error) {
  const response = error?.context
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json()
      if (body?.error) return String(body.error)
    } catch {
      /* Not JSON; fall through to the generic message. */
    }
  }
  if (/failed to send a request|failed to fetch|networkerror/i.test(String(error?.message))) {
    return 'The delete-account function is not reachable. It may not be deployed yet.'
  }
  return String(error?.message || 'Could not delete your account.')
}

/* --- errors -------------------------------------------------------------- */

/* Supabase errors are objects with a message and sometimes a code. This turns
   the ones a person can act on into a sentence, and the rest into something
   short enough to show. */
export function describeError(error, fallback = 'Something went wrong. Try again.') {
  if (!error) return fallback
  const message = String(error.message ?? error)
  if (error.code === '23505' || /duplicate key|already (exists|registered)/i.test(message))
    return 'That username is already taken.'
  if (/invalid login credentials/i.test(message))
    return 'Wrong email or password.'
  if (/email not confirmed/i.test(message))
    return 'Confirm your email first - check your inbox for the link.'
  if (/password should be at least|password.*(short|weak)/i.test(message))
    return message
  if (/rate limit/i.test(message))
    return 'Too many attempts. Wait a moment and try again.'
  if (/failed to fetch|networkerror|network request failed/i.test(message))
    return 'No connection. Check your network and try again.'
  if (/cannot message this person/i.test(message))
    return 'You can\u2019t message this person.'
  if (/request already sent/i.test(message))
    return 'Your request is sent. You can send more once they accept.'
  if (/too many requests today/i.test(message))
    return 'You have sent a lot of requests today. Try again tomorrow.'
  if (/not a request you can answer/i.test(message))
    return 'This request has already been answered.'
  if (/no such person/i.test(message))
    return 'That account no longer exists.'
  if (/follow each other/i.test(message))
    return 'Messaging is between people who follow each other.'
  if (/(relation|function|column) .* does not exist|schema cache/i.test(message))
    return 'The database is behind the app. Apply the latest migration in supabase/migrations.'
  return message || fallback
}
