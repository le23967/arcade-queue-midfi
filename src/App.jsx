import { useState } from 'react'
import { ARCADES, QUEUE_AHEAD } from './data.js'
import { estimateWaitMin } from './lib/queue.js'
import { Frame, TabBar, SessionBanner } from './components/Frame.jsx'

import Nearby from './screens/Nearby.jsx'
import Compare from './screens/Compare.jsx'
import Detail from './screens/Detail.jsx'
import CheckIn from './screens/CheckIn.jsx'
import Scan from './screens/Scan.jsx'
import Report from './screens/Report.jsx'
import CheckedIn from './screens/CheckedIn.jsx'
import Summary from './screens/Summary.jsx'
import MapsTab from './screens/MapsTab.jsx'
import MeTab from './screens/MeTab.jsx'

/* Screens carry their sketch number so a reviewer can hold the prototype and
   Fig 3 side by side. */
const CAPTIONS = {
  nearby: 'Screen 1 — Nearby Arcade',
  compare: 'Screen 2 — Compare',
  detail: 'Screen 3 — Detail',
  checkin: 'Screen 4A — Check-In',
  scan: 'Screen 5 — Scan target',
  checkedin: 'Screen 6 — Checked In',
  summary: 'Screen 8 — Session summary',
  maps: 'Maps tab',
  me: 'Me tab',
}

const MODAL_CAPTIONS = {
  report: 'Screen 4B — Report',
  checkout: 'Screen 7 — Check out confirmation',
}

/* The summary is only interesting if a session has some length to it, and a
   reviewer clicks through in seconds. Check-in is therefore backdated by the
   42 minutes the sketch shows, and still counts up in real time from there. */
const DEMO_SESSION_OFFSET_MIN = 42

export default function App() {
  const [arcades, setArcades] = useState(ARCADES)
  const [tab, setTab] = useState('home')
  const [view, setView] = useState('nearby')
  const [modal, setModal] = useState(null)
  const [sort, setSort] = useState('distance')
  const [activeId, setActiveId] = useState(null)
  const [scanMethod, setScanMethod] = useState('qr')
  const [session, setSession] = useState(null)
  const [notify, setNotify] = useState(true)
  const [reports, setReports] = useState(7)
  const [lastSession, setLastSession] = useState(null)

  const arcade = arcades.find((a) => a.id === activeId) ?? arcades[0]

  function patchArcade(id, patch) {
    setArcades((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch } : a))
    )
  }

  function goTab(next) {
    setTab(next)
    setModal(null)
    setView(next === 'home' ? 'nearby' : next)
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
    patchArcade(target.id, {
      queue: target.queue + 1,
      updatedMinsAgo: 0,
      updatedAt: '12:38 PM',
    })

    setSession({
      arcadeId: target.id,
      position,
      checkInAt: Date.now() - DEMO_SESSION_OFFSET_MIN * 60_000,
      waitedMin: estimateWaitMin(target),
    })
    setView('checkedin')
    setTab('home')
  }

  function doCheckOut() {
    const target = arcades.find((a) => a.id === session.arcadeId)
    patchArcade(target.id, {
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
      sessionMin: elapsed,
      waitedMin: session.waitedMin,
    })
    setSession(null)
    setModal(null)
    setView('summary')
  }

  const caption = modal ? MODAL_CAPTIONS[modal] : CAPTIONS[view]
  const showTabs = ['nearby', 'compare', 'maps', 'me', 'detail'].includes(view)
  const sessionArcade = session
    ? arcades.find((a) => a.id === session.arcadeId)
    : null

  return (
    <Frame caption={caption}>
      <div className="relative flex h-full flex-col">
        <div className="min-h-0 flex-1">
          {view === 'nearby' && (
            <Nearby
              arcades={arcades}
              sort={sort}
              onSort={setSort}
              onOpen={openArcade}
            />
          )}

          {view === 'compare' && (
            <Compare arcades={arcades} onOpen={openArcade} />
          )}

          {view === 'maps' && <MapsTab arcades={arcades} onOpen={openArcade} />}

          {view === 'me' && <MeTab reports={reports} sessions={3} />}

          {view === 'detail' && (
            <Detail
              arcade={arcade}
              onBack={() => setView(tab === 'home' ? 'nearby' : tab)}
              onCheckIn={() => setView('checkin')}
              onReport={() => setModal('report')}
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
                setTab('home')
                setView('nearby')
              }}
              onCheckOut={() => setModal('checkout')}
            />
          )}

          {view === 'summary' && lastSession && (
            <Summary
              arcade={arcades.find((a) => a.id === lastSession.arcadeId)}
              sessionMin={lastSession.sessionMin}
              waitedMin={lastSession.waitedMin}
              onDone={() => {
                setTab('home')
                setView('nearby')
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

        {modal === 'report' && (
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
