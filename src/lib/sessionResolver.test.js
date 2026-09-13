import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSessionResolver, BootstrapTimeoutError } from './sessionResolver.js'

const user = (id) => ({ id })
const session = (id) => ({ user: user(id) })

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function harness(loadProfile, extra = {}) {
  const commits = []
  const resolver = createSessionResolver({
    loadProfile,
    commit: (state) => commits.push(state),
    ...extra,
  })
  return { resolver, commits }
}

test('no session commits signed-out', async () => {
  const { resolver, commits } = harness(async () => ({ handle: 'x' }))
  await resolver.apply(null)
  assert.deepEqual(commits, [{ status: 'signed-out', user: null, profile: null, error: null }])
})

test('a session loads the profile and commits signed-in', async () => {
  const { resolver, commits } = harness(async (u) => ({ id: u.id, handle: 'alex' }))
  await resolver.apply(session('u1'))
  assert.equal(commits.length, 1)
  assert.equal(commits[0].status, 'signed-in')
  assert.equal(commits[0].profile.handle, 'alex')
})

test('the same session reported twice loads the profile once', async () => {
  let loads = 0
  const { resolver, commits } = harness(async (u) => {
    loads += 1
    return { id: u.id, handle: 'alex' }
  })
  await Promise.all([resolver.apply(session('u1')), resolver.apply(session('u1'))])
  assert.equal(loads, 1)
  assert.equal(commits.filter((c) => c.status === 'signed-in').length, 1)
})

test('a cancelled run does not poison the run that replaces it', async () => {
  /* The strict-mode shape: run one starts, is cancelled, and run two starts
     with the same stored session. Run two must still settle. */
  const gate = deferred()
  let loads = 0
  const loadProfile = async (u) => {
    loads += 1
    await gate.promise
    return { id: u.id, handle: 'alex' }
  }
  const first = harness(loadProfile)
  const p1 = first.resolver.apply(session('u1'))
  first.resolver.cancel()

  const second = harness(loadProfile)
  const p2 = second.resolver.apply(session('u1'))

  gate.resolve()
  await Promise.all([p1, p2])

  assert.equal(first.commits.length, 0, 'the cancelled run commits nothing')
  assert.equal(second.commits.length, 1)
  assert.equal(second.commits[0].status, 'signed-in')
  assert.equal(loads, 2, 'each run owns its own load')
})

test('a newer state wins over a slower older load', async () => {
  const slow = deferred()
  const { resolver, commits } = harness(async (u) => {
    if (u.id === 'u1') await slow.promise
    return { id: u.id, handle: u.id }
  })
  const older = resolver.apply(session('u1'))
  await resolver.apply(null)
  slow.resolve()
  await older
  assert.equal(commits.length, 1)
  assert.equal(commits[0].status, 'signed-out')
})

test('once committed, a repeat notification reuses the profile', async () => {
  let loads = 0
  const { resolver, commits } = harness(async (u) => {
    loads += 1
    return { id: u.id, handle: 'alex' }
  })
  await resolver.apply(session('u1'))
  resolver.setProfile({ id: 'u1', handle: 'renamed' })
  await resolver.apply(session('u1'))
  assert.equal(loads, 1)
  assert.equal(commits[1].status, 'signed-in')
  assert.equal(commits[1].profile.handle, 'renamed')
})

test('a failed load leaves checking with the error', async () => {
  const { resolver, commits } = harness(async () => {
    throw new Error('profiles unreachable')
  })
  await resolver.apply(session('u1'))
  assert.equal(commits.length, 1)
  assert.equal(commits[0].status, 'signed-out')
  assert.equal(commits[0].error.message, 'profiles unreachable')
})

test('a load that never settles is bounded', async () => {
  const { resolver, commits } = harness(() => new Promise(() => {}), { timeoutMs: 20 })
  await resolver.apply(session('u1'))
  assert.equal(commits.length, 1)
  assert.equal(commits[0].status, 'signed-out')
  assert.ok(commits[0].error instanceof BootstrapTimeoutError)
})

test('after cancel nothing is committed', async () => {
  const { resolver, commits } = harness(async (u) => ({ id: u.id }))
  resolver.cancel()
  await resolver.apply(session('u1'))
  await resolver.apply(null)
  assert.equal(commits.length, 0)
})
