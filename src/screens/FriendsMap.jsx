import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Avatar, GameDot, PrimaryButton, Chip } from '../components/ui.jsx'
import { Plus, Minus, Users, Clock, Pin, Crosshair } from '../components/Icons.jsx'
import { ME_MAP } from '../data.js'
import { estimateWaitMin, isStale, freshnessLabel, partiesLabel } from '../lib/queue.js'
import { presentFriends } from '../lib/social.js'

const MAP_CENTRE = [-33.88015, 151.20335]
const START_ZOOM = 15
const MIN_ZOOM = 2
const MAX_ZOOM = 19

const AVATAR_HUES = [
  ['#eef2ff', '#4338ca'],
  ['#fff1f2', '#be123c'],
  ['#ecfdf5', '#047857'],
  ['#fff7ed', '#c2410c'],
  ['#f5f3ff', '#6d28d9'],
  ['#ecfeff', '#0e7490'],
  ['#fefce8', '#a16207'],
]

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])
}

function hueFor(handle) {
  let value = 0
  for (let index = 0; index < handle.length; index += 1) {
    value = (value * 31 + handle.charCodeAt(index)) >>> 0
  }
  return AVATAR_HUES[value % AVATAR_HUES.length]
}

function makeVenueIcon(arcade, active) {
  const wait = estimateWaitMin(arcade)
  const label = escapeHtml(arcade.short)
  const ariaLabel = escapeHtml(`${arcade.short}, about ${wait} minutes wait`)
  const dot = active ? 'rgba(255,255,255,0.85)' : arcade.gameColor

  return L.divIcon({
    className: 'map-venue-marker',
    iconSize: [168, 58],
    iconAnchor: [84, 22],
    html: `
      <button type="button" class="map-marker-button" aria-label="${ariaLabel}" style="width:168px;display:flex;flex-direction:column;align-items:center;border:0;background:transparent;padding:0;color:inherit;cursor:pointer;font:inherit;">
        <span class="map-venue-pill" style="display:flex;align-items:center;gap:6px;border:${active ? '0' : '1px solid var(--line)'};border-radius:999px;background:${active ? 'var(--brand-600)' : 'var(--surface)'};padding:6px 12px 6px 9px;color:${active ? '#fff' : 'var(--ink)'};box-shadow:0 8px 20px rgba(24,24,27,0.18);transition:transform 150ms ease,background 150ms ease;">
          <span style="width:8px;height:8px;flex:none;border-radius:999px;background:${dot};"></span>
          <span style="white-space:nowrap;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;">${isStale(arcade) ? '~' : ''}${wait} min wait</span>
        </span>
        <span style="margin-top:4px;max-width:164px;overflow:hidden;border-radius:4px;background:rgba(255,255,255,0.86);padding:1px 4px;color:${active ? 'var(--brand-700)' : 'var(--ink-muted)'};font-size:9px;font-weight:700;letter-spacing:0.04em;line-height:13px;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;">${label}</span>
      </button>
    `,
  })
}

function makeFriendIcon(player, arcade, index, count) {
  const [background, colour] = hueFor(player.handle)
  const initials =
    player.handle.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '?'
  const offset = (index - (count - 1) / 2) * 25
  const ariaLabel = escapeHtml(`${player.handle}, at ${arcade.short}`)

  return L.divIcon({
    className: 'map-friend-marker',
    iconSize: [32, 32],
    iconAnchor: [16 - offset, 55],
    html: `
      <button type="button" class="map-marker-button map-avatar" aria-label="${ariaLabel}" style="position:relative;display:flex;width:32px;height:32px;align-items:center;justify-content:center;border:2px solid #fff;border-radius:999px;background:${background};padding:0;color:${colour};box-shadow:0 4px 12px rgba(24,24,27,0.2);cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;transition:transform 150ms ease;">
        ${escapeHtml(initials)}
        <span style="position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border:2px solid #fff;border-radius:999px;background:var(--fresh);"></span>
      </button>
    `,
  })
}

