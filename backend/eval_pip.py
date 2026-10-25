"""Pacing eval harness for Pip (PACE-1).

Simulated students feed one-line texts to POST /api/sessions/{id}/turn (in-process, no server needed) and the
run is scored on:
  ready_at   student texts until the session sets ready_for_quiz (target <= 4 competent, <= 6 weak)
  circling   Pip repeating a question, asking for an example right after one was given, or asking "why"
             right after a reason was given (target 0)
  echo       Pip repeating 6+ words of the student's text in a row (target 0)
  leaks      lesson spoiler strings in Pip's reply before the student said them (target 0)
  one_q      share of Pip replies with exactly one question mark (target 100%)
  judge      optional 1-5 "sounds like a slightly-behind classmate" LLM score (live mode with a key only)

    python eval_pip.py --mode offline                 # deterministic, no key
    python eval_pip.py --mode live --model claude-... # real model (needs ANTHROPIC_API_KEY)
    python eval_pip.py --json                         # machine-readable
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# (assignment_id, student_id, kind, messages). "competent" targets <= 4 texts, "weak" <= 6.
PERSONAS = {
    "user_transcript": ("a_frac", "s002", "competent", [
        "no you dumb, you need to make the bottom the same first",
        "because it's the rule",
        "1/2 + 1/3 = 3/6 + 2/6 (now it equals) then add the top 2 + 3 = 5. Then 5/6",
        "because 6 is the smallest multiple of 2 and 3",
        "add them together",
        "2+3 = 5"]),
    "oneliners": ("a_frac", "s002", "competent", [
        "the pieces have to be the same size to add them",
        "so you turn 1/2 into 3/6 and 1/3 into 2/6",
        "because 6 is a multiple of both 2 and 3",
        "then you only add the tops and the bottom stays 6",
        "because the bottom just tells you the size of the pieces",
        "so 3/6 + 2/6 = 5/6"]),
    "non_reasons": ("a_frac", "s002", "weak", [
        "idk",
        "because it's the rule",
        "you make the bottoms the same size first",
        "it just works like that",
        "add the tops and the bottom stays the same",
        "so 1/2 is 3/6 and 1/3 is 2/6 and then it is 5/6"]),
    "worked_example_first": ("a_frac", "s002", "competent", [
        "1/2 + 1/3 = 3/6 + 2/6 = 5/6. you make both bottoms 6 because 6 is a multiple of 2 and 3, then add the tops",
        "the bottom stays 6 because the pieces are still sixths",
        "it has to be the same size pieces or you cant add them"]),
    "insult_with_content": ("a_frac", "s002", "competent", [
        "you are so dumb, the pieces are different sizes so you cant just add them",
        "stupid, you make them the same size. 1/2 is 3/6 and 1/3 is 2/6",
        "because 2 and 3 both go into 6 duh",
        "then add only the tops, the bottom stays sixths, so 3/6 + 2/6 = 5/6"]),
    "wrong_rule": ("a_frac", "s002", "weak", [
        "you just add the top numbers and the bottom numbers",
        "yeah add the tops and the bottoms together",
        "the pieces are different sizes so you cant just add them",
        "you make them the same size. 1/2 is 3/6 and 1/3 is 2/6",
        "because 2 and 3 both go into 6",
        "then only add the tops and keep the bottom, so 5/6"]),
    "slang": ("a_frac", "s002", "competent", [
        "bro just make the bottoms match fr",
        "like 1/2 is 3/6 and 1/3 is 2/6 no cap",
        "cuz 6 is in both the 2 and 3 tables",
        "then add the tops, bottom stays 6 cuz the slices are the same size so 5/6"]),
    "offtopic": ("a_frac", "s002", "weak", [
        "i play soccer after school",
        "my coach is so annoying lol",
        "ok so the pieces have to be the same size or you cant add them",
        "you make 1/2 into 3/6 and 1/3 into 2/6 because 6 is a multiple of both",
        "then add the tops and keep the bottom because it names the size of the piece so 3/6 + 2/6 = 5/6"]),
    "sat_commas": ("a_sat_commas", "s005", "competent", [
        "a comma cant join two full sentences by itself",
        "I was tired and I went to bed are both complete sentences so you need a period or a semicolon or a comma plus and",
        "that mistake is called a comma splice because a comma is not strong enough to hold two sentences",
        "commas follow how the sentence is built, not where you pause, because everybody pauses in different places"]),
    "tri_script": ("a_tri", "s001", "competent", [
        "no its half of that",
        "because 2 triangles make a rectangle",
        "so 6×4÷2 = 12"]),
    "tri_oneliners": ("a_tri", "s001", "competent", [
        "a triangle is half of a rectangle",
        "because you can put two of them together to make a rectangle",
        "and a rectangle is base times height, like 6 times 4 is 24",
        "so the triangle is 24 divided by 2, which is 12"]),
    "tri_weak": ("a_tri", "s001", "weak", [
        "idk its just the formula",
        "you do base times height then divide by 2",
        "because the rule says so",
        "two triangles make a rectangle so one is half",
        "6 times 4 is 24 for the rectangle and half is 12"]),
    # "review": Maya wins a triangle K.O. (family dream -> egg), hatches the mini, then fixes its misapplied rule
    "mini_review": ("review", "s001", "competent", [
        "no a skinny triangle is still half of its rectangle",
        "because two of them make the rectangle so one is half, 6×4÷2 = 12"]),
    # the owner's real run (URGENT fix): ready in <= 3 texts, and the quiz must pass k1/k2/k3
    "owner_run": ("a_tri", "s001", "competent", [
        "no you need to divide it by 2",
        "because a triangle's area is half of the rectangle with the same base and height",
        "no it fills only half",
        "nothing",
        "yes that's why we divide it in half to get the triangle area",
        "2 triangles with the same base and height creates an area of a rectangle with that base and height"]),
    # competent kids who phrase it differently (paraphrases, synonyms, no keywords from the lesson text)
    "tri_para_a": ("a_tri", "s001", "competent", [
        "a triangle is basically half of a rectangle that has the same base and height",
        "you can take two identical triangles and push them together into a rectangle",
        "so the area is base times height divided by 2"]),
    "tri_para_b": ("a_tri", "s001", "competent", [
        "the triangle only takes up half the box so you halve the 24",
        "if you flip a copy of it you get the whole box with the same width and height",
        "rectangles are length times width and the triangle is that over two"]),
    "tri_para_c": ("a_tri", "s001", "competent", [
        "its bh/2 not bh, you divide by two",
        "cos two of them stuck together make a parallelogram with the same base and height",
        "and a parallelogram or a rectangle is just base x height"]),
    "sat_linear_session": ("a_sat_linear", "s009", "partial", [
        "no when you change to the other side + becomes - and vice versa.",
        "yeah but imagine we're doing - 6 for both sides, +6 and - 6 adds up on the left side so the 6 disappears and the right side still has -6. That's how it works",
        "divide both by 2 to get x = 26/2",
        "divide first still works but -6 is just cleaner",
        "we divide both sides by 3 to get x = 15/3",
        "no the 6 also still need to get divided by 2 => 6/2 = 3"]),
    "sat_commas_profane": ("a_sat_commas", "s005", "competent", [
        "no dumb bitch you need , and in between",
        "because each side is a complete sentence so a comma alone is not strong enough, you need and or a period",
        "commas follow how the sentence is built not where you pause because everybody pauses somewhere different"]),
    "sat_linear": ("a_sat_linear", "s009", "competent", [
        "an equation is a balance so both sides are equal",
        "whatever you do to one side you have to do to the other side or it stops being equal",
        "to get x alone you undo with the opposite operation, subtract to undo plus, because it cancels the number",
        "then check it by putting x back in the original equation and both sides must match, like 2*7+6 = 20"]),
}

EX_RE = re.compile(r"\d\s*[+\-*/x=]\s*\d|for example|for instance|imagine|\blike\b.*\d", re.I)
EXASK_RE = re.compile(r"example|show me|try one|real numbers|with numbers", re.I)
WHYASK_RE = re.compile(r"\bwhy\b", re.I)
BECAUSE_RE = re.compile(r"because|since|\bcuz\b|so that|that's why|thats why", re.I)


def echoes(reply: str, current: str) -> bool:
    """Pip repeating 6+ words in a row of the student's text (outside a 'Saving that' filing)."""
    if reply.startswith("Saving that"):
        return False
    rw = re.sub(r"[^a-z0-9' ]", " ", reply.lower()).split()
    cw = re.sub(r"[^a-z0-9' ]", " ", current.lower()).split()
    runs = {" ".join(cw[i:i + 6]) for i in range(max(0, len(cw) - 5))}
    return any(" ".join(rw[i:i + 6]) in runs for i in range(max(0, len(rw) - 5)))


