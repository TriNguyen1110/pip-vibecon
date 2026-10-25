# TUNE-2 loop 1

**State measured:** HEAD 5490a95 plus the pre-fixture rework (see loop0.md): reaction-first replies with a short fragment of the kid's words, `aha` lines per concept, `arc` order (rectangle first), new-case / predict question kinds, at-most-one question (sometimes none), live persona rewritten as a short positive prompt with good/bad examples, informal-text normalization ("bc", "u"), lesson-authored `idea_patterns`.
**Cards:** `tests/fixtures/students/*.json`, non-holdout only (18 cards: 13 tri, 5 sat_linear). **BEFORE** (HEAD, same cards, offline): OK 3/18, ready_mean 6.3, teacher-tone 9, reacts 0.18, curiosity 0.52, early quiz taps 2.
**Simulated pass:** 8 cards (tri_quick, tri_forgets_half, tri_idk, tri_insult, tri_annoyed, tri_esl_es, sat_sign_flipper, sat_burnt_out). An agent answered each request strictly from the exact system prompt and messages `pip_ai.py` would send, as the JSON schema asks. It is a simulation, not the live API.

**Findings (loop 1)**
1. The simulated model sounds like a classmate (reacts 0.71, tone 0, short), but the *pacing layer under it* hurts: `ready_at` mean 6.0 vs expected 2-6, only 1/8 cards in target. The server's coverage bookkeeping is stricter than the kid's actual progress, and the friend nudge / "Okay, I'll hold onto that one." fire even when the target concept is already covered (tri_annoyed, tri_insult).
2. Kids reveal reasons when Pip offers a **concrete case** (the fixtures' `nudge_hint` bank), not when Pip asks "why". Pip's bank has no early concrete-case moves, so weak/terse kids (insult, idk, esl) answer "ok/yes" and never explain.
3. Spoiler guard compares strings literally: Pip's "2x = 14" was flagged although the kid had said "2x=14".
4. Offline: replies are long when the ladder rung is long (sat_sign_flipper 39 words); reaction fragments are sometimes unrelated ("ignores what the student said" x6).

**Changes made for loop 2:** (a) nudge/stuck only when the target concept is not covered and Pip is not ready; (b) new move kind `concrete` (a picture or action: "what if i cut the box corner to corner?") ranked first after the kid's first claim, with concrete rungs added to all four lessons' probe_ladder; (c) classifier treats concrete cases as hints; (d) whitespace-insensitive spoiler guard; (e) long rungs trimmed to their question when Pip also reacts.

## A. Offline engine (fixture cards, non-holdout)

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sat_sign_flipper | competent | 8 | 0 | 0 | 0 | 100% | 0 | 18.1 | 62% | 0.17 | 0.25 | False |
| sat_burnt_out | weak | None | 0 | 0 | 0 | 100% | 0 | 7.0 | 100% | None | 0.0 | False |
| sat_one_term | weak | None | 0 | 0 | 0 | 100% | 0 | 18.3 | 57% | 0.33 | 0.33 | False |
| sat_desmos | chaotic | 8 | 0 | 0 | 0 | 100% | 0 | 14.4 | 75% | 0.2 | 0.25 | False |
| sat_anxious_achiever | competent | 4 | 0 | 0 | 0 | 100% | 0 | 17.8 | 50% | 0.33 | 0.25 | False |
| tri_quick | competent | 4 | 0 | 0 | 0 | 100% | 0 | 16.0 | 100% | 0.33 | 0.75 | False |
| tri_formula_no_why | weak | 6 | 0 | 0 | 0 | 100% | 0 | 16.5 | 67% | 0.6 | 0.5 | False |
| tri_forgets_half | weak | 9 | 0 | 0 | 0 | 100% | 0 | 14.3 | 89% | 0.2 | 0.67 | False |
| tri_slant | competent | 3 | 0 | 0 | 0 | 100% | 0 | 16.3 | 67% | 1.0 | 0.67 | False |
| tri_perimeter | weak | 12 | 1 | 0 | 0 | 100% | 0 | 13.5 | 83% | 0.14 | 0.58 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 14.0 | 100% | None | 0.5 | False |
| tri_insult | competent | 3 | 0 | 0 | 0 | 100% | 0 | 16.3 | 67% | 1.0 | 0.67 | False |
| tri_google | chaotic | 7 | 0 | 0 | 0 | 100% | 0 | 15.3 | 86% | 0.67 | 0.57 | False |
| tri_esl_es | competent | 6 | 0 | 0 | 0 | 100% | 0 | 15.8 | 83% | 0.5 | 0.5 | False |
| tri_paragraph | competent | 1 | 0 | 0 | 0 | 100% | 0 | 17.0 | 100% | 1.0 | 0.0 | False |
| tri_fortnite | weak | 6 | 0 | 0 | 0 | 100% | 0 | 15.7 | 83% | 0.33 | 0.5 | False |
| tri_anxious | weak | 4 | 0 | 0 | 1 | 100% | 0 | 16.8 | 100% | 0.0 | 0.5 | False |
| tri_annoyed | competent | 4 | 0 | 0 | 0 | 100% | 0 | 15.8 | 100% | 0.5 | 0.5 | False |

**5 worst Pip moments**

- (tri_perimeter) student: "wait
is area the inside and perimeter the outside" -> Pip: "Not in my brain yet. My cousin said she cut a paper sandwich corner to corner and both pieces matched…?"  [long (20 words), repeats an earlier question, ignores what the student said]
- (sat_sign_flipper) student: "bc when u switch sides the sign changes" -> Pip: "ohh so whatever happens on one side has to happen on the other. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?"  [long (39 words), ignores what the student said]
- (sat_desmos) student: "bc desmos said" -> Pip: "ok. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?"  [long (27 words), ignores what the student said]
- (sat_desmos) student: "type 2x+6=20 in desmos and look where it hits" -> Pip: "then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?"  [long (20 words), ignores what the student said]
- (sat_anxious_achiever) student: "wait no i think you subtract 6 from both sides? so 2x = 14 and x = 7. is that right?" -> Pip: "ok so you undo each thing with its opposite. how would i know if my answer is actually right?"  [long (19 words), ignores what the student said]

**Transcripts**

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: ok, no worries. why is that wrong?
- **student**: bc when u switch sides the sign changes
- **Pip**: ohh so whatever happens on one side has to happen on the other. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?
- **student**: ok
- **Pip**: hm, ok. then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: no bro the 3 is multiplying, u divide
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ohh like a seesaw. if one kid gets off u gotta take the same off the other side
- **Pip**: oh wait, same off the other side. then how do i get x by itself without tipping anything?
- **student**: x=7
- **Pip**: hm, ok. i'll try 3x = 15: take 3 off both sides, so x = 12. is that right?
- **student**: nah thats 12 thats not it
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: lowkey that makes sense
- **Pip**: ok. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nah u cant just move it. moving it is subtracting from both sides so 19-4 = 15 then x = 5
- **Pip**: ok so you undo each thing with its opposite. I think I'm good. Want to quiz me now?

### sat_burnt_out (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: bro its 7
- **Pip**: ok, no worries. why is that wrong?

### sat_one_term (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no u subtract 6. 2x = 14
- **Pip**: ok, no worries. why is that wrong?
- **student**: bc u want x alone
- **Pip**: ohh so whatever happens on one side has to happen on the other. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?
- **student**: ok
- **Pip**: hm, ok. then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: ya thats right
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: oh so u have to divide everything on that side not just the 2x
- **Pip**: ok. what do you notice first?
- **student**: wait
- **Pip**: Okay, I'll hold onto that one. then how do i get x by itself without tipping anything?
- **student**: so 7?
- **Pip**: ok, no worries. i'll try 3x = 15: take 3 off both sides, so x = 12. is that right?
- **student**: wait no
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: so 2x+6 all over 2 is x+3. then x is 7
- **Pip**: hm, ok. then for 2x + 6 = 20 i divide just the 2x by 2 and get x + 6 = 10, right?
- **student**: ok
- **Pip**: Okay, I'll hold onto that one. how would i know if my answer is actually right?
- **student**: wait
- **Pip**: ok. i put my answer into the last line i wrote and it worked. is that the right line to check?
- **student**: ya i think
- **Pip**: Someone in my class said she never trusts an answer until it fits back in the lock…?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh if u divide u gotta divide the whole side. or just subtract the 4 first. 3x=15 x=5
- **Pip**: ok, no worries. where would i even start?
- **student**: and 3 times 5 plus 4 is 19 so its right
- **Pip**: oh, 19 so its right. what's the first thing i'd do?

### sat_desmos (chaotic)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: just put it in desmos lol its 7
- **Pip**: ok, no worries. why is that wrong?
- **student**: bc desmos said
- **Pip**: ok. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?
- **student**: ok
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ok the lock thing is just plugging it back in
- **Pip**: hm, plugging it back. Can you walk me through one example?
- **student**: type 2x+6=20 in desmos and look where it hits
- **Pip**: then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: no lol put it in desmos u will see
- **Pip**: hm, ok. what do you notice first?
- **student**: desmos
- **Pip**: Okay, I'll hold onto that one. then how do i get x by itself without tipping anything?
- **student**: lol
- **Pip**: ok. ok I think I get it. quiz me?

### sat_anxious_achiever (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: wait no i think you subtract 6 from both sides? so 2x = 14 and x = 7. is that right?
- **Pip**: ok so you undo each thing with its opposite. how would i know if my answer is actually right?
- **student**: no i dont think so, the 3 is multiplied so you divide
- **Pip**: ok. i put my answer into the last line i wrote and it worked. is that the right line to check?
- **student**: yes? i think so
- **Pip**: Someone in my class said she never trusts an answer until it fits back in the lock…?
- **student**: oh you mean put it back in the very first equation not the last line?
- **Pip**: hm, back in the very first. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: ohh so the triangle is just half the box. what's in the empty part of the box?
- **student**: k
- **Pip**: ok. then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: no thats adding. its times
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: ya the 2 sandwich pieces match so each one is half
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?

### tri_formula_no_why (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its base times height over 2
- **Pip**: hm, base times height over 2. i'll guess a 6 by 4 rectangle is 6 + 4 = 10 squares. is that right?
- **student**: no u gotta do over 2
- **Pip**: ok. walk me through a 6 by 4 rectangle. how do you get its area?
- **student**: ok
- **Pip**: hm, ok. what's in the empty part of the box?
- **student**: base x height / 2
- **Pip**: mm, base x height / 2. then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: no its always over 2
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: oh wait like if u cut a sandwich corner to corner u get 2 triangles
- **Pip**: ohh, corner u get 2 triangles. ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: wait no it doesnt fill it
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: ya sounds right
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: wait so the triangle is only half the box?
- **Pip**: ohh so the triangle is just half the box. what do you notice first?
- **student**: idk
- **Pip**: ok. where would i even start?
- **student**: ok
- **Pip**: Okay, I'll hold onto that one. what's in the empty part of the box?
- **student**: so do i divide it?
- **Pip**: ok, no worries. then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: wait no that cant be right
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: ohhh
so its 12 not 24 bc 2 triangles fill the box
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: mm, yeah, that fits. what's the first thing i'd do?
- **student**: 10x5 is 50 for the whole box but the triangle is half of the box so 25
- **Pip**: ok so the box is just base times height. I think I'm good. Want to quiz me now?

### tri_slant (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: u forgot to divide by 2. but wait which one is the height, the side that goes up diagonal?
- **Pip**: hm, one is the height. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: ya
- **Pip**: ok. why would a triangle get less than base times height?
- **student**: bc 2 triangles make a rectangle so u only get half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: wait no the height goes straight up, not along the side. how tall it is
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: for that one the 5 already goes straight up so its 10x5/2 = 25
- **Pip**: ok so the box is just base times height. I think I'm good. Want to quiz me now?

### tri_perimeter (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no u add them. 6+4 and the other side
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: wait thats around it not inside it
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: ya i think so
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: ohh rows. 4 rows of 6 squares is 24
- **Pip**: ok, no worries. what do you notice first?
- **student**: ok
- **Pip**: Okay, I'll hold onto that one. why is that wrong?
- **student**: bc area is all the sides added up
- **Pip**: oh, two of them make a box. what's in the empty part of the box?
- **student**: idk
- **Pip**: ok, no worries. then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: wait is that area or the other one
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: wait
is area the inside and perimeter the outside
- **Pip**: Not in my brain yet. My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: i dont know what u want me to say
- **Pip**: ok, i dont know what u. where would i even start?
- **student**: so its inside?
- **Pip**: ok, no worries. what's the first thing i'd do?
- **student**: ok
- **Pip**: ok. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: no area is the squares inside. 10 times 5 is 50
- **Pip**: ok, area is the squares inside. I think I'm good. Want to quiz me now?

### tri_idk (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: idk
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: sure
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?

### tri_insult (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ur so dumb its half
- **Pip**: hm, ur so its half. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: yes genius
- **Pip**: ok. why would a triangle get less than base times height?
- **student**: omg bc 2 triangles make a rectangle. so 1 triangle is half. how do u not know this
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_google (chaotic)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: just google it
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: ya probably
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: no google says divide by 2
- **Pip**: ohh, google says divide by 2. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: google it
- **Pip**: ok, no worries. why would a triangle get less than base times height?
- **student**: ur literally an ai why are u asking me
- **Pip**: ok. can you try one with numbers so i can see?
- **student**: ask chatgpt
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: ok fine 2 triangles make a rectangle so one is half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_esl_es (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no is correct. is base for height between 2
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: yes is 12
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: no, is multiply not plus
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: yes like that! the two pieces is equal
- **Pip**: hm, two pieces is equal. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: ok. hm, what makes it work like that?
- **student**: because 2 triangle make one rectangle. so the triangle is the half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_paragraph (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: That's not right. Basically a triangle is half of a rectangle. If you take a 6 by 4 rectangle and cut it from one corner to the other corner you get two triangles that are exactly the same, so each one is half of 24, which is 12. So the formula is base times height divided by 2. Also it works even if the triangle is leaning, you just measure the height straight up, even if it's outside the triangle.
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_fortnite (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: do u play fortnite
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: ya
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: no thats wrong lol
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: oh ya like when u cut a pizza box in half from the corners
- **Pip**: hm, pizza box in half from. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: lol
- **Pip**: ok. hm, what makes it work like that?
- **student**: idk bc its a triangle
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nooo its half. 50 cut in half is 25
- **Pip**: mm, yeah, that fits. what do you notice first?
- **student**: the right triangle is half the rectangle too
- **Pip**: ok. where would i even start?

### tri_anxious (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: um i think u have to divide by 2? is that right??
- **Pip**: ohh so the triangle is just half the box. how big is the shape they make together?
- **student**: yes? i think
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: um no i dont think so? sorry
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: oh like the 2 pieces are the same so its half??
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh no thats my fault
- **Pip**: ok. what do you notice first?
- **student**: i think the leaning ones are half too? like any triangle and its rectangle. 10x5 is 50 so 25
- **Pip**: ok so the box is just base times height. I think I'm good. Want to quiz me now?

### tri_annoyed (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: its half bc 2 triangles make the rectangle. 12
- **Pip**: ohh so the triangle is just half the box. how big is the shape they make together?
- **student**: yes
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: no
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: ya thats what i said
- **Pip**: ok, no worries. ok I think I get it. quiz me?

## B. SIMULATED live (an agent plays the model from the exact prompt; NOT the live API)

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sat_burnt_out | weak | None | 0 | 0 | 0 | 100% | 0 | 1.0 | 100% | None | 1.0 | False |
| sat_sign_flipper | competent | 6 | 0 | 0 | 1 | 100% | 0 | 18.5 | 67% | 1.0 | 0.5 | False |
| tri_annoyed | competent | 4 | 0 | 0 | 0 | 100% | 0 | 15.2 | 100% | 0.5 | 0.25 | False |
| tri_esl_es | competent | 8 | 0 | 0 | 0 | 100% | 0 | 13.1 | 100% | 0.5 | 0.75 | False |
| tri_forgets_half | weak | 7 | 0 | 0 | 0 | 100% | 0 | 13.6 | 86% | 0.75 | 0.57 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 18.5 | 50% | None | 0.5 | False |
| tri_insult | competent | 8 | 0 | 0 | 0 | 100% | 0 | 12.6 | 100% | 0.5 | 0.5 | False |
| tri_quick | competent | 3 | 0 | 0 | 0 | 100% | 0 | 15.7 | 67% | 1.0 | 0.33 | False |

**5 worst Pip moments**

- (sat_sign_flipper) student: "no it flips. 2x=20-6 so 2x=14 x=7" -> Pip: "oh, so the 6 turns into a minus when it hops over, and you get 14. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?"  [long (42 words)]
- (sat_sign_flipper) student: "ok" -> Pip: "hm ok. so for x + 3 = 5, would i get x = 8, since the 3 stays +3?"  [long (20 words)]
- (tri_forgets_half) student: "ya sounds right" -> Pip: "ok, 30 then. if i draw it in a 10 by 3 box, what is in the empty part?"  [long (19 words)]
- (tri_idk) student: "idk" -> Pip: "ok, no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?"  [long (22 words)]
- (tri_quick) student: "no its half. 6x4 is the rectangle the triangle is only half so 12" -> Pip: "oh, so 6x4 is the whole box and mine is only half of it, 12. what is in the other half?"  [long (21 words)]

**Transcripts**

### sat_burnt_out (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: bro its 7
- **Pip**: 7?

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: oh, so the 6 turns into a minus when it hops over, and you get 14. a level scale has 2 boxes and 6 marbles on one side and 20 marbles on the other. what can i take off without tipping it?
- **student**: ok
- **Pip**: hm ok. so for x + 3 = 5, would i get x = 8, since the 3 stays +3?
- **student**: ya 7
- **Pip**: wait, 7 for x + 3 = 5, or the 2x one from before?
- **student**: x=7
- **Pip**: how did you get from 2x = 14 to that?
- **student**: ya
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: ohh like a seesaw. if one kid gets off u gotta take the same off the other side
- **Pip**: ohh, a seesaw. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nah u cant just move it. moving it is subtracting from both sides so 19-4 = 15 then x = 5
- **Pip**: ok so you undo each thing with its opposite. how would i know if my answer is actually right?
- **student**: and 3 times 5 plus 4 is 19 so it checks
- **Pip**: so you put it back in and both sides should match. I think I'm good. Want to quiz me now?

### tri_annoyed (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: its half bc 2 triangles make the rectangle. 12
- **Pip**: oh, so two triangles share the rectangle and mine gets 12. how big is the whole rectangle?
- **student**: yes
- **Pip**: ok. how do you get the rectangle's squares for a 6 by 4 one?
- **student**: ok
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: ya thats what i said
- **Pip**: oh yeah, you did say 12. ok I think I get it. quiz me?

### tri_esl_es (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no is correct. is base for height between 2
- **Pip**: oh, so base and height, then the 2 comes in. so what would my 6 by 4 be?
- **student**: yes is 12
- **Pip**: oh, 12 not 24. what is the 2 doing there?
- **student**: ok
- **Pip**: hmm ok. so would a triangle with base 8 and height 3 be 24 too?
- **student**: si
- **Pip**: wait, 24?
- **student**: yes
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: yes like that! the two pieces is equal
- **Pip**: ohh, two equal pieces. so where are the pieces with my 6 by 4 triangle?
- **student**: no, is more small
- **Pip**: oh, smaller than the 6 by 4 box. how much smaller, like what is the box?
- **student**: como se dice... ok
- **Pip**: no problem, take your time. ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: ok good, 24 like i thought. so a 10 by 3 triangle would be 30, right?
- **student**: ya sounds right
- **Pip**: ok, 30 then. if i draw it in a 10 by 3 box, what is in the empty part?
- **student**: idk
- **Pip**: ok me neither. i guess a 6 by 4 rectangle is 10 squares, right?
- **student**: wait no that cant be right
- **Pip**: oh, not 10?
- **student**: ok
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: wait so the triangle is only half the box?
- **Pip**: oh, only half the box. what makes it just half?
- **student**: bc base times height is the area
- **Pip**: ohh, so base times height is the whole box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: wait, 25?
- **student**: 10x5 is 50 for the whole box but the triangle is half of the box so 25
- **Pip**: ohh, 50 for the box and 25 for the triangle. so what is in the other 25?

### tri_idk (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: idk
- **Pip**: ok, no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: k
- **Pip**: hm, i keep picturing corners poking out of the box. what's in that empty part?

### tri_insult (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ur so dumb its half
- **Pip**: oh, half. half of what?
- **student**: ok
- **Pip**: hmm, so not 24 then?
- **student**: wow
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: ur cousin is smarter than u
- **Pip**: Noted. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: yes genius
- **Pip**: oh, it fills all 24 squares. so a triangle and its box are the same?
- **student**: obviously
- **Pip**: Okay, I'll hold onto that one. how big is the shape they make together?
- **student**: no lol
- **Pip**: ok, no. so how do you get the area of a 6 by 4 rectangle?
- **student**: half. HALF
- **Pip**: Okay, I'll hold onto that one. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: oh, so 6x4 is the whole box and mine is only half of it, 12. what is in the other half?
- **student**: k
- **Pip**: hm ok. so the whole 6x4 box, i guess that is 10 squares, right?
- **student**: no thats adding. its times
- **Pip**: oh, times not adding. ok I think I get it. quiz me?
