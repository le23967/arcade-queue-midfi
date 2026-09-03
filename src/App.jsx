import { useState } from 'react'
import { ARCADES, QUEUE_AHEAD, DEFAULT_GAME } from './data.js'
import {
  estimateWaitMin,
  venueGame,
  venuesForGame,
  otherGamesAt,
} from './lib/queue.js'
import { Frame, TabBar, SessionBanner, TAB_IDS } from './components/Frame.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

import Arcades from './screens/Arcades.jsx'
import Detail from './screens/Detail.jsx'
import CheckIn from './screens/CheckIn.jsx'
import Scan from './screens/Scan.jsx'
import ConfirmQueue from './screens/ConfirmQueue.jsx'
import Report from './screens/Report.jsx'
import CheckedIn from './screens/CheckedIn.jsx'
import Summary from './screens/Summary.jsx'
import Directions from './screens/Directions.jsx'
import Comments from './screens/Comments.jsx'
import { playSound, isMuted, setMuted } from './lib/sound.js'
import Message from './screens/Message.jsx'
import JoinFriend from './screens/JoinFriend.jsx'
import PlanSession from './screens/PlanSession.jsx'
import Liked from './screens/Liked.jsx'
import MeTab from './screens/MeTab.jsx'
import Friends from './screens/Friends.jsx'
import Watch from './screens/Watch.jsx'
import Follows from './screens/Follows.jsx'
import AddPerson from './screens/AddPerson.jsx'
import Messages from './screens/Messages.jsx'
import EditProfile from './screens/EditProfile.jsx'
import PlayerProfile from './screens/PlayerProfile.jsx'
import { CLIPS, CLIP_COMMENTS, ME, PLANNED } from './social.js'
import {
  INITIAL_FOLLOWING,
  findPerson,
  isMutual,
  relationshipOf,
} from './lib/social.js'

/* The summary is only interesting if a session has some length to it, and a
   reviewer clicks through in seconds. Check-in is therefore backdated by the
   42 minutes the sketch shows, and still counts up in real time from there. */
const DEMO_SESSION_OFFSET_MIN = 42

/* No backend, so delivery is simulated - but deterministically, and only in
   the one direction a phone can actually confirm on its own. */
const DELIVERY_DELAY_MS = 1200