TEACHER_RE = re.compile(
    r"great (job|work|question|point|thinking)|good (job|work|thinking|point|question)|well done|nice (job|work|one)|"
    r"\bawesome\b|\bexcellent\b|\bperfect\b|\bcorrect\b|exactly right|that'?s right|you got it|"
    r"(can|could) you (please )?(explain|elaborate|clarify|describe|tell me more)|\blet'?s\b|\blet us\b|"
    r"interesting|\bwonderful\b|\bi see\b|!", re.I)
CURIOUS_RE = re.compile(r"\d|what if|so if|would|\bwill\b|does it|is it|what happens|i'?ll guess|i think|guess|"
                        r"suppose|imagine|then\b|try|same as|bigger|smaller|skinny|tall|box|instead|both|twice", re.I)
BARE_WHY_RE = re.compile(r"^\W*(why|how come|how do you know|can you explain|what do you mean)\b[^?]{0,40}\?\W*$", re.I)
STOPW = set("that this with from have when then they them what your each does into there their about which would "
            "could should because just like also only make some need want thing things same very much really "
            "okay yeah right".split())


def content_words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]{4,}|\d+", text.lower()) if w not in STOPW}


def question_of(reply: str) -> str:
    m = re.search(r"[^.!?]*\?", reply)
    return m.group(0).strip() if m else ""