const YOU_ICON_APPROX = L.divIcon({
  className: 'map-you-marker',
  iconSize: [70, 38],
  iconAnchor: [35, 8],
  html: `
    <div aria-label="Approximate location" style="display:flex;width:70px;flex-direction:column;align-items:center;">
      <span style="width:16px;height:16px;border:3px solid #fff;border-radius:999px;background:var(--ink-subtle);box-shadow:0 2px 6px rgba(24,24,27,0.25);"></span>
      <span style="margin-top:3px;border-radius:4px;background:rgba(255,255,255,0.88);padding:1px 4px;color:var(--ink-muted);font-size:9px;font-weight:700;letter-spacing:0.04em;line-height:13px;text-transform:uppercase;white-space:nowrap;">Approx</span>
    </div>
  `,
})

const YOU_ICON = L.divIcon({
  className: 'map-you-marker',
  iconSize: [58, 38],
  iconAnchor: [29, 8],
  html: `
    <div aria-label="Your location" style="display:flex;width:58px;flex-direction:column;align-items:center;">
      <span style="position:relative;display:flex;width:16px;height:16px;">
        <span class="anim-ring" style="position:absolute;width:16px;height:16px;border-radius:999px;background:var(--brand-500);"></span>
        <span style="position:relative;width:16px;height:16px;border:3px solid #fff;border-radius:999px;background:var(--brand-600);box-shadow:0 2px 6px rgba(24,24,27,0.25);"></span>
      </span>
      <span style="margin-top:3px;border-radius:4px;background:rgba(255,255,255,0.88);padding:1px 4px;color:var(--brand-700);font-size:9px;font-weight:700;letter-spacing:0.04em;line-height:13px;text-transform:uppercase;white-space:nowrap;">You</span>
    </div>
  `,
})

