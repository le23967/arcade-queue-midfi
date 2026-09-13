import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateHandle,
  prepareMessage,
  relationshipFrom,
  hueFromProfile,
  toThreadMessage,
  partnerOf,
  classifyThread,
  threadMode,
  encodeProfileCode,
  decodeProfileCode,
  MESSAGE_MAX,
} from './accountRules.js'

test('handles follow the database rule', () => {
  assert.equal(validateHandle('mia').ok, true)
  assert.equal(validateHandle('  kenta_13 ').handle, 'kenta_13')
  assert.equal(validateHandle('').ok, false)
  assert.equal(validateHandle('a').ok, false)
  assert.equal(validateHandle('has space').ok, false)
  assert.equal(validateHandle('x'.repeat(17)).ok, false)
  assert.equal(validateHandle('x'.repeat(16)).ok, true)
})

test('messages are trimmed, non-empty and bounded', () => {
  assert.deepEqual(prepareMessage('  hello  '), { ok: true, text: 'hello', problem: null })
  assert.equal(prepareMessage('   ').ok, false)
  assert.equal(prepareMessage(undefined).ok, false)
  assert.equal(prepareMessage('x'.repeat(MESSAGE_MAX)).ok, true)
  assert.equal(prepareMessage('x'.repeat(MESSAGE_MAX + 1)).ok, false)
})

test('mutual needs both directions', () => {
  assert.equal(relationshipFrom({ youFollow: true, followsYou: true }).mutual, true)
  assert.equal(relationshipFrom({ youFollow: true, followsYou: false }).label, 'Following')
  assert.equal(relationshipFrom({ youFollow: false, followsYou: true }).action, 'Follow back')
  assert.equal(relationshipFrom({}).label, 'Not connected')
})

test('avatar hue survives the text column', () => {
  assert.equal(hueFromProfile({ avatar_hue: '3' }), 3)
  assert.equal(hueFromProfile({ avatar_hue: null }), null)
  assert.equal(hueFromProfile({ avatar_hue: 'blue' }), null)
  assert.equal(hueFromProfile(null), null)
})

test('rows map onto the thread shape', () => {
  const row = {
    id: 'm1',
    sender_id: 'u1',
    text: 'hey',
    created_at: '2026-09-13T10:00:00.000Z',
    read_at: null,
  }
  assert.deepEqual(toThreadMessage(row, 'u1'), {
    id: 'm1',
    sender: 'me',
    text: 'hey',
    timestamp: Date.parse('2026-09-13T10:00:00.000Z'),
    status: 'sent',
  })
  assert.equal(toThreadMessage({ ...row, read_at: '2026-09-13T10:01:00Z' }, 'u2').sender, 'them')
  assert.equal(toThreadMessage({ ...row, read_at: '2026-09-13T10:01:00Z' }, 'u1').status, 'read')
})

test('the partner is whichever side is not me', () => {
  const conv = { user_a: 'u1', user_b: 'u2', a: { id: 'u1' }, b: { id: 'u2' } }
  assert.equal(partnerOf(conv, 'u1').id, 'u2')
  assert.equal(partnerOf(conv, 'u2').id, 'u1')
})

test('a thread is a chat, a sent request, a received request, or nothing', () => {
  const me = 'u1'
  const chat = { status: 'accepted', requestedBy: null, myId: me, mutual: false }
  assert.equal(classifyThread(chat), 'chat')
  assert.equal(classifyThread({ ...chat, status: 'pending', requestedBy: 'u2', mutual: true }), 'chat')
  assert.equal(classifyThread({ status: 'pending', requestedBy: me, myId: me, mutual: false }), 'sent')
  assert.equal(classifyThread({ status: 'pending', requestedBy: 'u2', myId: me, mutual: false }), 'request')
  /* Declining tells the requester nothing: their side still reads as sent. */
  assert.equal(classifyThread({ status: 'declined', requestedBy: me, myId: me, mutual: false }), 'sent')
  assert.equal(classifyThread({ status: 'declined', requestedBy: 'u2', myId: me, mutual: false }), 'hidden')
  /* A request with nothing in it is not a request. */
  assert.equal(
    classifyThread({ status: 'pending', requestedBy: 'u2', myId: me, mutual: false, hasMessage: false }),
    'hidden'
  )
  assert.equal(classifyThread({ status: null, requestedBy: null, myId: me, mutual: false }), 'hidden')
})

test('the thread offers the right thing at the bottom', () => {
  const me = 'u1'
  assert.equal(threadMode({ status: null, requestedBy: null, myId: me, mutual: true }), 'chat')
  assert.equal(threadMode({ status: null, requestedBy: null, myId: me, mutual: false }), 'request-compose')
  assert.equal(threadMode({ status: 'accepted', requestedBy: 'u2', myId: me, mutual: false }), 'chat')
  assert.equal(
    threadMode({ status: 'pending', requestedBy: me, myId: me, mutual: false, sentByMe: 0 }),
    'request-compose'
  )
  assert.equal(
    threadMode({ status: 'pending', requestedBy: me, myId: me, mutual: false, sentByMe: 1 }),
    'request-sent'
  )
  assert.equal(
    threadMode({ status: 'declined', requestedBy: me, myId: me, mutual: false, sentByMe: 1 }),
    'request-sent'
  )
  assert.equal(threadMode({ status: 'pending', requestedBy: 'u2', myId: me, mutual: false }), 'request-received')
  assert.equal(threadMode({ status: 'declined', requestedBy: 'u2', myId: me, mutual: false }), 'request-received')
  assert.equal(threadMode({ status: 'accepted', requestedBy: null, myId: me, mutual: true, blocked: true }), 'blocked')
  /* Mutual wins over a pending row: the two follow each other now. */
  assert.equal(threadMode({ status: 'pending', requestedBy: 'u2', myId: me, mutual: true }), 'chat')
})

test('a profile code carries the account id and nothing else', () => {
  const id = '0b6f4a7e-1c3d-4e5f-8a9b-0c1d2e3f4a5b'
  const code = encodeProfileCode(id)
  assert.equal(code, `arcadecircle://profile/${id}`)
  assert.equal(decodeProfileCode(code), id)
  assert.equal(decodeProfileCode(`  ${code.toUpperCase()}/ `), id)
  assert.equal(decodeProfileCode(id), id)
  assert.equal(decodeProfileCode('https://example.com/whatever'), null)
  assert.equal(decodeProfileCode('arcadecircle://profile/not-an-id'), null)
  assert.equal(decodeProfileCode(''), null)
  assert.equal(decodeProfileCode(null), null)
  assert.ok(!code.includes('@'))
})