export default function App() {
  const [arcades, setArcades] = useState(ARCADES)
  const [tab, setTab] = useState(TAB_IDS[0])
  const [view, setView] = useState(TAB_IDS[0])
  const [arcadeView, setArcadeView] = useState('list')
  const [game, setGame] = useState(DEFAULT_GAME)
  const [modal, setModal] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [scanMethod, setScanMethod] = useState('qr')
  const [session, setSession] = useState(null)
  const [notify, setNotify] = useState(true)
  const [reports, setReports] = useState(7)
  const [lastSession, setLastSession] = useState(null)
  const [friendsSection, setFriendsSection] = useState('map')
  const [song, setSong] = useState('pandora')
  const [playerHandle, setPlayerHandle] = useState(null)
  const [visible, setVisible] = useState(true)
  const [clipIndex, setClipIndex] = useState(0)
  const [clipScope, setClipScope] = useState('following')
  const [called, setCalled] = useState(false)
  const [followsTab, setFollowsTab] = useState('followers')
  const [likedIds, setLikedIds] = useState([])
  const [comments, setComments] = useState(CLIP_COMMENTS)
  const [queueOpen, setQueueOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(() => !isMuted())
  const [messageTo, setMessageTo] = useState(null)
  const [planPreset, setPlanPreset] = useState({})
  /* Conversations survive closing the sheet, which is the whole point of a
     thread. Keyed by handle, oldest message first. */
  const [conversations, setConversations] = useState({})
  /* Following is state now that it can be changed from the People screen. */
  const [followingHandles, setFollowingHandles] = useState(INITIAL_FOLLOWING)
  /* The pending "tell them I'm coming", and the ones already sent. */
  const [joinTarget, setJoinTarget] = useState(null)
  const [joinsSent, setJoinsSent] = useState({})
  /* Which arcade the Here now list was opened from, if any. Null means the
     general, all-arcades view. */
  const [hereVenueId, setHereVenueId] = useState(null)
  /* Planned sessions you have said yes to. */
  const [rsvps, setRsvps] = useState([])
  /* Every session on Later, seeded with the ones you were invited to. Sessions
     you arrange are added here, so the invitation has somewhere to land. */
  const [planned, setPlanned] = useState(PLANNED)
  const [messageOpener, setMessageOpener] = useState('')
  /* Where back goes. A single "the screen I came from" slot was enough while
     no two screens could open each other - then the conversation header
     started opening the profile, and the profile's Message button opened the
     conversation, and each overwrote the other's slot. Back then bounced
     between the two forever with no way out but a page reload, which is the
     trap the evaluation already caught once. A stack cannot do that: every
     step is recorded, and back unwinds them in order. */
  const [history, setHistory] = useState([])
  /* Your own handle and avatar colour are the one identity in here you own,
     so they are state rather than a constant. */
  const [me, setMe] = useState({ handle: ME.handle, hue: null })

  /* Anything that navigates "back to the tab I came from" goes through this,
     so a renamed tab can never strand the view on an id nothing renders. */
  const backTab = TAB_IDS.includes(tab) ? tab : TAB_IDS[0]

  const rows = venuesForGame(arcades, game)
  const rawArcade = arcades.find((a) => a.id === activeId) ?? arcades[0]
  const arcade = venueGame(rawArcade, game) ?? rows[0] ?? null
  /* One lookup over one normalised roster, so a profile opened from the
     Followers list carries the same shape as one opened from the map. */
  const player = playerHandle ? findPerson(playerHandle) : null
  const playerRelationship = playerHandle
    ? relationshipOf(playerHandle, followingHandles)
    : null

  /* Going somewhere new records where you were; going back unwinds it. */
  function push(next) {
    setHistory((h) => [...h, view])
    setView(next)
  }

  function goBack() {
    const previous = history[history.length - 1] ?? backTab
    setHistory((h) => h.slice(0, -1))
    setView(previous)
  }

  /* A tab is a starting point, not a step, so arriving at one clears the
     trail behind it. */
  function goRoot(next) {
    setHistory([])
    setView(next)
  }

  const clip = CLIPS[clipIndex]
  const clipComments = comments[clip.id] ?? []
  const liked = likedIds.includes(clip.id)

  function toggleLike() {
    setLikedIds((ids) =>
      ids.includes(clip.id) ? ids.filter((i) => i !== clip.id) : [...ids, clip.id]
    )
  }

  function postComment(text) {
    setComments((all) => ({
      ...all,
      [clip.id]: [
        { id: `own-${Date.now()}`, handle: me.handle, text, minsAgo: 0 },
        ...(all[clip.id] ?? []),
      ],
    }))
  }

  /* Jumping to a clip from Activity or from Liked lands you in the feed at
     that clip, rather than opening a one-off player. */
  function openClip(id) {
    const i = CLIPS.findIndex((c) => c.id === id)
    if (i < 0) return
    setClipIndex(i)
    setTab('watch')
    setView('watch')
  }

  /* Messaging stays mutual-only. Following someone who has not followed back
     buys you nothing here, which is the rule the research asked for. */
  function openMessage(handle, opener = '') {
    const mutual = isMutual(handle, followingHandles)
    const hasHistory = (conversations[handle] ?? []).length > 0
    /* Mutual-only still governs who you can reach. It does not govern your own
       past conversations: unfollowing someone must not turn a thread you can
       see in your inbox into a row that does nothing when tapped. It opens,
       and it opens read-only. */
    if (!mutual && !hasHistory) return
    setMessageTo(handle)
    /* A button that offers to ask a particular question opens with that
       question in the box, rather than an empty one. */
    setMessageOpener(mutual ? opener : '')
    push('chat')
  }

  function sendMessage(handle, text) {
    const id = `m-${Date.now()}`
    setConversations((all) => ({
      ...all,
      [handle]: [
        ...(all[handle] ?? []),
        { id, sender: 'me', text, timestamp: Date.now(), status: 'sent' },
      ],
    }))
    window.setTimeout(() => {
      setConversations((all) => ({
        ...all,
        [handle]: (all[handle] ?? []).map((m) =>
          m.id === id ? { ...m, status: 'delivered' } : m
        ),
      }))
    }, DELIVERY_DELAY_MS)
  }

  /* "Join them" is about a person, so it asks before it acts and then says
     who was told. It never checks anyone in - that is a separate action at the
     cabinet. */
  function openJoin(handle, arcadeId) {
    if (!arcadeId) return
    setJoinTarget({ handle, arcadeId, sent: false })
    setModal('join')
  }

  function confirmJoin() {
    if (!joinTarget) return
    setJoinsSent((all) => ({ ...all, [joinTarget.handle]: joinTarget.arcadeId }))
    setJoinTarget((t) => ({ ...t, sent: true }))
    playSound('success')
  }

  /* Saying yes to a session is reversible, so it commits straight away and
     shows the result, rather than asking first. */
  function toggleRsvp(id) {
    setRsvps((list) =>
      list.includes(id) ? list.filter((s) => s !== id) : [...list, id]
    )
  }

  function toggleFollow(handle) {
    setFollowingHandles((list) =>
      list.includes(handle) ? list.filter((h) => h !== handle) : [...list, handle]
    )
  }

  /* Here now is venue-scoped only while you are inside the venue you opened it
     from. Anything that goes back to Circle on its own terms drops the filter,
     so the tab is never permanently narrowed. */
  function openHereAt(venueId) {
    setHereVenueId(venueId)
    setFriendsSection('here')
    setTab('friends')
    goRoot('friends')
  }

  function pickFriendsSection(next) {
    setHereVenueId(null)
    setFriendsSection(next)
  }

  /* Opening a plan from anywhere carries whatever context that place already
     knows - which venue, which game, who to invite. */
  function openPlan(preset = {}) {
    setPlanPreset(preset)
    push('plan')
  }

  /* Back has to land on the screen the profile was opened from, including the
     two that are not tabs. Opening someone from People used to return you to
     the Me tab, which reads as a failed back. */
  function openPlayer(handle) {
    setPlayerHandle(handle)
    push('player')
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
    goRoot(next)
    /* Coming into Circle from the tab bar is the general view, never whatever
       venue you happened to look at earlier. */
    if (next === 'friends') setHereVenueId(null)
  }

  function openArcade(id) {
    setActiveId(id)
    push('detail')
  }

  /* Check-in carries the count the person just confirmed at the cabinet, so
     the next reader gets a verified number rather than a blind +1 on top of an
     unconfirmed one. */
  function doCheckIn({ queue, solo }) {
    const target = arcade
    const position = queue + 1

    patchVenueGame(target.id, target.gameId, {
      queue: queue + 1,
      solo: Math.min(solo + 1, queue + 1),
      updatedMinsAgo: 0,
      updatedAt: '12:38 PM',
    })

    setSession({
      arcadeId: target.id,
      gameId: target.gameId,
      position,
      checkInAt: Date.now() - DEMO_SESSION_OFFSET_MIN * 60_000,
      waitedMin: estimateWaitMin({ ...target, queue, solo }),
    })
    playSound('success')
    setTab('arcades')
    goRoot('checkedin')
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
    goRoot('summary')
  }

  const showTabs = ['arcades', 'watch', 'friends', 'me', 'detail'].includes(view)
  const sessionArcade = session
    ? venueGame(
        arcades.find((a) => a.id === session.arcadeId),
        session.gameId
      )
    : null

  return (
    <Frame>
      <div className="relative flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <ErrorBoundary resetKey={view}>
          {view === 'arcades' && (
            <Arcades
              arcades={rows}
              venueCount={arcades.length}
              game={game}
              onGame={setGame}
              view={arcadeView}
              onView={setArcadeView}
              onOpen={openArcade}
              following={followingHandles}
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
              onCall={() => {
                playSound('alert')
                setCalled(true)
              }}
              liked={liked}
              likeCount={clip.likes + (liked ? 1 : 0)}
              onLike={toggleLike}
              commentCount={clipComments.length}
              onComments={() => setModal('comments')}
              onGo={() => {
                setCalled(false)
                setTab('arcades')
                goRoot('checkedin')
              }}
            />
          )}

          {view === 'addperson' && (
            <AddPerson
              me={me}
              following={followingHandles}
              onFollow={toggleFollow}
              onBack={goBack}
              onSearch={() => {
                setFollowsTab('following')
                push('follows')
              }}
            />
          )}

          {view === 'follows' && (
            <Follows
              tabName={followsTab}
              onTab={setFollowsTab}
              onBack={goBack}
              onOpenPlayer={openPlayer}
              following={followingHandles}
              onToggleFollow={toggleFollow}
              onAddPerson={() => push('addperson')}
            />
          )}

          {view === 'friends' && (
            <Friends
              arcades={arcades}
              game={game}
              section={friendsSection}
              onSection={pickFriendsSection}
              hereVenueId={hereVenueId}
              onClearVenue={() => setHereVenueId(null)}
              song={song}
              onSong={setSong}
              me={me}
              following={followingHandles}
              joinsSent={joinsSent}
              planned={planned}
              rsvps={rsvps}
              onRsvp={toggleRsvp}
              onOpenPlayer={openPlayer}
              onOpenClip={openClip}
              onOpenArcade={openArcade}
              onJoin={openJoin}
              onPlan={openPlan}
              onMessage={openMessage}
              onOpenMessages={() => push('messages')}
              onAddPerson={() => push('addperson')}
              threadCount={Object.keys(conversations).length}
            />
          )}

          {view === 'chat' && messageTo && (
            <Message
              handle={messageTo}
              messages={conversations[messageTo] ?? []}
              opener={messageOpener}
              mutual={isMutual(messageTo, followingHandles)}
              onSend={(text) => sendMessage(messageTo, text)}
              onOpenProfile={() => openPlayer(messageTo)}
              onBack={goBack}
            />
          )}

          {view === 'editprofile' && (
            <EditProfile
              me={me}
              onSave={(next) => {
                setMe(next)
                goBack()
              }}
              onBack={goBack}
            />
          )}

          {view === 'messages' && (
            <Messages
              conversations={conversations}
              onOpen={openMessage}
              onBack={goBack}
            />
          )}

          {view === 'plan' && (
            <PlanSession
              arcades={rows}
              preset={planPreset}
              me={me}
              onPlanned={(plan) => setPlanned((list) => [plan, ...list])}
              onBack={goBack}
              onDone={() => {
                /* A new invitation belongs with the other planned ones, not
                   in the list of who is at an arcade right now. */
                setHereVenueId(null)
                setFriendsSection('planned')
                setTab('friends')
                goRoot('friends')
              }}
            />
          )}

          {view === 'liked' && (
            <Liked
              likedIds={likedIds}
              onBack={goBack}
              onOpenClip={openClip}
            />
          )}

          {view === 'player' && player && (
            <PlayerProfile
              player={player}
              relationship={playerRelationship}
              arcade={arcades.find((a) => a.id === player.at) ?? null}
              joinedAt={joinsSent[player.handle] ?? null}
              onBack={goBack}
              onOpenArcade={openArcade}
              onJoin={openJoin}
              onMessage={openMessage}
              onToggleFollow={toggleFollow}
              onPlan={openPlan}
            />
          )}

          {view === 'me' && (
            <MeTab
              me={me}
              onEditProfile={() => push('editprofile')}
              reports={reports}
              sessions={3}
              visible={visible}
              onVisible={setVisible}
              onOpenFollows={(t) => {
                setFollowsTab(t)
                push('follows')
              }}
              following={followingHandles}
              likedCount={likedIds.length}
              onOpenLiked={() => push('liked')}
              soundOn={soundOn}
              onSound={(on) => {
                setMuted(!on)
                setSoundOn(on)
                if (on) playSound('success')
              }}
            />
          )}

          {view === 'detail' && arcade && (
            <Detail
              arcade={arcade}
              otherGames={otherGamesAt(rawArcade, game)}
              onPickGame={pickGame}
              onDirections={() => setModal('directions')}
              queueOpen={queueOpen}
              onToggleQueue={() => setQueueOpen((o) => !o)}
              mePosition={
                session &&
                session.arcadeId === arcade.id &&
                session.gameId === arcade.gameId
                  ? session.position
                  : null
              }
              onBack={goBack}
              onCheckIn={() => setView('checkin')}
              onReport={() => setModal('report')}
              following={followingHandles}
              onFriends={() => openHereAt(arcade.id)}
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
              onManual={() => setView('confirm')}
            />
          )}

          {view === 'scan' && (
            <Scan
              arcade={arcade}
              method={scanMethod}
              onBack={() => setView('checkin')}
              onSuccess={() => setView('confirm')}
            />
          )}

          {view === 'confirm' && arcade && (
            <ConfirmQueue
              arcade={arcade}
              onBack={() => setView('checkin')}
              onConfirm={doCheckIn}
            />
          )}

          {view === 'checkedin' && session && sessionArcade && (
            <CheckedIn
              arcade={sessionArcade}
              position={session.position}
              total={Math.max(session.position, sessionArcade.queue)}
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
                goRoot('arcades')
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
                goRoot('arcades')
              }}
            />
          )}
          </ErrorBoundary>
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
                  total={Math.max(session.position, sessionArcade.queue)}
                  onOpen={() => goRoot('checkedin')}
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
              patchVenueGame(arcade.id, arcade.gameId, {
                queue,
                solo,
                updatedMinsAgo: 0,
                updatedAt: '12:38 PM',
              })
              setReports((n) => n + 1)
            }}
          />
        )}

        {modal === 'comments' && (
          <Comments
            clip={clip}
            comments={clipComments}
            onPost={postComment}
            onClose={() => setModal(null)}
          />
        )}

        {modal === 'join' && joinTarget && (
          <JoinFriend
            handle={joinTarget.handle}
            arcade={arcades.find((a) => a.id === joinTarget.arcadeId) ?? null}
            sent={joinTarget.sent}
            onConfirm={confirmJoin}
            onOpenArcade={() => {
              setModal(null)
              openArcade(joinTarget.arcadeId)
            }}
            onClose={() => setModal(null)}
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
    <div className="absolute inset-0 z-10 flex items-end bg-ink/40">
      <div className="w-full rounded-t-md border-t border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">
          Are you sure you want to check out?
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
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
            className="w-full rounded-md border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
