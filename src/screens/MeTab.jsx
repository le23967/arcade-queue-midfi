import { Screen, TopBar, Body, Placeholder, Note } from '../components/ui.jsx'
import { Shield } from '../components/Icons.jsx'

/* Me tab.

   Kept deliberately thin. The privacy line is not filler: the team's own
   discussion landed on venue-level registration precisely because precise
   GPS is both unreliable and intrusive - "GPS is not accurate, sometimes it's
   not accurate" and "that will be related to the privacy issue", resolved as
   registering you "even if you're just near it and not in it ... a 20-metre
   radius". (Wednesday interview) */
export default function MeTab({ reports, sessions }) {
  return (
    <Screen>
      <TopBar title="Me" />

      <Body>
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-4">
          <Placeholder className="h-14 w-14 flex-none" label="" />
          <div>
            <p className="text-sm font-semibold text-gray-900">kntt</p>
            <p className="text-xs text-gray-600">maimai DX &middot; Sydney</p>
          </div>
        </div>

        <dl>
          <Line label="Sessions this week" value={String(sessions)} />
          <Line label="Queue reports submitted" value={String(reports)} />
          <Line label="Median wait reported" value="14 min" />
        </dl>

        <div className="m-4 rounded-md border border-gray-300 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-700">
              <Shield size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Location</p>
              <Note>
                Check-ins are recorded against a venue, not a coordinate. Your
                precise position is never read or stored, and your handle is
                never attached to a queue report.
              </Note>
            </div>
          </div>
        </div>
      </Body>
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
