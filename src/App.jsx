import { useState } from 'react'
import { ARCADES, QUEUE_AHEAD, DEFAULT_GAME } from './data.js'
import {
  estimateWaitMin,
  venueGame,
  venuesForGame,
  otherGamesAt,
} from './lib/queue.js'
import { Frame, TabBar, SessionBanner, TAB_IDS } from './components/Frame.jsx'
import { PrimaryButton, SecondaryButton } from './components/ui.jsx'
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
import Welcome from './screens/Welcome.jsx'
import Auth from './screens/Auth.jsx'
import { CLIPS, CLIP_COMMENTS, ME, PLANNED } from './social.js'
import {
  INITIAL_FOLLOWING,
  findPerson,
  isMutual,
  relationshipOf,
  openSessionWith,
  openSessions,
} from './lib/social.js'
import { useAuth } from './lib/auth.jsx'
import { useFollows } from './lib/useFollows.js'
import { useConversation, useInbox } from './lib/useConversation.js'
import { hueFromProfile } from './lib/accounts.js'

/* The summary is only interesting if a session has some length to it, and a
   reviewer clicks through in seconds. Check-in is therefore backdated by the
   42 minutes the sketch shows, and still counts up in real time from there. */
const DEMO_SESSION_OFFSET_MIN = 42

/* The gate.

   Who you are is decided before anything else renders. While the stored
   session is being restored there is a one-line screen; with no session the
   welcome and then sign in; with one, the prototype. The prototype is keyed
   by user id, so signing out or switching accounts unmounts it and every
   piece of per-user state - the open thread, the profile being looked at,
   the navigation trail - goes with it. Nothing of the previous person is
   left on screen.

   The welcome screen is shown once per page load to people who are not
   signed in. It is not stored anywhere, so a field-study participant on a
   fresh reload always starts there; a returning account holder never sees it
   because their session is restored first. */
export default function App() {
  const auth = useAuth()
  const [entered, setEntered] = useState(false)
  /* Only offered when Supabase is not configured, so the prototype can still
     be walked through on a machine without the two env values. */
  const [guest, setGuest] = useState(false)
  const [game, setGame] = useState(DEFAULT_GAME)

  if (auth.status === 'checking') {
    return (
      <Frame>
        <Splash text="Checking session…" />
      </Frame>
    )
  }

  if (auth.status !== 'signed-in' && !guest) {
    if (!entered) {
      return (
        <Frame>
          <Welcome game={game} onGame={setGame} onContinue={() => setEntered(true)} />
        </Frame>
      )
    }
    return (
      <Frame>
        <Auth
          configured={auth.configured}
          onSignIn={auth.signIn}
          onSignUp={auth.signUp}
          onBack={() => setEntered(false)}
          onGuest={auth.configured ? null : () => setGuest(true)}
        />
      </Frame>
    )
  }

  return <Prototype key={auth.user?.id ?? 'guest'} auth={auth} initialGame={game} />
}

function Splash({ text }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface">
      <p role="status" className="text-xs text-ink-subtle">
        {text}
      </p>
    </div>
  )
}

