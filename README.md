# Arcade Circle — mid-fi prototype

A functional medium-fidelity web prototype for the Sydney arcade rhythm-game
community, built from the lo-fi workflow in `Fig3_LoFi_Prototype_Workflow.jpg`,
from three field interviews conducted at Sydney arcades, and from Week 6
consultation feedback.

The project began on queue visibility and has moved on to the connection
problem underneath it: the queue is still tracked, but the point of the app is
getting people to the same cabinet at the same time.

Stack: React + Vite + Tailwind CSS.

```bash
npm install
npm run dev
npm run lint   # catches undefined references before they blank a screen
npm run build  # also the fastest check that every screen still renders
```

`npm run lint` exists for one reason. Twice, a bulk edit across screens dropped
an import and left a component referenced but undefined. React throws mid-render
and unmounts the whole tree, so the symptom is a blank white screen with nothing
to explain it — and it only appears when you happen to click that one section.
`no-undef` turns that into a build-time error. A small error boundary also keeps
a future crash inside the phone frame with the message visible, rather than
ending a live critique with a white void.

---

## What the interviews said

Five findings drove the design. Each one changed something specific in the UI.

### 1. The number is worthless without a timestamp

Players currently check a queue by messaging a group chat about an hour before
they travel. Replies take *"thirty or forty five minutes"*, and *"sometimes you
just don't get responses"* at all.

**In the UI:** every queue figure carries its age — on the list, in the compare
table, and as a first-class stat on the detail screen. Anything older than
15 minutes is labelled `STALE`, and stale venues are excluded from ranking
rather than quietly trusted.

### 2. Players choose on throughput, not on queue length

*"I'll go mostly to [the emptier one] just because there's more cabs, so it can
move more quickly ... even if it is comparatively bad, it's the moving cost."*

**In the UI:** wait is derived from queue load divided by machine count, and the
"best option" marker is computed from wait. On real cabinet counts this inverts
the obvious answer: on maimai, KOKO Town Hall wins with **10** parties queued
while Timezone Central Park loses with **7**, because KOKO runs five cabinets to
Central Park's two. KOKO is also the furthest away. The compare table exists to
make that trade-off visible.

### 3. Nobody can tell whose turn it is

*"People just come up and they're like, who's next?" ... "They weren't sure."*
*"It's very messy, especially when it gets busy."* Waiting players are
*"scrolling phones and they're not paying attention"*.

**In the UI:** the checked-in screen shows an explicit position (`#4 of 5`) and
the full running order. No one has to ask, and no one has to answer — which
matters for the interviewee who described themselves as *"very introverted"*.

### 4. If check-in isn't one tap, it won't happen

The venue already has a manual queue board and it has failed: *"there's a
[queue board] but no one uses it because it's like lazy"* — and the marker was
dead, *"it's dry out, it's got no ink left"*. Asked what would work instead:
*"With a QR code or ... tap your phone again — it would be nice."*

**In the UI:** check-in is ordered QR → NFC → Manual, with Manual explicitly
demoted to a fallback for a broken sticker or a phone without NFC.

Reporting the count is now **part of check-in** rather than a second button
beside it. Reporting and checking in are not the same action — one says *the
line is this long*, the other says *I am joining it*, and you can do the first
without the second — but as UI they competed: two buttons at equal weight at
the bottom of the screen, one of them occasional. So the detail screen keeps a
single primary action, and the report moves to the two places it belongs:

- **Inside check-in**, as a confirm step. You have just scanned at the cabinet,
  so you are standing in front of the line and can count it. The steppers
  arrive pre-filled, so an already-correct count stays one tap. Every check-in
  now carries a verified number instead of a blind +1 on an unconfirmed one.
- **Inside the expanded queue**, as *Update count*, which is where a wrong
  number is actually visible.

### 5. Queue counts parties, not people

*"There's two cabinets that you can play together, so people like playing
together, so they queue together."* And a pair holds the machine longer than a
solo player, because pairing buys a bonus song: *"if you play as two people, you
get like an extra song, so you get to play more."*

**In the UI:** Queue and Solo are reported and displayed separately, and the
wait model charges a pair 6 minutes against a solo player's 4. The report modal
recalculates the estimate live as you step the numbers, so the reporter can see
their report is worth making.

### 6. A queue belongs to a game, not to a venue

Every interviewee talks about one cabinet's queue, never the building's. The
Sound Voltex player queues for Sound Voltex — *"it really depends on time of
day … especially at Ikebukuro, 'cause there's two cabinets that you can play
together"* — while the maimai players queue for maimai. Asking "how busy is
Market City?" is not a question anyone actually has.

**In the UI:** the game is chosen first, on Arcades, and every number below it
is that game's queue at that venue. No venue runs all six games, so the filter
genuinely narrows the list — GITADORA is at one arcade only. The detail screen
lists the other games at the same venue with their own queues, so switching is
one tap when your first choice is backed up.

