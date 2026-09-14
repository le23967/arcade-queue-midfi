import { useCallback, useEffect, useRef, useState } from 'react'
import {
  acceptRequest,
  declineRequest,
  fetchInbox,
  fetchMessages,
  findConversation,
  getOrCreateConversation,
  insertMessage,
  markConversationRead,
  prepareMessage,
  subscribeToConversation,
  subscribeToInboxChanges,
  threadMode,
  toThreadMessage,
  describeError,
} from './accounts.js'
import { createCoalescedRefresh } from './coalesce.js'

/* A real private conversation with one other person.

   Opening a thread looks for the conversation and, if there is one, loads
   its messages oldest first and opens one realtime channel filtered to it.
   Nothing is created by opening: the row is made by the first send, through
   the database function that decides whether it starts as a conversation
   (you follow each other) or as a request (you do not). That keeps the
   other person's inbox free of empty threads from people who opened a
   profile and thought better of it.

   Inserts from the other side arrive on the channel; your own send appends
   the row the insert returned, and the channel copy of it is dropped by id.
   Updates carry read_at, so "Read" appears when it actually happened. The
   conversation row itself is on the channel too, which is how a request
   you sent turns into an open conversation the moment it is accepted.

   What the bottom of the screen offers - composer, "request sent", the
   three answers to a request, or nothing - is `mode`, from the rules in
   accountRules.js. A request is only marked read once it is a
   conversation, so the person who sent one learns nothing from a receipt.

   One mount per conversation: the screen that uses this is keyed by the
   other person's id, so a different person is a fresh hook with fresh
   state rather than a reset. The channel is closed when the thread
   unmounts or the user id goes away - which is what sign-out does to it. */
export function useConversation(myId, otherId, { mutual = false, blocked = false } = {}) {
  const [conversation, setConversation] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(Boolean(myId && otherId))
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [answering, setAnswering] = useState(false)
  const [answerError, setAnswerError] = useState(null)
  /* The server would not open a conversation with this person at all. It
     says the same thing whichever of the two blocked the other, and so
     does the screen. */
  const [refused, setRefused] = useState(false)
  /* The channel follows the conversation id, which can appear after mount. */
  const channelRef = useRef(null)
  const markedRef = useRef(null)

  const sentByMe = rows.filter((r) => r.sender_id === myId).length
  const mode = refused
    ? 'closed'
    : threadMode({
        status: conversation?.status ?? null,
        requestedBy: conversation?.requested_by ?? null,
        myId,
        mutual,
        blocked,
        sentByMe,
      })

  const listen = useCallback(
    (id) => {
      channelRef.current?.()
      channelRef.current = subscribeToConversation(id, {
        onInsert(row) {
          setRows((list) => (list.some((m) => m.id === row.id) ? list : [...list, row]))
        },
        onUpdate(row) {
          setRows((list) => list.map((m) => (m.id === row.id ? { ...m, ...row } : m)))
        },
        onConversation(row) {
          setConversation((c) => (c ? { ...c, ...row } : row))
        },
      })
    },
    []
  )

  useEffect(() => {
    if (!myId || !otherId) return undefined
    let active = true

    async function open() {
      try {
        const existing = await findConversation(myId, otherId)
        if (!active) return
        if (existing) {
          const initial = await fetchMessages(existing.id)
          if (!active) return
          setConversation(existing)
          setRows(initial)
          listen(existing.id)
        }
        setLoading(false)
      } catch (e) {
        if (!active) return
        setError(describeError(e, 'Could not open this conversation.'))
        setLoading(false)
      }
    }

    open()

    return () => {
      active = false
      channelRef.current?.()
      channelRef.current = null
    }
  }, [myId, otherId, listen])

  /* You are looking at it, so it is read - but only once it is a
     conversation rather than a request waiting on you. */
  useEffect(() => {
    if (!conversation || !myId || mode !== 'chat') return
    const unread = rows.filter((m) => m.sender_id !== myId && !m.read_at)
    if (unread.length === 0) return
    const key = unread.map((m) => m.id).join(',')
    if (markedRef.current === key) return
    markedRef.current = key
    markConversationRead(conversation.id, myId).catch(() => {})
    const at = new Date().toISOString()
    setRows((list) =>
      list.map((m) => (m.sender_id !== myId && !m.read_at ? { ...m, read_at: at } : m))
    )
  }, [conversation, rows, myId, mode])

  const send = useCallback(
    async (raw) => {
      const prepared = prepareMessage(raw)
      if (!prepared.ok) {
        setSendError(prepared.problem)
        return { error: prepared.problem }
      }
      if (!myId || !otherId) {
        const problem = 'Not connected yet. Try again in a moment.'
        setSendError(problem)
        return { error: problem }
      }
      setSending(true)
      setSendError(null)
      try {
        let target = conversation
        if (!target) {
          target = await getOrCreateConversation(otherId)
          setConversation(target)
          listen(target.id)
        }
        const row = await insertMessage(target.id, myId, prepared.text)
        setRows((list) => (list.some((m) => m.id === row.id) ? list : [...list, row]))
        return { error: null }
      } catch (e) {
        const problem = describeError(e, 'Message not sent. Try again.')
        if (/cannot message this person/i.test(String(e?.message ?? ''))) setRefused(true)
        setSendError(problem)
        return { error: problem }
      } finally {
        setSending(false)
      }
    },
    [conversation, myId, otherId, listen]
  )

  /* Accept and decline both come back with the row as the server now has
     it. Blocking is not here: it is about the person and lives with the
     follow graph. */
  const answer = useCallback(
    async (action) => {
      if (!conversation) return { error: 'Nothing to answer.' }
      setAnswering(true)
      setAnswerError(null)
      try {
        const next =
          action === 'accept'
            ? await acceptRequest(conversation.id)
            : await declineRequest(conversation.id)
        setConversation((c) => ({ ...c, ...next }))
        return { error: null }
      } catch (e) {
        const problem = describeError(e, 'That did not go through. Try again.')
        setAnswerError(problem)
        return { error: problem }
      } finally {
        setAnswering(false)
      }
    },
    [conversation]
  )

  const accept = useCallback(() => answer('accept'), [answer])
  const decline = useCallback(() => answer('decline'), [answer])

  const messages = rows.map((r) => toThreadMessage(r, myId))

  return {
    conversation,
    mode,
    messages,
    loading,
    error,
    sending,
    sendError,
    send,
    answering,
    answerError,
    accept,
    decline,
  }
}

