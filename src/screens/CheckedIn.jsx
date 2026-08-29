import {
  Screen,
  TopBar,
  Body,
  PrimaryButton,
  Toggle,
  Info,
} from '../components/ui.jsx'
import { CheckCircle } from '../components/Icons.jsx'

/* SCREEN 6 - Checked In.

   The sketch has the tick, the venue name and a Check Out button. The running
   order in the middle is the addition that does the real work.

   Two findings converge on it. First, nobody can tell whose turn it is:
   "people, like, just come up and they're like, who's next?" ... "they weren't
   sure" ... "it's very messy, especially when it gets busy." Second, players
   do not stand and watch - they are "scrolling phones and they're not paying
   attention", or they walk off to another cabinet entirely: "if they're about
   to have a queue, they'll go and play Mame ... while they wait."

   An explicit position plus a one-turn warning answers both: the order is
   readable without asking anyone, and you can leave the machine and still get
   back in time. */
export default function CheckedIn({
  arcade,
  position,
  total,
  queueAhead,
  aheadMin,
  notify,
  onNotify,
  onBack,
  onCheckOut,
}) {
  return (
    <Screen>
      <TopBar title="Checked In" onBack={onBack} />

      <Body>
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-5">
          <span className="text-gray-900">
            <CheckCircle size={40} />
          </span>
          <div>
            <p className="text-lg font-semibold text-gray-900">Checked In!</p>
            <p className="text-sm text-gray-700">{arcade.name}</p>
          </div>
        </div>

        <div className="border-b border-gray-300 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">
            Your position
          </p>
          <p className="text-3xl font-semibold tabular-nums text-gray-900">
            #{position}{' '}
            <span className="text-base font-normal text-gray-600">
              of {total}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Roughly {aheadMin} min out, across {arcade.cabinets}{' '}
            {arcade.cabinets === 1 ? 'machine' : 'machines'}.
          </p>
        </div>

        <div className="border-b border-gray-300">
          <p className="flex items-center gap-1.5 px-4 pt-3 text-xs uppercase tracking-wide text-gray-600">
            Running order
            <Info>
              Updates as people check in and out, so nobody has to ask who is
              next.
            </Info>
          </p>
          {/* State comes from the venue's cabinet count, not from a fixed
              label: at a two-machine venue only the first two are playing,
              whatever your position happens to be. */}
          <ol>
            {queueAhead.map((p, i) => {
              const n = position - queueAhead.length + i
              return <Row key={p.handle} n={n} name={p.handle} state={stateAt(n, arcade.cabinets)} />
            })}
            <Row n={position} name="You" state={stateAt(position, arcade.cabinets)} you />
            {total > position && (
              <Row
                n={position + 1}
                name="mkr_"
                state={stateAt(position + 1, arcade.cabinets)}
              />
            )}
          </ol>
        </div>

        <div className="p-4">
          <Toggle
            checked={notify}
            onChange={onNotify}
            label="Notify me when I'm one turn away"
            hint="Go play something else — you'll get pulled back in time."
          />
        </div>
      </Body>

      <div className="border-t border-gray-300 p-4">
        <PrimaryButton onClick={onCheckOut}>Check Out</PrimaryButton>
      </div>
    </Screen>
  )
}

function stateAt(n, cabinets) {
  if (n <= cabinets) return 'Playing now'
  if (n === cabinets + 1) return 'Next'
  return 'Waiting'
}

function Row({ n, name, state, you }) {
  return (
    <li
      className={`flex items-center gap-3 border-t border-gray-300 px-4 py-2 ${
        you ? 'bg-gray-100' : ''
      }`}
    >
      <span className="w-5 text-xs tabular-nums text-gray-600">{n}</span>
      <span
        className={`flex-1 text-sm ${
          you ? 'font-semibold text-gray-900' : 'text-gray-900'
        }`}
      >
        {name}
      </span>
      <span className="text-xs text-gray-600">{state}</span>
    </li>
  )
}