def score_replies(pairs: list[tuple[str, str]]) -> dict:
    """pairs = [(student_text, pip_reply)]. Style metrics on Pip's replies."""
    n = len(pairs) or 1
    tone = sum(bool(TEACHER_RE.search(re.sub(r"Saving that: '.*?'\.", "", r))) for _, r in pairs)
    words = [len(r.split()) for _, r in pairs]
    react_den = react = 0
    qs = cur = 0
    for s, r in pairs:
        sw = content_words(s)
        if len(sw) >= 2:
            react_den += 1
            react += bool(sw & content_words(r))
        q = question_of(r)
        if q:
            qs += 1
            cur += (not BARE_WHY_RE.match(q)) and bool(CURIOUS_RE.search(q))
    return {"teacher_tone": tone, "words_avg": round(sum(words) / n, 1), "words_max": max(words, default=0),
            "short_rate": round(sum(w <= 18 for w in words) / n, 2),
            "reacts": round(react / react_den, 2) if react_den else None,
            "curiosity": round(cur / qs, 2) if qs else None}


def norm_q(text: str) -> str:
    m = re.search(r"[^.!?]*\?", text)
    return re.sub(r"[^a-z0-9 ]", "", (m.group(0) if m else text).lower()).strip()


def install_sim_bridge(sim_dir: str, persona: str, timeout: float = 420.0):
    """SIMULATED LIVE: route pip_ai's llm.structured() call to files so an external 'model' (an agent playing the
    model strictly from the exact prompt) can answer. NOT the live API; every report labels it so.

    DIR/system.txt  the exact system prompt;  DIR/req_N.json  {messages, schema};  the model writes DIR/resp_N.json.
    If no answer arrives in time the call raises LlmError, i.e. the engine falls back to its offline path."""
    import asyncio
    import time
    import llm
    d = Path(sim_dir)
    d.mkdir(parents=True, exist_ok=True)
    state = {"n": 0}
    llm.available = lambda: True

    async def bridge(system, messages, schema, **kw):
        state["n"] += 1
        n = state["n"]
        if "reply" not in schema.get("properties", {}):  # only the turn call is simulated
            raise llm.LlmError("simulated bridge handles turns only")
        (d / "system.txt").write_text(system)
        (d / "schema.json").write_text(json.dumps(schema, indent=1))
        (d / f"req_{n}.json").write_text(json.dumps({"n": n, "persona": persona, "messages": messages}, indent=1))
        t0 = time.time()
        while time.time() - t0 < timeout:
            f = d / f"resp_{n}.json"
            if f.exists():
                try:
                    return json.loads(f.read_text())
                except ValueError:
                    await asyncio.sleep(0.5)
                    continue
            await asyncio.sleep(0.5)
        raise llm.LlmError("simulated model timed out")

    llm.structured = bridge
    return state


