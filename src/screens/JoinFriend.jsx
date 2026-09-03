import { Avatar, PrimaryButton, SecondaryButton } from '../components/ui.jsx'
import { CheckCircle, Users } from '../components/Icons.jsx'

/* Telling someone you are on your way.

   "Join them" used to open the arcade page, which put a Check In button in
   front of a person who was still on the other side of the city. The two
   actions were indistinguishable, so it was not clear whether anything had
   been sent, or whether being on the arcade page already meant you had joined.

   They are now two different things at two different moments. This sheet is
   the first one: it names the person and the venue before it commits, and then
   says plainly that they were told. Check In stays on the arcade page, for
   when you are standing at the cabinet. */
export default function JoinFriend({
  handle,
  arcade,
  sent,
  onConfirm,
  onUndo,
  onOpenArcade,
  onClose,
}) {
  const venue = arcade?.name ?? 'the arcade'
  const venueShort = arcade?.short ?? 'the arcade'

  return (
    <div className="anim-scrim absolute inset-0 z-20 flex items-end bg-ink/40">
      <div className="anim-sheet w-full rounded-t-2xl border-t border-line bg-surface shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        {sent ? (
          <div className="p-4">
            <div className="flex items-start gap-3 rounded-xl bg-fresh-bg p-3">
              <span className="mt-0.5 flex-none text-fresh">
                <CheckCircle size={26} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  {handle} has been notified
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  You&rsquo;re on your way to {venue}.
                </p>
              </div>
            </div>

            {/* The distinction the evaluation asked for, said out loud rather
                than left to be inferred from which screen you are on. */}
            <p className="mt-3 rounded-xl border border-line bg-sunken px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              You are <span className="font-semibold text-ink">not</span> in the
              queue yet. Check in at the cabinet when you get to {venueShort}.
            </p>

            <div className="mt-4 space-y-2">
              <PrimaryButton onClick={onOpenArcade}>
                View {venueShort}
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>Close</SecondaryButton>
              {/* Plans change on the way out of the door, so the last thing
                  said here is not final. This drops back to the unsent state
                  rather than closing, so it is clear what it undid. */}
              <button
                type="button"
                onClick={onUndo}
                className="w-full rounded-lg py-1.5 text-xs font-semibold text-ink-muted transition-colors duration-150 hover:text-ink"
              >
                Take it back &mdash; I&rsquo;m not coming
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar handle={handle} size={44} live />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-ink">
                  Join {handle} at {venueShort}?
                </h2>
                <p className="truncate text-xs text-ink-muted">{venue}</p>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              <span className="mt-0.5 flex-none text-ink-subtle">
                <Users size={15} />
              </span>
              <span>
                {handle} gets told you are coming. You check in yourself once
                you arrive, so this does not take a queue position.
              </span>
            </p>

            <div className="mt-4 space-y-2">
              <PrimaryButton onClick={onConfirm}>Notify them</PrimaryButton>
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