This also makes the seed data carry more than one lesson:

| Game | What it demonstrates |
| --- | --- |
| maimai DX | Throughput beats queue length — KOKO wins with 10 waiting against Central Park's 7, on five cabinets to two, despite being furthest away |
| Sound Voltex | KOKO is fastest at 4 min but 26 min stale, so Central Park wins on freshness |
| GITADORA | Two venues of three — Central Park genuinely does not have it |
| DDR | Both venues stale, exercising the fallback when nothing is fresh |

### 7. The queue count is not the same as the queue

A count says how long the line is. It does not say who is in it, and it quietly
implies the app knows. It does not: the number comes from a report, and most
people in a physical arcade queue are not running this.

**In the UI:** the Queue stat on the detail screen expands into the line
itself. Parties that checked in through the app are named; everyone else is
held as a **guest** placeholder rather than guessed at, and a footer says how
many of the total actually checked in. Central Park reads *3 of 7*. Market City
reads *0 of 11* — which is also why its number is 41 minutes stale. The two
facts explain each other.

Parties that came together show as one slot (`kzt +1`, `+2 guests`), because
that is how they hold a machine, and the first rows read *Playing now* rather
than *Waiting* for as many cabinets as the venue actually runs.

### Privacy

Check-in is recorded against a venue, never a coordinate, and reports are
anonymous. This follows the team's own conclusion that precise GPS is both
unreliable and intrusive — *"GPS is not accurate"*, *"that will be related to
the privacy issue"* — resolved as registering a player who is merely near the
venue.

---

## The social layer, and what was deliberately left out

The queue findings above were **volunteered** — asked "any pain points?", players
answered "I think it's just queue organization" before anything was suggested to
them. The social findings mostly appeared **only after an interviewer described a
concept first**. That asymmetry set the scope: only the three things a
participant raised on their own are built.

### Built — evidence graded

**A. No cap on score comparison** *(strongest evidence — volunteered, specific)*

The six-year maimai player raised this without being prompted. The official
score site lets you favourite 20 people: *"the website lets you favorite up to
20 people, and then on whatever song you use, you'll show all the scores"* …
*"but you can't have more than that"* → *"if you make something [to] get around
that, **that would actually be like—**"*

**In the UI:** the Friends → Scores leaderboard ranks all 26 people you follow
and draws a dashed line where the official site stops. On the seed data that
line hides 7 players — two of whom are checked into an arcade at that moment.
The point of the screen is that the person standing next to you can be
invisible on the tool you use today.

**B. Who's here, at venue level** *(moderate evidence)*

*"Seeing where your friends are and all of that."* The Sound Voltex player also
said yes to knowing when people she already knows are playing.

**In the UI:** Friends → Here now, grouped by venue, plus a "people you follow"
row on the arcade detail screen. Presence is mutual-follow, opt-in, and venue
level — never a position inside a venue.

**C. Passive profile signals** *(moderate evidence)*

*"Just being able to see like, oh, I mainly play Maimai … DDR or whatever"* and
*"Favourite songs? Absolutely."*

**In the UI:** games played and favourite songs on every profile, with shared
ones marked. There is no message button. The team had already concluded that
*"the app can't force our users to just go up to someone they haven't met"* —
*"it's impossible"* — so the profile lowers the cost of an opening rather than
brokering one. That matches how the veteran actually met people: at the
cabinet, because someone else said *"do you wanna play together?"*

**D. Followers and following** *(structural, not vanity)*

Reachable from Me. Worth having as its own screen because the direction of a
relationship is functional here, not decorative: presence is shared only
between mutuals, so "follows you" and "not mutual" change what each person can
actually see.

**E. Watch — a clip feed** *(moderate evidence, and it earns its place by
attaching to the queue)*

Asked what he does while queued, a player answered *"watch videos"*, and the
interviewer noted *"I'm guessing that's the general trend."* The failure is
that the watching happens in a different app, so *"scrolling phones and they're
not paying attention"* becomes a queue nobody can run and a group asking *"who's
next?"*

**In the UI:** clips from people you follow, with your live queue position
pinned above the feed and a simulated *"You're up"* takeover that interrupts
playback. That interruption is the reason the feature exists — a feed that
cannot pull you out of itself would make the original problem worse, not
better.

It also serves the on-ramp the team said they wanted for people outside the
community. The introverted player got in by watching: *"I'd watch like my
friends play for ages … I was really interested 'cause it looked so cool."*
Another described it as *"watching a concert almost … a display of skill."*

**F. Activity** *(the temporal half of presence)*

