import {
  Screen,
  TopBar,
  Body,
  Avatar,
  Chip,
  Info,
  PrimaryButton,
  SecondaryButton,
  GameDot,
} from '../components/ui.jsx'
import { SONGS } from '../social.js'
import {
  sharedSongs,
  sharedGames,
  gradeOf,
  formatAchievement,
} from '../lib/social.js'

/* Player profile.

   This screen used to end in nothing on purpose. The team's own conclusion was
   that "the app can't force our users to just go up to someone they haven't
   met" - "it's impossible" - so it showed what you had in common and stopped.
   The six-year player's own way in was someone else opening with "do you wanna
   play together?" at the cabinet, not an app.

   Consultation feedback was that a feature which only tells you where someone
   is has no purpose - knowing has to lead to joining them, asking them about
   the venue, or arranging to meet. So the actions are back, scoped to people
   you follow both ways. The stranger case is untouched: nothing here appears
   for someone who has not followed you back, so the original finding still
   holds where it applied.

   Every field below the handle is optional. Someone who follows you and whom
   you have not followed back is on record as a handle and a game and nothing
   else, so this screen has to render that person as readily as a mutual whose
   scores it has had for months. It reads the relationship from explicit state
   rather than inferring it from which fields happen to be missing. */
export default function PlayerProfile({
  player,
  relationship,
  arcade,
  joinedAt,
  onBack,
  onOpenArcade,
  onJoin,
  onMessage,
  onToggleFollow,
  onPlan,
}) {
  const rel = relationship ?? {
    youFollow: false,
    followsYou: false,
    mutual: false,
    label: 'Not connected',
  }
  const songs = sharedSongs(player)
  const games = sharedGames(player)
  const playerGames = player.games ?? []
  const playerSongs = player.songs ?? []
  const joined = joinedAt && arcade && joinedAt === arcade.id

  return (
    <Screen>
      <TopBar
        title={player.handle}
        subtitle={
          rel.mutual
            ? 'You follow each other'
            : rel.youFollow
              ? 'You follow them'
              : rel.followsYou
                ? 'Follows you'
                : 'Not connected'
        }
        onBack={onBack}
      />

      <Body>
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <Avatar handle={player.handle} size={56} live={Boolean(arcade)} />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-ink">
              {player.handle}
            </p>
            <p className="truncate text-xs text-ink-muted">
              {playerGames.length > 0 ? playerGames.join(' · ') : 'No games listed'}
            </p>
          </div>
          <Chip className="ml-auto" tone={rel.mutual ? 'brand' : 'default'}>
            {rel.label}
          </Chip>
        </div>

        {arcade && (
          <button
            type="button"
            onClick={() => onOpenArcade(arcade.id)}
            className="flex w-full items-center gap-3 border-b border-line bg-fresh-bg px-4 py-3 text-left transition-colors duration-150 hover:brightness-95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-fresh" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-fresh" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink">
                At {arcade.name}
              </span>
              <span className="block text-xs tabular-nums text-ink-muted">
                Checked in {player.sinceMin} min ago
              </span>
            </span>
            <span className="text-xs font-semibold text-fresh">Open</span>
          </button>
        )}

        <Section title="In common">
          {games.length === 0 && songs.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing on record yet.</p>
          ) : (
            <div className="space-y-1.5">
              {games.length > 0 && (
                <p className="text-sm text-ink">
                  You both play{' '}
                  <span className="font-semibold">{games.join(' and ')}</span>.
                </p>
              )}
              {songs.length > 0 && (
                <p className="text-sm text-ink">
                  <span className="font-semibold">{songs.join(', ')}</span>{' '}
                  {songs.length === 1 ? 'is' : 'are'} in both your favourites.
                </p>
              )}
            </div>
          )}
        </Section>

        <Section title="Favourite songs">
          {playerSongs.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {player.handle} has not shared any favourites yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {playerSongs.map((s) => (
                <Chip key={s} tone={songs.includes(s) ? 'brand' : 'default'}>
                  {s}
                </Chip>
              ))}
            </div>
          )}
        </Section>

        {player.scores && (
          <Section title="Scores">
            <ul>
              {SONGS.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 border-b border-line py-2 last:border-b-0"
                >
                  <GameDot color="var(--game-maimai)" />
                  <span className="flex-1 text-sm text-ink">{s.title}</span>
                  <span className="font-display text-sm tabular-nums text-ink">
                    {formatAchievement(player.scores[s.id])}
                  </span>
                  <Chip tone={player.scores[s.id] >= 100.5 ? 'brand' : 'default'}>
                    {gradeOf(player.scores[s.id])}
                  </Chip>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="flex items-center gap-1.5 px-4 py-3 text-xs text-ink-subtle">
          Contact is mutual-only
          <Info above>
            Messaging only reaches people you follow both ways. Nothing here
            lets you approach a stranger, which is what the arcade research
            warned against.
          </Info>
        </p>
      </Body>

      {/* The actions the consultation asked for: reach out, join them where
          they are, or arrange the next one - all of which need the follow to
          run both ways first, so a one-way profile offers the follow instead of
          an action that would quietly do nothing. */}
      <div className="space-y-2 border-t border-line p-4">
        {rel.mutual ? (
          <>
            {joined && (
              <p className="rounded-xl bg-fresh-bg px-3 py-2 text-xs font-medium text-ink">
                {player.handle} knows you&rsquo;re on your way to {arcade.short}.
              </p>
            )}
            {arcade ? (
              <PrimaryButton onClick={() => onJoin(player.handle, arcade.id)}>
                Join them at {arcade.short}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => onPlan({ invite: player.handle })}>
                Plan a session together
              </PrimaryButton>
            )}
            <SecondaryButton onClick={() => onMessage(player.handle)}>
              Message
            </SecondaryButton>
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-ink-muted">
              {rel.youFollow
                ? `${player.handle} has not followed you back, so you cannot message them or see where they are.`
                : `Follow ${player.handle} back to message them and see where they play.`}
            </p>
            {rel.youFollow ? (
              <SecondaryButton onClick={() => onToggleFollow(player.handle)}>
                Following
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={() => onToggleFollow(player.handle)}>
                {rel.followsYou ? 'Follow back' : 'Follow'}
              </PrimaryButton>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      {children}
    </div>
  )
}
