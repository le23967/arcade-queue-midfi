import { useState } from 'react'
import {
  Screen,
  TopBar,
  Body,
  Seg,
  Avatar,
  Chip,
  Info,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui.jsx'
import { CheckCircle } from '../components/Icons.jsx'
import { findPerson, nextUnfollowed, relationshipOf } from '../lib/social.js'

/* Adding somebody you have just met.

   Everything social in here is mutual-only - presence, messaging, the
   leaderboard - and until now the only way to make a relationship mutual was
   to know a username and type it correctly into a search field buried under
   Me. That is not what happens at an arcade. You are standing next to someone
   who has just handed you the cabinet, and asking them to spell their handle
   is exactly the friction the app removes everywhere else.

   The venue flow already answered this once: check-in is ordered QR, then NFC,
   then manual, because a player told us plainly what would work - "with a QR
   code", or tapping your phone. The paper queue board failed because writing
   things down is "like lazy". A username you have to spell out is the same
   failure in a different place, so people get the same treatment as cabinets:
   show a code, or scan one.

   Search is still here, one tap away at the bottom, for the case it is
   actually good at - somebody you already know the name of. */
export default function AddPerson({ me, following, onFollow, onBack, onSearch }) {
  const [tab, setTab] = useState('scan')
  const [found, setFound] = useState(null)

  const person = found ? findPerson(found) : null
  const relationship = found ? relationshipOf(found, following) : null

  function simulateScan() {
    const match = nextUnfollowed(following)
    setFound(match ? match.handle : 'none')
  }

  return (
    <Screen>
      <TopBar
        title="Add someone"
        onBack={onBack}
        right={
          <Info>
            A code carries a username, nothing else. Following someone shows
            them nothing until they follow you back, so scanning is an
            introduction rather than access.
          </Info>
        }
      />

      <div className="flex gap-1.5 border-b border-line px-4 py-2">
        <Seg on={tab === 'scan'} onClick={() => setTab('scan')}>
          Scan a code
        </Seg>
        <Seg on={tab === 'mine'} onClick={() => setTab('mine')}>
          My code
        </Seg>
      </div>

      {tab === 'mine' ? (
        <>
          <Body className="flex flex-col items-center justify-center p-6 text-center">
            <QrBlock value={me.handle} />
            <p className="mt-4 font-display text-lg font-semibold text-ink">
              @{me.handle}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Hold this up and let them scan it.
            </p>
          </Body>
          <Footer onSearch={onSearch} />
        </>
      ) : person ? (
        <>
          <Body className="p-4">
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar handle={person.handle} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-ink">
                    @{person.handle}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {person.games.length > 0
                      ? person.games.join(' · ')
                      : 'No games listed'}
                  </p>
                </div>
                <Chip tone={relationship.youFollow ? 'brand' : 'quiet'}>
                  {relationship.label}
                </Chip>
              </div>

              {relationship.youFollow ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-fresh-bg px-3 py-2 text-xs text-ink">
                  <span className="mt-0.5 flex-none text-fresh">
                    <CheckCircle size={15} />
                  </span>
                  <span>
                    {relationship.followsYou
                      ? `You follow each other, so you will see when ${person.handle} is at an arcade.`
                      : `${person.handle} has to follow you back before either of you shows up on the map.`}
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-xs text-ink-muted">
                  {relationship.followsYou
                    ? `${person.handle} already follows you. Follow back and you both appear on each other's map.`
                    : 'Following shares nothing until they follow you back.'}
                </p>
              )}
            </div>
          </Body>

          <div className="space-y-2 border-t border-line p-4">
            {!relationship.youFollow && (
              <PrimaryButton onClick={() => onFollow(person.handle)}>
                {relationship.action} @{person.handle}
              </PrimaryButton>
            )}
            <SecondaryButton onClick={() => setFound(null)}>
              Scan another code
            </SecondaryButton>
          </div>
        </>
      ) : found === 'none' ? (
        <>
          <Body className="flex flex-col items-center justify-center p-6 text-center">
            <p className="font-display text-base font-semibold text-ink">
              Nobody new to add
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              You already follow everyone this prototype knows about.
            </p>
          </Body>
          <div className="border-t border-line p-4">
            <SecondaryButton onClick={() => setFound(null)}>Back</SecondaryButton>
          </div>
        </>
      ) : (
        <>
          <Body className="flex flex-col items-center justify-center p-6 text-center">
            {/* The camera is a gray frame in a mid-fi build, the same way the
                cabinet is on the check-in flow. */}
            <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl border border-line bg-sunken">
              <Corner className="left-3 top-3 border-l-2 border-t-2 rounded-tl-lg" />
              <Corner className="right-3 top-3 border-r-2 border-t-2 rounded-tr-lg" />
              <Corner className="bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg" />
              <Corner className="bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg" />
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Camera, placeholder
              </span>
            </div>
            <p className="mt-4 text-sm text-ink">
              Point your camera at the code on their phone.
            </p>
          </Body>

          <div className="space-y-2 border-t border-line p-4">
            <PrimaryButton onClick={simulateScan}>
              Simulate successful scan
            </PrimaryButton>
            <Footer onSearch={onSearch} bare />
          </div>
        </>
      )}
    </Screen>
  )
}

function Footer({ onSearch, bare = false }) {
  const button = (
    <button
      type="button"
      onClick={onSearch}
      className="w-full text-center text-xs font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-600"
    >
      Know their username? Search instead
    </button>
  )
  return bare ? button : <div className="border-t border-line p-4">{button}</div>
}

function Corner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-6 w-6 border-line-strong ${className}`}
    />
  )
}

/* A code, drawn rather than encoded.

   Nothing scans this - there is no second device in a prototype - so the point
   is only that it reads unmistakably as a QR code at a glance. The pattern is
   derived from the handle, so your code is always your code, and the three
   corner markers are drawn in the fixed positions a real one has. */
function QrBlock({ value }) {
  const cells = 13
  let n = 0
  for (let i = 0; i < value.length; i += 1) n = (n * 31 + value.charCodeAt(i)) >>> 0

  const marker = (row, col) =>
    [0, 1, 2, 3, 4, 5, 6].includes(row) &&
    ([0, 1, 2, 3, 4, 5, 6].includes(col) || col >= cells - 7)
      ? row === 0 || row === 6 || col === 0 || col === 6 || col === cells - 7 || col === cells - 1
        ? true
        : row >= 2 && row <= 4 && ((col >= 2 && col <= 4) || (col >= cells - 5 && col <= cells - 3))
      : null

  const squares = []
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const fixed =
        marker(row, col) ??
        (row >= cells - 7 && col <= 6
          ? row === cells - 7 || row === cells - 1 || col === 0 || col === 6
            ? true
            : row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4
          : null)
      n = (n * 1103515245 + 12345) >>> 0
      const on = fixed === null ? ((n >>> 16) & 0xff) > 118 : fixed
      squares.push(
        <span
          key={`${row}-${col}`}
          className={on ? 'bg-ink' : 'bg-transparent'}
          style={{ aspectRatio: '1 / 1' }}
        />
      )
    }
  }

  return (
    <div
      aria-hidden="true"
      className="grid w-[188px] gap-[2px] rounded-2xl border border-line bg-surface p-3 shadow-sm"
      style={{ gridTemplateColumns: `repeat(${cells}, 1fr)` }}
    >
      {squares}
    </div>
  )
}
