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
    "sat_linear_session": ("a_sat_linear", "s009", "competent", [
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


def norm_q(text: str) -> str:
    m = re.search(r"[^.!?]*\?", text)
    return re.sub(r"[^a-z0-9 ]", "", (m.group(0) if m else text).lower()).strip()


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
        one_q += reply.count("?") == 1
        if echoes(reply, m):
            echo_n += 1
            notes.append(f"#{i} verbatim echo: {reply[:70]}")
        q = norm_q(reply)
        if q in seen_q:
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
        for sp in spoilers:
            if sp in low and sp not in said_all:
                leaks += 1
                notes.append(f"#{i} leak '{sp}'")
        if ready_at is None and s.get("ready_for_quiz"):
            ready_at = i
    out = {"persona": name, "kind": kind, "texts": len(msgs), "ready_at": ready_at, "circling": circ,
           "leaks": leaks, "echo": echo_n, "one_q": round(one_q / max(1, n_pip), 2), "notes": notes,
           "transcript": [(t["from"], t["text"]) for t in s["transcript"] if t["from"] in ("pip", "student")]}
    if judge:
        out["judge"] = judge(out["transcript"])
    return out


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
    args = ap.parse_args()
    if args.model:
        os.environ["PIP_CHAT_MODEL"] = args.model
    client, server = load_app(Path(args.backend).resolve(), args.mode)
    if args.mode == "live" and not server.llm.available():
        print("live mode needs ANTHROPIC_API_KEY", file=sys.stderr)
        return 2
    judge = make_judge(server) if args.mode == "live" else None
    names = args.only.split(",") if args.only else list(PERSONAS)
    res = [run_persona(client, n, PERSONAS[n], judge) for n in names]
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
           or r["ready_at"] is None or r["ready_at"] > (4 if r["kind"] == "competent" else 6)]
    print(f"\n{len(res) - len(bad)}/{len(res)} personas within targets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
