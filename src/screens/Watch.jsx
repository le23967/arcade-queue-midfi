import { useEffect, useState } from 'react'
import { Screen, TopBar, Body, Avatar, PrimaryButton } from '../components/ui.jsx'
import { Chevron, Bell, Heart, Comment } from '../components/Icons.jsx'
import { CLIPS } from '../social.js'
import { gradeOf, formatAchievement } from '../lib/social.js'

const NEARBY_LIMIT_KM = 1

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
  liked,
  likeCount,
  onLike,
  commentCount,
  onComments,
}) {
  const scopedIndexes = getClipIndexes(scope, clips, arcades)
  const nearbyIndexes = getClipIndexes('nearby', clips, arcades)
  const clip = clips[index]
  const venue = arcades.find((arcade) => arcade.id === clip?.venue)
  const page = scopedIndexes.indexOf(index)

  useEffect(() => {
    const nextIndexes = getClipIndexes(scope, clips, arcades)
    if (nextIndexes.length > 0 && !nextIndexes.includes(index)) {
      onIndex(nextIndexes[0])
    }
  }, [arcades, clips, index, onIndex, scope])

  if (called && session && sessionArcade) {
    return <YoureUp arcade={sessionArcade} position={session.position} onGo={onGo} />
  }

  function selectScope(nextScope) {
    const nextIndexes = getClipIndexes(nextScope, clips, arcades)
    onScope(nextScope)
    if (nextIndexes.length > 0 && !nextIndexes.includes(index)) {
      onIndex(nextIndexes[0])
    }
  }

  if (!clip || scopedIndexes.length === 0) {
    return (
      <Screen>
        <TopBar title="Watch" />
        <ScopeSwitch
          scope={scope}
          followingCount={clips.length}
          nearbyCount={nearbyIndexes.length}
          onChange={selectScope}
        />
        <Body className="flex items-center justify-center p-6 text-center">
          <div>
            <p className="font-display text-lg font-semibold text-ink">No clips here yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Try Following for the latest plays from your circle.
            </p>
          </div>
        </Body>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        title="Watch"
        subtitle={
          scope === 'nearby'
            ? `Clips recorded within ${NEARBY_LIMIT_KM} km`
            : 'New rhythm clips from people you follow'
        }
      />

      <ScopeSwitch
        scope={scope}
        followingCount={clips.length}
        nearbyCount={nearbyIndexes.length}
        onChange={selectScope}
      />

      {session && sessionArcade && (
        <button
          type="button"
          onClick={onCall}
          className="flex w-full items-center gap-2 border-b border-brand-200 bg-brand-50 px-4 py-2 text-left transition-colors duration-150 hover:bg-brand-100"
        >
          <span className="relative flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-white">
            <span className="anim-ring absolute h-2 w-2 rounded-full bg-brand-400" />
            <Bell size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-ink">
              Queue #{session.position} at {sessionArcade.short}
            </span>
            <span className="block text-[10px] text-ink-muted">Tap to preview your turn alert</span>
          </span>
          <span className="flex-none text-xs font-semibold text-brand-700">Preview</span>
        </button>
      )}

      <Body className="flex min-h-0 flex-col p-3 [overflow:hidden]">
        <ClipStage
          key={clip.id}
          clip={clip}
          venue={venue}
          liked={liked}
          likeCount={likeCount}
          onLike={onLike}
          commentCount={commentCount}
          onComments={onComments}
        />

        <div className="mt-2 flex flex-none items-center gap-2">
          <PageButton
            disabled={page <= 0}
            onClick={() => onIndex(scopedIndexes[page - 1])}
            flip
          >
            Prev
          </PageButton>
          <span className="min-w-0 flex-1 text-center">
            <span className="block text-xs font-semibold tabular-nums text-ink">
              {page + 1} / {scopedIndexes.length}
            </span>
            <span className="block truncate text-[10px] text-ink-muted">
              {scope === 'nearby' ? 'Nearest arcade clips' : 'Latest from your circle'}
            </span>
          </span>
          <PageButton
            disabled={page < 0 || page === scopedIndexes.length - 1}
            onClick={() => onIndex(scopedIndexes[page + 1])}
          >
            Next
          </PageButton>
        </div>
      </Body>
    </Screen>
  )
}

function ScopeSwitch({ scope, followingCount, nearbyCount, onChange }) {
  return (
    <div className="border-b border-line px-3 py-2">
      <div className="grid grid-cols-2 rounded-xl border border-line bg-sunken p-1">
        <ScopeButton
          active={scope === 'following'}
          label="Following"
          detail={`${followingCount} clips`}
          onClick={() => onChange('following')}
        />
        <ScopeButton
          active={scope === 'nearby'}
          label="Nearby"
          detail={`${nearbyCount} within ${NEARBY_LIMIT_KM} km`}
          onClick={() => onChange('nearby')}
        />
      </div>
    </div>
  )
}

function ScopeButton({ active, label, detail, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-left transition-all duration-150 ease-soft active:scale-[0.98] ${
        active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
          : 'text-ink-muted hover:bg-surface hover:text-ink'
      }`}
    >
      <span className="block text-xs font-semibold">{label}</span>
      <span className={`block text-[10px] ${active ? 'text-brand-100' : 'text-ink-subtle'}`}>
        {detail}
      </span>
    </button>
  )
}

function ClipStage({
  clip,
  venue,
  liked,
  likeCount,
  onLike,
  commentCount,
  onComments,
}) {
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!playing) return undefined

    const timer = window.setInterval(() => {
      setElapsed((time) => {
        const next = time + 0.1
        return next >= clip.seconds ? 0 : next
      })
    }, 100)

    return () => window.clearInterval(timer)
  }, [clip.seconds, playing])

  const progress = Math.min(100, (elapsed / clip.seconds) * 100)

  return (
    <div className="relative flex min-h-[226px] flex-1 overflow-hidden rounded-[22px] bg-[#100d28] text-white shadow-[0_18px_38px_rgba(30,27,75,0.28)]">
      <button
        type="button"
        aria-label={playing ? 'Pause clip' : 'Play clip'}
        aria-pressed={playing}
        onClick={() => setPlaying((value) => !value)}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-offset-[-4px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 16% 14%, rgba(99, 102, 241, 0.72), transparent 34%), radial-gradient(circle at 88% 45%, rgba(225, 29, 72, 0.44), transparent 32%), linear-gradient(155deg, #21175b 0%, #100d28 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-[22%] h-44 w-[130%] rotate-[-8deg] rounded-[50%] border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-[30%] h-36 w-[125%] rotate-[-8deg] rounded-[50%] border border-white/10"
      />

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5">
        <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur">
          Rhythm clip
        </span>
        <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[10px] font-semibold tabular-nums text-white/80 backdrop-blur">
          {clip.seconds}s
        </span>
      </div>

      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
        <StageAction
          onClick={onLike}
          active={liked}
          label={liked ? 'Unlike clip' : 'Like clip'}
        >
          <Heart size={15} filled={liked} />
          <span className="tabular-nums">{likeCount}</span>
        </StageAction>
        <StageAction onClick={onComments} label="Open comments">
          <Comment size={15} />
          <span className="tabular-nums">{commentCount}</span>
        </StageAction>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[42%] flex h-20 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 opacity-75"
      >
        {Array.from({ length: 13 }, (_, bar) => (
          <span
            key={bar}
            className="w-1 rounded-full bg-white/70 transition-[height] duration-100"
            style={{ height: `${beatHeight(bar, elapsed, playing)}%` }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full border border-brand-400/70 ${playing ? 'anim-ring' : ''}`}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-xl backdrop-blur-md">
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </span>
        <span className="mt-1 block text-[10px] font-semibold text-white/75">
          {playing ? 'Tap to pause' : 'Tap to play'}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Avatar handle={clip.handle} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">@{clip.handle}</p>
            <p className="truncate text-[10px] text-white/65">
              {venue ? `${venue.short} · ` : ''}{ago(clip.postedMin)}
            </p>
          </div>
          <div className="flex-none rounded-xl border border-white/15 bg-white/10 px-2 py-1 text-right">
            <p className="text-xs font-bold tabular-nums text-white">
              {formatAchievement(clip.achievement)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-200">
              {gradeOf(clip.achievement)}
            </p>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-white">
            {clip.song} <span className="text-white/55">· {clip.chart}</span>
          </p>
          <span className="text-[9px] tabular-nums text-white/60">
            {formatTime(elapsed)} / {formatTime(clip.seconds)}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-[#fb7185] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StageAction({ children, onClick, active, label, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      {...rest}
      className={`flex h-8 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold shadow-lg backdrop-blur-md transition-all duration-150 ease-soft active:scale-95 ${
        active
          ? 'border-rose-300/40 bg-rose-500 text-white'
          : 'border-white/15 bg-black/30 text-white hover:bg-black/50'
      }`}
    >
      {children}
    </button>
  )
}

function PageButton({ children, disabled, onClick, flip }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-[76px] items-center justify-center gap-1 rounded-xl border px-3 text-xs font-semibold transition-all duration-150 ease-soft ${
        disabled
          ? 'border-line bg-sunken text-ink-subtle'
          : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 active:scale-[0.97]'
      }`}
    >
      {flip && (
        <span className="rotate-180">
          <Chevron size={14} />
        </span>
      )}
      {children}
      {!flip && <Chevron size={14} />}
    </button>
  )
}

function YoureUp({ arcade, position, onGo }) {
  return (
    <Screen>
      <TopBar title="Watch" subtitle="Your clip has been paused" />
      <Body className="flex flex-col items-center justify-center bg-brand-50 p-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-600/25">
          <span className="anim-ring absolute h-5 w-5 rounded-full bg-brand-400" />
          <Bell size={34} />
        </div>
        <p className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          You&rsquo;re up
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Position #{position} at <span className="font-semibold text-ink">{arcade.name}</span>
        </p>
        <p className="mt-1 text-xs text-ink-muted">The clip is paused so you can take your turn.</p>
        <div className="mt-6 w-full">
          <PrimaryButton onClick={onGo}>Open my queue</PrimaryButton>
        </div>
      </Body>
    </Screen>
  )
}

function getClipIndexes(scope, clips, arcades) {
  const allIndexes = clips.map((_, clipIndex) => clipIndex)
  if (scope !== 'nearby') return allIndexes

  const distanceByVenue = new Map(
    arcades.map((arcade) => [arcade.id, arcade.distanceKm])
  )

  return allIndexes
    .filter((clipIndex) => {
      const distance = distanceByVenue.get(clips[clipIndex].venue)
      return typeof distance === 'number' && distance <= NEARBY_LIMIT_KM
    })
    .sort((left, right) => {
      const leftClip = clips[left]
      const rightClip = clips[right]
      const distanceDifference =
        distanceByVenue.get(leftClip.venue) - distanceByVenue.get(rightClip.venue)
      return distanceDifference || leftClip.postedMin - rightClip.postedMin
    })
}

function beatHeight(bar, elapsed, playing) {
  if (!playing) return 18 + (bar % 4) * 5
  const wave = (Math.sin(elapsed * 9 + bar * 0.82) + 1) / 2
  const centre = 1 - Math.abs(bar - 6) / 8
  return 20 + wave * 48 + centre * 18
}

function PlayGlyph() {
  return <span className="ml-1 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
}

function PauseGlyph() {
  return (
    <span className="flex gap-1" aria-hidden="true">
      <span className="h-4 w-1.5 rounded-sm bg-white" />
      <span className="h-4 w-1.5 rounded-sm bg-white" />
    </span>
  )
}

function formatTime(seconds) {
  return `0:${Math.floor(seconds).toString().padStart(2, '0')}`
}

function ago(min) {
  if (min < 60) return `${min}m ago`
  const hours = Math.round(min / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}
