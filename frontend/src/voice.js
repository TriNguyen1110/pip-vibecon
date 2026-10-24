// Pip's voice (CONTRACT v3.1): browser speech synthesis only. Nothing is recorded, stored or sent.
// Captions always show; the voice is never the only channel. Mouth openness (0..1) is published
// to subscribers while Pip speaks so the 3D stage can lip-flap without re-rendering the page.
import { useEffect, useState } from 'react'

const KEY = 'pip.voice.muted'
const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

function readMuted() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

let muted = readMuted()
let gestured = false
let speaking = false
let pulseAt = -1
let startedAt = 0
let mouth = 0
let viseme = null
let sayText = ''
let wordAt = -1
let wordStart = 0
let wordEnd = 0
let lastVis = 0
let raf = 0
let voice = null
const mouthSubs = new Set()
const visSubs = new Set()
const stateSubs = new Set()

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Browsers need a user gesture before audio. Any tap or key on the page counts.
if (typeof window !== 'undefined') {
  const mark = () => {
    gestured = true
  }
  window.addEventListener('pointerdown', mark, { capture: true, passive: true })
  window.addEventListener('keydown', mark, { capture: true })
}
const hasGesture = () => gestured || !!navigator.userActivation?.hasBeenActive

function pickVoice() {
  if (voice) return voice
  try {
    const all = window.speechSynthesis.getVoices() || []
    const en = all.filter((v) => /^en(-|_|$)/i.test(v.lang))
    const prefer = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Karen', 'Moira', 'Tessa', 'Daniel']
    voice = prefer.map((n) => en.find((v) => v.name.includes(n))).find(Boolean) ?? en.find((v) => /en-US/i.test(v.lang)) ?? en[0] ?? null
  } catch {
    voice = null
  }
  return voice
}
if (supported()) {
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      voice = null
      pickVoice()
    })
  } catch {
    /* fine */
  }
}

function emitState() {
  stateSubs.forEach((f) => f({ muted, speaking }))
}

function setMouth(v) {
  if (Math.abs(v - mouth) < 0.02 && !(v === 0 && mouth !== 0)) return
  mouth = v
  mouthSubs.forEach((f) => f(v))
}

function setViseme(v) {
  if (v === viseme) return
  viseme = v
  visSubs.forEach((f) => f(v))
}

// Viseme from the text being spoken: a/e/i wide, o/u round, other letters small, else closed.
export function visemeFor(ch = '') {
  const c = ch.toLowerCase()
  if ('aei'.includes(c) && c) return 'wide'
  if ('ou'.includes(c) && c) return 'o'
  if (/[a-z0-9]/.test(c)) return 'small'
  return 'closed'
}
const FRAME = 1000 / 12

// Steps through the current word (from boundary events) at ~12 fps; without boundary events,
// through the whole sentence at an estimated speaking rate.
function currentViseme(now) {
  if (!speaking) return null
  let i
  if (wordAt >= 0) {
    i = wordStart + Math.floor((now - wordAt) / FRAME)
    if (i >= wordEnd) return 'closed'
  } else {
    i = Math.floor(((now - startedAt) / 1000) * 13)
  }
  return visemeFor(sayText[i] ?? '')
}

const VIS_MOUTH = { closed: 0.04, small: 0.35, wide: 0.75, o: 0.9 }

// ElevenLabs alignment (CONTRACT v3.4): the character being spoken at audio.currentTime.
function audioViseme() {
  const al = audio?.alignment
  const el = audio?.el
  if (!al || !el) return 'closed'
  const t = el.currentTime
  const st = al.character_start_times_seconds ?? []
  const en = al.character_end_times_seconds ?? []
  const ch = al.characters ?? []
  while (audio.k < st.length - 1 && st[audio.k + 1] <= t) audio.k++
  while (audio.k > 0 && st[audio.k] > t) audio.k--
  if (t > (en[audio.k] ?? 0) + 0.04) return 'closed'
  return visemeFor(ch[audio.k] ?? '')
}

// A word boundary pulses the mouth 0 -> 1 -> 0 over ~120ms, on top of a gentle oscillation.
function tick(now) {
  raf = 0
  if (audio) {
    if (!speaking) {
      setMouth(0)
      setViseme(null)
      return
    }
    const v = audioViseme()
    setViseme(v)
    setMouth(VIS_MOUTH[v] ?? 0)
    raf = requestAnimationFrame(tick)
    return
  }
  if (now - lastVis >= FRAME) {
    lastVis = now
    setViseme(currentViseme(now))
  }
  if (!speaking && (pulseAt < 0 || now - pulseAt > 140)) {
    setMouth(0)
    setViseme(null)
    return
  }
  const t = (now - startedAt) / 1000
  const still = reducedMotion()
  const base = speaking ? (still ? 0.2 : 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 3.2))) : 0
  let pulse = 0
  if (pulseAt >= 0) {
    const d = now - pulseAt
    if (d >= 0 && d <= 120) pulse = d < 60 ? d / 60 : (120 - d) / 60
  }
  setMouth(Math.max(base, pulse * (still ? 0.6 : 0.95)))
  raf = requestAnimationFrame(tick)
}
function loop() {
  if (!raf && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(tick)
}

// Speech reads better without emoji and with fractions said as words.
function forSpeech(text = '') {
  return String(text)
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 over $2')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pip's voice (CONTRACT v3.4): POST /api/tts first (ElevenLabs audio + character alignment), else the
// browser's speechSynthesis. Prefetch as soon as a reply arrives so the bubble and the voice start together.
const TTS_TIMEOUT = 8000
const ttsCache = new Map()
let ttsOff = false // the server said fallback: stop asking for this visit
let audio = null // { el, alignment, k }
let token = 0

export function prefetchTTS(text) {
  const say = forSpeech(text)
  if (!say || ttsOff || muted) return Promise.resolve(null)
  if (ttsCache.has(say)) return ttsCache.get(say)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), TTS_TIMEOUT)
  const base = `${import.meta.env.VITE_BACKEND_URL ?? ''}/api`
  const p = fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: say }),
    signal: ctrl?.signal,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j || j.fallback || !j.audio_b64) {
        if (j?.fallback) ttsOff = true
        ttsCache.delete(say)
        return null
      }
      return j
    })
    .catch(() => {
      ttsCache.delete(say)
      return null
    })
    .finally(() => clearTimeout(timer))
  ttsCache.set(say, p)
  if (ttsCache.size > 40) ttsCache.delete(ttsCache.keys().next().value)
  return p
}

