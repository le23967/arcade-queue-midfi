import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  FreshBadge,
  StaleBadge,
  Info,
} from '../components/ui.jsx'
import { Users, Clock, Chevron, Pin } from '../components/Icons.jsx'
import { presentAt } from '../lib/social.js'
import {
  queueRoster,
  rosterKnownCount,
  estimateWaitMin,
  isStale,
  freshnessLabel,
  pairsOf,
  peopleOf,
  partiesLabel,
  playersLabel,
  SOLO_TURN_MIN,
  PAIR_TURN_MIN,
  STALE_AFTER_MIN,
} from '../lib/queue.js'

/* SCREEN 3 - Detail.

   The sketch listed Queue, Solo, Wait and Updated as four stats of the same
   size, and a heuristic evaluation found the obvious problem with that:
   "there are a lot of queue numbers; which one should I actually use?".

   Only one of them answers the question this screen exists for, so the wait
   is the only number set at display size and it comes first. The queue
   breakdown sits under it, because a player who knows how a maimai line works
   still wants the pairs and the solo count. Solo lost its own row: the
   breakdown already says it, and the same number twice is what made the
   screen look like it held more measures than it does.

   Freshness moved with the wait. A queue number is worth nothing without its
   age - the whole reason the group chat fails is that its answer arrives
   "thirty or forty five minutes" later - so the report age carries a Fresh or
   Stale badge and sits against the number it qualifies, rather than a row
   below as a timestamp of its own. */