function Prototype({ auth, initialGame }) {
  const [arcades, setArcades] = useState(ARCADES)
  const [tab, setTab] = useState(TAB_IDS[0])
  const [view, setView] = useState(TAB_IDS[0])
  const [arcadeView, setArcadeView] = useState('list')
  const [game, setGame] = useState(initialGame ?? DEFAULT_GAME)
  const [modal, setModal] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [scanMethod, setScanMethod] = useState('qr')
  const [session, setSession] = useState(null)
  const [notify, setNotify] = useState(true)
  const [reports, setReports] = useState(7)
  const [lastSession, setLastSession] = useState(null)
  const [friendsSection, setFriendsSection] = useState('now')
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
  /* The open thread: a real account ({ kind: 'real', profile }) or a seeded
     sample player ({ kind: 'sample', handle }). Real messages live in the
     database and are loaded by the thread itself; nothing is held here. */
  const [chat, setChat] = useState(null)
  const [planPreset, setPlanPreset] = useState({})
  /* Who you follow among the SEEDED players. This drives the prototype's
     presence, scores and planned sessions and is not the real follow graph -
     that is `follows` below, and the two never mix. */
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
  /* Where back goes. A single "the screen I came from" slot was enough while
     no two screens could open each other - then the conversation header
     started opening the profile, and the profile's Message button opened the
     conversation, and each overwrote the other's slot. Back then bounced
     between the two forever with no way out but a page reload, which is the
     trap the evaluation already caught once. A stack cannot do that: every
     step is recorded, and back unwinds them in order. */
  const [history, setHistory] = useState([])
  /* Your identity is your real profile when signed in. Without an account
     (a build with no Supabase configured) the seeded ME stands in, editable
     for the run only. */
  const profile = auth.profile
  const myId = auth.user?.id ?? null
  const [guestMe, setGuestMe] = useState({ handle: ME.handle, hue: null })
  const me = profile
    ? { id: profile.id, handle: profile.handle, hue: hueFromProfile(profile) }
    : guestMe
  /* The real follow graph: other accounts, both directions. */
  const follows = useFollows(myId)
  /* A real account being looked at, as opposed to a seeded player. */
  const [realPlayer, setRealPlayer] = useState(null)

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

  /* One line naming the open session that lets you reach its host, for the
     screens that have to say why a stranger's thread is open. */
  function viaLabel(session) {
    if (!session) return null
    const venue = arcades.find((a) => a.id === session.venue)
    return `${venue?.short ?? 'an arcade'}, ${session.whenLabel}`
  }

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

  /* Messaging is real and mutual-only: a thread with another account you
     follow both ways, stored in the database. The seeded players have no
     account behind them, so a Message tap on one of them opens a closed
     thread that says so rather than a box that goes nowhere. The old
     prototype exception for open-session hosts is not carried over - it will
     return when open sessions themselves are stored. */
  function openMessage(handle) {
    /* Seeded players: the prototype's own rule still decides whether the
       tap does anything at all. */
    if (
      !isMutual(handle, followingHandles) &&
      !openSessionWith(handle, planned, rsvps)
    )
      return
    setChat({ kind: 'sample', handle })
    push('chat')
  }

  function openRealChat(target) {
    setChat({ kind: 'real', profile: target })
    push('chat')
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

  /* Plans change, so telling someone you are coming has to be as undoable as
     saying yes to a session already is. */
  function unsendJoin(handle) {
    setJoinsSent((all) => {
      const next = { ...all }
      delete next[handle]
      return next
    })
    setJoinTarget((t) => (t && t.handle === handle ? { ...t, sent: false } : t))
  }

  /* Sending replaces the session it was opened on, if it was opened on one, so
     a change leaves one session rather than two. */
  function savePlan(plan) {
    setPlanned((list) =>
      list.some((s) => s.id === plan.id)
        ? list.map((s) => (s.id === plan.id ? plan : s))
        : [plan, ...list]
    )
  }

  function cancelPlan(id) {
    setPlanned((list) => list.filter((s) => s.id !== id))
    setRsvps((list) => list.filter((s) => s !== id))
  }

  /* Reopens Plan a session on an existing one, with everything already filled
     in, rather than making people rebuild it from scratch to move it an hour. */
  function editPlan(session) {
    openPlan({
      venue: session.venue,
      gameId: session.gameId,
      invited: session.asked ?? [],
      when: session.when,
      open: Boolean(session.open),
      note: session.note ?? '',
      editingId: session.id,
    })
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
    setFriendsSection('now')
    setTab('friends')
    goRoot('friends')
  }

  /* Same shape for the open sessions at a venue: the arcade page says there
     are some, and tapping through lands on Open filtered to that arcade. */
  function openSessionsAt(venueId) {
    setHereVenueId(venueId)
    setFriendsSection('open')
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
    setRealPlayer(null)
    setPlayerHandle(handle)
    push('player')
  }

  function openRealProfile(target) {
    setPlayerHandle(null)
    setRealPlayer(target)
    push('player')
  }

  /* Edits go to the real profile when there is one. The screen shows the
     server's answer - a taken username, most likely - under the field. */
  async function saveProfile({ handle, hue }) {
    if (profile) {
      const result = await auth.updateProfile({
        handle,
        avatar_hue: hue === null || hue === undefined ? null : String(hue),
      })
      if (!result.error) goBack()
      return result
    }
    setGuestMe({ handle, hue })
    goBack()
    return { error: null }
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

  /* Both ways out of a queue hand the slot back, so both go through here.
     Check-in counts you as one more solo party, so leaving has to take that
     back as well. Dropping only the party count turned one of the venue's
     pairs into a solo player on every pass: at KOKO on maimai, 10 parties
     with 4 solo came back as 10 with 5, so the running order drew a pair as
     a single player and the venue lost one of its 16 players. It compounds,
     and once enough pairs have been converted the wait falls with them. */
  function releaseQueueSlot() {
    const target = venueGame(
      arcades.find((a) => a.id === session.arcadeId),
      session.gameId
    )
    patchVenueGame(target.id, session.gameId, {
      queue: Math.max(0, target.queue - 1),
      solo: Math.max(0, target.solo - 1),
      updatedMinsAgo: 0,
      updatedAt: '12:38 PM',
    })
  }

  /* Leaving the queue is not checking out. Nothing was played, so no session
     is recorded and there is no summary to show - it drops you back on the
     venue, where you can queue again or look somewhere else. */
  function leaveQueue() {
    releaseQueueSlot()
    setActiveId(session.arcadeId)
    setSession(null)
    setModal(null)
    setTab('arcades')
    goRoot('detail')
  }

  function doCheckOut() {
    releaseQueueSlot()

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
              myId={myId}
              configured={auth.configured}
              follows={follows}
              onOpenProfile={openRealProfile}
              onAddPerson={() => push('addperson')}
            />
          )}

          {view === 'friends' && (
            <Friends
              arcades={arcades}
              game={game}
              onGame={setGame}
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
              onEditPlan={editPlan}
              onCancelPlan={cancelPlan}
              onUnsendJoin={unsendJoin}
              onOpenPlayer={openPlayer}
              onOpenClip={openClip}
              onOpenArcade={openArcade}
              onJoin={openJoin}
              onPlan={openPlan}
              onMessage={openMessage}
              onOpenMessages={() => push('messages')}
              onAddPerson={() => push('addperson')}
            />
          )}

          {view === 'chat' && chat?.kind === 'real' && (
            <RealThread
              myId={myId}
              partner={chat.profile}
              mutual={follows.relationship(chat.profile.id).mutual}
              onOpenProfile={() => openRealProfile(chat.profile)}
              onBack={goBack}
            />
          )}

          {view === 'chat' && chat?.kind === 'sample' && (
            <Message
              handle={chat.handle}
              messages={[]}
              canReply={false}
              subtitle="Sample player"
              blockedNote={`${chat.handle} is a sample player from the prototype, so there is nobody to write back. Messaging works between real accounts: find people under Me, then People.`}
              onOpenProfile={() => openPlayer(chat.handle)}
              onBack={goBack}
            />
          )}

          {view === 'editprofile' && (
            <EditProfile me={me} onSave={saveProfile} onBack={goBack} />
          )}

          {view === 'messages' && (
            <Inbox myId={myId} onOpen={openRealChat} onBack={goBack} />
          )}

          {view === 'plan' && (
            <PlanSession
              arcades={rows}
              preset={planPreset}
              me={me}
              onPlanned={savePlan}
              onBack={goBack}
              onDone={(open) => {
                /* A new invitation belongs with the other planned ones, not
                   in the list of who is at an arcade right now. An open one
                   lands on Open, where the people it was posted for will
                   see it. */
                setHereVenueId(null)
                setFriendsSection(open ? 'open' : 'planned')
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

          {view === 'player' && realPlayer && (
            <PlayerProfile
              player={{
                id: realPlayer.id,
                handle: realPlayer.handle,
                hue: hueFromProfile(realPlayer),
                games: [],
                songs: [],
                scores: null,
                at: null,
                real: true,
              }}
              relationship={follows.relationship(realPlayer.id)}
              arcade={null}
              joinedAt={null}
              onBack={goBack}
              onOpenArcade={openArcade}
              onJoin={() => {}}
              onUnsendJoin={() => {}}
              onMessage={() => openRealChat(realPlayer)}
              onToggleFollow={() => follows.toggle(realPlayer.id)}
              onPlan={() => {}}
            />
          )}

          {view === 'player' && !realPlayer && player && (
            <PlayerProfile
              player={player}
              relationship={playerRelationship}
              arcade={arcades.find((a) => a.id === player.at) ?? null}
              joinedAt={joinsSent[player.handle] ?? null}
              openSession={viaLabel(openSessionWith(player.handle, planned, rsvps))}
              onBack={goBack}
              onOpenArcade={openArcade}
              onJoin={openJoin}
              onUnsendJoin={unsendJoin}
              onMessage={openMessage}
              onToggleFollow={toggleFollow}
              onPlan={openPlan}
            />
          )}

          {view === 'me' && (
            <MeTab
              me={me}
              account={auth.user}
              onEditProfile={() => push('editprofile')}
              onSignOut={auth.signOut}
              reports={reports}
              sessions={3}
              visible={visible}
              onVisible={setVisible}
              onOpenFollows={(t) => {
                setFollowsTab(t)
                push('follows')
              }}
              followers={follows.followers.length}
              following={follows.following.length}
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
              openCount={
                openSessions(planned).filter((s) => s.venue === arcade.id).length
              }
              onOpenSessions={() => openSessionsAt(arcade.id)}
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
              onLeaveQueue={() => setModal('leavequeue')}
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
            onUndo={() => unsendJoin(joinTarget.handle)}
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
          <QueueExitSheet
            title={`Finished playing at ${sessionArcade.short}?`}
            detail={`Your place goes back and everyone behind you moves up one. How long you played and how long you queued are recorded.`}
            confirmLabel="Yes, check out"
            onCancel={() => setModal(null)}
            onConfirm={doCheckOut}
          />
        )}

        {modal === 'leavequeue' && sessionArcade && session && (
          <QueueExitSheet
            title={`Leave the queue at ${sessionArcade.short}?`}
            detail={`You give up position #${session.position} and everyone behind you moves up one. Nothing is recorded, because you have not played.`}
            confirmLabel="Yes, leave the queue"
            onCancel={() => setModal(null)}
            onConfirm={leaveQueue}
          />
        )}
      </div>
    </Frame>
  )
}

/* A live thread with another account.

   The conversation hook lives in this component rather than in the shell so
   its realtime channel opens when the thread is on screen and closes when it
   is not - going back, opening a different person, or signing out all
   unmount it. A thread with someone you no longer follow both ways is closed
   for replies and says why. */
function RealThread({ myId, partner, mutual, onOpenProfile, onBack }) {
  const thread = useConversation(myId, partner.id, mutual)
  return (
    <Message
      handle={partner.handle}
      hue={hueFromProfile(partner)}
      messages={thread.messages}
      canReply={mutual}
      subtitle={mutual ? 'You follow each other' : 'You don\u2019t follow each other'}
      blockedNote={`You and ${partner.handle} don\u2019t follow each other, so you can\u2019t send messages. Follow each other to talk.`}
      loading={thread.loading}
      error={thread.error}
      sending={thread.sending}
      sendError={thread.sendError}
      onSend={thread.send}
      onOpenProfile={onOpenProfile}
      onBack={onBack}
    />
  )
}

function Inbox({ myId, onOpen, onBack }) {
  const inbox = useInbox(myId)
  return (
    <Messages
      threads={inbox.threads}
      loading={inbox.loading}
      error={inbox.error}
      signedIn={Boolean(myId)}
      onOpen={onOpen}
      onBack={onBack}
    />
  )
}

/* SCREEN 7 - confirming a way out of the queue.

   Both exits give the slot back, so both ask first. They are not the same
   thing though: checking out ends a session that happened, while leaving the
   queue says one never started. From the waiting end of the queue only the
   second is true, so the copy has to separate them rather than leaving one
   button to mean both. */
function QueueExitSheet({ title, detail, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="anim-scrim absolute inset-0 z-10 flex items-end bg-ink/40">
      <div className="anim-sheet w-full rounded-t-2xl border-t border-line bg-surface p-4 shadow-2xl">
        <h2 className="font-display text-base font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail}</p>
        <div className="mt-4 space-y-2">
          <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        </div>
      </div>
    </div>
  )
}
