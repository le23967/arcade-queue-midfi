import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchPresence,
  checkInPresence,
  checkOutPresence,
  setPresenceVisible,
  subscribeToPresenceChanges,
  describeError,
} from './accounts.js'
import { createCoalescedRefresh } from './coalesce.js'
import { GAMES } from '../data.js'

/* Who is at an arcade right now, shared through the database.

   Your own check-in and every mutual's, while they are active and have
   chosen to be seen; row level security keeps everyone else out. Shaped
   into what the map and the Now list already draw for the prototype's
   sample players: a handle, the venue they are at, which game, and how
   long they have been there.

   Changes arrive as notices rather than as the rows themselves, because a
   check-out or going hidden is exactly the kind of change realtime cannot
   deliver - the receiver is no longer allowed to see the row - so each
   notice is an instruction to look again. The graph matters too: someone
   who becomes mutual with you should appear if they are already out, so
   the list is fetched again whenever your follows change. */
export function usePresence(myId, graphKey = '') {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)
  const refreshRef = useRef(null)

  useEffect(() => {
    if (!myId) return undefined
    let active = true

    const refresh = createCoalescedRefresh(async () => {
      try {
        const list = await fetchPresence()
        if (!active) return
        setRows(list)
        setError(null)
      } catch (e) {
        if (active) setError(describeError(e, 'Could not load who is out.'))
      } finally {
        if (active) setLoading(false)
      }
    })
    refreshRef.current = refresh

    refresh()
    const unsubscribe = subscribeToPresenceChanges(myId, () => {
      if (active) refresh()
    })

    return () => {
      active = false
      if (refreshRef.current === refresh) refreshRef.current = null
      unsubscribe()
    }
  }, [myId])

  /* A changed follow graph can change who is visible; look again. */
  useEffect(() => {
    if (graphKey) refreshRef.current?.()
  }, [graphKey])

  const refresh = useCallback(async () => {
    await refreshRef.current?.()
  }, [])

  const mine = useMemo(() => rows.find((r) => r.user_id === myId) ?? null, [rows, myId])

  /* "12m" has to keep counting while the map is open. */
  const now = useClock(60_000)

  /* Mutuals who are out, in the shape the map and the Now list draw. */
  const present = useMemo(() => {
    return rows
      .filter((r) => r.user_id !== myId && r.active && r.visible && r.profile)
      .map((r) => ({
        id: r.user_id,
        handle: r.profile.handle,
        profile: r.profile,
        at: r.venue_id,
        gameId: r.game_id,
        games: [GAMES.find((g) => g.id === r.game_id)?.label ?? r.game_id],
        sinceMin: Math.max(0, Math.round((now - Date.parse(r.checked_in_at)) / 60000)),
        position: r.position,
        real: true,
        followsYou: true,
      }))
  }, [rows, myId, now])

  const checkIn = useCallback(
    async ({ venueId, gameId, position, visible }) => {
      if (!myId) return { error: 'Sign in to check in.' }
      try {
        const row = await checkInPresence(myId, { venueId, gameId, position, visible })
        setRows((list) => [...list.filter((r) => r.user_id !== myId), row])
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not share your check-in.') }
      }
    },
    [myId]
  )

  /* Marked inactive here first, so the screens that read this let go of
     the queue at once; the server follows. If it does not, the next look
     brings the row back, which is the truth of it. */
  const checkOut = useCallback(async () => {
    if (!myId) return { error: null }
    setRows((list) => list.map((r) => (r.user_id === myId ? { ...r, active: false } : r)))
    try {
      await checkOutPresence(myId)
      return { error: null }
    } catch (e) {
      return { error: describeError(e, 'Could not update your check-in.') }
    }
  }, [myId])

  const setVisible = useCallback(
    async (visible) => {
      if (!myId || !mine) return { error: null }
      try {
        await setPresenceVisible(myId, visible)
        setRows((list) => list.map((r) => (r.user_id === myId ? { ...r, visible } : r)))
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not change who can see you.') }
      }
    },
    [myId, mine]
  )

  return { present, mine, loading, error, checkIn, checkOut, setVisible, refresh }
}

/* The time, refreshed on an interval, so anything derived from it is
   recomputed without reading the clock during render. */
export function useClock(everyMs) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(timer)
  }, [everyMs])
  return now
}
