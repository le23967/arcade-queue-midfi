/* When a message was, in as few characters as still answer the question.

   An inbox row has room for one short stamp, and what a person wants from
   it changes with age: the time if it was today, the day if it was this
   week, the date if it was longer ago. All three come from Intl in the
   viewer's own locale, so nothing here hard-codes a clock format or a
   month name. `now` is injectable for tests. */
const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const dateWithYear = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function formatMessageStamp(timestamp, now = Date.now()) {
  const then = Number(timestamp)
  if (!Number.isFinite(then)) return ''
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS)
  if (days <= 0) return time.format(then)
  if (days === 1) return 'Yesterday'
  if (days < 7) return weekday.format(then)
  return new Date(then).getFullYear() === new Date(now).getFullYear()
    ? date.format(then)
    : dateWithYear.format(then)
}

/* Inside a thread only the clock matters; the day is implied by scrolling. */
export function formatMessageTime(timestamp) {
  const then = Number(timestamp)
  return Number.isFinite(then) ? time.format(then) : ''
}
