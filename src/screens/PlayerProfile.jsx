import { Screen, TopBar, Body, Placeholder, Note, Chip } from '../components/ui.jsx'
import { SONGS } from '../social.js'
import {
  sharedSongs,
  sharedGames,
  gradeOf,
  formatAchievement,
} from '../lib/social.js'

/* Player profile.

   No message button, and that is deliberate. The team already worked out that
   "the app can't force our users to just go up to someone they haven't met" -
   "it's impossible". So the profile does not try to broker a conversation. It
   shows what you already have in common and leaves the opening where it
   actually happened for the six-year player: at the cabinet, because the
   other person said "do you wanna play together?"

   What it shows is only what participants volunteered: which game someone
   mainly plays, their songs, and their scores. */
export default function PlayerProfile({ player, arcade, onBack, onOpenArcade }) {
  const songs = sharedSongs(player)
  const games = sharedGames(player)

  return (
    <Screen>
      <TopBar title={player.handle} onBack={onBack} />

      <Body>
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-4">
          <Placeholder className="h-14 w-14 flex-none" label="" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{player.handle}</p>
            <p className="text-xs text-gray-600">{player.games.join(' · ')}</p>
          </div>
        </div>

        {arcade && (
          <button
            type="button"
            onClick={() => onOpenArcade(arcade.id)}
            className="w-full border-b border-gray-300 px-4 py-3 text-left"
          >
            <p className="text-xs uppercase tracking-wide text-gray-600">
              Here now
            </p>
            <p className="text-sm font-semibold text-gray-900">{arcade.name}</p>
            <p className="text-xs tabular-nums text-gray-600">
              Checked in {player.sinceMin} min ago
            </p>
          </button>
        )}

        <Section title="In common">
          {games.length === 0 && songs.length === 0 ? (
            <p className="text-sm text-gray-600">Nothing on record yet.</p>
          ) : (
            <div className="space-y-2">
              {games.length > 0 && (
                <p className="text-sm text-gray-900">
                  You both play{' '}
                  <span className="font-semibold">{games.join(' and ')}</span>.
                </p>
              )}
              {songs.length > 0 && (
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{songs.join(', ')}</span>{' '}
                  {songs.length === 1 ? 'is' : 'are'} in both your favourites.
                </p>
              )}
            </div>
          )}
        </Section>

        <Section title="Favourite songs">
          <div className="flex flex-wrap gap-1.5">
            {player.songs.map((s) => (
              <Chip key={s} className={songs.includes(s) ? 'border-gray-900 text-gray-900' : ''}>
                {s}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Scores">
          <ul>
            {SONGS.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 border-b border-gray-300 py-2 last:border-b-0"
              >
                <span className="flex-1 text-sm text-gray-900">{s.title}</span>
                <span className="text-sm tabular-nums text-gray-900">
                  {formatAchievement(player.scores[s.id])}
                </span>
                <Chip>{gradeOf(player.scores[s.id])}</Chip>
              </li>
            ))}
          </ul>
        </Section>

        <div className="px-4 pb-4">
          <Note>
            There is no message button. The app shows you who is around and what
            you already have in common; the conversation happens at the cabinet.
          </Note>
        </div>
      </Body>
    </Screen>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-300 px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">{title}</p>
      {children}
    </div>
  )
}
