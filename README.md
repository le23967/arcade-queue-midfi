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

### Privacy

Check-in is recorded against a venue, never a coordinate, and reports are
anonymous. This follows the team's own conclusion that precise GPS is both
unreliable and intrusive — *"GPS is not accurate"*, *"that will be related to
the privacy issue"* — resolved as registering a player who is merely near the
venue.

---

## Screens

| Screen | Route | Notes |
| --- | --- | --- |
| 1 — Nearby Arcade | `nearby` | List with queue, distance, wait and report age. Sort by distance or wait. |
| 2 — Compare | `compare` | Arcade / Queue / Solo / Wait table with a computed best option. |
| 3 — Detail | `detail` | Stats plus Check In and Report. |
| 4A — Check-In | `checkin` | QR / NFC / Manual. |
| 5 — Scan target | `scan` | Cabinet placeholder; simulates a successful scan. |
| 4B — Report | modal | Queue and Solo steppers with a live wait preview. |
| 6 — Checked In | `checkedin` | Position, running order, one-turn-away notification. |
| 7 — Check out | modal | Confirmation. |
| 8 — Session summary | `summary` | Session time and time queued. |
| Maps / Me | tabs | Gray map placeholder; profile and privacy statement. |

The current screen number is printed under the device frame so the prototype can
be reviewed alongside the lo-fi sheet.

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
- **Assets** — no photography or illustration. The cabinet, the map and the
  avatar are gray placeholder blocks; icons are inline single-weight strokes.

The first three are enforced globally in `src/index.css` rather than left to
discipline, so the prototype cannot drift into hi-fi by accident.

---

## Data

Seed data lives in `src/data.js` and the wait model in `src/lib/queue.js`.
Reporting a queue or checking in mutates the shared state, so the list, the
compare table and the detail screen all move together.

Raw interview transcripts are not committed — participants consented to a
university project, not to publication. The findings above are the distilled
record.
