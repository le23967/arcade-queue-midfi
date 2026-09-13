import { Screen, Body, PrimaryButton, Seg } from '../components/ui.jsx'
import { GAMES } from '../data.js'

/* First use.

   The Week 7 critique found that a reviewer landing on the map could not say
   what the app was for. One screen, one sentence, and the one choice the
   rest of the prototype depends on: which game's queues you are looking at.
   It is not a tutorial - nothing after Continue explains anything - and it
   is deliberately not remembered, so every field-study participant starts
   from the same place on a reload. */
export default function Welcome({ game, onGame, onContinue }) {
  return (
    <Screen>
      <Body className="flex flex-col justify-center px-6 py-8">
        <p className="font-display text-2xl font-semibold text-ink">
          Arcade Circle
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          See who&rsquo;s at nearby rhythm-game arcades, compare live queues,
          and plan a session.
        </p>

        <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Choose a game to start
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Game">
          {GAMES.map((g) => (
            <Seg
              key={g.id}
              on={g.id === game}
              accent={g.color}
              aria-pressed={g.id === game}
              onClick={() => onGame(g.id)}
            >
              {g.label}
            </Seg>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-subtle">
          You can change this any time.
        </p>
      </Body>

      <div className="border-t border-line p-4">
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </div>
    </Screen>
  )
}
