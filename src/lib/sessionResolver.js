/* Turning auth sessions into one settled state.

   Supabase reports the session more than once at start-up - `getSession()`
   resolves, then the listener fires INITIAL_SESSION with the same session -
   and React in development mounts the provider twice. The first version of
   this logic remembered "profile already loaded for this user" in a ref
   that outlived the effect run which set it. The run that set it had been
   cancelled and threw its result away; the run that replaced it saw the
   memo and never loaded anything; the app sat on "Checking session…" until
   site data was cleared. That is the failure this module exists to make
   impossible.

   The rules:

   - every call to `apply` is a generation; only the newest generation may
     commit, so stale async work cannot overwrite newer auth state
   - a profile load in flight for a user is shared, so two notifications of
     the same session do not start competing loads
   - "already signed in as this user" is only true once a profile has been
     COMMITTED, never merely started
   - `cancel()` stops every later commit from this resolver, so an unmounted
     provider cannot set state
   - a failed load commits signed-out with the error, never stays pending
   - an optional bound on the load turns a hang into that same error

   Nothing here touches Supabase; `loadProfile` is injected, which is what
   makes it testable under plain Node. */
export function createSessionResolver({ loadProfile, commit, timeoutMs = 0 }) {
  let cancelled = false
  let latest = 0
  /* The last committed signed-in identity, or null. */
  let current = null
  const inflight = new Map()

  function load(user) {
    let promise = inflight.get(user.id)
    if (!promise) {
      const work = Promise.resolve().then(() => loadProfile(user))
      promise = timeoutMs > 0 ? withTimeout(work, timeoutMs) : work
      promise = promise.finally(() => {
        if (inflight.get(user.id) === promise) inflight.delete(user.id)
      })
      inflight.set(user.id, promise)
    }
    return promise
  }

  async function apply(session) {
    const run = ++latest
    const user = session?.user ?? null

    if (!user) {
      current = null
      if (!cancelled) commit({ status: 'signed-out', user: null, profile: null, error: null })
      return
    }

    if (current && current.userId === user.id) {
      /* Same person, fresher user object (a token refresh, say). */
      if (!cancelled) commit({ status: 'signed-in', user, profile: current.profile, error: null })
      return
    }

    try {
      const profile = await load(user)
      if (cancelled || run !== latest) return
      current = { userId: user.id, profile }
      commit({ status: 'signed-in', user, profile, error: null })
    } catch (error) {
      if (cancelled || run !== latest) return
      current = null
      commit({ status: 'signed-out', user: null, profile: null, error })
    }
  }

  return {
    apply,
    cancel() {
      cancelled = true
    },
    /* Edits to the profile made after sign-in have to be reflected here, or
       the next duplicate session notification would commit the old one. */
    setProfile(profile) {
      if (current) current = { ...current, profile }
    },
    forget() {
      current = null
    },
  }
}

export class BootstrapTimeoutError extends Error {
  constructor(ms) {
    super(`Restoring your session took longer than ${Math.round(ms / 1000)} seconds.`)
    this.name = 'BootstrapTimeoutError'
  }
}

function withTimeout(promise, ms) {
  let timer
  const bound = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new BootstrapTimeoutError(ms)), ms)
  })
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer))
}
