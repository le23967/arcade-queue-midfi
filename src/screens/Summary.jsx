import { Screen, TopBar, Body, PrimaryButton, Note } from '../components/ui.jsx'
import { CheckCircle } from '../components/Icons.jsx'

/* SCREEN 8 - Session summary. */
export default function Summary({ arcade, sessionMin, waitedMin, onDone }) {
  return (
    <Screen>
      <TopBar title="Session" />

      <Body>
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-6">
          <span className="text-gray-900">
            <CheckCircle size={40} />
          </span>
          <div>
            <p className="text-lg font-semibold text-gray-900">Checked out</p>
            <p className="text-sm text-gray-700">{arcade.name}</p>
          </div>
        </div>

        <dl>
          <Line label="Session time" value={`${sessionMin} min`} />
          <Line label="Time queued" value={`${waitedMin} min`} />
          <Line label="Arcade" value={arcade.short} />
        </dl>

        <div className="px-4 py-4">
          <Note>
            Checking out frees your slot immediately, which is what keeps the
            running order honest for everyone still waiting. Session times also
            feed the wait estimate at this venue.
          </Note>
        </div>
      </Body>

      <div className="border-t border-gray-300 p-4">
        <PrimaryButton onClick={onDone}>Back to Arcades</PrimaryButton>
      </div>
    </Screen>
  )
}

function Line({ label, value }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-300 px-4 py-3">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-gray-900">
        {value}
      </dd>
    </div>
  )
}
