"""Pip's crew, unlocks and dream (v3.9 / v3.10): pure rules over the student document. Earn-only, non-romantic,
all-ages. The server calls `ko_rewards` once per K.O. and `pick_review_rule` for mini reviews."""

import re

import lesson as L
import pacing

DREAMS = ("fame", "squad", "creator", "family", "explorer")
DUO_CREATURES = ("blob", "cat", "dragon", "axolotl", "frog", "bot")
VERSION_UNLOCKS = {2: ["club_stage"], 3: ["runway_finale", "mod_slot_2"]}

REFORMED = {  # one reformed line per boss, same deadpan formal voice
    "a_tri": "I have recounted. It is half. I would like to join you.",
    "a_frac": "I have counted the bottoms again. They were never mine to add. I would like to join you.",
    "a_sat_commas": "I have stopped pausing at random. Commas have standards. I would like to join you.",
    "a_sat_linear": "I have carried the plus across and changed its sign. It was easy. I would like to join you.",
}
GENERIC_REFORMED = "I accept the correction. I would like to join you."
SHAPES = {"a_tri": "triangle", "a_frac": "pizza", "a_sat_commas": "comma", "a_sat_linear": "seesaw"}
RULE_NAMES = {"a_tri": "half-rule", "a_frac": "same-size rule", "a_sat_commas": "comma rule",
              "a_sat_linear": "balance rule"}
FASHION = ["jacket", "visor", "scarf", "sneakers", "backpack patch", "room lamp", "room rug"]
CLUBS = [("club_show", "Club show"), ("runway", "Runway show"), ("arena_concert", "Arena concert")]


def reformed_line(a: dict) -> str:
    return ((a["boss"].get("lines") or {}).get("reformed") or REFORMED.get(a["id"]) or GENERIC_REFORMED)


def egg_ready(st: dict) -> bool:
    if any(c.get("kind") == "mini" for c in st.get("crew", [])):
        return False
    return (st.get("brain_version", 1) >= 3 or st.get("ko_count", 0) >= 3
            or (st.get("pip_dream") == "family" and st.get("ko_count", 0) >= 1))


def dream_unlock(st: dict, a: dict, n: int) -> dict | None:
    """The dream's reward for the n-th K.O. (n starts at 1)."""
    d = st.get("pip_dream")
    boss = a["boss"]["name"].split()[0].lower()
    shape = SHAPES.get(a["id"], "shape")
    if d == "fame":
        kid, title = CLUBS[n - 1] if n <= len(CLUBS) else (f"cover_{n}", f"Cover: {a['topic']}")
        line = "i just headlined the club stage. you're welcome." if n == 1 else \
            f"{title.lower()} is booked. i'm very calm about it."
        return {"kind": "stage", "id": kid, "title": title, "line": line}
    if d == "squad":
        if n == 1:
            return {"kind": "crew", "id": "duo_prompt", "title": "Choose a duo partner",
                    "line": f"{boss} wants to be in the group photo. fine."}
        return {"kind": "photo", "id": f"group_photo_{n}", "title": "Group photo",
                "line": f"{boss} stood in the back. he is very proud of it."}
    if d == "creator":
        item = FASHION[(n - 1) % len(FASHION)]
        rule = RULE_NAMES.get(a["id"], "rule")
        line = f"i made a jacket out of your {rule}." if n == 1 else f"i made a {item} out of your {rule}."
        return {"kind": "fashion", "id": re.sub(r"\W+", "_", item) + (f"_{n}" if n > len(FASHION) else ""),
                "title": f"New {item}", "line": line}
    if d == "family":
        if n == 1:
            return {"kind": "egg", "id": "egg", "title": "A wobbling egg",
                    "line": "the egg is wobbling. i didn't do anything."}
        return {"kind": "photo", "id": f"photo_wall_{n}", "title": "Photo wall",
                "line": "i put your face on the wall. it is a good wall."}
    if d == "explorer":
        return {"kind": "backdrop", "id": f"{SHAPES.get(a['id'], 'new')}_valley_{n}" if n > 1 else
                f"{SHAPES.get(a['id'], 'new')}_valley", "title": f"The {shape} valley",
                "line": f"there's a new place on the map. it's shaped like a {shape}."}
    return None


def ko_rewards(st: dict, a: dict, now: str) -> dict:
    """Mutates the student; returns {new_crew, unlocked, dream_unlock, egg_ready}."""
    st["ko_count"] = int(st.get("ko_count", 0)) + 1
    crew, unlocks = st.setdefault("crew", []), st.setdefault("unlocks", [])
    new_crew, unlocked = [], []
    if not any(c.get("kind") == "reformed_boss" and c.get("from_assignment") == a["id"] for c in crew):
        member = {"kind": "reformed_boss", "id": f"boss_{a['id']}", "name": a["boss"]["name"],
                  "joined_at": now, "from_assignment": a["id"], "line": reformed_line(a),
                  "emoji": a["boss"].get("emoji", "")}
        crew.append(member)
        new_crew.append(member)
    for v in range(2, int(st.get("brain_version", 1)) + 1):
        for u in VERSION_UNLOCKS.get(v, []):
            if u not in unlocks:
                unlocks.append(u)
                unlocked.append(u)
    du = dream_unlock(st, a, st["ko_count"])
    if du and du["id"] not in unlocks:
        unlocks.append(du["id"])
    st["egg_ready"] = egg_ready(st)
    return {"new_crew": new_crew, "unlocked": unlocked, "dream_unlock": du, "egg_ready": st["egg_ready"]}


def pick_review_rule(st: dict, sessions: list[dict], assignments: dict) -> dict | None:
    """The correct rule (verbatim) least recently reviewed; never-reviewed first, then oldest."""
    log = {f"{r['assignment_id']}:{r['concept_id']}": r["date"] for r in st.get("review_log", [])}
    cands = []
    for s in sorted(sessions, key=lambda x: x["created_at"], reverse=True):
        a = assignments.get(s["assignment_id"])
        if not a or a.get("review"):
            continue
        for r in s.get("brain") or []:
            if r.get("correct") and (r.get("quote") or "").strip() and any(
                    c["id"] == r["concept_id"] for c in a["concepts"]):
                key = f"{a['id']}:{r['concept_id']}"
                cands.append((log.get(key, ""), key, a, r))
    if not cands:
        return None
    seen, uniq = set(), []
    for c in sorted(cands, key=lambda x: x[0]):
        if c[1] not in seen:
            seen.add(c[1])
            uniq.append(c)
    _, key, a, r = uniq[0]
    return {"assignment": a, "concept_id": r["concept_id"], "rule": r["quote"].strip()}


def misapplication(a: dict, les: dict | None, cid: str) -> str:
    """What the mini gets wrong: the lesson's contrast case for the concept, phrased as one question."""
    spec = L.lc(les, cid) if les else None
    rungs = (spec or {}).get("probe_ladder", [])
    infer = next((r for r in rungs if pacing.rung_kind(r) == "infer"), None)
    if infer:
        line = infer.rstrip()
        line = re.sub(r"\s*that'?s what my rule says\.?$", "", line, flags=re.I).rstrip(" .,")
        return f"I tried it on a new one. {line[:1].upper()}{line[1:]}. Is that right?"
    q = pacing.one_question(rungs[0]) if rungs else "Can you show me again?"
    return q if q.endswith("?") else q + "?"
