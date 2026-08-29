import { useState } from 'react'
import { ARCADES, QUEUE_AHEAD, DEFAULT_GAME } from './data.js'
import {
  estimateWaitMin,
  venueGame,
  venuesForGame,
  otherGamesAt,
} from './lib/queue.js'
import { Frame, TabBar, SessionBanner } from './components/Frame.jsx'

import Arcades from './screens/Arcades.jsx'
import Detail from './screens/Detail.jsx'
import CheckIn from './screens/CheckIn.jsx'
import Scan from './screens/Scan.jsx'
import Report from './screens/Report.jsx'
import CheckedIn from './screens/CheckedIn.jsx'
import Summary from './screens/Summary.jsx'
import Directions from './screens/Directions.jsx'
import MeTab from './screens/MeTab.jsx'
import Friends from './screens/Friends.jsx'
import Watch from './screens/Watch.jsx'
import Follows from './screens/Follows.jsx'
import PlayerProfile from './screens/PlayerProfile.jsx'
import { FRIENDS, FOLLOWERS_ONLY, CLIPS } from './social.js'

/* Screens carry their sketch number so a reviewer can hold the prototype and
   Fig 3 side by side. */
const CAPTIONS = {
  arcades: 'Screens 1 + 2 — Arcades (list / compare)',
  detail: 'Screen 3 — Detail',
  checkin: 'Screen 4A — Check-In',
  scan: 'Screen 5 — Scan target',
  checkedin: 'Screen 6 — Checked In',
  summary: 'Screen 8 — Session summary',
  watch: 'Watch — clip feed',
  friends: 'Friends tab',
  follows: 'Followers / Following',
  player: 'Player profile',
  me: 'Me tab',
}

const MODAL_CAPTIONS = {
  report: 'Screen 4B — Report',
  checkout: 'Screen 7 — Check out confirmation',
  directions: 'Directions — hand-off to the phone’s maps app',
}

/* The summary is only interesting if a session has some length to it, and a
   reviewer clicks through in seconds. Check-in is therefore backdated by the
   42 minutes the sketch shows, and still counts up in real time from there. */
const DEMO_SESSION_OFFSET_MIN = 42

