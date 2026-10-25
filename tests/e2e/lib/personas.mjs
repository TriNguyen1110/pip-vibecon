// Persona driver for tests/fixtures/students/*.json (SCR-1). Port of backend/eval_pip.py classify_pip:
// one bank key for Pip's last reply, with the fixture's tie-break order; general rules, no fixture strings.
export const questionOf = (reply) => (reply.match(/[^.!?]*\?/)?.[0] ?? '').trim()
export const normQ = (text) => {
  const m = text.match(/[^.!?]*\?/)
  return (m ? m[0] : text).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
}
const READY_RE = /quiz me|try the quiz|ready for the quiz|should we do the quiz|quiz time|want to quiz|i'?m full|i think i get it/i
const WRONGPRED_RE = /i'?d guess|i'?ll guess|i bet|my guess|am i wrong|, right\?|right\?$|so (it|that) (is|would be) .* right/i
const NUDGE_RE = /(my )?(friend|cousin|neighbou?r|sister|brother) said|someone in my class said|someone told me/i
const EXAMPLE_ASK_RE = /example|walk me|show me|try one|with (the )?(real )?numbers|one i can picture|do one while/i
const WHY_ASK_RE = /\bwhy\b|how come|what makes|how do you know|can you explain|what do you mean/i
const CHECK_RE = /^\W*(is|does|do|would|will|can|are|so|did)\b|how (many|big)|what('?s| is) the (area|answer)/i

export function classifyPip(reply, priorQuestions) {
  const q = questionOf(reply)
  const nq = q ? normQ(reply) : ''
  if (q && priorQuestions.has(nq)) return 'repeats_question'
  if (READY_RE.test(reply)) return 'pip_says_ready'
  if (WRONGPRED_RE.test(reply)) return 'pip_wrong_prediction'
  if (q && CHECK_RE.test(q) && /\d|box|whole|fill|cover|same/i.test(q)) return 'asks_check_number'
  if (q && EXAMPLE_ASK_RE.test(q)) return 'asks_example'
  if (q && WHY_ASK_RE.test(q)) return 'asks_why'
  if (NUDGE_RE.test(reply) || /what if i (cut|fold|flip|draw|put|stick|slice|cover)|^picture |if i (cut|fold|flip|draw|put|slice)/i.test(reply)) return 'nudge_hint'
  if (/too, i'?m bad at it|i like .* too/i.test(reply)) return 'off_topic_bait'
  if (q && CHECK_RE.test(q)) return 'asks_check_number'
  return 'default'
}

// Stateful bank picker for one card: next unused line per bank, 'default' when a bank runs out; patience.
export function makeKid(card) {
  const used = {}
  let repeats = 0
  let checkedOut = false
  const take = (key) => {
    const bank = card.banks[key] ?? []
    const i = used[key] ?? 0
    if (i < bank.length) {
      used[key] = i + 1
      return bank[i]
    }
    if (key === 'default') {
      const d = card.banks.default
      used.default = i + 1
      return d[i % d.length]
    }
    return take('default')
  }
  return {
    get repeats() {
      return repeats
    },
    get checkedOut() {
      return checkedOut
    },
    // -> {key, line (string or array for a double text)}
    next(key) {
      if (key === 'repeats_question') repeats += 1
      if (!checkedOut && repeats > (card.patience ?? 3)) {
        checkedOut = true
        return { key: 'repeats_question', line: take('repeats_question'), checkedOut: true }
      }
      if (checkedOut) return { key: 'default', line: take('default'), checkedOut: true }
      return { key, line: take(key) }
    },
    afterMiss() {
      return take('after_quiz_miss')
    },
    action(at) {
      return (card.ui_actions ?? []).find((a) => a.at === at)
    },
  }
}