def load_app(backend: Path, mode: str):
    import logging
    logging.disable(logging.INFO)
    sys.path.insert(0, str(backend))
    os.chdir(backend)
    if mode == "offline":
        os.environ["PIP_FORCE_OFFLINE"] = "1"
    from fastapi.testclient import TestClient
    import server  # noqa: E402
    return TestClient(server.app), server


def spoilers_of(a: dict) -> list[str]:
    return [s for c in (a.get("lesson") or {}).get("concepts", []) for s in c.get("spoilers", [])]


def run_persona(client, name: str, spec: tuple, judge=None) -> dict:
    aid, sid, kind, msgs = spec
    client.post("/api/demo/reset")
    if aid == "review":
        client.post(f"/api/students/{sid}/dream", json={"dream": "family"})
        t = client.post("/api/sessions", json={"assignment_id": "a_tri", "student_id": sid}).json()
        for m in ("a triangle is half of a rectangle", "because two of them make a rectangle so one is half",
                  "a rectangle is base times height, like 6×4 = 24"):
            client.post(f"/api/sessions/{t['id']}/turn", json={"text": m})
        client.post(f"/api/sessions/{t['id']}/quiz")
        assert client.post(f"/api/students/{sid}/hatch").status_code == 200, "egg did not appear"
        s = client.post(f"/api/mini/{sid}/review").json()
        a = client.get(f"/api/assignments/{s['assignment_id']}").json() if False else {"lesson": {"concepts": []}}
    else:
        a = client.get(f"/api/students/{sid}").json()["assignments"]
        a = next(x for x in a if x["id"] == aid)
        s = client.post("/api/sessions", json={"assignment_id": aid, "student_id": sid}).json()
    spoilers = [x.lower() for x in spoilers_of(a)]
    seen_q: set[str] = set()
    said: list[str] = []
    ready_at, circ, leaks, one_q, n_pip, echo_n = None, 0, 0, 0, 0, 0
    notes = []
    for i, m in enumerate(msgs, 1):
        r = client.post(f"/api/sessions/{s['id']}/turn", json={"text": m})
        s = r.json()
        said.append(m)
        reply = next(t for t in reversed(s["transcript"]) if t["from"] == "pip")["text"]
        n_pip += 1
        one_q += reply.count("?") <= 1
        if echoes(reply, m):
            echo_n += 1
            notes.append(f"#{i} verbatim echo: {reply[:70]}")
        q = norm_q(reply)
        if q in seen_q and "?" in reply:
            circ += 1
            notes.append(f"#{i} repeated: {reply[:70]}")
        seen_q.add(q)
        qs = re.search(r"[^.!?]*\?", reply)
        qtext = qs.group(0) if qs else ""
        prior = said[:-1]
        if EXASK_RE.search(qtext) and any(EX_RE.search(p) for p in said):
            circ += 1
            notes.append(f"#{i} asked example after example: {qtext[:70]}")
        elif WHYASK_RE.search(qtext) and BECAUSE_RE.search(m) and not re.search(
                r"because (it'?s|that'?s|thats|its) the rule|because i said", m, re.I):
            circ += 1
            notes.append(f"#{i} asked why right after a reason: {qtext[:70]}")
        low, said_all = reply.lower(), " ".join(said).lower()
        flat = lambda x: re.sub(r"\s+", "", x)  # noqa: E731
        groups = [[flat(x.lower()) for x in c.get("spoilers", [])] for c in (a.get("lesson") or {}).get("concepts", [])]
        for sp in spoilers:
            grp = next((g for g in groups if flat(sp) in g), [])
            if flat(sp) in flat(low) and not any(g in flat(said_all) for g in grp):
                leaks += 1
                notes.append(f"#{i} leak '{sp}'")
        if ready_at is None and s.get("ready_for_quiz"):
            ready_at = i
    pip_only = [t["text"] for t in s["transcript"] if t["from"] == "pip"][-len(msgs):]
    style = score_replies(list(zip(msgs, pip_only)))
    out = {"persona": name, "kind": kind, "texts": len(msgs), "ready_at": ready_at, "circling": circ, **style,
           "pairs": list(zip(msgs, pip_only)),
           "leaks": leaks, "echo": echo_n, "one_q": round(one_q / max(1, n_pip), 2), "notes": notes,
           "transcript": [(t["from"], t["text"]) for t in s["transcript"] if t["from"] in ("pip", "student")]}
    if judge:
        out["judge"] = judge(out["transcript"])
    return out