export default function App() {
  const [arcades, setArcades] = useState(ARCADES)
  const [tab, setTab] = useState('home')
  const [view, setView] = useState('arcades')
  const [arcadeView, setArcadeView] = useState('list')
  const [game, setGame] = useState(DEFAULT_GAME)
  const [modal, setModal] = useState(null)
  const [sort, setSort] = useState('distance')
  const [activeId, setActiveId] = useState(null)
  const [scanMethod, setScanMethod] = useState('qr')
  const [session, setSession] = useState(null)
  const [notify, setNotify] = useState(true)
  const [reports, setReports] = useState(7)
  const [lastSession, setLastSession] = useState(null)
  const [friendsSection, setFriendsSection] = useState('here')
  const [song, setSong] = useState('neon')
  const [playerHandle, setPlayerHandle] = useState(null)
  const [visible, setVisible] = useState(true)
  const [clipIndex, setClipIndex] = useState(0)
  const [clipScope, setClipScope] = useState('following')
  const [called, setCalled] = useState(false)
  const [followsTab, setFollowsTab] = useState('followers')

  const rows = venuesForGame(arcades, game)
  const rawArcade = arcades.find((a) => a.id === activeId) ?? arcades[0]
  const arcade = venueGame(rawArcade, game) ?? rows[0] ?? null
  const player =
    FRIENDS.find((p) => p.handle === playerHandle) ??
    FOLLOWERS_ONLY.find((p) => p.handle === playerHandle) ??
    null

  const [playerBack, setPlayerBack] = useState('friends')

  function openPlayer(handle) {
    setPlayerHandle(handle)
    setPlayerBack(view === 'detail' ? 'detail' : view)
    setView('player')
  }

  function patchVenueGame(id, gameId, patch) {
    setArcades((list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, games: { ...a.games, [gameId]: { ...a.games[gameId], ...patch } } }
          : a
      )
    )
  }

  /* Opening a venue that does not run the selected game would show nothing, so
     switching game from the detail screen switches the whole filter. */
  function pickGame(next) {
    setGame(next)
  }

  function goTab(next) {
    setTab(next)
    setModal(null)
    setView(next)
  }

  function openArcade(id) {
    setActiveId(id)
    setView('detail')
  }

  function doCheckIn() {
    const target = arcade
    const position = target.queue + 1

    /* Checking in is itself a queue report: the count goes up and the clock
       resets, so the next person to look sees a number that is seconds old. */
    patchVenueGame(target.id, target.gameId, {
      queue: target.queue + 1,
      updatedMinsAgo: 0,
      updatedAt: '12:38 PM',
    })

    setSession({
      arcadeId: target.id,
      gameId: target.gameId,
      position,
      checkInAt: Date.now() - DEMO_SESSION_OFFSET_MIN * 60_000,
      waitedMin: estimateWaitMin(target),
    })
    setView('checkedin')
    setTab('arcades')
  }

  function doCheckOut() {
    const target = venueGame(
      arcades.find((a) => a.id === session.arcadeId),
      session.gameId
    )
    patchVenueGame(target.id, session.gameId, {
      queue: Math.max(0, target.queue - 1),
      updatedMinsAgo: 0,
      updatedAt: '12:38 PM',
    })

    const elapsed = Math.max(
      1,
      Math.round((Date.now() - session.checkInAt) / 60_000)
    )
    setLastSession({
      arcadeId: session.arcadeId,
      gameId: session.gameId,
      sessionMin: elapsed,
      waitedMin: session.waitedMin,
    })
    setSession(null)
    setModal(null)
    setView('summary')
  }

  const caption = modal ? MODAL_CAPTIONS[modal] : CAPTIONS[view]
  const showTabs = ['arcades', 'watch', 'friends', 'me', 'detail'].includes(view)
  const sessionArcade = session
    ? venueGame(
        arcades.find((a) => a.id === session.arcadeId),
        session.gameId
      )
    : null

  return (
    <Frame caption={caption}>
      <div className="relative flex h-full flex-col">
        <div className="min-h-0 flex-1">
          {view === 'arcades' && (
            <Arcades
              arcades={rows}
              venueCount={arcades.length}
              game={game}
              onGame={setGame}
              view={arcadeView}
              onView={setArcadeView}
              sort={sort}
              onSort={setSort}
              onOpen={openArcade}
            />
          )}

          {view === 'watch' && (
            <Watch
              clips={CLIPS}
              index={clipIndex}
              onIndex={setClipIndex}
              scope={clipScope}
              onScope={setClipScope}
              arcades={arcades}
              session={session}
              sessionArcade={sessionArcade}
              called={called}
              onCall={() => setCalled(true)}
              onGo={() => {
                setCalled(false)
                setTab('arcades')
                setView('checkedin')
              }}
            />
          )}

          {view === 'follows' && (
            <Follows
              tabName={followsTab}
              onTab={setFollowsTab}
              onBack={() => setView('me')}
              onOpenPlayer={openPlayer}
            />
          )}

          {view === 'friends' && (
            <Friends
              arcades={arcades}
              section={friendsSection}
              onSection={setFriendsSection}
              song={song}
              onSong={setSong}
              onOpenPlayer={openPlayer}
            />
          )}

          {view === 'player' && player && (
            <PlayerProfile
              player={player}
              arcade={arcades.find((a) => a.id === player.at) ?? null}
              onBack={() => setView(playerBack)}
              onOpenArcade={openArcade}
            />
          )}

          {view === 'me' && (
            <MeTab
              reports={reports}
              sessions={3}
              visible={visible}
              onVisible={setVisible}
              onOpenFollows={(t) => {
                setFollowsTab(t)
                setView('follows')
              }}
            />
          )}

          {view === 'detail' && arcade && (
            <Detail
              arcade={arcade}
              otherGames={otherGamesAt(rawArcade, game)}
              onPickGame={pickGame}
              onDirections={() => setModal('directions')}
              onBack={() => setView(tab)}
              onCheckIn={() => setView('checkin')}
              onReport={() => setModal('report')}
              onFriends={() => {
                setTab('friends')
                setFriendsSection('here')
                setView('friends')
              }}
            />
          )}

          {view === 'checkin' && (
            <CheckIn
              arcade={arcade}
              onBack={() => setView('detail')}
              onScan={(method) => {
                setScanMethod(method)
                setView('scan')
              }}
              onManual={doCheckIn}
            />
          )}

          {view === 'scan' && (
            <Scan
              arcade={arcade}
              method={scanMethod}
              onBack={() => setView('checkin')}
              onSuccess={doCheckIn}
            />
          )}

          {view === 'checkedin' && session && sessionArcade && (
            <CheckedIn
              arcade={sessionArcade}
              position={session.position}
              total={session.position + 1}
              queueAhead={QUEUE_AHEAD}
              aheadMin={estimateWaitMin({
                ...sessionArcade,
                queue: Math.max(0, session.position - 1),
                solo: Math.min(sessionArcade.solo, session.position - 1),
              })}
              notify={notify}
              onNotify={setNotify}
              onBack={() => {
                setTab('arcades')
                setView('arcades')
              }}
              onCheckOut={() => setModal('checkout')}
            />
          )}

          {view === 'summary' && lastSession && (
            <Summary
              arcade={venueGame(
                arcades.find((a) => a.id === lastSession.arcadeId),
                lastSession.gameId
              )}
              sessionMin={lastSession.sessionMin}
              waitedMin={lastSession.waitedMin}
              onDone={() => {
                setTab('arcades')
                setView('arcades')
              }}
            />
          )}
        </div>

        {showTabs && (
          <TabBar
            active={tab}
            onSelect={goTab}
            banner={
              session && sessionArcade ? (
                <SessionBanner
                  arcadeName={sessionArcade.short}
                  position={session.position}
                  total={session.position + 1}
                  onOpen={() => setView('checkedin')}
                />
              ) : null
            }
          />
        )}

        {modal === 'report' && arcade && (
          <Report
            arcade={arcade}
            onCancel={() => setModal(null)}
            onSubmit={({ queue, solo }) => {
              patchArcade(arcade.id, {
                queue,
                solo,
                updatedMinsAgo: 0,
                updatedAt: '12:38 PM',
              })
              setReports((n) => n + 1)
            }}
          />
        )}

        {modal === 'directions' && arcade && (
          <Directions arcade={arcade} onCancel={() => setModal(null)} />
        )}

        {modal === 'checkout' && sessionArcade && (
          <CheckoutModal
            arcade={sessionArcade}
            onCancel={() => setModal(null)}
            onConfirm={doCheckOut}
          />
        )}
      </div>
    </Frame>
  )
}

/* SCREEN 7 - Check out confirmation. */
function CheckoutModal({ arcade, onCancel, onConfirm }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end bg-gray-900/40">
      <div className="w-full rounded-t-md border-t border-gray-300 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Are you sure you want to check out?
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          This gives up your place at {arcade.short} and moves everyone behind
          you up one.
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Yes, check out
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
