# Arcade Circle

A mid-fidelity web prototype for the Sydney arcade rhythm game community.

It started as a queue tracker. After talking to players we moved it towards the
problem underneath the queue, which is connection. The app still tracks queues,
but the point of it is getting people to the same cabinet at the same time.

Built from the lo-fi workflow in `Fig3_LoFi_Prototype_Workflow.jpg`, three field
interviews at Sydney arcades, and Week 6 consultation feedback.

```bash
npm install
npm run dev
npm run lint    # catches undefined references before they blank a screen
npm run build   # also the quickest check that every screen still renders
```

Stack: React, Vite and Tailwind.

## What the interviews told us

We ran three sessions. One at an arcade on a Wednesday, and two on 21 August.
Five findings shaped the build.

### 1. A queue number is useless without a timestamp

Right now players check a queue by messaging a group chat about an hour before
they travel. Replies take *"thirty or forty five minutes"*, and sometimes nobody
answers at all.

So every queue figure in the app shows how old it is. Anything older than 15
minutes gets marked `Stale` and is left out of the ranking. We would rather show
an honest gap than a confident wrong number.

### 2. Players pick a venue on throughput, not on queue length

One player told us he goes to the busier arcade on purpose, because *"there's
more cabs, so it can move more quickly"*. He called the extra travel *"the
moving cost"* and said he pays it happily.

So wait time is queue load divided by machine count, and the best option is
worked out from wait rather than from queue size. On the real cabinet counts
this flips the obvious answer. KOKO Town Hall wins with 10 parties queued while
Central Park loses with 7, because KOKO runs five maimai cabinets to Central
Park's two. KOKO is also the furthest away. The compare table exists to make
that trade-off visible.

### 3. Nobody can tell whose turn it is

The clearest quote we got was about people walking up and asking *"who's
next?"*, and nobody being sure. Another player called the queue *"very messy,
especially when it gets busy"*. People waiting are *"scrolling phones and
they're not paying attention"*, so they miss their turn.

So the checked-in screen shows your position and the full running order. You do
not have to ask anyone, and nobody has to answer. That matters for the player
who described herself as *"very introverted"*.

### 4. If check-in is not one tap, it will not happen

The arcade already has a paper queue board and it has failed. One player said
*"no one uses it because it's like lazy"*, and the marker was dead anyway. He
described it as *"dry"*, with *"no ink left"*. When we asked what would work he
said *"with a QR code"*, or tapping your phone.

So check-in is ordered QR, then NFC, then Manual. Manual is clearly marked as a
fallback for a broken sticker or a phone without NFC.

### 5. The queue counts parties, not people

Players who came together queue together. One interviewee explained that at a
venue with two linked cabinets, *"people like playing together, so they queue
together"*. A pair also holds the machine longer, because playing as two buys a
bonus song. As she put it, *"you get to play more"*.

So Queue and Solo are reported and shown separately. The wait model charges a
pair 6 minutes against a solo player's 4.

## The social layer

The queue findings came up on their own. When we asked what the pain points
were, the first answer was *"queue organization"*, before we had suggested
anything. The social ideas mostly came out only after we described a concept
first. That gap set the scope, so we only built the things a participant raised
without being prompted.

### Score comparison with no cap

This is the strongest evidence we have. A player who has been going for six
years told us the official maimai score site lets you favourite 20 people, and
*"you can't have more than that"*. He said getting around that limit would be
worth having, and we had not mentioned it.

So the Scores leaderboard ranks all 26 people you follow and draws a line where
the official site stops. On our data that line hides 7 players, and two of them
are checked into an arcade at that moment. The point of the screen is that the
person standing next to you can be invisible on the tool you use today.

### Who is out, on a map

Players told us they care about *"seeing where your friends are and all of
that"*. Consultation feedback pushed this further and asked for a map with
people on it, not just a list.

So the Circle tab opens on a map. Friends show as avatars, venues as pins. You
can pinch to zoom on a trackpad, drag to pan, and tap a pin to enter the venue.
Tapping a friend brings up a card with Join them and Message on it.

