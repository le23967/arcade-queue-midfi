import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  SecondaryButton,
  StaleBadge,
  Info,
} from '../components/ui.jsx'
import { Users, User, Clock, Refresh, Chevron } from '../components/Icons.jsx'
import { presentAt } from '../lib/social.js'
import {
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
export default function Detail({ arcade, otherGames, onBack, onCheckIn, onReport, onFriends, onPickGame }) {
  const stale = isStale(arcade)
  const friendsHere = presentAt(arcade.id)

  return (
    <Screen>
      <TopBar
        title={`${arcade.short} · ${arcade.game}`}
        onBack={onBack}
        right={stale ? <StaleBadge /> : null}
      />

      <Body>
        <div className="border-b border-gray-300 px-4 py-3">
          <p className="text-sm text-gray-900">{arcade.name}</p>
          <p className="text-xs text-gray-600">
            {arcade.suburb} &middot; {arcade.distanceKm.toFixed(1)} km &middot;{' '}
            {arcade.cabinets} {arcade.cabinets === 1 ? 'cabinet' : 'cabinets'}
          </p>
        </div>

        <dl>
          <Stat Icon={Users} label="Queue" value={`${arcade.queue} waiting`}>
            {pairsOf(arcade)} pair{pairsOf(arcade) === 1 ? '' : 's'} &middot;{' '}
            {arcade.solo} solo
          </Stat>
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
            className="flex w-full items-center gap-3 border-b border-gray-300 px-4 py-3 text-left"
          >
            <span className="text-gray-700">
              <Users size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-xs uppercase tracking-wide text-gray-600">
                People you follow
              </span>
              <span className="block text-sm font-semibold text-gray-900">
                {friendsHere.map((p) => p.handle).join(', ')} here now
              </span>
            </span>
            <Chevron size={16} />
          </button>
        )}

        {otherGames.length > 0 && (
          <div className="border-b border-gray-300">
            <p className="px-4 pt-3 text-xs uppercase tracking-wide text-gray-600">
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
                    <span className="flex-1 text-sm text-gray-900">{g.game}</span>
                    <span className="text-xs tabular-nums text-gray-600">
                      Q {g.queue}
                    </span>
                    <span className="w-16 text-right text-sm tabular-nums text-gray-900">
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

      <div className="space-y-2 border-t border-gray-300 p-4">
        <PrimaryButton onClick={onCheckIn}>Check In</PrimaryButton>
        <SecondaryButton onClick={onReport}>Report queue</SecondaryButton>
      </div>
    </Screen>
  )
}

function Stat({ Icon, label, value, children, emphasis, info }) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-300 px-4 py-3">
      <span className="mt-0.5 text-gray-700">
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-600">
          {label}
          {info && <Info>{info}</Info>}
        </dt>
        <dd
          className={`text-lg font-semibold tabular-nums text-gray-900 ${
            emphasis ? 'underline decoration-dashed underline-offset-4' : ''
          }`}
        >
          {value}
        </dd>
        <p className="text-xs text-gray-600">{children}</p>
      </div>
    </div>
  )
}