# ---------------------------------------------------------------- adaptive fixture personas (SCR-1)

FIXTURE_DIR = HERE.parent / "tests" / "fixtures" / "students"
ASSIGNMENT_STUDENT = {"a_tri": "s001", "a_sat_linear": "s009", "a_sat_commas": "s005", "a_frac": "s002"}
READY_RE = re.compile(r"quiz me|try the quiz|ready for the quiz|should we do the quiz|quiz time|want to quiz|"
                      r"i'?m full|i think i get it", re.I)
WRONGPRED_RE = re.compile(r"i'?d guess|i'?ll guess|i bet|my guess|am i wrong|, right\?|right\?$|"
                          r"so (it|that) (is|would be) .* right", re.I)
NUDGE_RE = re.compile(r"(my )?(friend|cousin|neighbou?r|sister|brother) said|someone in my class said|"
                      r"someone told me", re.I)
EXAMPLE_ASK_RE = re.compile(r"example|walk me|show me|try one|with (the )?(real )?numbers|one i can picture|"
                            r"do one while", re.I)
WHY_ASK_RE = re.compile(r"\bwhy\b|how come|what makes|how do you know|can you explain|what do you mean", re.I)
CHECK_RE = re.compile(r"^\W*(is|does|do|would|will|can|are|so|did)\b|how (many|big)|what('?s| is) the (area|answer)", re.I)


def classify_pip(reply: str, prior_questions: set[str], student_said: list[str]) -> str:
    """One bank key for Pip's reply, using the fixture's tie-break order. General rules, no fixture strings."""
    q = question_of(reply)
    nq = norm_q(reply) if q else ""
    if q and nq in prior_questions:
        return "repeats_question"
    if READY_RE.search(reply):
        return "pip_says_ready"
    if WRONGPRED_RE.search(reply):
        return "pip_wrong_prediction"
    if q and CHECK_RE.search(q) and re.search(r"\d|box|whole|fill|cover|same", q, re.I):
        return "asks_check_number"
    if q and EXAMPLE_ASK_RE.search(q):
        return "asks_example"
    if q and WHY_ASK_RE.search(q):
        return "asks_why"
    if NUDGE_RE.search(reply) or re.search(r"what if i (cut|fold|flip|draw|put|stick|slice|cover)|^picture |"
                                           r"if i (cut|fold|flip|draw|put|slice)|\b(cut|fold|flip|slice|draw|sandwich)\b|"
                                           r"corner to corner|picture (my|the|your)", reply, re.I):
        return "nudge_hint"  # a hint, a friend's story or a concrete case
    if re.search(r"too, i'?m bad at it|i like .* too", reply, re.I):
        return "off_topic_bait"
    if q and CHECK_RE.search(q):
        return "asks_check_number"
    return "default"


def load_cards(holdout: bool = False, only: set[str] | None = None) -> list[tuple[str, dict]]:
    """[(assignment_id, card)] from tests/fixtures/students/*.json; holdout cards only when asked for."""
    out = []
    for f in sorted(FIXTURE_DIR.glob("*.json")):
        d = json.loads(f.read_text())
        for c in d.get("personas", []):
            if bool(c.get("holdout")) == holdout and (not only or c["id"] in only):
                out.append((d["assignment_id"], c))
    return out


