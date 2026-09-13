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

/* --- conversations and messages ------------------------------------------ */

const CONVERSATION_COLUMNS = `
  id, user_a, user_b, created_at,
  a:profiles!conversations_user_a_fkey (${PROFILE_COLUMNS}),
  b:profiles!conversations_user_b_fkey (${PROFILE_COLUMNS})
`

/* Goes through the database function, which orders the pair, refuses
   self-conversations and refuses anyone you are not mutual with. */
export async function getOrCreateConversation(otherId) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_other: otherId,
  })
  if (error) throw error
  return data
}

/* Your conversations with the latest message on each, newest first. */
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

/* One channel per open conversation. Returns the unsubscribe function. */
export function subscribeToConversation(conversationId, { onInsert, onUpdate }) {
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
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
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
  if (/follow each other/i.test(message))
    return 'Messaging is between people who follow each other.'
  return message || fallback
}
