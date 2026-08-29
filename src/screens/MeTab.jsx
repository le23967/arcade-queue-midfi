import { Screen, TopBar, Body, Placeholder, Note, Chip, Toggle } from '../components/ui.jsx'
import { Shield } from '../components/Icons.jsx'
import { ME, FRIENDS, OLD_SITE_FAVOURITE_CAP } from '../social.js'

/* Me tab.

   The profile fields are only the ones participants volunteered: which games
   you mainly play ("just being able to see like, oh, I mainly play Maimai ...
   DDR or whatever") and favourite songs ("Favourite songs? Absolutely").

   The privacy statement is not filler. The team's own discussion landed on
   venue-level registration because precise GPS is both unreliable and
   intrusive - "GPS is not accurate" and "that will be related to the privacy
   issue" - resolved as registering a player who is merely near the venue. */
export default function MeTab({ reports, sessions, visible, onVisible }) {
  return (
    <Screen>
      <TopBar title="Me" />

      <Body>
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-4">
          <Placeholder className="h-14 w-14 flex-none" label="" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{ME.handle}</p>
            <p className="text-xs text-gray-600">
              {ME.games.join(' · ')} &middot; Sydney
            </p>
          </div>
        </div>

        <Section title="Favourite songs">
          <div className="flex flex-wrap gap-1.5">
            {ME.songs.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </Section>

        <dl>
          <Line label="Sessions this week" value={String(sessions)} />
          <Line label="Queue reports submitted" value={String(reports)} />
          <Line
            label="Following"
            value={String(FRIENDS.length)}
            hint={`No cap — the official site stops at ${OLD_SITE_FAVOURITE_CAP}`}
          />
        </dl>

        <div className="p-4">
          <Toggle
            checked={visible}
            onChange={onVisible}
            label="Visible to people who follow me"
            hint="Shows which arcade you are at while checked in. Never where you are otherwise."
          />
        </div>

        <div className="mx-4 mb-4 rounded-md border border-gray-300 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-700">
              <Shield size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Location</p>
              <Note>
                Check-ins are recorded against a venue, not a coordinate. Your
                precise position is never read or stored, your handle is never
                attached to a queue report, and presence is only shared with
                people you follow back.
              </Note>
            </div>
          </div>
        </div>
      </Body>
    </Screen>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-300 px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">{title}</p>
      {children}
    </div>
  )
}

function Line({ label, value, hint }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-300 px-4 py-3">
      <dt className="text-sm text-gray-600">
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </dt>
      <dd className="text-lg font-semibold tabular-nums text-gray-900">
        {value}
      </dd>
    </div>
  )
}