export default function Detail({
  arcade,
  otherGames,
  onBack,
  onCheckIn,
  onReport,
  onFriends,
  onPickGame,
  onDirections,
  queueOpen,
  onToggleQueue,
  mePosition,
  following,
}) {
  const stale = isStale(arcade)
  const friendsHere = presentAt(arcade.id, following)

  return (
    <Screen>
      {/* The badge used to sit up here as well. One state, stated once, next
          to the number it applies to. */}
      <TopBar title={`${arcade.short} · ${arcade.game}`} onBack={onBack} />

      <Body>
        <WaitStat arcade={arcade} stale={stale} />

        {/* Tapping the address hands off to the phone's own maps app. We say
            which arcade to go to; routing, transit and traffic are not ours to
            rebuild. */}
        <button
          type="button"
          onClick={onDirections}
          className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left"
        >
          <span className="text-ink-muted">
            <Pin size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm text-ink">{arcade.name}</span>
            <span className="block text-xs text-ink-muted">
              {arcade.address}
            </span>
            {/* The cabinet count was here too. It belongs with the wait it
                divides, and saying it twice made it look like a measure of
                its own. */}
            <span className="block text-xs tabular-nums text-ink-muted">
              {arcade.distanceKm.toFixed(1)} km away
            </span>
          </span>
          <Chevron size={16} />
        </button>

        {/* The count on its own says how long the line is but not who is in
            it. Expanding names the parties that checked in through the app
            and leaves the rest as guests, which is the honest split. */}
        <QueueStat
          arcade={arcade}
          open={queueOpen}
          onToggle={onToggleQueue}
          mePosition={mePosition}
          onReport={onReport}
        />

        {friendsHere.length > 0 && (
          <button
            type="button"
            onClick={onFriends}
            className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left"
          >
            <span className="text-ink-muted">
              <Users size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-xs uppercase tracking-wide text-ink-muted">
                People you follow at {arcade.short}
              </span>
              <span className="block text-sm font-semibold text-ink">
                {friendsHere.map((p) => p.handle).join(', ')} here now
              </span>
            </span>
            <Chevron size={16} />
          </button>
        )}

        {otherGames.length > 0 && (
          <div className="border-b border-line">
            <p className="px-4 pt-3 text-xs uppercase tracking-wide text-ink-muted">
              Also at this venue
            </p>
            <ul className="px-4 pb-3">
              {otherGames.map((g) => (
                <li key={g.gameId}>
                  <button
                    type="button"
                    onClick={() => onPickGame(g.gameId)}
                    className="flex w-full items-center gap-2 py-1.5 text-left"
                  >
                    <span className="flex-1 text-sm text-ink">{g.game}</span>
                    <span className="text-xs tabular-nums text-ink-muted">
                      {partiesLabel(g.queue)}
                    </span>
                    <span className="w-16 text-right text-sm tabular-nums text-ink">
                      ~{estimateWaitMin(g)} min
                    </span>
                    {isStale(g) && <StaleBadge />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      </Body>

      {/* One primary action. Correcting the count is an occasional, secondary
          job, so it lives inside the queue list where the wrong number is
          actually visible, and inside check-in where you are looking at the
          line anyway. */}
      <div className="border-t border-line p-4">
        <PrimaryButton onClick={onCheckIn}>Check In</PrimaryButton>
      </div>
    </Screen>
  )
}

/* The decision value.

   Everything else on this screen either explains this number or acts on it,
   so nothing else is set at this size. The badge answers the second half of
   the question - how old the number is allowed to get before it stops being
   worth anything - using the same 15 minute threshold the ranking already
   applies, so a stale venue reads the same here as it does on Arcades. */
function WaitStat({ arcade, stale }) {
  const pairs = pairsOf(arcade)
  const machines = `${arcade.cabinets} ${arcade.cabinets === 1 ? 'machine' : 'machines'}`

  return (
    <div className="flex items-start gap-3 border-b border-line px-4 py-4">
      <span className="mt-1 text-ink-muted">
        <Clock size={18} />
      </span>
      <div className="flex-1">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-muted">
          Estimated wait
          <Info>
            {arcade.solo} solo &times; {SOLO_TURN_MIN} min + {pairs} pair
            {pairs === 1 ? '' : 's'} &times; {PAIR_TURN_MIN} min, divided by{' '}
            {machines}. A pair holds one queue position like a solo player, but
            holds the machine longer, because pairing buys an extra song.
            Reports older than {STALE_AFTER_MIN} min are marked stale: still
            here, but not ranked as fastest.
          </Info>
        </p>
        <p className="font-display text-3xl font-bold leading-tight tabular-nums text-ink">
          About {estimateWaitMin(arcade)} min
        </p>
        <p className="text-xs text-ink-muted">Across {machines}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {stale ? <StaleBadge /> : <FreshBadge />}
          <span className="text-xs tabular-nums text-ink-muted">
            {freshnessLabel(arcade)} &middot; {arcade.updatedAt}
          </span>
        </div>
        {stale && (
          <p className="mt-1 text-xs text-stale">
            Left out of Fastest now until someone updates it.
          </p>
        )}
      </div>
    </div>
  )
}

function QueueStat({ arcade, open, onToggle, mePosition, onReport }) {
  const rows = queueRoster(arcade, { mePosition })
  const known = rosterKnownCount(arcade, mePosition)

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="mt-0.5 text-ink-muted">
          <Users size={18} />
        </span>
        {/* Secondary by design: the same three facts as before, one step down
            in size, so they support the wait instead of competing with it. */}
        <span className="flex-1">
          <span className="block text-xs uppercase tracking-wide text-ink-muted">
            Queue
          </span>
          <span className="block text-sm font-semibold tabular-nums text-ink">
            {partiesLabel(arcade.queue)} waiting
          </span>
          <span className="block text-xs text-ink-muted">
            {pairsOf(arcade)} pair{pairsOf(arcade) === 1 ? '' : 's'} &middot;{' '}
            {arcade.solo} solo &middot; {playersLabel(peopleOf(arcade))} in total
          </span>
        </span>
        <span className={`mt-1 text-ink-muted ${open ? '-rotate-90' : 'rotate-90'}`}>
          <Chevron size={18} />
        </span>
      </button>

      {open && (
        <>
          <ol className="border-t border-line">
            {rows.map((r) => (
              <li
                key={r.position}
                className={`flex items-start gap-3 border-b border-line px-4 py-2 last:border-b-0 ${
                  r.you ? 'bg-sunken' : ''
                }`}
              >
                <span className="w-4 pt-0.5 text-xs tabular-nums text-ink-muted">
                  {r.position}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm ${
                      r.app || r.you
                        ? 'font-semibold text-ink'
                        : 'text-ink-muted'
                    }`}
                  >
                    {r.you
                      ? 'You'
                      : r.app
                        ? `${r.handle}${r.plus ? ` +${r.plus}` : ''}`
                        : `+${(r.plus ?? 0) + 1} guest${r.plus ? 's' : ''}`}
                  </span>
                </span>

                <span className="pt-0.5 text-xs text-ink-muted">{r.state}</span>
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-2 px-4 py-2">
            <p className="flex flex-1 items-start gap-1.5 text-xs text-ink-muted">
              <span>
                <span className="tabular-nums">{known}</span> of{' '}
                <span className="tabular-nums">{arcade.queue}</span> parties
                checked in through the app.
              </span>
              <Info>
                The queue count comes from reports, so it includes people who
                are not running this app. They are held as guests rather than
                guessed at. A venue where nobody checks in is also a venue whose
                number goes stale.
              </Info>
            </p>
            <button
              type="button"
              onClick={onReport}
              className="flex-none rounded-md border border-line-strong px-2 py-1 text-xs font-medium text-ink"
            >
              Update count
            </button>
          </div>
        </>
      )}
    </div>
  )
}
