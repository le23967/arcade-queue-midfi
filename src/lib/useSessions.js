import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchSessions,
  createSession,
  updateSession,
  deleteSession,
  setSessionInvitees,
  setGoing,
  subscribeToSessionChanges,
  describeError,
} from './accounts.js'
import { createCoalescedRefresh } from './coalesce.js'
import { formatWhen } from './time.js'
import { useClock } from './usePresence.js'

/* The sessions you can see, shared through the database.

   Yours, the ones you were asked to or said yes to, and every open one -
   row level security decides which rows come back, so this only has to
   fetch and shape them. Shaped into what the Later tab already draws for
   the prototype's sample sessions: host handle, venue and game ids, a
   label for when, who is going, who was asked, and whether it is yours or
   you were asked to it. The real profiles ride along so a change to the
   session can message the people on it.

   One realtime channel per signed-in person reports any session or
   membership they are allowed to see, arriving or changing; bursts collapse
   into one refetch at a time. An invitee therefore sees a new session the
   moment their membership lands, a changed time the moment the host saves
   it, and a called-off session leaving. */
export function useSessions(myId) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)
  const refreshRef = useRef(null)

  useEffect(() => {
    if (!myId) return undefined
    let active = true

    const refresh = createCoalescedRefresh(async () => {
      try {
        const list = await fetchSessions()
        if (!active) return
        setRows(list)
        setError(null)
      } catch (e) {
        if (active) setError(describeError(e, 'Could not load sessions.'))
      } finally {
        if (active) setLoading(false)
      }
    })
    refreshRef.current = refresh

    refresh()
    const unsubscribe = subscribeToSessionChanges(myId, () => {
      if (active) refresh()
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

  /* "Tonight" becomes "Today" at midnight without a reload. */
  const clock = useClock(60_000)

  const sessions = useMemo(() => {
    const now = new Date(clock)
    return rows
      .filter((r) => r.host)
      .map((r) => {
        const members = (r.members ?? []).filter((m) => m.profile)
        const mine = r.host_id === myId
        const me = members.find((m) => m.user_id === myId) ?? null
        const going = members.filter((m) => m.status === 'going')
        const when = new Date(r.starts_at)
        return {
          id: r.id,
          mine,
          host: r.host.handle,
          hostId: r.host_id,
          hostProfile: r.host,
          venue: r.venue_id,
          gameId: r.game_id,
          when,
          whenLabel: formatWhen(when, now),
          note: r.note ?? '',
          open: Boolean(r.open),
          /* Handles, for the rows the Later tab already draws. */
          going: going.map((m) => m.profile.handle),
          asked: members.map((m) => m.profile.handle),
          askedProfiles: members.map((m) => m.profile),
          invitedMe: Boolean(me) && !mine,
          goingMe: me?.status === 'going',
          /* Whether the host asked you, which decides what withdrawing
             leaves behind. */
          askedByHost: Boolean(me?.by_host),
        }
      })
  }, [rows, myId, clock])

  /* The ids you have said yes to, in the shape the Later tab checks. */
  const rsvps = useMemo(() => sessions.filter((s) => s.goingMe).map((s) => s.id), [sessions])

  /* Creates or updates, then reconciles who is asked. Returns the id and
     the ids of people newly asked, or an error. */
  const save = useCallback(
    async (plan, inviteeIds, editingId = null) => {
      if (!myId) return { error: 'Sign in to plan a session.' }
      try {
        let id = editingId
        if (id) await updateSession(id, plan)
        else id = await createSession(myId, plan)
        const current = editingId
          ? (rows.find((r) => r.id === editingId)?.members ?? []).map((m) => m.user_id)
          : []
        const added = await setSessionInvitees(id, inviteeIds, current)
        await refresh()
        return { error: null, id, added }
      } catch (e) {
        return { error: describeError(e, 'Could not save the session.') }
      }
    },
    [myId, rows, refresh]
  )

  const cancel = useCallback(
    async (id) => {
      try {
        await deleteSession(id)
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not call the session off.') }
      }
    },
    [refresh]
  )

  const rsvp = useCallback(
    async (id, going) => {
      if (!myId) return { error: 'Sign in to join a session.' }
      const session = sessions.find((s) => s.id === id)
      try {
        await setGoing(id, myId, going, { byHost: Boolean(session?.askedByHost) })
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'That did not go through. Try again.') }
      }
    },
    [myId, sessions, refresh]
  )

  return { sessions, rsvps, loading, error, save, cancel, rsvp, refresh }
}
