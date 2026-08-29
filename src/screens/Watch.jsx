import { Screen, TopBar, Body, Seg, Info, PrimaryButton } from '../components/ui.jsx'
import { Chevron, Bell, Users, Clock } from '../components/Icons.jsx'
import { CLIPS } from '../social.js'
import { gradeOf, formatAchievement } from '../lib/social.js'

/* Watch.

   Not a borrowed pattern. Asked what he does while queued, a player answered
   "watch videos" - "I'm guessing that's the general trend." The failure is
   that the watching happens in another app, so "scrolling phones and they're
   not paying attention" turns into a queue nobody can run.

   Moving the watching inside the app that holds your place is the point: the
   strip at the top is always your position, and the app can pull you out when
   you are up. It is also the on-ramp for people outside the community, who
   get in by watching first.

   Paging is by button, not by swipe-and-glide. Everything here lands on one
   frame. */
export default function Watch({
  clips = CLIPS,
  index,
  onIndex,
  scope,
  onScope,
  arcades,
  session,
  sessionArcade,
  called,
  onCall,
  onGo,
}) {
  const clip = clips[index]
  const venue = arcades.find((a) => a.id === clip.venue)

  if (called && session && sessionArcade) {
    return <YoureUp arcade={sessionArcade} position={session.position} onGo={onGo} />
  }

  return (
    <Screen>
      <TopBar
        title="Watch"
        right={
          <Info align="right">
            Clips from people you follow. Watching is what most players already
            do with the wait, so it happens here, where the app still knows your
            place in the queue and can pull you out when you are up.
          </Info>
        }
      />

      <div className="flex gap-2 border-b border-gray-300 px-4 py-2">
        <Seg on={scope === 'following'} onClick={() => onScope('following')}>
          Following
        </Seg>
        <Seg on={scope === 'nearby'} onClick={() => onScope('nearby')}>
          Nearby
        </Seg>
      </div>

      {session && sessionArcade && (
        <button
          type="button"
          onClick={onCall}
          className="flex w-full items-center gap-2 border-b border-gray-300 bg-gray-100 px-4 py-2 text-left"
        >
          <Bell size={14} />
          <span className="flex-1 text-xs text-gray-900">
            You&rsquo;re <span className="font-semibold tabular-nums">#{session.position}</span>{' '}
            at {sessionArcade.short} &mdash; we&rsquo;ll pull you out when
            you&rsquo;re up
          </span>
          <span className="text-xs font-semibold text-gray-900">Simulate</span>
        </button>
      )}

      <Body className="flex flex-col p-3">
        {/* No video asset: the clip is a gray block, as the cabinet and map are. */}
        <div className="relative flex min-h-[200px] flex-1 flex-col justify-end rounded-md border border-gray-300 bg-gray-200">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Clip &mdash; placeholder
          </span>

          <span className="absolute right-2 top-2 rounded-md border border-gray-400 bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-700">
            {clip.seconds}s
          </span>

          <div className="m-2 rounded-md border border-gray-300 bg-white px-3 py-2">
            <p className="text-sm font-semibold text-gray-900">@{clip.handle}</p>
            <p className="text-xs text-gray-700">
              {clip.song} &middot; {clip.chart}
            </p>
            <p className="text-xs tabular-nums text-gray-600">
              {formatAchievement(clip.achievement)} {gradeOf(clip.achievement)}
              {venue && ` · ${venue.short}`} &middot; {ago(clip.postedMin)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 px-1">
          <Metric Icon={Users} value={clip.likes} label="likes" />
          <Metric Icon={Clock} value={clip.comments} label="comments" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <PageButton
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
            flip
          >
            Prev
          </PageButton>
          <span className="flex-1 text-center text-xs tabular-nums text-gray-600">
            {index + 1} / {clips.length}
          </span>
          <PageButton
            disabled={index === clips.length - 1}
            onClick={() => onIndex(index + 1)}
          >
            Next
          </PageButton>
        </div>
      </Body>
    </Screen>
  )
}

function Metric({ Icon, value, label }) {
  return (
    <span className="flex items-center gap-1 text-xs tabular-nums text-gray-600">
      <Icon size={14} />
      {value}
      <span className="sr-only">{label}</span>
    </span>
  )
}

function PageButton({ children, disabled, onClick, flip }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold ${
        disabled
          ? 'border-gray-300 bg-gray-100 text-gray-400'
          : 'border-gray-400 bg-white text-gray-900'
      }`}
    >
      {flip && <span className="rotate-180">
        <Chevron size={14} />
      </span>}
      {children}
      {!flip && <Chevron size={14} />}
    </button>
  )
}

/* The payoff. The feed is allowed to interrupt itself, because the whole
   reason it is in this app is that the queue is the priority. */
function YoureUp({ arcade, position, onGo }) {
  return (
    <Screen>
      <TopBar title="Watch" />
      <Body className="flex flex-col items-center justify-center p-6 text-center">
        <Bell size={40} />
        <p className="mt-3 text-2xl font-semibold text-gray-900">You&rsquo;re up</p>
        <p className="mt-1 text-sm text-gray-700">
          {arcade.name} &middot; position #{position}
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Paused so you don&rsquo;t miss it.
        </p>
        <div className="mt-6 w-full">
          <PrimaryButton onClick={onGo}>Open my queue</PrimaryButton>
        </div>
      </Body>
    </Screen>
  )
}

function ago(min) {
  if (min < 60) return `${min}m ago`
  const h = Math.round(min / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}
