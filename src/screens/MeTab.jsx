import {
  Avatar,
  Body,
  Chip,
  Screen,
  Toggle,
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
  reports,
  sessions,
  visible,
  onVisible,
  onOpenFollows,
  likedCount,
  onOpenLiked,
}) {
  const { followers, following } = followCounts()
  const safeSessions = Math.max(0, Number(sessions) || 0)
  const safeReports = Math.max(0, Number(reports) || 0)
  const safeLikedCount = Math.max(0, Number(likedCount) || 0)
  const sessionsToGo = Math.max(0, WEEKLY_GOAL - safeSessions)
  const progress = Math.min(100, (safeSessions / WEEKLY_GOAL) * 100)

  return (
    <Screen>
      <TopBar title="Me" subtitle="Your play, progress and privacy" />

      <Body className="bg-sunken">
        <div className="space-y-3 px-4 py-4 pb-6">
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 shadow-sm">
            <div className="flex items-center gap-3 p-4">
              <Avatar handle={ME.handle} size={58} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                    {ME.handle}
                  </h2>
                  <Chip tone="brand">Sydney</Chip>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {ME.games.join(' · ')}
                </p>
              </div>
            </div>

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

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-ink">
                  Your player card
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Friends can use these picks to find a game or song you both enjoy.
                </p>
              </div>
              <Chip tone="quiet">Shared</Chip>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Preference title="Main games" Icon={Bars} items={ME.games} />
              <Preference title="On repeat" Icon={Play} items={ME.songs} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-ink">
                  Community contribution
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">Your activity this week</p>
              </div>
              <Pulse size={19} className="text-brand-600" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
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
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Shield size={17} />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-ink">Privacy</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Choose whether mutuals can see your arcade while you are checked in.
                </p>
              </div>
            </div>

            <Toggle
              checked={visible}
              onChange={onVisible}
              label={visible ? 'Visible to mutuals' : 'Hidden from mutuals'}
              hint={
                visible ? 'Your current arcade can be seen.' : 'Your arcade stays private.'
              }
            />

            <div className="mt-2 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5">
              <Shield size={15} className="mt-0.5 flex-none text-ink-muted" />
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Only the arcade name is shared. Precise coordinates stay off your profile,
                and queue updates do not show your handle.
              </p>
            </div>
          </section>
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