export default function FriendsMap({
  arcades,
  following,
  joinsSent,
  onOpenPlayer,
  onOpenArcade,
  onJoin,
  onMessage,
}) {
  const [map, setMap] = useState(null)
  const [selected, setSelected] = useState(null)
  const [tileState, setTileState] = useState('loading')
  /* Real position when the browser gives us one, otherwise the seeded
     location. `live` says which, so the map never implies a precision it does
     not have. */
  const [me, setMe] = useState({ lat: ME_MAP.lat, lng: ME_MAP.lng, accuracy: null, live: false })
  const [geoState, setGeoState] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'locating' : 'unavailable'
  )
  const tileFailed = useRef(false)
  const here = presentFriends(following)

  /* Watch rather than read once, so the dot follows you while you walk to the
     arcade. Venue level privacy is unaffected: this position stays on the
     device and is never attached to a check-in or shared with anyone. */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setMe({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          live: true,
        })
        setGeoState('live')
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  const tileHandlers = useMemo(
    () => ({
      loading() {
        tileFailed.current = false
        setTileState('loading')
      },
      load() {
        setTileState(tileFailed.current ? 'error' : 'ready')
      },
      tileerror() {
        tileFailed.current = true
        setTileState('error')
      },
    }),
    []
  )

  const friendCard = selected?.kind === 'friend' ? selected.player : null
  const venueCard =
    selected?.kind === 'venue' ? arcades.find((arcade) => arcade.id === selected.id) : null

  function recentre() {
    if (!map) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.setView(MAP_CENTRE, START_ZOOM, { animate: !reduceMotion })
  }

  /* Separate from recentre: one frames all three venues, the other takes you
     to yourself. */
  function locateMe() {
    if (!map) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.setView([me.lat, me.lng], Math.max(map.getZoom(), 16), { animate: !reduceMotion })
  }

  return (
    <div className="arcade-map relative min-h-0 flex-1 overflow-hidden bg-[#e9e6df]">
      <style>{`
        .arcade-map .leaflet-container { font-family: inherit; }
        .arcade-map .map-marker-button:focus-visible {
          outline: 3px solid var(--brand-600);
          outline-offset: 2px;
        }
        .arcade-map .map-marker-button:hover .map-venue-pill,
        .arcade-map .map-avatar:hover { transform: translateY(-1px) scale(1.04); }
        .arcade-map .map-marker-button:active .map-venue-pill,
        .arcade-map .map-avatar:active { transform: scale(0.96); }
        .arcade-map .leaflet-control-attribution {
          background: rgba(255,255,255,0.82);
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 6px 0 0 0;
          color: var(--ink-subtle);
        }
        .arcade-map .leaflet-control-attribution a { color: var(--ink-muted); }
      `}</style>

      <MapContainer
        ref={setMap}
        center={MAP_CENTRE}
        zoom={START_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        worldCopyJump
        className="h-full w-full"
        style={{
          backgroundColor: '#e9e6df',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* OpenStreetMap's tile policy requires the credit, so it stays. It is
            styled down rather than switched off. */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxNativeZoom={19}
          eventHandlers={tileHandlers}
        />

        {arcades.map((arcade) => (
          <VenueMarkers
            key={arcade.id}
            arcade={arcade}
            friends={here.filter((player) => player.at === arcade.id)}
            active={selected?.kind === 'venue' && selected.id === arcade.id}
            onPickVenue={() => setSelected({ kind: 'venue', id: arcade.id })}
            onPickFriend={(player) => setSelected({ kind: 'friend', player })}
          />
        ))}

        {me.live && me.accuracy ? (
          <Circle
            center={[me.lat, me.lng]}
            radius={Math.min(me.accuracy, 220)}
            pathOptions={{
              color: 'var(--brand-600)',
              fillColor: 'var(--brand-500)',
              fillOpacity: 0.12,
              weight: 1,
            }}
          />
        ) : null}

        <Marker
          position={[me.lat, me.lng]}
          icon={me.live ? YOU_ICON : YOU_ICON_APPROX}
          interactive={false}
          keyboard={false}
          zIndexOffset={300}
        />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between p-3">
        <span className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-2.5 py-1.5 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-fresh" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-fresh" />
          </span>
          <span className="text-[11px] font-semibold text-ink">{here.length} out now</span>
        </span>

        <span className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <ZoomButton label="Zoom in" onClick={() => map?.zoomIn()}>
            <Plus size={16} />
          </ZoomButton>
          <span className="h-px bg-line" />
          <ZoomButton label="Zoom out" onClick={() => map?.zoomOut()}>
            <Minus size={16} />
          </ZoomButton>
          <span className="h-px bg-line" />
          <ZoomButton
            label={geoState === 'live' ? 'Centre on my location' : 'Find my location'}
            disabled={geoState === 'unavailable' || geoState === 'denied'}
            onClick={locateMe}
          >
            <Crosshair size={15} />
          </ZoomButton>
          <span className="h-px bg-line" />
          <ZoomButton label="Show all arcades" onClick={recentre}>
            <Pin size={15} />
          </ZoomButton>
        </span>
      </div>

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute left-3 top-12 z-[1000] rounded bg-surface/90 px-1.5 py-0.5 text-[9px] font-medium text-ink-muted shadow-sm backdrop-blur hover:text-brand-700"
      >
        Map data © OpenStreetMap contributors
      </a>

      {tileState !== 'ready' && (
        <span
          role="status"
          className="pointer-events-none absolute left-3 top-[70px] z-[1000] rounded-full border border-line bg-surface/95 px-2 py-1 text-[10px] font-medium text-ink-muted shadow-sm"
        >
          {tileState === 'error' ? 'Map tiles are having trouble loading' : 'Loading map…'}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[1000] p-3">
        {venueCard ? (
          <VenueCard
            arcade={venueCard}
            friends={here.filter((player) => player.at === venueCard.id)}
            onEnter={() => onOpenArcade(venueCard.id)}
            onClose={() => setSelected(null)}
          />
        ) : friendCard ? (
          <FriendCard
            player={friendCard}
            arcade={arcades.find((arcade) => arcade.id === friendCard.at)}
            joined={joinsSent?.[friendCard.handle] === friendCard.at}
            onJoin={() => onJoin(friendCard.handle, friendCard.at)}
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

function VenueMarkers({ arcade, friends, active, onPickVenue, onPickFriend }) {
  const venueIcon = useMemo(() => makeVenueIcon(arcade, active), [arcade, active])

  if (!arcade.map?.lat || !arcade.map?.lng) return null

  return (
    <>
      <Marker
        position={[arcade.map.lat, arcade.map.lng]}
        icon={venueIcon}
        keyboard={false}
        riseOnHover
        zIndexOffset={active ? 450 : 400}
        eventHandlers={{ click: onPickVenue }}
      />
      {friends.map((player, index) => (
        <FriendMarker
          key={player.handle}
          player={player}
          arcade={arcade}
          index={index}
          count={friends.length}
          onPick={() => onPickFriend(player)}
        />
      ))}
    </>
  )
}

function FriendMarker({ player, arcade, index, count, onPick }) {
  const icon = useMemo(
    () => makeFriendIcon(player, arcade, index, count),
    [player, arcade, index, count]
  )

  return (
    <Marker
      position={[arcade.map.lat, arcade.map.lng]}
      icon={icon}
      keyboard={false}
      riseOnHover
      zIndexOffset={500 + index}
      eventHandlers={{ click: onPick }}
    />
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
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">
          {friends.length} friends are out
        </p>
        <span className="text-right text-[11px] text-ink-subtle">Tap someone to join them</span>
      </div>
      <div className="mt-2.5 flex gap-2">
        {friends.map((player) => {
          const arcade = arcades.find((item) => item.id === player.at)
          return (
            <button
              key={player.handle}
              type="button"
              onClick={() => onPick(player)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-sunken px-2 py-2 text-left transition-colors duration-150 hover:bg-line/50"
            >
              <Avatar handle={player.handle} size={30} live />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">
                  {player.handle}
                </span>
                <span className="block truncate text-[10px] text-ink-muted">
                  {arcade?.short}
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
              <Users size={12} /> {partiesLabel(arcade.queue)}
            </span>
            <span className="tabular-nums">{arcade.distanceKm.toFixed(1)} km</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-subtle">
            {arcade.game} &middot; {freshnessLabel(arcade).toLowerCase()}
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {friends.length > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-fresh-bg px-2.5 py-1.5">
          <span className="flex -space-x-2">
            {friends.map((player) => (
              <Avatar
                key={player.handle}
                handle={player.handle}
                size={22}
                className="ring-2 ring-surface"
              />
            ))}
          </span>
          <span className="text-[11px] font-medium text-ink">
            {friends.map((player) => player.handle).join(', ')} here now
          </span>
        </div>
      )}

      <div className="mt-2.5">
        <PrimaryButton onClick={onEnter}>Open this arcade</PrimaryButton>
      </div>
    </Card>
  )
}

function FriendCard({ player, arcade, joined, onJoin, onMessage, onProfile, onClose }) {
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
            {player.games.slice(0, 2).map((game) => (
              <Chip key={game} tone="quiet">
                {game}
              </Chip>
            ))}
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Once they have been told, the card says so rather than offering to
          tell them again. */}
      {joined && (
        <p className="mt-2.5 rounded-xl bg-fresh-bg px-2.5 py-1.5 text-[11px] font-medium text-ink">
          {player.handle} knows you&rsquo;re on your way.
        </p>
      )}

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
          {joined ? 'Notify again' : 'Join them'}
        </button>
      </div>
    </Card>
  )
}

function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-sunken hover:text-ink"
    >
      &times;
    </button>
  )
}

function ZoomButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center text-ink transition-colors duration-150 hover:bg-sunken active:bg-line"
    >
      {children}
    </button>
  )
}
