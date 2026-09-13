import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMessageStamp, formatMessageTime } from './time.js'

/* Noon on a Wednesday, local time, so day boundaries are unambiguous. */
const now = new Date(2026, 8, 16, 12, 0, 0).getTime()
const hours = (n) => n * 60 * 60 * 1000
const days = (n) => n * 24 * hours(1)

test('today is a time, yesterday is a word, this week is a day, older is a date', () => {
  const today = formatMessageStamp(now - hours(2), now)
  assert.equal(today, new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now - hours(2)))
  assert.equal(formatMessageStamp(now - days(1), now), 'Yesterday')
  assert.equal(
    formatMessageStamp(now - days(3), now),
    new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(now - days(3))
  )
  assert.equal(
    formatMessageStamp(now - days(30), now),
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(now - days(30))
  )
  assert.match(formatMessageStamp(now - days(400), now), /2025/)
})

test('the day boundary is the calendar day, not 24 hours', () => {
  /* 1 a.m. today, looked at from noon today, is still today. */
  const oneAm = new Date(2026, 8, 16, 1, 0, 0).getTime()
  assert.notEqual(formatMessageStamp(oneAm, now), 'Yesterday')
  /* 11 p.m. yesterday, 13 hours ago, is yesterday. */
  const lateLastNight = new Date(2026, 8, 15, 23, 0, 0).getTime()
  assert.equal(formatMessageStamp(lateLastNight, now), 'Yesterday')
})

test('nonsense is an empty string rather than Invalid Date', () => {
  assert.equal(formatMessageStamp(undefined, now), '')
  assert.equal(formatMessageStamp(NaN, now), '')
  assert.equal(formatMessageTime('soon'), '')
  assert.ok(formatMessageTime(now).length > 0)
})