/* Every conversation you are in, with its latest message.

   Held for the whole signed-in session rather than only while the list is
   open, so the way into it can say whether anything is waiting. One
   realtime channel per signed-in person reports any message or
   conversation they are allowed to see; bursts of changes collapse into
   one refetch at a time, and the list is fetched again whenever asked. */
export function useInbox(myId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)
  /* The last message someone else sent you while this was mounted, so the
     shell can say so wherever you are. Cleared by whoever shows it. */
  const [incoming, setIncoming] = useState(null)
  const refreshRef = useRef(null)

  useEffect(() => {
    if (!myId) return undefined
    let active = true

    const refresh = createCoalescedRefresh(async () => {
      try {
        const list = await fetchInbox(myId)
        if (!active) return
        setThreads(list)
        setError(null)
      } catch (e) {
        if (active) setError(describeError(e, 'Could not load your messages.'))
      } finally {
        if (active) setLoading(false)
      }
    })
    refreshRef.current = refresh

    refresh()
    const unsubscribe = subscribeToInboxChanges(myId, (change) => {
      if (!active) return
      if (change?.table === 'messages' && change.event === 'INSERT' && change.row?.sender_id !== myId) {
        setIncoming({
          id: change.row.id,
          conversationId: change.row.conversation_id,
          senderId: change.row.sender_id,
          text: change.row.text,
          at: Date.parse(change.row.created_at),
        })
      }
      refresh()
    })

    return () => {
      active = false
      if (refreshRef.current === refresh) refreshRef.current = null
      unsubscribe()
    }
  }, [myId])

  const refresh = useCallback(async () => {
    await refreshRef.current?.()
  }, [])

  const clearIncoming = useCallback(() => setIncoming(null), [])

  return { threads, loading, error, refresh, incoming, clearIncoming }
}