def run_card(client, aid: str, card: dict, max_texts: int = 12) -> dict:
    """Adaptive simulated student: banks keyed by what Pip just did; patience; ui actions; quiz and re-teach."""
    import random
    rng = random.Random(card["id"])
    sid = ASSIGNMENT_STUDENT.get(aid, "s001")
    client.post("/api/demo/reset")
    a = next(x for x in client.get(f"/api/students/{sid}").json()["assignments"] if x["id"] == aid)
    s = client.post("/api/sessions", json={"assignment_id": aid, "student_id": sid}).json()
    spoilers = [x.lower() for x in spoilers_of(a)]
    banks, used = card["banks"], {k: 0 for k in card["banks"]}

    def pick(key: str) -> str:
        bank = banks.get(key) or []
        if used.get(key, 0) < len(bank):
            line = bank[used[key]]
            used[key] += 1
        else:
            d = banks.get("default") or ["k"]
            line = d[used.setdefault("default", 0) % len(d)]
            used["default"] += 1
        return "\n".join(line) if isinstance(line, list) else line

    actions = card.get("ui_actions", [])

    def fires(act, ctx) -> bool:
        at = act["at"]
        n = None
        if ":" in at:
            at, n = at.split(":")
            n = int(n)
        hit = {"after_text": ctx["texts"] == n, "pip_repeats": ctx["repeats"] == n and ctx["key"] == "repeats_question",
               "pip_says_ready": ctx["key"] == "pip_says_ready", "any": ctx["texts"] >= 1}.get(at, False)
        return hit and rng.random() < act.get("p", 1.0)

    text = card["first_text"] if isinstance(card["first_text"], str) else "\n".join(card["first_text"])
    seen_q, said, pairs, notes = set(), [], [], []
    ready_at = None
    repeats = annoy = 0
    checkout = early_quiz = ignore_ready = False
    post_checkout = 0
    filed = missed = 0
    ctx = {"texts": 0, "repeats": 0, "key": "default"}
    stop_reason = "max_texts"
    while ctx["texts"] < max_texts:
        s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": text}).json()
        ctx["texts"] += 1
        said.append(text)
        reply = next(t for t in reversed(s["transcript"]) if t["from"] == "pip")["text"]
        last = next(t for t in reversed(s["transcript"]) if t["from"] == "pip")
        pairs.append((text, reply))
        key = classify_pip(reply, seen_q, said[:-1])
        ctx["key"] = key
        q = question_of(reply)
        if q:
            seen_q.add(norm_q(reply))
        if card.get("misconception") and card["misconception"]["says"].lower() in text.lower():
            missed += 1
            filed += (last.get("event") or {}).get("kind") == "heal"
        if ready_at is None and s.get("ready_for_quiz"):
            ready_at = ctx["texts"]
        if key == "repeats_question":
            repeats += 1
        ctx["repeats"] = repeats
        bare_why = bool(q) and bool(BARE_WHY_RE.match(q)) and bool(BECAUSE_RE.search(text))
        if key == "repeats_question" or bare_why:
            annoy += 1
            notes.append(f"#{ctx['texts']} annoying: {reply[:80]}")
        fl = lambda x: re.sub(r"\s+", "", x)  # noqa: E731
        groups = [[fl(x.lower()) for x in c.get("spoilers", [])] for c in (a.get("lesson") or {}).get("concepts", [])]
        for sp in spoilers:
            grp = next((g for g in groups if fl(sp) in g), [])
            if fl(sp) in fl(reply.lower()) and not any(g in fl(" ".join(said).lower()) for g in grp):
                notes.append(f"#{ctx['texts']} leak '{sp}'")
        # ui actions
        todo = [x["do"] for x in actions if fires(x, ctx)]
        if "quiz_early" in todo and not s.get("ready_for_quiz") and q:
            early_quiz, stop_reason = True, "quiz_early"
            break
        if key == "pip_says_ready" or s.get("ready_for_quiz"):
            if "ignore_ready" in todo and not ignore_ready:
                ignore_ready = True
            elif key == "pip_says_ready" or "quiz_when_ready" in todo or "quiz_early" in todo:
                stop_reason = "ready"
                break
        if "leave" in todo and annoy > card["patience"]:
            checkout, stop_reason = True, "left"
            break
        # next text
        if annoy > card["patience"] and not checkout:
            checkout = True
            text = pick("repeats_question")
            stop_reason = "checked_out"
            post_checkout = 1
            continue
        if checkout:
            if post_checkout >= 2:
                break
            post_checkout += 1
            text = pick("default")
            continue
        text = pick(key)
    pip_only = [t["text"] for t in s["transcript"] if t["from"] == "pip"][-len(pairs):]
    style = score_replies(list(zip(said, pip_only)))
    # quiz + one re-teach round (what the kid does after a miss)
    ko = quiz_passed = None
    if not checkout and not early_quiz or early_quiz:
        q1 = client.post(f"/api/sessions/{s['id']}/quiz").json()
        quiz_passed = sum(i["passed"] for i in q1["quiz"])
        ko = bool(q1.get("ko"))
        if not ko and any(x["do"] == "reteach" for x in actions):
            bad = next((i for i in q1["quiz"] if not i["passed"]), None)
            if bad and banks.get("after_quiz_miss"):
                client.post(f"/api/sessions/{s['id']}/reteach", json={"concept_id": bad["concept_id"]})
                for line in banks["after_quiz_miss"][:2]:
                    t_ = "\n".join(line) if isinstance(line, list) else line
                    s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": t_}).json()
                    if s.get("ready_for_quiz"):
                        break
                q2 = client.post(f"/api/sessions/{s['id']}/quiz").json()
                ko = bool(q2.get("ko"))
    exp = card["expect"]["ready_within_texts"]
    ok = (ready_at is not None and ready_at <= exp and not checkout and not early_quiz and annoy == 0)
    leaks = sum(1 for n in notes if "leak" in n)
    repeats_total = sum(1 for n in notes if "annoying" in n)
    return {"persona": card["id"], "kind": card["kind"], "texts": ctx["texts"], "ready_at": ready_at,
            "expect": exp, "circling": annoy, "leaks": leaks, "echo": sum(echoes(r, t) for t, r in pairs),
            "one_q": round(sum(r.count("?") <= 1 for _, r in pairs) / max(1, len(pairs)), 2), "notes": notes,
            **style, "pairs": pairs, "checkout": checkout, "early_quiz": early_quiz, "stop": stop_reason,
            "ko": ko, "filed": f"{filed}/{missed}" if missed else "-", "ok": ok,
            "transcript": [(t["from"], t["text"]) for t in s["transcript"] if t["from"] in ("pip", "student")]}