### Activity, which answers a different question

A presence list tells you who is there now. Activity tells you whether you have
just missed someone. If a friend left 25 minutes ago there is no point going.

Every row ends in something you can do, such as Join them, Plan the next one, or
Send congrats. Knowing where someone is does not count for much until it leads
somewhere.

### Clips

Asked what he does while queued, one player said he watches videos. The
interviewer noted that this seemed to be the general trend. The problem is that
the watching happens in another app, which is how people miss their turn.

So the Watch tab keeps your queue position pinned above the feed, and interrupts
playback when you are up. A feed that cannot pull you out of itself would make
the original problem worse. Watching is also how people get into these games.
The introverted player told us she watched friends play for ages before trying,
because it *"looked so cool"*.

### Plan a session

Presence pays off when it turns into a time and a place. Plan a session lets you
pick a venue, a game and a time, then invite mutuals. It lands as an invitation
on their Circle tab.

### Profiles and contact

Profiles show which games someone mainly plays and their favourite songs. Both
came up unprompted. Shared items are marked, so you can see what you have in
common before you say anything.

Messaging is limited to people you follow both ways. We took it out at one point
because of an interview finding, but that finding was about strangers. Our own
notes said the app *"can't force our users to just go up to someone they haven't
met"*, and that still holds. Nothing in the app reaches someone who has not
followed you back.

## What we did not build

**Invite and earn events.** This was our idea in a team session, not something a
participant asked for. Four things argue against it.

1. The game already does it. Playing as two gets you a bonus song, which is
   immediate and free. An app level reward competes with that and loses.
2. It needs money we do not have. We flagged this ourselves at the time.
   Discounts need the arcade to pay for them, and our goal is not arcade profit.
3. It asks introverts to recruit. The most repeated trait in our interviews is
   reluctance to approach people.
4. It can work against the queue goal. Pushing players onto one day creates the
   crowding the rest of the app helps them avoid.

The best version of the idea is demand smoothing, moving players off the Friday
and weekend peak. That is worth testing, but it serves the venue before the
player and it still needs a partner. We would want a willing venue and evidence
that an event flattens the peak before building it.

**Avoid lists.** One player said he would go back to a venue he avoids if he
could reliably know certain people were not there. It is a real need, but it
needs tracking people who have not agreed to be tracked. The venue level crowd
count gives some of the value without the surveillance.

## Venue data

Venues, games and cabinet counts are real, checked in August 2026. Queue counts
and wait times are made up.

| Venue | Address | maimai | CHUNITHM | SDVX | GITADORA | Taiko | DDR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Timezone Central Park | Level 2, Central Park Mall, 28 Broadway, Chippendale | 2 | 1 | 1 | none | 2 | none |
| Timezone Haymarket | Level 3, Market City, 9 to 13 Hay St, Haymarket | 2 | 2 | 1 | 2 | 1 | 2 |
| KOKO Amusement Town Hall | 614 George Street, Sydney | 5 | 3 | 2 | 1 | 5 | 2 |

Two things came out of checking.

Timezone George St does not exist any more. The store at 505 George Street is
closed. The George Street rhythm arcade is KOKO Amusement Town Hall at 614
George Street, and it is by far the biggest of the three.

Central Park has neither GITADORA nor DDR, so it genuinely drops out of those
two filters.

Distances are walking distance from UTS Broadway, since that is where we were
based. Arcade line-ups change often, so check again before relying on this.

