import { useCallback, useEffect, useState } from 'react'
import {
  fetchInbox,
  fetchMessages,
  getOrCreateConversation,
  insertMessage,
  markConversationRead,
  prepareMessage,
  subscribeToConversation,
  toThreadMessage,
  describeError,
} from './accounts.js'

/* A real private conversation with one other person.

   Opening a thread resolves the conversation through the database function
   (which refuses anyone you are not mutual with), loads its messages oldest
   first, and opens one realtime channel filtered to that conversation.
   Inserts from the other side arrive on the channel; your own send appends
   the row the insert returned, and the channel copy of it is dropped by id.
   Updates carry read_at, so "Read" appears when it actually happened.

   The channel is closed whenever the other person changes, the thread
   unmounts, or the user id goes away - which is what sign-out does to it. */
export function useConversation(myId, otherId, enabled = true) {
  const [conversationId, setConversationId] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(Boolean(myId && otherId && enabled))
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  useEffect(() => {
    if (!myId || !otherId || !enabled) return undefined
    let active = true
    let unsubscribe = null

    async function open() {
      try {
        const id = await getOrCreateConversation(otherId)
        if (!active) return
        const initial = await fetchMessages(id)
        if (!active) return
        setConversationId(id)
        setRows(initial)
        setError(null)
        setLoading(false)

        unsubscribe = subscribeToConversation(id, {
          onInsert(row) {
            setRows((list) => (list.some((m) => m.id === row.id) ? list : [...list, row]))
            /* You are looking at it, so it is read. */
            if (row.sender_id !== myId) markConversationRead(id, myId).catch(() => {})
          },
          onUpdate(row) {
            setRows((list) => list.map((m) => (m.id === row.id ? { ...m, ...row } : m)))
          },
        })

        if (initial.some((m) => m.sender_id !== myId && !m.read_at)) {
          await markConversationRead(id, myId)
          if (!active) return
          /* Reflect it locally without waiting for the update event. */
          setRows((list) =>
            list.map((m) =>
              m.sender_id !== myId && !m.read_at
                ? { ...m, read_at: new Date().toISOString() }
                : m
            )
          )
        }
      } catch (e) {
        if (!active) return
        setError(describeError(e, 'Could not open this conversation.'))
        setLoading(false)
      }
    }

    open()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [myId, otherId, enabled])

  const send = useCallback(
    async (raw) => {
      const prepared = prepareMessage(raw)
      if (!prepared.ok) {
        setSendError(prepared.problem)
        return { error: prepared.problem }
      }
      if (!conversationId || !myId) {
        const problem = 'Not connected yet. Try again in a moment.'
        setSendError(problem)
        return { error: problem }
      }
      setSending(true)
      setSendError(null)
      try {
        const row = await insertMessage(conversationId, myId, prepared.text)
        setRows((list) => (list.some((m) => m.id === row.id) ? list : [...list, row]))
        return { error: null }
      } catch (e) {
        const problem = describeError(e, 'Message not sent. Try again.')
        setSendError(problem)
        return { error: problem }
      } finally {
        setSending(false)
      }
    },
    [conversationId, myId]
  )

  const messages = rows.map((r) => toThreadMessage(r, myId))

  return { conversationId, messages, loading, error, sending, sendError, send }
}

/* Every conversation you are in, with its latest message. Fetched when the
   list is opened; a thread that just changed is on top. */
export function useInbox(myId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!myId) return undefined
    let active = true
    fetchInbox(myId)
      .then((list) => {
        if (!active) return
        setThreads(list)
        setError(null)
      })
      .catch((e) => {
        if (active) setError(describeError(e, 'Could not load your messages.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [myId])

  return { threads, loading, error }
}
