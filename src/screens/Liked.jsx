import { Screen, TopBar, Body, Chip, Info } from '../components/ui.jsx'
import { Chevron } from '../components/Icons.jsx'
import { CLIPS } from '../social.js'
import { gradeOf, formatAchievement, ago } from '../lib/social.js'

/* Liked clips.

   This lives under Me rather than under Watch, on purpose.

   Watch is a lean-back surface: one clip at a time, served to you, in order.
   Finding something you saved is the opposite task - you have a specific thing
   in mind and you are going to retrieve it. Those two want different shapes (a
   pager versus a list), and folding the saved list into Watch's segmented
   control would have mixed two content SOURCES with one saved STATE in the
   same control.

   Me is already the tab for things that belong to you: your sessions, your
   reports, who you follow, your songs. Liked clips fit that model without
   changing what the tab means. It is also where Instagram and TikTok both put
   theirs, so it is where people look first. */
export default function Liked({ likedIds, onBack, onOpenClip }) {
  const clips = CLIPS.filter((c) => likedIds.includes(c.id))

  return (
    <Screen>
      <TopBar
        title="Liked clips"
        onBack={onBack}
        right={
          <Info>
            Liking a clip is the one reply that needs no words, which matters
            for players who would rather not start a conversation. Your likes
            are visible to the person who posted.
          </Info>
        }
      />

      <Body>
        {clips.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-600">
            Nothing liked yet. Tap the heart on a clip in Watch.
          </p>
        ) : (
          <ul>
            {clips.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenClip(c.id)}
                  className="flex w-full items-center gap-3 border-b border-gray-300 px-4 py-3 text-left"
                >
                  <span className="flex h-14 w-10 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-200 text-[10px] tabular-nums text-gray-500">
                    {c.seconds}s
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">
                      @{c.handle}
                    </span>
                    <span className="block truncate text-xs text-gray-700">
                      {c.song} &middot; {c.chart}
                    </span>
                    <span className="block text-xs tabular-nums text-gray-600">
                      {formatAchievement(c.achievement)} &middot; {ago(c.postedMin)}
                    </span>
                  </span>
                  <Chip>{gradeOf(c.achievement)}</Chip>
                  <Chevron size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Screen>
  )
}