Sources: [SEGA maimai DX location finder](https://location.am-all.net/alm/location?gm=98&lang=en&ct=1012),
[Timezone Central Park](https://www.timezonegames.com/en-au/venues/nsw/timezone-central-park/),
[Zenius-i-vanisher: Central Park](https://zenius-i-vanisher.com/v5.2/arcade.php?id=4598),
[Haymarket](https://zenius-i-vanisher.com/v5.2/arcade.php?id=4114),
[KOKO Town Hall](https://zenius-i-vanisher.com/v5.2/arcade.php?id=5910).

## Screens

| Screen | Route | What it does |
| --- | --- | --- |
| Circle, Map | tab | Friends as avatars, venues as pins. Pinch to zoom, drag to pan, tap to act. |
| Circle, Here now | tab | Who is out, grouped by venue, each row ending in Join. |
| Circle, Activity | tab | What people did and when, each line ending in an action. |
| Circle, Scores | tab | Uncapped leaderboard with the 20 favourite limit drawn on it. |
| Watch | tab | Clips from people you follow, with your queue position pinned above. |
| Comments | modal | Comment thread on a clip. |
| Arcades, List and Compare | tab | Queue, distance, wait and report age, plus the compare table. |
| Detail | `detail` | Venue stats, an expandable queue, and one primary action. |
| Check-In | `checkin` | QR, NFC or Manual. |
| Scan | `scan` | Cabinet placeholder, simulates a scan. |
| Confirm | `confirm` | Pre-filled count to confirm or correct before joining. |
| Checked In | `checkedin` | Your position and the running order. |
| Session summary | `summary` | Session time and time queued. |
| Plan a session | `plan` | Venue, game, time and who to ask. |
| Message | modal | Mutual only. |
| Player profile | `player` | Games, songs, scores, and the actions. |
| Liked clips | `liked` | Clips you saved, reachable from Me. |
| Followers and Following | `follows` | Who can see you, and who you can see. |
| Directions | modal | Hands off to Apple Maps or Google Maps. |
| Me | tab | Profile, counts, visibility and privacy. |

Screens 1 to 8 from the lo-fi sheet all still run end to end. The current screen
name prints under the phone frame so the prototype can be reviewed next to the
sheet.

The tab bar is Circle, Watch, Arcades, Me. The lo-fi sheet had Home, Compare,
Maps and Me. Home and Compare merged into Arcades. Watch and Circle were added
for the social layer. People come first because the project is about connection.

Maps is no longer its own tab. As a venue directory it just repeated the list.
Consultation feedback asked for a map with people on it, which is a view of the
community rather than a second directory, so it lives inside Circle. Real
routing still hands off to the phone. Players choose a venue while they are
already moving, so at that point they want live transit, and the phone does that
properly.

## Fidelity

Week 6 consultation feedback reset what this stage should be. Mid-fidelity is
meant to carry colour, type, motion and depth. It is the stage where a design
starts to look like the finished product, while high fidelity is where it also
behaves like one. An earlier pass suppressed all four, and the prototype read as
a wireframe because of it. That suppression is gone.

- **Colour.** An indigo brand colour for primary actions, semantic colours for
  fresh, stale and live, and one hue per game. Game colour is used on dots, bars
  and pins but never on body text, so contrast never depends on the hue. Tokens
  sit at the top of `src/index.css`.
- **Type.** Space Grotesk for headings and numbers, Inter for text.
- **Motion.** Screens enter, sheets rise, lists stagger, the like button reacts
  and live dots pulse. Everything is short and all of it turns off under
  `prefers-reduced-motion`.
- **Depth.** Elevation separates sheets, the tab bar and map pins from the page.
- **Assets.** Still no photography. The map and the clip frame are drawn, and
  avatars are generated from the handle, so the repo ships no image files.
- **Text.** One short line of helper text per screen at most. Longer explanations
  sit behind a `?` tooltip, which measures itself against the frame and flips
  side so it cannot get clipped. Each screen also says in one line what it is
  for.

## Code

| Where | What |
| --- | --- |
| `src/data.js` | Venues, per game queues, map positions |
| `src/social.js` | People, clips, activity, planned sessions |
| `src/lib/queue.js` | Wait model, staleness, queue roster, venue resolvers |
| `src/lib/social.js` | Leaderboard, presence, follows, formatting |
| `src/components/ui.jsx` | Shared primitives |
| `src/screens/` | One file per screen |

Reporting a queue or checking in changes the shared state, so the list, the
compare table and the detail screen all move together.

Raw interview transcripts are not committed. Participants agreed to a university
project, not to publication. The findings above are the record we keep.
