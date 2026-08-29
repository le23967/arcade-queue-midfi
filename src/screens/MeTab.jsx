import { Screen, TopBar, Body, Placeholder, Chip, Toggle, Info } from '../components/ui.jsx'
import { Shield, Chevron } from '../components/Icons.jsx'
import { ME, FRIENDS, OLD_SITE_FAVOURITE_CAP } from '../social.js'
import { followCounts } from '../lib/social.js'

/* Me tab. Profile fields are only the ones participants volunteered: which
   games you mainly play, and your songs. Explanation sits behind "?" rather
   than on the screen. */
export default function MeTab({
  reports,
  sessions,
  visible,
  onVisible,
  onOpenFollows,
  likedCount,
  onOpenLiked,
  helps,
  onHelps,
}) {
  const { followers, following } = followCounts()

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

        <div className="grid grid-cols-2 border-b border-gray-300">
          <Count
            label="Followers"
            value={followers}
            onClick={() => onOpenFollows('followers')}
          />
          <Count
            label="Following"
            value={following}
            border
            onClick={() => onOpenFollows('following')}
          />
        </div>

        <Row label="Favourite songs">
          <div className="flex flex-wrap gap-1.5">
            {ME.songs.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </Row>

        <Nav label="Liked clips" value={likedCount} onClick={onOpenLiked} />

        <Line label="Sessions this week" value={sessions} />
        <Line label="Queue reports" value={reports} />
        <Line
          label="Compared against"
          value={FRIENDS.length}
          info={
            <>
              Everyone you follow, with no cap. The official score site stops at{' '}
              {OLD_SITE_FAVOURITE_CAP} favourites.
            </>
          }
        />

        <div className="space-y-2 p-4">
          <Toggle
            checked={helps}
            onChange={onHelps}
            label="Happy to help beginners"
            hint="Shows next to your name in a queue, so nobody has to guess whether it is fine to ask."
          />
          <Toggle
            checked={visible}
            onChange={onVisible}
            label="Share my arcade with mutuals"
            hint="Only while checked in."
          />
        </div>

        <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-3">
          <Shield size={16} />
          <span className="flex-1 text-sm font-medium text-gray-900">Location</span>
          <Info above>
            Check-ins are recorded against a venue, not a coordinate. Your
            precise position is never read or stored, your handle is never
            attached to a queue report, and presence is only shared with people
            you follow back.
          </Info>
        </div>
      </Body>
    </Screen>
  )
}

function Count({ label, value, onClick, border }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-4 py-3 text-left ${
        border ? 'border-l border-gray-300' : ''
      }`}
    >
      <span className="flex-1">
        <span className="block text-xl font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <span className="block text-xs text-gray-600">{label}</span>
      </span>
      <Chevron size={16} />
    </button>
  )
}

function Row({ label, children }) {
  return (
    <div className="border-b border-gray-300 px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">{label}</p>
      {children}
    </div>
  )
}

function Nav({ label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-gray-300 px-4 py-3 text-left"
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <Chevron size={16} />
      </span>
    </button>
  )
}

function Line({ label, value, info }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
      <span className="flex items-center gap-1.5 text-sm text-gray-600">
        {label}
        {info && <Info>{info}</Info>}
      </span>
      <span className="text-lg font-semibold tabular-nums text-gray-900">
        {value}
      </span>
    </div>
  )
}
