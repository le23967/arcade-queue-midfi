import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchFollows,
  fetchBlocks,
  follow as followRow,
  unfollow as unfollowRow,
  blockUser,
  unblockUser,
  subscribeToFollowChanges,
  relationshipFrom,
  describeError,
} from './accounts.js'
import { createCoalescedRefresh } from './coalesce.js'

/* The signed-in person's real follow graph, both directions.

   Loaded when the user id is known, and refetched whenever an edge touching
   them changes - their own taps, and the other person's, from any browser.
   The first version only refetched after your own writes, so B following A
   left A showing "Following" until a reload; now a notice from the database
   trigger arrives over one realtime channel per signed-in user and the graph
   is fetched again. Mutual is worked out here from the two lists, the same
   way the database function does it.

   One channel, opened when the user id appears and closed when it changes,
   when they sign out, or on unmount. Bursts of notices collapse into one
   refetch at a time. With no user id everything is empty and writes refuse.

   Who you have blocked rides along with the graph: blocking someone also
   removes the follow in both directions, so the two are read together and
   every write to either refetches both. */
export function useFollows(myId) {
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [blocked, setBlocked] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)
  const refreshRef = useRef(null)

  useEffect(() => {
    if (!myId) return undefined
    let active = true

    const refresh = createCoalescedRefresh(async () => {
      try {
        const [next, blocks] = await Promise.all([fetchFollows(myId), fetchBlocks(myId)])
        if (!active) return
        setFollowing(next.following)
        setFollowers(next.followers)
        setBlocked(blocks)
        setError(null)
      } catch (e) {
        if (active) setError(describeError(e, 'Could not load who you follow.'))
      } finally {
        if (active) setLoading(false)
      }
    })
    refreshRef.current = refresh

    refresh()
    const unsubscribe = subscribeToFollowChanges(myId, () => {
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

  const followingIds = useMemo(() => new Set(following.map((p) => p.id)), [following])
  const followerIds = useMemo(() => new Set(followers.map((p) => p.id)), [followers])
  const blockedIds = useMemo(() => new Set(blocked), [blocked])

  const relationship = useCallback(
    (otherId) =>
      relationshipFrom({
        youFollow: followingIds.has(otherId),
        followsYou: followerIds.has(otherId),
      }),
    [followingIds, followerIds]
  )

  const follow = useCallback(
    async (otherId) => {
      if (!myId) return { error: 'Sign in to follow people.' }
      try {
        await followRow(myId, otherId)
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not follow. Try again.') }
      }
    },
    [myId, refresh]
  )

  const unfollow = useCallback(
    async (otherId) => {
      if (!myId) return { error: 'Sign in to follow people.' }
      try {
        await unfollowRow(myId, otherId)
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not unfollow. Try again.') }
      }
    },
    [myId, refresh]
  )

  const toggle = useCallback(
    (otherId) => (followingIds.has(otherId) ? unfollow(otherId) : follow(otherId)),
    [followingIds, follow, unfollow]
  )

  const isBlocked = useCallback((otherId) => blockedIds.has(otherId), [blockedIds])

  const block = useCallback(
    async (otherId) => {
      if (!myId) return { error: 'Sign in to block people.' }
      try {
        await blockUser(otherId)
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not block. Try again.') }
      }
    },
    [myId, refresh]
  )

  const unblock = useCallback(
    async (otherId) => {
      if (!myId) return { error: 'Sign in to block people.' }
      try {
        await unblockUser(otherId)
        await refresh()
        return { error: null }
      } catch (e) {
        return { error: describeError(e, 'Could not unblock. Try again.') }
      }
    },
    [myId, refresh]
  )

  return {
    following,
    followers,
    blocked,
    loading,
    error,
    relationship,
    isBlocked,
    follow,
    unfollow,
    toggle,
    block,
    unblock,
    refresh,
  }
}
