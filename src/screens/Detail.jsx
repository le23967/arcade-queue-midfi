import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  StaleBadge,
  Info,
} from '../components/ui.jsx'
import { Users, User, Clock, Refresh, Chevron, Pin } from '../components/Icons.jsx'
import { presentAt } from '../lib/social.js'
import {
  queueRoster,
  rosterKnownCount,
  estimateWaitMin,
  isStale,
  freshnessLabel,
  pairsOf,
  SOLO_TURN_MIN,
  PAIR_TURN_MIN,
} from '../lib/queue.js'

/* SCREEN 3 - Detail.

   Sketch stats kept as-is (Queue / Solo / Wait / Updated). The "Updated" row
   is promoted from a footnote to a first-class stat with its own confirm
   action, because staleness is the failure mode the current workaround has:
   asking the group chat takes "thirty or forty five minutes" to answer, if it
   answers at all. */
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
}) {
  const stale = isStale(arcade)
  const friendsHere = presentAt(arcade.id)

  return (
    <Screen>
      <TopBar
        title={`${arcade.short} · ${arcade.game}`}
        subtitle="See the line, then take a place in it"
        onBack={onBack}
        right={stale ? <StaleBadge /> : null}
      />

      <Body>
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
            <span className="block text-xs tabular-nums text-ink-muted">
              {arcade.distanceKm.toFixed(1)} km &middot; {arcade.cabinets}{' '}
              {arcade.cabinets === 1 ? 'cabinet' : 'cabinets'}
            </span>
          </span>
          <Chevron size={16} />
        </button>

        <dl>
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
          <Stat Icon={User} label="Solo" value={String(arcade.solo)}>
            Single players, queued on their own
          </Stat>
          <Stat
            Icon={Clock}
            label="Wait"
            value={`~${estimateWaitMin(arcade)} min`}
            info={
              <>
                {arcade.solo} solo &times; {SOLO_TURN_MIN} min + {pairsOf(arcade)}{' '}
                pair{pairsOf(arcade) === 1 ? '' : 's'} &times; {PAIR_TURN_MIN} min,
                divided by {arcade.cabinets}{' '}
                {arcade.cabinets === 1 ? 'machine' : 'machines'}. A pair holds the
                machine longer because pairing buys an extra song.
              </>
            }
          >
            Across {arcade.cabinets} {arcade.cabinets === 1 ? 'machine' : 'machines'}
          </Stat>
          <Stat
            Icon={Refresh}
            label="Updated"
            value={arcade.updatedAt}
            emphasis={stale}
          >
            {freshnessLabel(arcade)}
          </Stat>
        </dl>

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
                People you follow
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
                      Q {g.queue}
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
        <span className="flex-1">
          <span className="block text-xs uppercase tracking-wide text-ink-muted">
            Queue
          </span>
          <span className="block text-lg font-semibold tabular-nums text-ink">
            {arcade.queue} waiting
          </span>
          <span className="block text-xs text-ink-muted">
            {pairsOf(arcade)} pair{pairsOf(arcade) === 1 ? '' : 's'} &middot;{' '}
            {arcade.solo} solo
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
                <span className="tabular-nums">{arcade.queue}</span> checked in
                through the app.
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

function Stat({ Icon, label, value, children, emphasis, info }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-4 py-3">
      <span className="mt-0.5 text-ink-muted">
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-muted">
          {label}
          {info && <Info>{info}</Info>}
        </dt>
        <dd
          className={`text-lg font-semibold tabular-nums text-ink ${
            emphasis ? 'underline decoration-dashed underline-offset-4' : ''
          }`}
        >
          {value}
        </dd>
        <p className="text-xs text-ink-muted">{children}</p>
      </div>
    </div>
  )
}
