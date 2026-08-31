/* Sound.

   Feedback from the Week 6 review listed sound alongside colour, motion and
   type as something this stage should carry, so the prototype has a small
   sound set rather than none.

   Everything is synthesised with the Web Audio API. That keeps the repo free
   of audio files, matches the no-assets rule the rest of the prototype
   follows, and suits a rhythm game app: the cues are short musical intervals
   rather than system beeps.

   Cues are triggered by one delegated listener at the app root rather than by
   each button asking for them. Thirty six buttons had no sound when this was
   wired per component, which is the kind of gap that reopens every time a
   screen is added.

   Browsers refuse to start audio before a gesture, so the context is created
   lazily on the first sound and resumed if the browser suspended it. Muting is
   remembered per device. */

const STORAGE_KEY = 'arcade-circle:muted'

let ctx = null
let muted = read()

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function isMuted() {
  return muted
}

export function setMuted(value) {
  muted = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* Private browsing can refuse storage. The setting still applies for the
       rest of the session. */
  }
}

function audio() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/* One short note. Sine keeps it soft enough to sit under a conversation in a
   critique room. */
function note(at, freq, start, length, peak) {
  const osc = at.createOscillator()
  const gain = at.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, at.currentTime + start)

  /* A tiny attack and a smooth tail, so nothing clicks. */
  gain.gain.setValueAtTime(0, at.currentTime + start)
  gain.gain.linearRampToValueAtTime(peak, at.currentTime + start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at.currentTime + start + length)

  osc.connect(gain).connect(at.destination)
  osc.start(at.currentTime + start)
  osc.stop(at.currentTime + start + length + 0.02)
}

/* Frequencies are a pentatonic run, so any two cues played close together
   still sound like they belong to the same app. */
const CUES = {
  tap: [[660, 0, 0.07, 0.16]],
  select: [[587, 0, 0.08, 0.2], [880, 0.055, 0.11, 0.18]],
  like: [[784, 0, 0.07, 0.2], [1175, 0.05, 0.13, 0.18]],
  success: [[523, 0, 0.11, 0.22], [659, 0.085, 0.11, 0.22], [988, 0.17, 0.26, 0.24]],
  alert: [[880, 0, 0.14, 0.26], [660, 0.16, 0.14, 0.24], [880, 0.32, 0.28, 0.26]],
  back: [[494, 0, 0.08, 0.15], [370, 0.06, 0.11, 0.13]],
}

export function playSound(name) {
  if (muted) return
  const cue = CUES[name]
  if (!cue) return
  const at = audio()
  if (!at) return
  try {
    cue.forEach(([freq, start, length, peak]) => note(at, freq, start, length, peak))
  } catch {
    /* Audio is a nicety. It must never break a screen. */
  }
}

/* --- delegation -----------------------------------------------------------

   One listener for the whole prototype. Any button makes a sound unless it
   opts out, and an element can pick a different cue with `data-sound`:

     <button data-sound="select">   a committing action
     <button data-sound="none">     silent, for repeats like zoom or paging

   Returns a cleanup function. */
export function listenForTaps(root = document) {
  function onDown(event) {
    const el = event.target.closest?.(
      'button, [role="button"], a[href], input[type="checkbox"], input[type="radio"]'
    )
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return
    const named = el.dataset?.sound ?? el.closest('[data-sound]')?.dataset?.sound
    if (named === 'none') return
    playSound(named && CUES[named] ? named : 'tap')
  }

  root.addEventListener('pointerdown', onDown, true)
  return () => root.removeEventListener('pointerdown', onDown, true)
}
