import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase.js'
import { ensureProfile, updateProfile as saveProfile, describeError } from './accounts.js'

/* Who is signed in.

   One place holds the session, the user and their profile, and every screen
   reads it from context rather than asking Supabase itself. `status` is the
   thing the app gate switches on:

     checking    the stored session is being restored - show nothing rash
     signed-out  no session, or Supabase is not configured at all
     signed-in   a user with a profile

   A session without a profile is treated as still checking until the profile
   is created or read, so a screen never renders a handle-less user. */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (supabaseConfigured ? 'checking' : 'signed-out'))
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  /* Supabase can report the same session more than once at start-up; the
     profile is only fetched once per user id. */
  const loadedFor = useRef(null)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    async function apply(session) {
      const next = session?.user ?? null
      if (!next) {
        loadedFor.current = null
        if (!active) return
        setUser(null)
        setProfile(null)
        setStatus('signed-out')
        return
      }
      if (loadedFor.current === next.id) {
        if (active) setUser(next)
        return
      }
      loadedFor.current = next.id
      try {
        const loaded = await ensureProfile(next)
        if (!active) return
        setUser(next)
        setProfile(loaded)
        setStatus('signed-in')
      } catch {
        /* Without a profile the person cannot be shown; treat as signed out
           rather than leaving the app on the checking screen forever. */
        loadedFor.current = null
        if (!active) return
        setUser(null)
        setProfile(null)
        setStatus('signed-out')
      }
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))

    /* Deferred with a timeout: doing Supabase calls synchronously inside this
       callback can deadlock the auth client. */
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => apply(session), 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      configured: supabaseConfigured,
      status,
      user,
      profile,

      /* Each of these returns { error } as a sentence for the screen to show,
         rather than throwing, so a form can stay mounted and say what
         happened. Passwords go straight to Supabase and are never logged. */
      async signUp({ email, password, handle }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { handle } },
        })
        if (error) return { error: describeError(error) }
        /* With email confirmation on there is no session yet; the profile is
           created by the database trigger when the row lands. */
        return { error: null, needsConfirmation: !data.session }
      },

      async signIn({ email, password }) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? describeError(error) : null }
      },

      async signOut() {
        const { error } = await supabase.auth.signOut()
        /* Even if the network call fails, the local session is gone. */
        loadedFor.current = null
        setUser(null)
        setProfile(null)
        setStatus('signed-out')
        return { error: error ? describeError(error) : null }
      },

      async updateProfile(patch) {
        if (!user) return { error: 'Not signed in.' }
        try {
          const next = await saveProfile(user.id, patch)
          setProfile(next)
          return { error: null, profile: next }
        } catch (error) {
          return { error: describeError(error) }
        }
      },
    }),
    [status, user, profile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
