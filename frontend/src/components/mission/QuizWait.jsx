import { useEffect, useState } from 'react'
import { CREATURE_EMOJI } from '../Mascot.jsx'
import { Dots } from '../ui.jsx'

// The quiz call can take 10–20 s. Make the wait a moment, not a spinner.
const PIP_LINES = [
  'Reading every rule you taught me. Slowly.',
  'Writing each rule on a sticky note.',
  'Checking the notes against the questions.',
  'I will use only what you told me. Exactly.',
  'Showing my work. All of it.',
  'Almost done. I think. I am taking this very seriously.',
]
const RETRY_LINES = [
  'Replacing the old sticky note.',
  'Reading your new rule. Carefully.',
  'Trying that question again with the new rule.',
  'Following the new rule exactly.',
]
const BOSS_LINES = [
  (n) => `“Pip will never pass. Never!” — ${n}`,
  (n) => `${n} is pacing around Pip’s head.`,
  (n) => `${n} is hiding behind a sticky note.`,
  (n) => `“Add the bottoms, Pip. Do it.” — ${n}`,
  (n) => `${n} is nervously eating itself.`,
]

export default function QuizWait({ boss, creature, retry }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 2600)
    return () => clearInterval(id)
  }, [])
  const lines = retry ? RETRY_LINES : PIP_LINES
  const pip = lines[Math.min(t, lines.length - 1)]
  const bossLine = BOSS_LINES[t % BOSS_LINES.length](boss?.name ?? 'The boss')
  return (
    <div className="quizwait glass" role="status" aria-live="polite">
      <div className="quizwait__pip">
        <span className="quizwait__face" aria-hidden>
          {CREATURE_EMOJI[creature] ?? '🫧'}
          <span className="quizwait__think">💭</span>
        </span>
        <div className="stack-sm grow">
          <p className="eyebrow">Pip is thinking hard</p>
          <p className="quizwait__line" key={`p${t}`}>
            {pip} <Dots />
          </p>
        </div>
      </div>
      <p className="quizwait__boss" key={`b${t}`}>
        <span aria-hidden>{boss?.emoji ?? '👾'}</span> {bossLine}
      </p>
    </div>
  )
}
