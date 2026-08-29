# Arcade Queue — mid-fi prototype

A functional medium-fidelity web prototype of an arcade queue app for rhythm-game
players, built from the lo-fi workflow in `Fig3_LoFi_Prototype_Workflow.jpg` and
from three field interviews conducted at Sydney arcades.

Stack: React + Vite + Tailwind CSS.

```bash
npm install
npm run dev
```

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
"best option" marker is computed from wait. On the seed data this inverts the
obvious answer: Timezone wins with 8 parties queued while Central Park loses
with 3, because Timezone runs four cabinets to Central Park's one. The compare
table exists to make that inversion visible.

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
| maimai DX | Throughput beats queue length — Timezone wins with 8 waiting against Central Park's 3, on four cabinets to one |
| Sound Voltex | Timezone is fastest at 4 min but 22 min stale, so Central Park wins on freshness |
| GITADORA | One venue of three — the filter narrowing to a real answer |
| DDR | Both venues stale, exercising the fallback when nothing is fresh |

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

## Screens

| Screen | Route | Notes |
| --- | --- | --- |
| 1 + 2 — Arcades | `arcades` | Pick a game, then one screen with two views. **List** carries queue, distance, wait and report age; **Compare** is the Arcade / Queue / Solo / Wait table with a computed best option. The lo-fi sheet drew these as two tabs, but they are the same venues with the same four numbers — splitting them cost a tab and made you navigate to answer one question. |
| 3 — Detail | `detail` | Stats plus Check In and Report. |
| 4A — Check-In | `checkin` | QR / NFC / Manual. |
| 5 — Scan target | `scan` | Cabinet placeholder; simulates a successful scan. |
| 4B — Report | modal | Queue and Solo steppers with a live wait preview. |
| 6 — Checked In | `checkedin` | Position, running order, one-turn-away notification. |
| 7 — Check out | modal | Confirmation. |
| 8 — Session summary | `summary` | Session time and time queued. |
| Watch | tab | Clip feed from people you follow, with your queue position pinned above it. |
| Friends — Here now | tab | People you follow who are at an arcade, grouped by venue. |
| Friends — Scores | tab | Uncapped per-song leaderboard with the official site's 20-favourite line drawn on it. |
| Player profile | `player` | Games, favourite songs, shared items, scores. No message button. |
| Followers / Following | `follows` | Roster with the direction of each relationship, reachable from Me. |
| Maps / Me | tabs | Gray map placeholder; profile, visibility toggle and privacy statement. |

The current screen number is printed under the device frame so the prototype can
be reviewed alongside the lo-fi sheet.

The tab bar is **Arcades · Watch · Maps · Friends · Me**. The lo-fi sheet had
Home, Compare, Maps and Me; Home and Compare merged into Arcades, and Watch and
Friends were added for the social layer.

---

## Mid-fi constraints

Deliberate limits, so the prototype is tested for flow and information rather
than for polish:

- **Colour** — black, white and `gray-100`–`gray-900` only. `blue-600` is
  reserved for the single primary action on a screen and appears nowhere else.
  "Best option" and "Stale" are carried by weight, border and an explicit word,
  not by colour.
- **Motion** — none. Every state change, tab switch and modal is instant.
- **Depth** — no shadows, glows, blurs or gradients.
- **Assets** — no photography or illustration. The cabinet, the clip, the map
  and the avatar are gray placeholder blocks; icons are inline single-weight
  strokes.
- **Text** — at most one short line of helper text per screen. Rationale,
  caveats and privacy detail live behind a `?` tooltip, which opens on hover,
  tap or focus and closes on the same frame. Explanation that does not fit in a
  tooltip belongs in the code or in this file, not on the screen. An earlier
  pass put it all on the screen as paragraphs; that reads as documentation,
  gets skipped, and clutters the layout — the worst of both outcomes.

The first three are enforced globally in `src/index.css` rather than left to
discipline, so the prototype cannot drift into hi-fi by accident.

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