function playAudio(j, my) {
  try {
    const el = new Audio(`data:${j.mime || 'audio/mpeg'};base64,${j.audio_b64}`)
    audio = { el, alignment: j.alignment ?? null, k: 0 }
    const done = () => {
      if (audio?.el !== el) return
      speaking = false
      emitState()
      loop()
    }
    el.onplaying = () => {
      if (my !== token) return el.pause()
      speaking = true
      startedAt = performance.now()
      emitState()
      loop()
    }
    el.onended = done
    el.onerror = done
    return el.play().then(
      () => true,
      () => {
        audio = null
        return false
      },
    )
  } catch {
    audio = null
    return Promise.resolve(false)
  }
}

export function speak(text) {
  if (muted || !hasGesture()) return false
  const say = forSpeech(text)
  if (!say) return false
  const my = ++token
  stopNow()
  prefetchTTS(text).then(async (j) => {
    if (my !== token || muted) return
    if (j && (await playAudio(j, my))) return
    if (my === token) speakSynth(say)
  })
  return true
}

function speakSynth(say) {
  if (!supported()) return false
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    audio = null
    const u = new window.SpeechSynthesisUtterance(say)
    const v = pickVoice()
    if (v) u.voice = v
    u.lang = v?.lang || 'en-US'
    u.pitch = 1.15
    u.rate = 1.0
    sayText = say
    wordAt = -1
    u.onstart = () => {
      speaking = true
      startedAt = performance.now()
      emitState()
      loop()
    }
    u.onboundary = (e) => {
      if (!e.name || e.name === 'word') {
        pulseAt = performance.now()
        wordAt = pulseAt
        wordStart = e.charIndex ?? 0
        const len = e.charLength || (say.slice(wordStart).search(/\s|$/) || 1)
        wordEnd = wordStart + len
        loop()
      }
    }
    const done = () => {
      speaking = false
      emitState()
      loop()
    }
    u.onend = done
    u.onerror = done
    synth.speak(u)
    return true
  } catch {
    return false
  }
}

function stopNow() {
  try {
    if (supported()) window.speechSynthesis.cancel()
  } catch {
    /* fine */
  }
  if (audio?.el) {
    try {
      audio.el.pause()
    } catch {
      /* fine */
    }
  }
  audio = null
  speaking = false
}

export function stopSpeaking() {
  token++
  stopNow()
  emitState()
  loop()
}

export function setMuted(v) {
  muted = !!v
  try {
    localStorage.setItem(KEY, muted ? '1' : '0')
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
  if (muted) stopSpeaking()
  emitState()
}

export const voiceSupported = supported

// Mute state for the toggle.
export function useVoice() {
  const [s, setS] = useState({ muted, speaking })
  useEffect(() => {
    stateSubs.add(setS)
    return () => {
      stateSubs.delete(setS)
    }
  }, [])
  useEffect(() => () => stopSpeaking(), [])
  // Audio playback works everywhere; speechSynthesis is only the fallback.
  return { ...s, supported: true, toggle: () => setMuted(!muted) }
}

// Current mouth openness; only the component that calls this re-renders.
export function useMouth() {
  const [m, setM] = useState(mouth)
  useEffect(() => {
    mouthSubs.add(setM)
    return () => {
      mouthSubs.delete(setM)
    }
  }, [])
  return m
}

// Current viseme while Pip speaks (null otherwise); falls back to `mouth` in the stage.
export function useViseme() {
  const [v, setV] = useState(viseme)
  useEffect(() => {
    visSubs.add(setV)
    return () => {
      visSubs.delete(setV)
    }
  }, [])
  return v
}

// Deadpan lines for a tap on Pip. Never the same one twice in a row.
const TAP_LINES = [
  'Ow. Noted.',
  'That was my brain.',
  'I’m still learning. Gently.',
  'Hello. I felt that.',
  'Poke received. Filing it.',
  'I don’t know what that means yet.',
  'Careful. I’m full of rules.',
]
let lastTap = -1
export function tapLine() {
  let i = Math.floor(Math.random() * TAP_LINES.length)
  if (i === lastTap) i = (i + 1) % TAP_LINES.length
  lastTap = i
  return TAP_LINES[i]
}
