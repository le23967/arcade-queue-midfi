import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCoalescedRefresh } from './coalesce.js'

function deferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

test('one call runs the work once', async () => {
  let runs = 0
  const refresh = createCoalescedRefresh(async () => {
    runs += 1
  })
  await refresh()
  assert.equal(runs, 1)
})

test('calls during a run collapse into one follow-up run', async () => {
  const gates = [deferred(), deferred()]
  let runs = 0
  const refresh = createCoalescedRefresh(async () => {
    const gate = gates[runs]
    runs += 1
    await gate.promise
  })
  const first = refresh()
  refresh()
  refresh()
  refresh()
  assert.equal(runs, 1, 'nothing new starts while one is in flight')
  gates[0].resolve()
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(runs, 2, 'exactly one more run follows')
  gates[1].resolve()
  await first
  assert.equal(runs, 2)
})

test('a failure does not wedge later refreshes', async () => {
  let runs = 0
  const refresh = createCoalescedRefresh(async () => {
    runs += 1
    if (runs === 1) throw new Error('boom')
  })
  await assert.rejects(refresh())
  await refresh()
  assert.equal(runs, 2)
})
