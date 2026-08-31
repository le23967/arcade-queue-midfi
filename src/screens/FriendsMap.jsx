import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, GameDot, PrimaryButton, Chip } from '../components/ui.jsx'
import { Plus, Minus, Users, Clock } from '../components/Icons.jsx'
import { ME_MAP } from '../data.js'
import { estimateWaitMin, isStale, freshnessLabel } from '../lib/queue.js'
import { presentFriends } from '../lib/social.js'
import MapCanvas from './MapCanvas.jsx'

/* Map view.

   Consultation feedback asked for the people to be visible on a map rather
   than only in a list: friends as avatars, venues as pins, the map zoomable,
   and the venues enterable from it. It serves the interview request for
   "seeing where your friends are and all of that" better than a list does.

   The list that used to sit under the map has gone. It repeated the pins and
   left the map too short to read, and a map you cannot move is just a picture.
   The space it freed goes to the map itself and to a card that carries the
   action, so tapping a pin ends in going somewhere rather than in a fact.

   Zoom works the way a Mac user expects: pinch on the trackpad, two finger
   scroll to pan, drag to pan, and buttons for anyone without a trackpad. */

const MIN_SCALE = 1
const MAX_SCALE = 4

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export default function FriendsMap({ arcades, onOpenPlayer, onOpenArcade, onMessage }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(false)
  const boxRef = useRef(null)
  const drag = useRef(null)

  const here = presentFriends()

  /* Keep the map from being dragged off screen: at scale 1 it cannot move, and
     past that it can move by however much it overflows. */
  const clampPan = useCallback((next) => {
    const el = boxRef.current
    if (!el) return next
    const { width, height } = el.getBoundingClientRect()
    const slackX = (width * (next.scale - 1)) / 2
    const slackY = (height * (next.scale - 1)) / 2
    return {
      ...next,
      x: clamp(next.x, -slackX, slackX),
      y: clamp(next.y, -slackY, slackY),
    }
  }, [])

  const zoomAt = useCallback(
    (factor, cx, cy) => {
      setView((v) => {
        const el = boxRef.current
        if (!el) return v
        const rect = el.getBoundingClientRect()
        const px = cx ?? rect.width / 2
        const py = cy ?? rect.height / 2
        const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
        /* Keep whatever is under the cursor under the cursor. */
        const originX = rect.width / 2 + v.x
        const originY = rect.height / 2 + v.y
        const k = scale / v.scale
        return clampPan({
          scale,
          x: v.x + (px - originX) * (1 - k),
          y: v.y + (py - originY) * (1 - k),
        })
      })
    },
    [clampPan]
  )

  /* Attached by hand rather than through onWheel, because the listener has to
     be non passive to stop the browser zooming the whole page on a pinch. */
  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    function onWheel(e) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      // macOS sends a pinch as a wheel event with ctrlKey set.
      if (e.ctrlKey || e.metaKey) {
        zoomAt(Math.exp(-e.deltaY * 0.01), cx, cy)
      } else {
        setView((v) =>
          v.scale === 1 ? v : clampPan({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })
        )
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt, clampPan])

  function onPointerDown(e) {
    if (view.scale === 1) return
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, x: view.x, y: view.y }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d) return
    setView((v) =>
      clampPan({
        ...v,
        x: d.x + (e.clientX - d.pointerX),
        y: d.y + (e.clientY - d.pointerY),
      })
    )
  }

  function endDrag() {
    drag.current = null
    setDragging(false)
  }

  const friendCard = selected?.kind === 'friend' ? selected.player : null
  const venueCard =
    selected?.kind === 'venue' ? arcades.find((a) => a.id === selected.id) : null

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`absolute inset-0 touch-none overflow-hidden ${
          view.scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: dragging ? 'none' : 'transform 180ms var(--ease-out)',
          }}
        >
          <MapCanvas />

          {arcades.map((a) => (
            <VenuePin
              key={a.id}
              arcade={a}
              friends={here.filter((p) => p.at === a.id)}
              scale={view.scale}
              active={selected?.kind === 'venue' && selected.id === a.id}
              onPick={() => setSelected({ kind: 'venue', id: a.id })}
              onPickFriend={(player) => setSelected({ kind: 'friend', player })}
            />
          ))}

          <YouPin scale={view.scale} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-2.5 py-1.5 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-fresh" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-fresh" />
          </span>
          <span className="text-[11px] font-semibold text-ink">
            {here.length} out now
          </span>
        </span>

        <span className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <ZoomButton
            label="Zoom in"
            disabled={view.scale >= MAX_SCALE}
            onClick={() => zoomAt(1.5)}
          >
            <Plus size={16} />
          </ZoomButton>
          <span className="h-px bg-line" />
          <ZoomButton
            label="Zoom out"
            disabled={view.scale <= MIN_SCALE}
            onClick={() => zoomAt(1 / 1.5)}
          >
            <Minus size={16} />
          </ZoomButton>
        </span>
      </div>

      {view.scale === 1 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[132px] text-center text-[10px] font-medium text-ink-subtle">
          Pinch to zoom, drag to move
        </p>
      )}

      {/* The card is the point of the screen. Tapping anything on the map ends
          in something you can do, not in a label. */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        {venueCard ? (
          <VenueCard
            arcade={venueCard}
            friends={here.filter((p) => p.at === venueCard.id)}
            onEnter={() => onOpenArcade(venueCard.id)}
            onClose={() => setSelected(null)}
          />
        ) : friendCard ? (
          <FriendCard
            player={friendCard}
            arcade={arcades.find((a) => a.id === friendCard.at)}
            onJoin={() => onOpenArcade(friendCard.at)}
            onMessage={() => onMessage(friendCard.handle)}
            onProfile={() => onOpenPlayer(friendCard.handle)}
            onClose={() => setSelected(null)}
          />
        ) : (
          <SummaryCard
            friends={here}
            arcades={arcades}
            onPick={(player) => setSelected({ kind: 'friend', player })}
          />
        )}
      </div>
    </div>
  )
}

function VenuePin({ arcade, friends, scale, active, onPick, onPickFriend }) {
  const wait = estimateWaitMin(arcade)
  const stale = isStale(arcade)

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${arcade.map.x * 100}%`, top: `${arcade.map.y * 100}%` }}
    >
      <div
        className="flex flex-col items-center"
        style={{ transform: `scale(${1 / scale})` }}
      >
        {friends.length > 0 && (
          <div className="mb-1 flex -space-x-2.5">
            {friends.map((p) => (
              <button
                key={p.handle}
                type="button"
                onClick={() => onPickFriend(p)}
                aria-label={`${p.handle}, at ${arcade.short}`}
                className="rounded-full ring-2 ring-surface transition-transform duration-150 ease-soft hover:z-10 hover:scale-110 active:scale-95"
              >
                <Avatar handle={p.handle} size={30} live />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onPick}
          aria-label={`${arcade.short}, about ${wait} minutes`}
          className={`flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 shadow-lg transition-all duration-150 ease-soft hover:scale-105 active:scale-95 ${
            active
              ? 'bg-brand-600 text-white ring-4 ring-brand-600/20'
              : 'border border-line bg-surface text-ink'
          }`}
        >
          {active ? (
            <span className="h-2 w-2 rounded-full bg-white/80" />
          ) : (
            <GameDot color={arcade.gameColor} />
          )}
          <span className="whitespace-nowrap font-display text-xs font-bold tabular-nums">
            {stale ? '~' : ''}
            {wait}m
          </span>
        </button>

        <span
          className={`mt-1 whitespace-nowrap rounded px-1 text-[9px] font-bold uppercase tracking-wide ${
            active ? 'text-brand-700' : 'text-ink-muted'
          }`}
        >
          {arcade.short}
        </span>
      </div>
    </div>
  )
}

function YouPin({ scale }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${ME_MAP.x * 100}%`, top: `${ME_MAP.y * 100}%` }}
    >
      <div style={{ transform: `scale(${1 / scale})` }} className="flex flex-col items-center">
        <span className="relative flex h-4 w-4">
          <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-brand-500" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-[3px] border-surface bg-brand-600 shadow" />
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-brand-700">
          You
        </span>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="anim-row rounded-2xl border border-line bg-surface p-3 shadow-xl">
      {children}
    </div>
  )
}

function SummaryCard({ friends, arcades, onPick }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-ink">
          {friends.length} in your circle are out
        </p>
        <span className="text-[11px] text-ink-subtle">Tap someone to join them</span>
      </div>
      <div className="mt-2.5 flex gap-2">
        {friends.map((p) => {
          const at = arcades.find((a) => a.id === p.at)
          return (
            <button
              key={p.handle}
              type="button"
              onClick={() => onPick(p)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-sunken px-2 py-2 text-left transition-colors duration-150 hover:bg-line/50"
            >
              <Avatar handle={p.handle} size={30} live />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">
                  {p.handle}
                </span>
                <span className="block truncate text-[10px] text-ink-muted">
                  {at?.short}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function VenueCard({ arcade, friends, onEnter, onClose }) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        <GameDot color={arcade.gameColor} className="mt-1.5 h-2.5 w-2.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-ink">
            {arcade.name}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock size={12} /> ~{estimateWaitMin(arcade)} min
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Users size={12} /> {arcade.queue} waiting
            </span>
            <span className="tabular-nums">{arcade.distanceKm.toFixed(1)} km</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-subtle">
            {arcade.game} &middot; {freshnessLabel(arcade).toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          &times;
        </button>
      </div>

      {friends.length > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-fresh-bg px-2.5 py-1.5">
          <span className="flex -space-x-2">
            {friends.map((p) => (
              <Avatar key={p.handle} handle={p.handle} size={22} className="ring-2 ring-surface" />
            ))}
          </span>
          <span className="text-[11px] font-medium text-ink">
            {friends.map((p) => p.handle).join(', ')} here now
          </span>
        </div>
      )}

      <div className="mt-2.5">
        <PrimaryButton onClick={onEnter}>
          {friends.length > 0 ? 'Join them here' : 'Open this arcade'}
        </PrimaryButton>
      </div>
    </Card>
  )
}

function FriendCard({ player, arcade, onJoin, onMessage, onProfile, onClose }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onProfile} aria-label={`Open ${player.handle}`}>
          <Avatar handle={player.handle} size={44} live />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-ink">
            {player.handle}
          </p>
          <p className="truncate text-xs text-ink-muted">
            At {arcade?.short} for {player.sinceMin} min
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {player.games.slice(0, 2).map((g) => (
              <Chip key={g} tone="quiet">
                {g}
              </Chip>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          &times;
        </button>
      </div>

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onMessage}
          className="flex-1 rounded-xl border border-line-strong bg-surface py-2.5 font-display text-sm font-semibold text-ink transition-all duration-150 hover:bg-sunken active:scale-[0.98]"
        >
          Message
        </button>
        <button
          type="button"
          onClick={onJoin}
          className="flex-1 rounded-xl bg-brand-600 py-2.5 font-display text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-150 hover:bg-brand-700 active:scale-[0.98]"
        >
          Join them
        </button>
      </div>
    </Card>
  )
}

function ZoomButton({ children, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center transition-colors duration-150 ${
        disabled ? 'text-ink-subtle' : 'text-ink hover:bg-sunken active:bg-line'
      }`}
    >
      {children}
    </button>
  )
}
