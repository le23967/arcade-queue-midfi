import { useState } from 'react'
import { Body, Avatar, GameDot, Chip, Info } from '../components/ui.jsx'
import { Plus, Minus, Chevron } from '../components/Icons.jsx'
import { ME_MAP } from '../data.js'
import { estimateWaitMin, isStale } from '../lib/queue.js'
import { presentFriends } from '../lib/social.js'

/* Map view.

   Consultation feedback asked for the people to be visible on a map rather
   than only in a list: friends as avatars, venues as pins, the map zoomable,
   and the venues enterable from it. It serves the interview request for
   "seeing where your friends are and all of that" better than a list does.

   Still a drawn map rather than a tile server - no API key, no external
   requests, no photography - but the geography is real: Central Park sits
   south-west on Broadway, Market City in the middle of Haymarket, and KOKO
   north-east near Town Hall. Real routing stays with the phone's own maps app
   through the Directions hand-off. */

const ZOOMS = [1, 1.5, 2.2]

export default function FriendsMap({ arcades, onOpenPlayer, onOpenArcade }) {
  const [zoom, setZoom] = useState(0)
  const here = presentFriends()
  const scale = ZOOMS[zoom]

  return (
    <Body className="flex flex-col">
      <div className="relative flex-1 overflow-hidden bg-sunken">
        {/* Street grid, drawn. Gives the pins something to sit on without
            pretending to be a real map. */}
        <div
          className="absolute inset-0 origin-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <Streets />

          {arcades.map((a) => {
            const friends = here.filter((p) => p.at === a.id)
            return (
              <VenuePin
                key={a.id}
                arcade={a}
                friends={friends}
                scale={scale}
                onOpenArcade={onOpenArcade}
                onOpenPlayer={onOpenPlayer}
              />
            )
          })}

          <YouPin scale={scale} />
        </div>

        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <ZoomButton
            label="Zoom in"
            disabled={zoom >= ZOOMS.length - 1}
            onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))}
          >
            <Plus size={16} />
          </ZoomButton>
          <span className="h-px bg-line" />
          <ZoomButton
            label="Zoom out"
            disabled={zoom <= 0}
            onClick={() => setZoom((z) => Math.max(0, z - 1))}
          >
            <Minus size={16} />
          </ZoomButton>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-2.5 py-1 backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            {here.length} in your circle out now
          </span>
          <Info above>
            Positions are venue level. The map never shows where anyone is
            inside a venue, and only people you follow back appear.
          </Info>
        </div>
      </div>

      {/* Tapping a venue on the map enters it; the strip repeats that in a
          list so the same action is reachable without hunting for a pin. */}
      <ul className="border-t border-line">
        {arcades.map((a) => {
          const n = here.filter((p) => p.at === a.id).length
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onOpenArcade(a.id)}
                className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left transition-colors duration-150 hover:bg-sunken"
              >
                <GameDot color={a.gameColor} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {a.short}
                  </span>
                  <span className="block text-xs tabular-nums text-ink-muted">
                    ~{estimateWaitMin(a)} min &middot; {a.distanceKm.toFixed(1)} km
                    {n > 0 && ` · ${n} here`}
                  </span>
                </span>
                {isStale(a) && <Chip tone="quiet">stale</Chip>}
                <Chevron size={16} />
              </button>
            </li>
          )
        })}
      </ul>
    </Body>
  )
}

function Streets() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="100" height="100" fill="var(--sunken)" />
      <g stroke="var(--line)" strokeWidth="0.6">
        <path d="M0 82 L100 12" />
        <path d="M0 92 L100 22" />
        <path d="M-5 55 L105 40" />
        <path d="M18 -5 L34 105" />
        <path d="M55 -5 L68 105" />
        <path d="M82 -5 L94 105" />
      </g>
      <g stroke="var(--line-strong)" strokeWidth="1.4">
        <path d="M0 87 L100 17" />
        <path d="M36 -5 L52 105" />
      </g>
      <rect x="60" y="62" width="26" height="20" fill="var(--line)" opacity="0.5" rx="1" />
      <rect x="6" y="14" width="20" height="16" fill="var(--line)" opacity="0.5" rx="1" />
    </svg>
  )
}

function VenuePin({ arcade, friends, scale, onOpenArcade, onOpenPlayer }) {
  const wait = estimateWaitMin(arcade)

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${arcade.map.x * 100}%`, top: `${arcade.map.y * 100}%` }}
    >
      <div
        className="flex flex-col items-center"
        style={{ transform: `scale(${1 / scale})` }}
      >
        {/* Friends stand above the pin they are at. */}
        {friends.length > 0 && (
          <div className="mb-1 flex -space-x-2">
            {friends.map((p) => (
              <button
                key={p.handle}
                type="button"
                onClick={() => onOpenPlayer(p.handle)}
                aria-label={`${p.handle}, at ${arcade.short}`}
                className="rounded-full ring-2 ring-surface transition-transform duration-150 ease-soft hover:z-10 hover:scale-110 active:scale-95"
              >
                <Avatar handle={p.handle} size={26} live />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenArcade(arcade.id)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1.5 pr-2.5 shadow-lg transition-transform duration-150 ease-soft hover:scale-105 active:scale-95"
        >
          <GameDot color={arcade.gameColor} />
          <span className="whitespace-nowrap font-display text-[11px] font-bold tabular-nums text-ink">
            {wait}m
          </span>
        </button>
        <span className="mt-0.5 whitespace-nowrap rounded px-1 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
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
        <span className="relative flex h-3.5 w-3.5">
          <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-brand-500" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-surface bg-brand-600" />
        </span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-700">
          You
        </span>
      </div>
    </div>
  )
}

function ZoomButton({ children, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center transition-colors duration-150 ${
        disabled ? 'text-ink-subtle' : 'text-ink hover:bg-sunken active:bg-line'
      }`}
    >
      {children}
    </button>
  )
}
