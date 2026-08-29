import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '../components/ui.jsx'
import { ago } from '../lib/social.js'
import { ME } from '../social.js'

/* Comments on a clip.

   A bottom sheet rather than a screen, so the clip stays visible behind it and
   you keep your place in the feed. The list is plain text with a gray avatar
   block; a mid-fi comment thread is a list, not a chat UI. */
export default function Comments({ clip, comments, onPost, onClose }) {
  const [text, setText] = useState('')
  const canPost = text.trim().length > 0

  function post() {
    if (!canPost) return
    onPost(text.trim())
    setText('')
  }

  return (
    <div className="absolute inset-0 z-10 flex items-end bg-gray-900/40">
      <div className="flex max-h-[80%] w-full flex-col rounded-t-md border-t border-gray-300 bg-white">
        <div className="flex items-baseline gap-2 border-b border-gray-300 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Comments</h2>
          <span className="text-xs tabular-nums text-gray-600">
            {comments.length}
          </span>
          <span className="ml-auto text-xs text-gray-600">@{clip.handle}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-600">
              No comments yet.
            </p>
          ) : (
            <ul>
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="flex gap-3 border-b border-gray-300 px-4 py-3"
                >
                  <span className="h-8 w-8 flex-none rounded-md border border-gray-300 bg-gray-200" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.handle}
                      </span>
                      <span className="text-xs tabular-nums text-gray-500">
                        {ago(c.minsAgo)}
                      </span>
                    </span>
                    <span className="block text-sm text-gray-900">{c.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-300 p-4">
          <label className="mb-2 block text-xs text-gray-600" htmlFor="comment">
            Comment as {ME.handle}
          </label>
          <input
            id="comment"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && post()}
            placeholder="Say something"
            className="mb-2 w-full rounded-md border border-gray-400 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
          />
          <div className="space-y-2">
            <PrimaryButton onClick={post} disabled={!canPost}>
              Post
            </PrimaryButton>
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
