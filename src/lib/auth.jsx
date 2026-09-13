import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase.js'
import {
  ensureProfile,
  updateProfile as saveProfile,
  deleteOwnAccount,
  describeError,
} from './accounts.js'
import { createSessionResolver } from './sessionResolver.js'

/* Who is signed in.

   One place holds the session, the user and their profile, and every screen
   reads it from context rather than asking Supabase itself. `status` is the
   thing the app gate switches on:

     checking    the stored session is being restored - show nothing rash
     signed-out  no session, Supabase not configured, or restoring failed
                 (then `error` says why)
     signed-in   a user with a profile

   Restoring is one owned operation per mount. Supabase says "here is the
   session" more than once at start-up, and development mounts this twice;
   the resolver turns all of that into a single committed state, drops
   anything stale, and is thrown away on unmount. Every path out of
   `checking` is bounded: a profile load that fails or hangs ends in
   signed-out with an error the sign-in screen can show, never in a spinner.

   Two rules about the auth client's internal lock. Nothing awaits a
   Supabase call inside the auth-state callback itself - the callback only
   schedules work for the next tick - and the profile load happens outside
   that callback entirely. Both are what keeps the client from waiting on a
   lock the callback is holding. */
const AuthContext = createContext(null)

/* Long enough for a slow connection, short enough that a person is not left
   looking at nothing. It is a last resort; the resolver settles on its own. */
const BOOTSTRAP_TIMEOUT_MS = 15_000

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    status: supabaseConfigured ? 'checking' : 'signed-out',
    user: null,
    profile: null,
    error: null,
  }))
  const resolverRef = useRef(null)

  useEffect(() => {
    if (!supabase) return undefined

    const resolver = createSessionResolver({
      loadProfile: ensureProfile,
      timeoutMs: BOOTSTRAP_TIMEOUT_MS,
      commit: (next) =>
        setState({
          status: next.status,
          user: next.user,
          profile: next.profile,
          error: next.error ? describeError(next.error, 'Could not restore your session.') : null,
        }),
    })
    resolverRef.current = resolver

    /* The stored session, restored once. If this itself never settles, the
       bound below still gets the app off the checking screen. */
    let settled = false
    const initial = supabase.auth
      .getSession()
      .then(({ data, error }) => {
        settled = true
        if (error) throw error
        return resolver.apply(data.session)
      })
      .catch((error) => {
        settled = true
        resolver.apply(null)
        setState((s) =>
          s.status === 'checking'
            ? { ...s, status: 'signed-out', error: describeError(error, 'Could not restore your session.') }
            : s
        )
      })

    const bound = window.setTimeout(() => {
      if (settled) return
      resolver.cancel()
      setState((s) =>
        s.status === 'checking'
          ? {
              status: 'signed-out',
              user: null,
              profile: null,
              error: 'Restoring your session took too long. Sign in again.',
            }
          : s
      )
    }, BOOTSTRAP_TIMEOUT_MS)

    /* Later changes: sign in, sign out, token refresh, another tab. The
       callback does no Supabase work itself; it hands the session to the
       resolver on the next tick. */
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      window.setTimeout(() => {
        initial.finally(() => resolver.apply(session))
      }, 0)
    })

    return () => {
      resolver.cancel()
      if (resolverRef.current === resolver) resolverRef.current = null
      window.clearTimeout(bound)
      listener.subscription.unsubscribe()
    }
  }, [])

  const { status, user, profile, error } = state

  const value = useMemo(
    () => ({
      configured: supabaseConfigured,
      status,
      user,
      profile,
      error,

      /* Each of these returns { error } as a sentence for the screen to show,
         rather than throwing, so a form can stay mounted and say what
         happened. Passwords go straight to Supabase and are never logged. */
      async signUp({ email, password, handle }) {
        const { data, error: failure } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { handle } },
        })
        if (failure) return { error: describeError(failure) }
        /* With email confirmation on there is no session yet; the profile is
           created by the database trigger when the row lands. */
        return { error: null, needsConfirmation: !data.session }
      },

      async signIn({ email, password }) {
        const { error: failure } = await supabase.auth.signInWithPassword({ email, password })
        return { error: failure ? describeError(failure) : null }
      },

      async signOut() {
        const { error: failure } = await supabase.auth.signOut()
        /* Even if the network call fails, the local session is gone. */
        resolverRef.current?.forget()
        setState({ status: 'signed-out', user: null, profile: null, error: null })
        return { error: failure ? describeError(failure) : null }
      },

      async updateProfile(patch) {
        if (!user) return { error: 'Not signed in.' }
        try {
          const next = await saveProfile(user.id, patch)
          resolverRef.current?.setProfile(next)
          setState((s) => ({ ...s, profile: next }))
          return { error: null, profile: next }
        } catch (failure) {
          return { error: describeError(failure) }
        }
      },

      /* The server deletes the account behind the session token; once it
         has, the token is dead, so only the local copy of the session is
         cleared. The prototype is keyed by user id and unmounts with it,
         which is what takes the old profile and threads off the screen. */
      async deleteAccount() {
        if (!user) return { error: 'Not signed in.' }
        try {
          await deleteOwnAccount()
        } catch (failure) {
          return { error: describeError(failure, 'Could not delete your account.') }
        }
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
        resolverRef.current?.forget()
        setState({ status: 'signed-out', user: null, profile: null, error: null })
        return { error: null }
      },
    }),
    [status, user, profile, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