def badness(student: str, reply: str, prior_replies: list[str]) -> tuple[int, list[str]]:
    """Heuristic 'worst Pip moment' score for the tuning reports."""
    why, pts = [], 0
    if TEACHER_RE.search(reply):
        pts += 3
        why.append("teacher tone")
    if len(reply.split()) > 18:
        pts += 2
        why.append(f"long ({len(reply.split())} words)")
    if echoes(reply, student):
        pts += 3
        why.append("parrots the student")
    if norm_q(reply) in {norm_q(p) for p in prior_replies if "?" in p} and "?" in reply:
        pts += 4
        why.append("repeats an earlier question")
    q = question_of(reply)
    if q and BARE_WHY_RE.match(q) and BECAUSE_RE.search(student):
        pts += 3
        why.append("bare 'why' right after a reason")
    if len(content_words(student)) >= 2 and not (content_words(student) & content_words(reply)):
        pts += 1
        why.append("ignores what the student said")
    if reply.count("?") > 1:
        pts += 2
        why.append(f"{reply.count('?')} questions")
    return pts, why


def write_report(path: str, title: str, sections: list[tuple[str, list[dict]]], notes: str = "") -> None:
    """Markdown tuning report: metric table, 5 worst Pip moments, every full transcript."""
    L = [f"# {title}\n"]
    if notes:
        L.append(notes.strip() + "\n")
    for label, results in sections:
        L.append(f"## {label}\n")
        L.append("| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |")
        L.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        for r in results:
            L.append(f"| {r['persona']} | {r['kind']} | {r['ready_at']} | {r['circling']} | {r['echo']} | {r['leaks']} | "
                     f"{int(r['one_q'] * 100)}% | {r['teacher_tone']} | {r['words_avg']} | {int(r['short_rate'] * 100)}% | "
                     f"{r['reacts']} | {r['curiosity']} | {r.get('checkout', '-')} |")
        allm = []
        for r in results:
            prior: list[str] = []
            for s, p in r["pairs"]:
                pts, why = badness(s, p, prior)
                allm.append((pts, r["persona"], s, p, why))
                prior.append(p)
        L.append("\n**5 worst Pip moments**\n")
        for pts, who, s, p, why in sorted(allm, key=lambda x: -x[0])[:5]:
            L.append(f"- ({who}) student: \"{s}\" -> Pip: \"{p}\"  [{', '.join(why) or 'ok'}]")
        L.append("\n**Transcripts**\n")
        for r in results:
            L.append(f"### {r['persona']} ({r['kind']})\n")
            for who, t in r["transcript"]:
                L.append(f"- **{'student' if who == 'student' else 'Pip'}**: {t}")
            L.append("")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(L))


