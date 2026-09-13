import { useState } from 'react'
import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  SecondaryButton,
  Avatar,
} from '../components/ui.jsx'
import { validateHandle, handleAvailable, describeError } from '../lib/accounts.js'

/* Sign in, or create an account.

   One screen with two modes rather than two screens, because the only
   difference is one field and one verb. Everything the person needs to know
   about the app has already been said on the welcome screen; this one asks
   for the least it can - a username, an email, a password - and reports
   what the server said, in the interface, when something goes wrong.

   Sign-up has to cope with a project that confirms email addresses: the
   account exists but there is no session yet, so instead of dropping into an
   app with nobody signed in it says to check the inbox and switches to Sign
   in for when they come back. */
const INPUT =
  'w-full rounded-xl border px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-subtle'

export default function Auth({
  initialMode = 'signin',
  configured,
  onSignIn,
  onSignUp,
  onBack,
  onGuest,
}) {
  const [mode, setMode] = useState(initialMode)
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const signup = mode === 'signup'
  const handleCheck = validateHandle(handle)
  const handleProblem = signup && handle !== '' && !handleCheck.ok ? handleCheck.problem : null
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const ready =
    configured &&
    !busy &&
    emailOk &&
    password.length > 0 &&
    (!signup || handleCheck.ok)

  function switchMode(next) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function submit(event) {
    event?.preventDefault()
    if (!ready) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (signup) {
        /* Checked up front so a taken handle is a sentence under the field
           rather than a placeholder username after the fact. */
        const free = await handleAvailable(handleCheck.handle)
        if (!free) {
          setError(`${handleCheck.handle} is already taken.`)
          return
        }
        const result = await onSignUp({
          email: email.trim(),
          password,
          handle: handleCheck.handle,
        })
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.needsConfirmation) {
          setNotice('Check your email to confirm your account, then sign in here.')
          setMode('signin')
          setPassword('')
        }
        /* With confirmation off, the auth listener signs the person in and
           the gate above this screen swaps it out. */
      } else {
        const result = await onSignIn({ email: email.trim(), password })
        if (result.error) setError(result.error)
      }
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <TopBar
        title={signup ? 'Create account' : 'Sign in'}
        subtitle={
          signup
            ? 'A username people can find, and a way back in'
            : 'Your follows and messages are yours to keep'
        }
        onBack={onBack}
      />

      <Body className="bg-sunken">
        <form onSubmit={submit} noValidate>
          {signup && (
            <div className="flex flex-col items-center gap-2 border-b border-line bg-surface px-4 py-5">
              <Avatar handle={handleCheck.handle || '?'} size={64} />
              <p className="font-display text-base font-semibold text-ink">
                {handleCheck.handle || 'Your username'}
              </p>
            </div>
          )}

          <div className="space-y-4 border-b border-line bg-surface px-4 py-4">
            {signup && (
              <Field
                id="auth-handle"
                label="Username"
                hint={handleProblem ?? 'Letters, numbers and underscores. This is what people search for.'}
                problem={Boolean(handleProblem)}
              >
                <input
                  id="auth-handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  maxLength={16}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={busy}
                  className={`${INPUT} ${
                    handleProblem ? 'border-live focus:border-live' : 'border-line-strong focus:border-brand-500'
                  }`}
                />
              </Field>
            )}

            <Field id="auth-email" label="Email">
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                disabled={busy}
                className={`${INPUT} border-line-strong focus:border-brand-500`}
              />
            </Field>

            <Field
              id="auth-password"
              label="Password"
              hint={signup ? 'At least 6 characters.' : null}
            >
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={signup ? 'new-password' : 'current-password'}
                disabled={busy}
                className={`${INPUT} border-line-strong focus:border-brand-500`}
              />
            </Field>
          </div>

          {!configured && (
            <p className="mx-4 mt-4 rounded-xl border border-stale bg-stale-bg px-3 py-2.5 text-xs leading-relaxed text-ink">
              Accounts are not set up on this build. Add{' '}
              <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> to a local
              env file to turn them on.
            </p>
          )}

          {error && (
            <p role="alert" className="mx-4 mt-4 rounded-xl bg-live-bg px-3 py-2.5 text-xs font-medium text-live">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mx-4 mt-4 rounded-xl bg-fresh-bg px-3 py-2.5 text-xs font-medium text-fresh">
              {notice}
            </p>
          )}

          {/* A real submit button so Enter in the last field sends the form. */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </Body>

      <div className="space-y-2 border-t border-line p-4">
        <PrimaryButton disabled={!ready} onClick={submit}>
          {busy
            ? signup
              ? 'Creating account…'
              : 'Signing in…'
            : signup
              ? 'Create account'
              : 'Sign in'}
        </PrimaryButton>
        <SecondaryButton onClick={() => switchMode(signup ? 'signin' : 'signup')}>
          {signup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </SecondaryButton>
        {!configured && onGuest && (
          <button
            type="button"
            onClick={onGuest}
            className="w-full rounded-md py-1.5 text-xs font-medium text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            Look around without an account
          </button>
        )}
      </div>
    </Screen>
  )
}

function Field({ id, label, hint, problem, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className={`mt-1.5 text-xs ${problem ? 'font-medium text-live' : 'text-ink-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}