A presence list answers "who is there now". Activity answers **"did I just
miss them"** — if someone left 25 minutes ago there is no point going. Both
questions came out of the same interview interest in seeing where friends are;
only the first one had a screen.

Plain sentences in reverse time order: checked in, left, played a set, posted a
clip, set a new best. A mid-fi feed is a list, not a timeline graphic.

**G. Like and comment on clips** *(watching without a reply is half a feature)*

A feed you can only watch is worse than no feed: you see your friends play and
have no way to say anything. Like and comment are the two cheapest replies, and
**the like needs no words at all** — which is the point for the players who
would rather not start a conversation. Liked state is a black fill, never a
red heart; the palette has one accent and it belongs to primary actions.

**Liked clips live under Me, not under Watch.** Watch is a lean-back surface —
one clip at a time, served to you, in order. Retrieving something you saved is
the opposite task: you have a specific thing in mind and you are going to find
it. Those two want different shapes (a pager versus a list), and folding a
saved list into Watch's segmented control would have mixed two content
*sources* (Following / Nearby) with one saved *state* in the same control — a
category error in what the control means. Me is already the tab for things that
belong to you: your sessions, your reports, who you follow, your songs. Liked
clips fit that model without changing what the tab means, and it is where
Instagram and TikTok both put theirs, so it is where people look first.

### Not built

**Invite-and-earn events (points for bringing people on quiet weekdays)** —
parked as future work. It was the team's own idea in the Wednesday session, not
a participant request, and four things argue against building it now:

1. **The game already does it.** *"If you play as two people, you get like an
   extra song. So you get to play more. So there is a lot of incentive to
   actually like socialize."* An app-level reward duplicates an in-game
   mechanic that is immediate, free, and already working.
2. **It needs money the project does not have.** The team flagged this
   themselves: *"who gonna provide the money?"* and *"that's very hard, we need
   to coordinate with the arcade"* — against their own stated goal, *"our core
   goal isn't to make money or to help the arcade profit."*
3. **It asks introverts to recruit.** The most repeated personal trait across
   the interviews is reluctance to approach people — *"Very introverted."* A
   referral mechanic puts that first.
4. **It can fight the queue goal.** Concentrating players on a chosen day
   creates the crowding the rest of the app exists to help people avoid.

The strongest version of the idea is *demand smoothing* — moving players off the
reported Friday/weekend peak onto quiet weekdays. That is worth testing, but it
serves the venue's revenue before the player's stated need, and still requires
arcade partnership. **Preconditions before building:** a willing venue partner,
and evidence that an event flattens the peak rather than creating a new one.

**Avoid-lists** — one player would return to a venue he avoids if he could
reliably know certain people were not there (*"Honestly, probably"*). Real need,
not built: it requires tracking people who have not consented to being tracked.
The venue-level crowd count gives partial value without the surveillance.

---

## Venue data

Venues, games and **cabinet counts are real**, checked August 2026. Queue
counts and wait times are invented; everything else is not.

| Venue | Address | maimai | CHUNITHM | SDVX | GITADORA | Taiko | DDR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Timezone Central Park | Level 2, Central Park Mall, 28 Broadway, Chippendale | 2 | 1 | 1 | — | 2 | — |
| Timezone Haymarket | Level 3, Market City, 9–13 Hay St, Haymarket | 2 | 2 | 1 | 2 | 1 | 2 |
| KOKO Amusement Town Hall | 614 George Street, Sydney | 5 | 3 | 2 | 1 | 5 | 2 |

Two corrections came out of the check:

- **Timezone George St does not exist.** The Timezone at 505 George Street is
  permanently closed. The George Street rhythm arcade is **KOKO Amusement Town
  Hall** at 614 George Street, and it is by far the largest of the three — five
  maimai cabinets and five Taiko cabinets.
- **Central Park has neither GITADORA nor DDR**, so it drops out of those two
  filters for real.

Distances are walking distance from UTS Broadway, since the interviews were run
by students based there.

Arcade line-ups change often — re-check before relying on this.

