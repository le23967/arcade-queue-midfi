import {
  Avatar,
  Body,
  Chip,
  Screen,
  Toggle,
  Disclosure,
  TopBar,
} from '../components/ui.jsx'
import {
  Bars,
  Chevron,
  Heart,
  Play,
  Pulse,
  Shield,
  Users,
} from '../components/Icons.jsx'
import { ME } from '../social.js'
import { followCounts } from '../lib/social.js'

const WEEKLY_GOAL = 4

export default function MeTab({
  me,
  onEditProfile,
  reports,
  sessions,
  visible,
  onVisible,
  soundOn,
  onSound,
  onOpenFollows,
  following: followingHandles,
  likedCount,
  onOpenLiked,
}) {
  const { followers, following } = followCounts(followingHandles)
  const safeSessions = Math.max(0, Number(sessions) || 0)
  const safeReports = Math.max(0, Number(reports) || 0)
  const safeLikedCount = Math.max(0, Number(likedCount) || 0)
  const sessionsToGo = Math.max(0, WEEKLY_GOAL - safeSessions)
  const progress = Math.min(100, (safeSessions / WEEKLY_GOAL) * 100)

  return (
    <Screen>
      <TopBar title="Me" />

      <Body className="bg-sunken">
        <div className="space-y-3 px-4 py-4 pb-6">
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 shadow-sm">
            {/* Your handle and colour are yours, so the card that shows them is
                the control that changes them. */}
            <button
              type="button"
              onClick={onEditProfile}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-100"
            >
              <Avatar handle={me.handle} hue={me.hue} size={58} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl font-bold tracking-tight text-ink">
                    {me.handle}
                  </span>
                  <Chip tone="brand">Sydney</Chip>
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted">
                  {ME.games.join(' · ')}
                </span>
              </span>
              <span className="flex flex-none items-center gap-1 text-xs font-semibold text-brand-700">
                Edit
                <Chevron size={13} />
              </span>
            </button>

            <div className="border-t border-brand-200 bg-surface/70 px-4 py-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    Weekly goal
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {sessionsToGo === 0
                      ? 'Goal met. Keep the run going.'
                      : `${sessionsToGo} ${sessionsToGo === 1 ? 'session' : 'sessions'} to go.`}
                  </p>
                </div>
                <p className="font-display text-lg font-bold tabular-nums text-ink">
                  {safeSessions}
                  <span className="text-sm font-medium text-ink-muted">/{WEEKLY_GOAL}</span>
                </p>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100"
                role="progressbar"
                aria-label="Weekly session goal"
                aria-valuemin={0}
                aria-valuemax={WEEKLY_GOAL}
                aria-valuenow={Math.min(safeSessions, WEEKLY_GOAL)}
              >
                <span
                  className="block h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          <section aria-label="Profile shortcuts" className="grid grid-cols-3 gap-2">
            <QuickAction
              label="Followers"
              value={followers}
              Icon={Users}
              onClick={() => onOpenFollows('followers')}
            />
            <QuickAction
              label="Following"
              value={following}
              Icon={Users}
              onClick={() => onOpenFollows('following')}
            />
            <QuickAction
              label="Liked clips"
              value={safeLikedCount}
              Icon={Heart}
              onClick={onOpenLiked}
            />
          </section>

          <Disclosure
            title="Your player card"
            hint={`${ME.games.join(', ')} · shared with friends`}
            icon={<Bars size={17} />}
          >
            <p className="mb-3 text-xs leading-relaxed text-ink-muted">
              Friends can use these picks to find a game or song you both enjoy.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Preference title="Main games" Icon={Bars} items={ME.games} />
              <Preference title="On repeat" Icon={Play} items={ME.songs} />
            </div>
          </Disclosure>

          <Disclosure
            title="Community contribution"
            hint={`${safeSessions} sessions, ${safeReports} queue updates`}
            icon={<Pulse size={17} />}
          >
            <div className="grid grid-cols-2 gap-2">
              <ContributionStat
                label="Play sessions"
                value={safeSessions}
                Icon={Play}
              />
              <ContributionStat
                label="Queue updates"
                value={safeReports}
                Icon={Pulse}
              />
            </div>

            <p className="mt-3 rounded-xl bg-fresh-bg px-3 py-2 text-xs leading-relaxed text-ink-muted">
              Queue updates help other players choose a better time to visit.
            </p>
          </Disclosure>

          <Disclosure
            title="Privacy and sound"
            hint={`${visible ? 'Visible to mutuals' : 'Hidden'} · sound ${soundOn ? 'on' : 'off'}`}
            icon={<Shield size={17} />}
          >
            <Toggle
              checked={visible}
              onChange={onVisible}
              label={visible ? 'Visible to mutuals' : 'Hidden from mutuals'}
              hint={
                visible ? 'Your current arcade can be seen.' : 'Your arcade stays private.'
              }
            />

            {/* Sound is on by default, but an arcade is loud and a lecture
                theatre is not, so it has to be one tap away. */}
            <div className="mt-2">
              <Toggle
                checked={soundOn}
                onChange={onSound}
                label={soundOn ? 'Sound on' : 'Sound off'}
                hint="Short cues when you check in, when you are up, and when you like a clip."
              />
            </div>

            <div className="mt-2 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5">
              <Shield size={15} className="mt-0.5 flex-none text-ink-muted" />
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Only the arcade name is shared. Precise coordinates stay off your profile,
                and queue updates do not show your handle.
              </p>
            </div>
          </Disclosure>
        </div>
      </Body>
    </Screen>
  )
}

function QuickAction({ label, value, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 rounded-2xl border border-line bg-surface p-3 text-left shadow-sm transition-all duration-150 ease-soft hover:border-brand-200 hover:bg-brand-50 active:scale-[0.98]"
    >
      <span className="flex items-center justify-between text-ink-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sunken">
          <Icon size={15} />
        </span>
        <Chevron size={13} />
      </span>
      <span className="mt-2 block font-display text-lg font-bold tabular-nums text-ink">
        {value}
      </span>
      <span className="block truncate text-[10px] font-medium text-ink-muted">{label}</span>
    </button>
  )
}

function Preference({ title, Icon, items }) {
  return (
    <div className="min-w-0 rounded-xl bg-sunken p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
        <Icon size={14} className="text-brand-600" />
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Chip key={item} tone="quiet" className="max-w-full truncate">
            {item}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function ContributionStat({ label, value, Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-sunken p-2.5">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-surface text-brand-600 shadow-sm">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold tabular-nums leading-none text-ink">
          {value}
        </span>
        <span className="mt-1 block whitespace-nowrap text-[10px] text-ink-muted">
          {label}
        </span>
      </span>
    </div>
  )
}
