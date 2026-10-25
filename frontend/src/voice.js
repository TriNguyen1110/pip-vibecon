// Voices (CONTRACT v3.1, v3.4, v3.5): Pip, the boss and the announcer via POST /api/tts, falling back to
// browser speech synthesis. Only Pip's lines are spoken; nothing is recorded or sent from the student.
// Captions always show; the voice is never the only channel. Mouth openness and visemes are published
// to subscribers while Pip speaks so only the stage re-renders.
import { useEffect, useState } from 'react'
import VOICES from '../../backend/voices.json'

const KEY = 'pip.voice.muted'
const supported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

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
    const prefer = [
      'Samantha',
      'Google US English',
      'Microsoft Aria',
      'Microsoft Jenny',
      'Karen',
      'Moira',
      'Tessa',
      'Daniel',
    ]
    voice =
      prefer.map((n) => en.find((v) => v.name.includes(n))).find(Boolean) ??
      en.find((v) => /en-US/i.test(v.lang)) ??
      en[0] ??
      null
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
  if (current && (current.speaker ?? 'pip') !== 'pip') {
    // The boss or the announcer is talking: Pip keeps its mouth shut.
    setMouth(0)
    setViseme(null)
    if (speaking) raf = requestAnimationFrame(tick)
    return
  }
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

// Voices (CONTRACT v3.4 + v3.5): POST /api/tts first (ElevenLabs audio + character alignment), else the
// browser's speechSynthesis. A small queue keeps lines from overlapping: announcer sting, then Pip's line,
// then the boss's caption. Only Pip's lines move Pip's mouth. Prefetch as soon as a reply arrives.
const TTS_TIMEOUT = 8000
const ttsCache = new Map()
const inflight = new Set() // AbortControllers of /api/tts requests still on the wire
let ttsDownUntil = 0 // after a fallback or a network failure, use browser speech for a while
let audio = null // { el, alignment, k }
let token = 0
let current = null // the line being spoken: { speaker, ... }
let queue = []

// Pip's voice choice in the Look sheet (CONTRACT v3.5 + owner update): the named choices in
// backend/voices.json `pip_choices` (bright | chaotic | chill), read at build time so the backend can recast
// a voice without a frontend change. The backend resolves the name (with its voice settings). Fena
// ("Bright") is Pip's default for every vibe, so the default no longer follows the vibe.
const CHOICE_LABELS = { bright: 'Bright', chaotic: 'Chaotic', chill: 'Chill' }
export const PIP_VOICES = Object.keys(VOICES?.pip_choices ?? CHOICE_LABELS).map((k) => ({
  id: k,
  label: CHOICE_LABELS[k] ?? k.charAt(0).toUpperCase() + k.slice(1),
}))
export const DEFAULT_PIP_VOICE = PIP_VOICES.some((v) => v.id === 'bright') ? 'bright' : PIP_VOICES[0]?.id
// Kept for callers: every vibe now starts on the default voice.
export const voiceForVibe = () => DEFAULT_PIP_VOICE
export const isPipVoice = (v) => PIP_VOICES.some((x) => x.id === v)

// Who Pip is right now (set by the screen): vibe, grade, pip_voice. Boss lines carry their own boss.
let pipCtx = { vibe: 'cute', grade: null, pip_voice: null }
export function setVoiceContext(c) {
  pipCtx = { ...pipCtx, ...c }
}

// Browser fallback: a different register per role.
const SYNTH = {
  pip: { pitch: 1.15, rate: 1 },
  boss: { pitch: 0.7, rate: 1.05 },
  announcer: { pitch: 0.55, rate: 0.85 },
}

function ttsBody(say, line) {
  const speaker = line.speaker ?? 'pip'
  const body = { text: say, speaker }
  if (speaker === 'pip') {
    body.vibe = line.vibe ?? pipCtx.vibe
    body.pip_voice = pipVoiceOf(line.pip_voice ?? pipCtx.pip_voice)
  }
  if (speaker === 'boss') {
    if (line.boss_id) body.boss_id = line.boss_id
    if (line.boss) body.boss_name = line.boss
  }
  const grade = line.grade ?? pipCtx.grade
  if (grade != null) body.grade = grade
  return body
}

