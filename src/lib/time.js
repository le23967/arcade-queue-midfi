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

/* --- when a session is ------------------------------------------------- */

/* Written for the person planning, so the near future reads the way they
   would say it - tonight, tomorrow, Saturday - and only further out does it
   become a date. Day and month names are fixed English here because the
   rest of the prototype's copy is; the invitation that leaves the phone
   uses Intl instead, since it is read on someone else's. */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function midnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function clock(date) {
  const hours = date.getHours()
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(date.getMinutes()).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

export function formatWhen(date, now = new Date()) {
  const days = Math.round((midnight(date) - midnight(now)) / 86400000)

  if (days === 0) return `${date.getHours() >= 17 ? 'Tonight' : 'Today'}, ${clock(date)}`
  if (days === 1) return `Tomorrow, ${clock(date)}`
  if (days > 1 && days < 7) return `${DAY_NAMES[date.getDay()]}, ${clock(date)}`
  return `${DAY_NAMES[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()]}, ${clock(date)}`
}
