import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  SecondaryButton,
  StaleBadge,
  Note,
} from '../components/ui.jsx'
import { Users, User, Clock, Refresh } from '../components/Icons.jsx'
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
export default function Detail({ arcade, onBack, onCheckIn, onReport }) {
  const stale = isStale(arcade)

  return (
    <Screen>
      <TopBar
        title={arcade.short}
        onBack={onBack}
        right={stale ? <StaleBadge /> : null}
      />

      <Body>
        <div className="border-b border-gray-300 px-4 py-3">
          <p className="text-sm text-gray-900">{arcade.name}</p>
          <p className="text-xs text-gray-600">
            {arcade.suburb} &middot; {arcade.distanceKm.toFixed(1)} km &middot;{' '}
            {arcade.game}
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
          <Stat Icon={Clock} label="Wait" value={`~${estimateWaitMin(arcade)} min`}>
            Across {arcade.cabinets} {arcade.cabinets === 1 ? 'machine' : 'machines'}
          </Stat>
          <Stat
            Icon={Refresh}
            label="Updated"
            value={arcade.updatedAt}
            emphasis={stale}
          >
            {freshnessLabel(arcade)}
            {stale && ' — worth confirming before you travel'}
          </Stat>
        </dl>

        <div className="space-y-2 px-4 py-4">
          <Note>
            <span className="font-semibold text-gray-900">How this is worked out.</span>{' '}
            {arcade.solo} solo &times; {SOLO_TURN_MIN} min + {pairsOf(arcade)} pair
            {pairsOf(arcade) === 1 ? '' : 's'} &times; {PAIR_TURN_MIN} min, divided
            by {arcade.cabinets}{' '}
            {arcade.cabinets === 1 ? 'machine' : 'machines'}.
          </Note>
        </div>
      </Body>

      <div className="space-y-2 border-t border-gray-300 p-4">
        <PrimaryButton onClick={onCheckIn}>Check In</PrimaryButton>
        <SecondaryButton onClick={onReport}>Report queue</SecondaryButton>
      </div>
    </Screen>
  )
}

function Stat({ Icon, label, value, children, emphasis }) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-300 px-4 py-3">
      <span className="mt-0.5 text-gray-700">
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <dt className="text-xs uppercase tracking-wide text-gray-600">{label}</dt>
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