export function prefetchTTS(text, line = {}) {
  const say = forSpeech(text)
  if (!say || muted || Date.now() < ttsDownUntil) return Promise.resolve(null)
  const body = ttsBody(say, line)
  const key = JSON.stringify(body)
  if (ttsCache.has(key)) return ttsCache.get(key)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  if (ctrl) inflight.add(ctrl)
  const timer = setTimeout(() => ctrl?.abort(), TTS_TIMEOUT)
  const base = `${import.meta.env.VITE_BACKEND_URL ?? ''}/api`
  const p = fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl?.signal,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j || j.fallback || !j.audio_b64) {
        if (j?.fallback) ttsDownUntil = Date.now() + 15000
        ttsCache.delete(key)
        return null
      }
      return j
    })
    .catch(() => {
      // Unreachable or blocked: don't keep knocking (each failed request is a console error).
      // A request we cancelled ourselves (mute) is not a failure.
      if (!ctrl?.signal.aborted || ctrl.signal.reason !== 'muted') ttsDownUntil = Date.now() + 60000
      ttsCache.delete(key)
      return null
    })
    .finally(() => {
      clearTimeout(timer)
      if (ctrl) inflight.delete(ctrl)
    })
  ttsCache.set(key, p)
  if (ttsCache.size > 60) ttsCache.delete(ttsCache.keys().next().value)
  return p
}

function playAudio(j, my, onDone) {
  try {
    const el = new Audio(`data:${j.mime || 'audio/mpeg'};base64,${j.audio_b64}`)
    audio = { el, alignment: j.alignment ?? null, k: 0 }
    const done = () => {
      if (audio?.el !== el) return
      speaking = false
      emitState()
      loop()
      onDone()
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

function playNext() {
  if (current || muted) return
  const item = queue.shift()
  if (!item) return
  current = item
  const my = ++token
  let finished = false
  const onDone = () => {
    if (finished || my !== token) return
    finished = true
    current = null
    playNext()
  }
  prefetchTTS(item.text, item).then(async (j) => {
    if (my !== token || muted) return
    if (j && (await playAudio(j, my, onDone))) return
    if (my !== token) return
    if (!speakSynth(forSpeech(item.text), item.speaker ?? 'pip', onDone)) onDone()
  })
}

const asItem = (x) => (typeof x === 'string' ? { text: x, speaker: 'pip' } : { speaker: 'pip', ...x })
// pip_voice sent to the backend: a named choice, else the default (old saved voice ids map to it).
const pipVoiceOf = (v) => (isPipVoice(v) ? v : DEFAULT_PIP_VOICE)

// Replace whatever is queued with these lines, in order (strings are Pip's lines).
export function sayLines(items) {
  if (muted || !hasGesture()) return false
  const list = items
    .filter(Boolean)
    .map(asItem)
    .filter((i) => forSpeech(i.text))
  if (!list.length) return false
  stopNow()
  token++
  current = null
  queue = list
  list.forEach((i) => prefetchTTS(i.text, i))
  playNext()
  return true
}

// Add a line after the current ones (a boss taunt while Pip talks waits its turn).
export function enqueueLine(item) {
  if (muted || !hasGesture()) return false
  const it = asItem(item)
  if (!forSpeech(it.text)) return false
  queue.push(it)
  playNext()
  return true
}

export function speak(text, line = {}) {
  return sayLines([{ ...line, text }])
}

// One-word announcer stings ("BOSS FIGHT", "CRITICAL", "K.O.", "BRAIN UPGRADED"), at most one per 3 s.
let lastSting = -Infinity
export function stingLine(word) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  if (now - lastSting < 3000) return null
  lastSting = now
  return { text: word, speaker: 'announcer' }
}

function speakSynth(say, speaker, onDone) {
  if (!supported() || !say) return false
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    audio = null
    const u = new window.SpeechSynthesisUtterance(say)
    const v = pickVoice()
    if (v) u.voice = v
    u.lang = v?.lang || 'en-US'
    const reg = SYNTH[speaker] ?? SYNTH.pip
    u.pitch = reg.pitch
    u.rate = reg.rate
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
        const len = e.charLength || say.slice(wordStart).search(/\s|$/) || 1
        wordEnd = wordStart + len
        loop()
      }
    }
    const done = () => {
      speaking = false
      emitState()
      loop()
      onDone?.()
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
  queue = []
  current = null
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
  if (muted) {
    // Mute silences everything: also cancel voice requests still on the wire.
    inflight.forEach((c) => c.abort('muted'))
    inflight.clear()
    ttsCache.clear()
    stopSpeaking()
  }
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