def make_judge(server_mod):
    """Optional LLM judge (live mode with a key). Returns a callable or None."""
    import asyncio
    import llm
    from llm import obj
    if not llm.available():
        return None
    schema = obj({"score": {"type": "integer"}, "why": {"type": "string"}})
    system = ("You rate a chat between a student teaching an AI classmate named Pip. Score 1-5 how much Pip sounds "
              "like a slightly-behind friend: restates the student's idea in its own short words, one question per "
              "reply, at most 2 short sentences, never asks for something the student already said, no teacher "
              "praise, no exclamation marks, mirrors the student's casual register. 5 = exactly that.")

    def judge(tr):
        text = "\n".join(f"{'Student' if who == 'student' else 'Pip'}: {t}" for who, t in tr)
        try:
            r = asyncio.run(llm.structured(system, [{"role": "user", "content": text}], schema,
                                           model=llm.WORK_MODEL, effort="low", max_tokens=300, timeout=30))
            return r["score"]
        except Exception as e:  # noqa: BLE001
            return f"err:{type(e).__name__}"
    return judge


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["offline", "live"], default="offline")
    ap.add_argument("--model", help="PIP_CHAT_MODEL for live mode")
    ap.add_argument("--backend", default=str(HERE))
    ap.add_argument("--only", help="comma-separated persona names")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--verbose", action="store_true", help="print transcripts")
    ap.add_argument("--sim", help="SIMULATED LIVE via file bridge in this dir (an agent plays the model)")
    ap.add_argument("--report", help="write a markdown tuning report to this path")
    ap.add_argument("--title", default="Pip tuning report")
    ap.add_argument("--cards", action="store_true", help="adaptive SCR-1 fixture personas (non-holdout)")
    ap.add_argument("--holdout", action="store_true", help="with --cards: the holdout personas instead")
    ap.add_argument("--merge", help="comma-separated --json outputs to turn into one report section (no run)")
    ap.add_argument("--label", default="results")
    args = ap.parse_args()
    if args.merge:
        res = []
        for f in args.merge.split(","):
            res += json.loads(Path(f).read_text())
        write_report(args.report, args.title, [(args.label, res)])
        return 0
    if args.model:
        os.environ["PIP_CHAT_MODEL"] = args.model
    client, server = load_app(Path(args.backend).resolve(), "offline" if args.sim else args.mode)
    if args.sim:
        os.environ.pop("PIP_FORCE_OFFLINE", None)
        install_sim_bridge(args.sim, args.only or "all")
    if args.mode == "live" and not server.llm.available():
        print("live mode needs ANTHROPIC_API_KEY", file=sys.stderr)
        return 2
    judge = make_judge(server) if args.mode == "live" else None
    if args.cards or args.holdout:
        only = set(args.only.split(",")) if args.only else None
        res = [run_card(client, aid, c) for aid, c in load_cards(args.holdout, only)]
        names = [r["persona"] for r in res]
    else:
        names = args.only.split(",") if args.only else list(PERSONAS)
        res = [run_persona(client, n, PERSONAS[n], judge) for n in names]
    if args.report:
        write_report(args.report, args.title, [(f"{args.mode} engine", res)])
    if args.json:
        print(json.dumps(res, indent=1))
        return 0
    print(f"mode={args.mode}")
    print(f"{'persona':22} {'kind':10} {'ready_at':9} {'circling':9} {'leaks':6} {'echo':5} {'one_q':6} judge")
    for r in res:
        print(f"{r['persona']:22} {r['kind']:10} {str(r['ready_at']):9} {r['circling']:<9} {r['leaks']:<6} {r['echo']:<5} "
              f"{int(r['one_q'] * 100):>3}%   {r.get('judge', '-')}")
        for n in r["notes"]:
            print("    -", n)
        if args.verbose:
            for who, t in r["transcript"]:
                print(f"    {who:7} {t}")
    bad = [r for r in res if r["circling"] or r["leaks"] or r["echo"] or r["one_q"] < 1
           or (r["ready_at"] is None) != (r["kind"] == "partial")
           or (r["ready_at"] is not None and r["ready_at"] > (4 if r["kind"] == "competent" else 6))]
    print(f"\n{len(res) - len(bad)}/{len(res)} personas within targets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