Sources: [SEGA maimai DX International location finder](https://location.am-all.net/alm/location?gm=98&lang=en&ct=1012) ·
[Timezone Central Park](https://www.timezonegames.com/en-au/venues/nsw/timezone-central-park/) ·
[Zenius-i-vanisher: Timezone Central Park](https://zenius-i-vanisher.com/v5.2/arcade.php?id=4598) ·
[Zenius-i-vanisher: Timezone Haymarket](https://zenius-i-vanisher.com/v5.2/arcade.php?id=4114) ·
[Zenius-i-vanisher: KOKO Amusement Town Hall](https://zenius-i-vanisher.com/v5.2/arcade.php?id=5910)

---

## Screens

| Screen | Route | Notes |
| --- | --- | --- |
| 1 + 2 — Arcades | `arcades` | Pick a game, then one screen with two views. **List** carries queue, distance, wait and report age; **Compare** is the Arcade / Queue / Solo / Wait table with a computed best option. The lo-fi sheet drew these as two tabs, but they are the same venues with the same four numbers — splitting them cost a tab and made you navigate to answer one question. |
| 3 — Detail | `detail` | Stats, an expandable queue, and one primary action: Check In. |
| 4A — Check-In | `checkin` | QR / NFC / Manual. |
| 5 — Scan target | `scan` | Cabinet placeholder; simulates a successful scan. |
| Check-In — confirm | `confirm` | Pre-filled count to confirm or correct before joining. |
| 4B — Report | modal | Queue and Solo steppers with a live wait preview, reached from *Update count* in the expanded queue. |
| 6 — Checked In | `checkedin` | Position, running order, one-turn-away notification. |
| 7 — Check out | modal | Confirmation. |
| 8 — Session summary | `summary` | Session time and time queued. |
| Watch | tab | Clip feed from people you follow, with your queue position pinned above it. Like and comment on each clip. |
| Comments | modal | Comment thread on a clip; posting adds to it. |
| Liked clips | `liked` | Clips you liked, reachable from Me; opening one jumps into the feed at that clip. |
| Circle — Map | tab | Friends as avatars and venues as pins on a drawn map, zoomable, venues enterable. |
| Circle — Here now | tab | People you follow who are at an arcade, grouped by venue, each row ending in **Join**. |
| Circle — Activity | tab | What friends did and when, each line ending in the action it enables. |
| Circle — Scores | tab | Uncapped per-song leaderboard with the official site's 20-favourite line drawn on it. |
| Plan a session | `plan` | Venue, game, time and who to ask; lands as an invitation on their Circle tab. |
| Message | modal | Mutual-only, with openers drawn from what the feed actually raises. |
| Player profile | `player` | Games, favourite songs, shared items, scores, and the actions: join them, plan a session, message. |
| Followers / Following | `follows` | Roster with the direction of each relationship, reachable from Me. |
| Directions | modal | Hands off to Apple Maps or Google Maps from the venue address. |
| Me | tab | Profile, follower counts, visibility toggle and privacy statement. |

The current screen number is printed under the device frame so the prototype can
be reviewed alongside the lo-fi sheet.

The tab bar is **Circle · Watch · Arcades · Me**. The lo-fi sheet had Home,
Compare, Maps and Me. Home and Compare merged into Arcades; Watch and Circle
were added for the social layer; people come first because the project is about
connection rather than queue-reading.

**Why the map lives inside Circle.** A standalone Maps tab duplicated the
venue list and answered nothing it did not. Consultation feedback asked for the
map back, but for people on it — friends as avatars, venues as pins, zoomable,
venues enterable — which is a view of the community rather than a second venue
directory. So it is a view inside Circle. Real routing still hands off to the
phone's own maps app: players choose a venue while already moving — *"usually
just when I get on the bus"*, *"as I'm on the way to the city"* — so at that
moment they want live transit, which the phone does properly.

---

## Fidelity

Week 6 consultation feedback reset what this stage should be. Mid-fidelity is
expected to carry colour, type, motion and depth: the stage where a design
starts to resemble the finished product, with high fidelity being where it also
behaves like it. An earlier pass suppressed all four globally, which left the
prototype reading as a wireframe. That suppression is gone.

- **Colour** — an indigo brand for primary actions, semantic tokens for
  fresh / stale / live, and **one hue per game**. The game hue is used for
  dots, bars and pins but never for body text, so a venue row or a map pin
  says which game it is about before the label is read, and contrast never
  depends on the hue. Tokens live at the top of `src/index.css`.
- **Type** — Space Grotesk for headings and numbers, Inter for text.
- **Motion** — screens enter, sheets rise, lists stagger, the like reacts,
  live indicators pulse. Everything is short, and all of it is disabled under
  `prefers-reduced-motion`.
- **Depth** — elevation separates sheets, the tab bar and pins from the page.
- **Assets** — still no photography. The clip and the map are drawn, and
  avatars are generated from the handle, so the repo ships no image files.
- **Text** — at most one short line of helper text per screen; the rest sits
  behind a `?` tooltip that measures itself against the frame and flips side
  so it cannot be clipped. Each screen also carries a one-line statement of
  what it is for, because feedback was that every feature has to answer that.

---

## Data

Queue data lives in `src/data.js` — a venue holds one record per game it runs —
with the wait model and the game resolvers in `src/lib/queue.js`;
players, songs and scores live in `src/social.js` with helpers in
`src/lib/social.js`.
Reporting a queue or checking in mutates the shared state, so the list, the
compare table and the detail screen all move together.

Raw interview transcripts are not committed — participants consented to a
university project, not to publication. The findings above are the distilled
record.
