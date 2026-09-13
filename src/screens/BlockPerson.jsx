import { useState } from 'react'
import { Sheet, SheetBody, PrimaryButton, SecondaryButton, Avatar } from '../components/ui.jsx'

/* Blocking someone.

   Reachable from a request and from a profile, and the same sheet either
   way, so the word means one thing. It says what a block does before it
   does it: they cannot message you or send you requests, the follow ends
   in both directions, and they are not told. Undoing it is on their
   profile, and the sheet says so, so nobody hesitates over whether this is
   forever. */
export default function BlockPerson({ handle, hue = null, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await onConfirm()
    if (result?.error) {
      setError(result.error)
      setBusy(false)
    }
  }

  return (
    <Sheet title={`Block ${handle}?`} onClose={onCancel} closeLabel="Cancel" dismissable={!busy}>
      <SheetBody>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar handle={handle} hue={hue} size={44} />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
              {handle} won’t be able to message you or send you requests, and
              you’ll stop following each other. They aren’t told.
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            You can unblock them later from their profile.
          </p>

          <div aria-live="polite">
            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-live-bg px-3 py-2.5 text-xs font-medium text-live">
                {error}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <SecondaryButton onClick={onCancel} disabled={busy} data-autofocus>
              Cancel
            </SecondaryButton>
            <PrimaryButton tone="danger" onClick={confirm} disabled={busy}>
              {busy ? 'Blocking…' : `Block ${handle}`}
            </PrimaryButton>
          </div>
        </div>
      </SheetBody>
    </Sheet>
  )
}
