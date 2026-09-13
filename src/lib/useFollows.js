import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchFollows,
  follow as followRow,
  unfollow as unfollowRow,
  relationshipFrom,
  describeError,
} from './accounts.js'

/* The signed-in person's real follow graph, both directions.

   Loaded once per user and refreshed after every change you make. Mutual is
   worked out here from the two lists, the same way the database function
   does it, so a Follow tap on a profile that already follows you flips the
   label to Mutual as soon as the row is in. With no user id (signed out, or
   Supabase not configured) everything is empty and the writes refuse. */
export function useFollows(myId) {
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(Boolean(myId))
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!myId) return
    try {
      const next = await fetchFollows(myId)
      setFollowing(next.following)
      setFollowers(next.followers)
      setError(null)
    } catch (e) {
      setError(describeError(e, 'Could not load who you follow.'))
    } finally {
      setLoading(false)
    }
  }, [myId])

  useEffect(() => {
    if (!myId) return undefined
    let active = true
    fetchFollows(myId)
      .then((next) => {
        if (!active) return
        setFollowing(next.following)
        setFollowers(next.followers)
        setError(null)
      })
      .catch((e) => {
        if (active) setError(describeError(e, 'Could not load who you follow.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [myId])

  const followingIds = useMemo(() => new Set(following.map((p) => p.id)), [following])
  const followerIds = useMemo(() => new Set(followers.map((p) => p.id)), [followers])

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

  return { following, followers, loading, error, relationship, follow, unfollow, toggle, refresh }
}
