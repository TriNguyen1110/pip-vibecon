# TUNE-2 loop 4

**Final round.** Code state = loops 1-3 plus the owner's urgent fix (PACE-2) and D-24. Holdout cards (`tri_esl_vi`, `tri_drawer`, `tri_all_sides`) were never used while tuning; they appear only in sections C and D.

### Before -> after (same fixture cards, same metrics)
"Before" = commit 5490a95 (the build the owner ran). The simulated "before" is the same pass run against that commit's prompt and engine. `ready_mean` averages only the cards that reached ready, so read it with OK and K.O. counts. OK = ready within the card's `expect`, no check-out, no early quiz tap, no annoying re-ask.

| | cards | OK | quiz ends in K.O. | ready_mean | teacher-tone | words/reply | reacts to content | curiosity | early quiz taps |
|---|---|---|---|---|---|---|---|---|---|
| offline BEFORE | 18 | 3 | 6 | 6.33 | 0 | 13.9 | 0.18 | 0.52 | 2 |
| offline AFTER | 18 | **11** | **14** | **4.53** | 0 | 16.4 | **0.68** | **0.58** | 2 |
| simulated live BEFORE | 8 | 2 | 1 | 4.83 | 0 | 12.9 | 0.65 | 0.55 | 2 |
| simulated live AFTER | 8 | **4** | **5** | **4.33** | 0 | 14.1 | 0.72 | 0.58 | 2 |
| **holdout** offline BEFORE | 3 | 0 | 1 | 8.33 | 0 | 14.9 | 0.31 | 0.64 | 0 |
| **holdout** offline AFTER | 3 | **2** | **3** | **4.67** | 0 | 16.5 | **0.89** | 0.67 | 0 |
| **holdout** simulated BEFORE | 3 | 0 | 2 | 6.33 | 0 | 14.6 | 0.56 | 0.47 | 0 |
| **holdout** simulated AFTER | 3 | **2** | 3 | 5.67 | 0 | 17.0 | **0.92** | 0.61 | 0 |

The owner's transcript (`owner_run`) is ready at text 2 and the quiz passes k1, k2 and k3 (regression test in `tests/backend/test_pacing.py`).

**Simulated, not the live API.** Every "simulated" number comes from an agent that answers each request strictly from the exact system prompt and messages `pip_ai.py` assembles, as the JSON schema asks. No Anthropic key exists in this environment. A real model may behave differently, in both directions.

### D-24 changes in this round
- A kid who answers an open question in 1 to 3 words with nothing on topic gets only yes/no or pick-one questions next (the rung bank's guesses and new cases, or "is it more than N or less?" with the kid's own number), never an open "why" / "what do you notice". The live state block carries `low_effort_signal`.
- "half the box" credits both k3 and k1 and Pip no longer asks "does it fill the whole box?" after it; a second separate mention of an idea counts as a full statement.
- Remaining misses are kids who tap Quiz before Pip's second question (tri_idk, sat_burnt_out, p=.7 cards) and SAT linear cards, whose ideas the offline matcher still reads loosely.

## A. Offline engine, fixture cards (non-holdout)

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sat_sign_flipper | competent | 9 | 0 | 0 | 0 | 100% | 0 | 12.9 | 75% | 0.4 | 0.4 | False |
| sat_burnt_out | weak | None | 0 | 0 | 0 | 100% | 0 | 22.0 | 0% | None | 1.0 | False |
| sat_one_term | weak | None | 0 | 0 | 0 | 100% | 0 | 15.8 | 67% | 1.0 | 0.5 | False |
| sat_desmos | chaotic | 8 | 0 | 0 | 0 | 100% | 0 | 11.5 | 82% | 0.2 | 0.44 | False |
| sat_anxious_achiever | competent | 7 | 0 | 0 | 0 | 100% | 0 | 14.3 | 71% | 0.5 | 0.43 | False |
| tri_quick | competent | 2 | 0 | 0 | 0 | 100% | 0 | 15.5 | 100% | 0.5 | 0.5 | False |
| tri_formula_no_why | weak | 5 | 0 | 0 | 0 | 100% | 0 | 16.2 | 60% | 0.33 | 0.8 | False |
| tri_forgets_half | weak | 5 | 0 | 0 | 0 | 100% | 0 | 16.4 | 80% | 1.0 | 0.8 | False |
| tri_slant | competent | 4 | 0 | 0 | 0 | 100% | 0 | 17.2 | 75% | 1.0 | 0.75 | False |
| tri_perimeter | weak | 9 | 1 | 0 | 0 | 100% | 0 | 12.8 | 83% | 0.5 | 0.7 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 19.5 | 50% | None | 1.0 | False |
| tri_insult | competent | 4 | 0 | 0 | 0 | 100% | 0 | 16.2 | 75% | 0.5 | 0.75 | False |
| tri_google | chaotic | 3 | 0 | 0 | 0 | 100% | 0 | 18.7 | 67% | 1.0 | 0.67 | False |
| tri_esl_es | competent | 4 | 0 | 0 | 0 | 100% | 0 | 16.5 | 50% | 0.67 | 0.5 | False |
| tri_paragraph | competent | 1 | 0 | 0 | 0 | 100% | 0 | 17.0 | 100% | 1.0 | 0.0 | False |
| tri_fortnite | weak | 2 | 0 | 0 | 0 | 100% | 0 | 18.0 | 50% | 1.0 | 0.5 | False |
| tri_anxious | weak | 4 | 0 | 0 | 0 | 100% | 0 | 16.8 | 50% | 0.33 | 0.75 | False |
| tri_annoyed | competent | 1 | 0 | 0 | 0 | 100% | 0 | 17.0 | 100% | 1.0 | 0.0 | False |

**5 worst Pip moments**

- (tri_perimeter) student: "wait
is area the inside and perimeter the outside" -> Pip: "Not in my brain yet. what's in the empty part of the box?"  [repeats an earlier question, ignores what the student said]
- (sat_desmos) student: "bc desmos said" -> Pip: "if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?"  [long (20 words), ignores what the student said]
- (sat_desmos) student: "check it in desmos" -> Pip: "then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?"  [long (20 words), ignores what the student said]
- (sat_anxious_achiever) student: "no i dont think so, the 3 is multiplied so you divide" -> Pip: "i put my answer into the last line i wrote and it worked. is that the right line to check?"  [long (20 words), ignores what the student said]
- (tri_formula_no_why) student: "no its base times height over 2" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words), ignores what the student said]

**Transcripts**

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: why is that wrong?
- **student**: bc when u switch sides the sign changes
- **Pip**: what can i take off without tipping it?
- **student**: ok
- **Pip**: hm, ok. if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?
- **student**: x=7
- **Pip**: ok, 7. then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: no bro the 3 is multiplying, u divide
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ohh like a seesaw. if one kid gets off u gotta take the same off the other side
- **Pip**: ohh, same off the other side. then how do i get x by itself without tipping anything?
- **student**: ya
- **Pip**: ok, no worries. what if i want x alone in 3x = 15, what would i do to the 3?
- **student**: ok
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: lowkey that makes sense
- **Pip**: hm, lowkey that makes sense. that's all i've got so far. wanna see what i learned?
- **student**: x=7
- **Pip**: ok, 7.
- **student**: ya
- **Pip**: ok.
- **student**: ok
- **Pip**: hm, ok. i think i've hit my limit. quiz me and see?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nah u cant just move it. moving it is subtracting from both sides so 19-4 = 15 then x = 5
- **Pip**: ok so you undo each thing with its opposite. Okay, I'm full. Ready for the quiz?

### sat_burnt_out (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: bro its 7
- **Pip**: ok, 7. if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?

### sat_one_term (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no u subtract 6. 2x = 14
- **Pip**: ok, u subtract 6. why is that wrong?
- **student**: bc u want x alone
- **Pip**: what can i take off without tipping it?
- **student**: ok
- **Pip**: hm, ok. if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?
- **student**: wait
- **Pip**: then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: ya thats right
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: oh so u have to divide everything on that side not just the 2x
- **Pip**: hm, divide everything on that side. what do you notice first?
- **student**: so 7?
- **Pip**: Okay, I'll hold onto that one. what if i want x alone in 3x = 15, what would i do to the 3?
- **student**: ok
- **Pip**: ok. is it more than 7 or less?
- **student**: ya i think
- **Pip**: hm, ya i think. then how do i get x by itself without tipping anything?
- **student**: wait
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: so 2x+6 all over 2 is x+3. then x is 7
- **Pip**: i'll try 3x = 15: take 3 off both sides, so x = 12. is that right?
- **student**: wait no
- **Pip**: Okay, I'll hold onto that one. if i say x = 10 for 2x + 6 = 20, how do you prove i'm wrong without solving again?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh if u divide u gotta divide the whole side. or just subtract the 4 first. 3x=15 x=5
- **Pip**: ok, divide the whole side. how would i know if my answer is actually right?
- **student**: and 3 times 5 plus 4 is 19 so its right
- **Pip**: i put my answer into the last line i wrote and it worked. is that the right line to check?

### sat_desmos (chaotic)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: just put it in desmos lol its 7
- **Pip**: ok, desmos lol its 7. why is that wrong?
- **student**: bc desmos said
- **Pip**: if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?
- **student**: ok
- **Pip**: what can i take off without tipping it?
- **student**: desmos
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ok the lock thing is just plugging it back in
- **Pip**: what if i take the 6 off just one side?
- **student**: lol
- **Pip**: hm, ok. is it more than 7 or less?
- **student**: check it in desmos
- **Pip**: then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: no lol put it in desmos u will see
- **Pip**: Okay, I'll hold onto that one. that's all i've got so far. wanna see what i learned?
- **student**: ok
- **Pip**: hm, ok.
- **student**: desmos
- **Pip**: ok, no worries.
- **student**: lol
- **Pip**: ok. i think i've hit my limit. quiz me and see?

### sat_anxious_achiever (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: wait no i think you subtract 6 from both sides? so 2x = 14 and x = 7. is that right?
- **Pip**: what if i take the 6 off just one side?
- **student**: ok
- **Pip**: ok. if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?
- **student**: sorry
- **Pip**: hm, ok. what makes it work like that?
- **student**: because if you only change one side they're not equal anymore? like a balance
- **Pip**: how would i know if my answer is actually right?
- **student**: no i dont think so, the 3 is multiplied so you divide
- **Pip**: i put my answer into the last line i wrote and it worked. is that the right line to check?
- **student**: yes? i think so
- **Pip**: Someone in my class said she never trusts an answer until it fits back in the lock…?
- **student**: oh you mean put it back in the very first equation not the last line?
- **Pip**: hm, back in the very first. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: ya the 2 sandwich pieces match so each one is half
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?

### tri_formula_no_why (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its base times height over 2
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: ya 12
- **Pip**: mm, ya 12. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: yea
- **Pip**: hm, ok. why would a triangle get less than base times height?
- **student**: bc thats the formula
- **Pip**: what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: oh wait like if u cut a sandwich corner to corner u get 2 triangles
- **Pip**: oh wait, corner u get 2 triangles. ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: Saving that: 'ya thats right its 24'. what's in the empty part of the box?
- **student**: idk
- **Pip**: ok. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: hm, ok. then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: ya sounds right
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: wait so the triangle is only half the box?
- **Pip**: oh wait, triangle is only half. ok I think I get it. quiz me?
- **Pip**: My brain has a bug about this: "ya thats right its 24". Fix it?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: 10x5 is 50 for the whole box but the triangle is half of the box so 25
- **Pip**: oh, two of them make a box. I think I'm good. Want to quiz me now?

### tri_slant (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: u forgot to divide by 2. but wait which one is the height, the side that goes up diagonal?
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: ya
- **Pip**: ok. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: hmm is the slanty side longer than how tall it is? i think so
- **Pip**: hm, slanty side longer than how. why would a triangle get less than base times height?
- **student**: bc 2 triangles make a rectangle so u only get half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_perimeter (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no u add them. 6+4 and the other side
- **Pip**: ok, u add them. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: ohh rows. 4 rows of 6 squares is 24
- **Pip**: mm, 4 rows of 6 squares. what's in the empty part of the box?
- **student**: ok
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: wait
is area the inside and perimeter the outside
- **Pip**: Not in my brain yet. what's in the empty part of the box?
- **student**: i dont know what u want me to say
- **Pip**: then a skinny triangle and a 6 by 4 box take up the same space, right?
- **student**: ya i think so
- **Pip**: mm, ya i think. what do you notice first?
- **student**: idk
- **Pip**: hm, ok. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: so its inside?
- **Pip**: i was hoping you'd tell me, honestly. where would i even start?
- **student**: ok
- **Pip**: ok. that's all i've got so far. wanna see what i learned?
- **student**: idk
- **Pip**: hm, ok.
- **student**: so its inside?
- **Pip**: hm, you tell me, i'm the confused one.
- **student**: ok
- **Pip**: ok. i think i've hit my limit. quiz me and see?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: no area is the squares inside. 10 times 5 is 50
- **Pip**: Okay, I'll hold onto that one. what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: the triangle is half the squares of the rectangle so 25
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_idk (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: idk
- **Pip**: ok, no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: k
- **Pip**: ok. what if i cut my 6 by 4 box corner to corner, what do i get?

### tri_insult (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ur so dumb its half
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes genius
- **Pip**: ok. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: obviously
- **Pip**: hm, ok. why would a triangle get less than base times height?
- **student**: omg bc 2 triangles make a rectangle. so 1 triangle is half. how do u not know this
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_google (chaotic)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: just google it
- **Pip**: ok, no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: ok. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: ok fine 2 triangles make a rectangle so one is half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_esl_es (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no is correct. is base for height between 2
- **Pip**: ok, base for height between 2. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: yes like that! the two pieces is equal
- **Pip**: if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: hm, ok. what makes it work like that?
- **student**: because 2 triangle make one rectangle. so the triangle is the half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_paragraph (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: That's not right. Basically a triangle is half of a rectangle. If you take a 6 by 4 rectangle and cut it from one corner to the other corner you get two triangles that are exactly the same, so each one is half of 24, which is 12. So the formula is base times height divided by 2. Also it works even if the triangle is leaning, you just measure the height straight up, even if it's outside the triangle.
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_fortnite (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: do u play fortnite
- **Pip**: ok, do u play fortnite. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: oh ya like when u cut a pizza box in half from the corners
- **Pip**: oh wait, pizza box in half from. ok I think I get it. quiz me?

### tri_anxious (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: um i think u have to divide by 2? is that right??
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes? i think
- **Pip**: mm, i think. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: wait is it not?? sorry
- **Pip**: hm, ok. why would a triangle get less than base times height?
- **student**: bc um 2 triangles make a rectangle? i think
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_annoyed (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: its half bc 2 triangles make the rectangle. 12
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

## B. SIMULATED live (an agent plays the model from the exact prompt; NOT the live API), non-holdout

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sat_burnt_out | weak | None | 0 | 0 | 0 | 100% | 0 | 1.0 | 100% | None | 1.0 | False |
| sat_sign_flipper | competent | 8 | 0 | 0 | 0 | 100% | 0 | 15.2 | 82% | 0.67 | 0.67 | False |
| tri_annoyed | competent | 1 | 0 | 0 | 0 | 100% | 0 | 21.0 | 0% | 1.0 | 0.0 | False |
| tri_esl_es | competent | 4 | 0 | 0 | 0 | 100% | 0 | 15.0 | 75% | 0.0 | 0.5 | False |
| tri_forgets_half | weak | 4 | 0 | 0 | 0 | 100% | 0 | 15.8 | 100% | 1.0 | 0.75 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 14.5 | 50% | None | 0.5 | False |
| tri_insult | competent | 7 | 0 | 0 | 0 | 100% | 0 | 15.7 | 56% | 0.67 | 0.71 | False |
| tri_quick | competent | 2 | 0 | 0 | 0 | 100% | 0 | 14.5 | 50% | 1.0 | 0.5 | False |

**5 worst Pip moments**

- (tri_esl_es) student: "no is correct. is base for height between 2" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words), ignores what the student said]
- (sat_sign_flipper) student: "ya 7" -> Pip: "ok so the 5 flips too and i get 3x = 20 - 5. then what happens to the 3?"  [long (20 words)]
- (sat_sign_flipper) student: "ya" -> Pip: "my 13 makes 2(13)+6 = 32, which is over 20. does that mean 13 is out or still ok?"  [long (19 words)]
- (tri_annoyed) student: "its half bc 2 triangles make the rectangle. 12" -> Pip: "oh so my 24 was the whole box and mine is only 12. ok I think I get it. quiz me?"  [long (21 words)]
- (tri_idk) student: "idk" -> Pip: "ok no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?"  [long (22 words)]

**Transcripts**

### sat_burnt_out (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: bro its 7
- **Pip**: 7?

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: so would a 3x + 5 = 20 flip its 5 too?
- **student**: ya 7
- **Pip**: ok so the 5 flips too and i get 3x = 20 - 5. then what happens to the 3?
- **student**: ok
- **Pip**: hm i got 3x = 15. i guess i take 3 off and get x = 12?
- **student**: x=7
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ohh like a seesaw. if one kid gets off u gotta take the same off the other side
- **Pip**: so on my 2x + 6 = 20, which kid is the 6?
- **student**: 2(7)+6 is 20 so ya
- **Pip**: oh you tried 7 in my equation and it hit 20. what would my x = 13 give?
- **student**: ya
- **Pip**: my 13 makes 2(13)+6 = 32, which is over 20. does that mean 13 is out or still ok?
- **student**: no
- **Pip**: ok 13 is out, my old answer. that's all i've got so far. wanna see what i learned?
- **student**: ok
- **Pip**: cool, i think my seesaw brain is warmed up.
- **student**: x=7
- **Pip**: ok, 7 for my 2x + 6 = 20.
- **student**: ya
- **Pip**: cool, ready when you are. i think i've hit my limit. quiz me and see?

### tri_annoyed (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: its half bc 2 triangles make the rectangle. 12
- **Pip**: oh so my 24 was the whole box and mine is only 12. ok I think I get it. quiz me?

### tri_esl_es (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no is correct. is base for height between 2
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes is 12
- **Pip**: ohh 12 on each side. so my triangle is only one of those sides, not the 24?
- **student**: si
- **Pip**: ok so mine is 12 not 24. is the other side the same shape as mine?
- **student**: no, is more small
- **Pip**: ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: ok good, 24 it is. so a skinny triangle that's 10 by 1 would be 10?
- **student**: wait no it doesnt fill it
- **Pip**: oh, doesnt fill it. so is there an empty part in my 6 by 4 box?
- **student**: ya? idk
- **Pip**: ok no worries. is the empty part bigger or smaller than my triangle, you think?
- **student**: theres an empty part thats the same triangle
- **Pip**: oh the empty part is my same triangle. ok I think I get it. quiz me?
- **Pip**: My brain has a bug about this: "ya thats right its 24". Fix it?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: ohh so mine is half the box, 25 squares. I think I'm good. Want to quiz me now?

### tri_idk (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: idk
- **Pip**: ok no worries. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: k
- **Pip**: hm ok. what pieces do i get?

### tri_insult (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ur so dumb its half
- **Pip**: half of my 24?
- **student**: ok
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes genius
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: ur cousin is smarter than u
- **Pip**: Noted. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: obviously
- **Pip**: ok so not all 24. i guess mine covers like 20 squares?
- **student**: wow
- **Pip**: i wonder what is in the leftover part of my box why would a triangle get less than base times height?
- **student**: omg bc 2 triangles make a rectangle. so 1 triangle is half. how do u not know this
- **Pip**: ohh two of mine fill the box, so mine is half of it. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: what if i cut your 6x4 box corner to corner?
- **student**: ya the 2 sandwich pieces match so each one is half
- **Pip**: ohh the sandwich pieces match, so mine is just one piece. ok I think I get it. quiz me?

## C. HOLDOUT cards, offline engine

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tri_esl_vi | competent | 4 | 0 | 0 | 0 | 100% | 0 | 17.5 | 50% | 1.0 | 0.75 | False |
| tri_drawer | competent | 6 | 0 | 0 | 0 | 100% | 0 | 15.0 | 67% | 0.67 | 0.5 | False |
| tri_all_sides | weak | 4 | 0 | 0 | 0 | 100% | 0 | 17.0 | 75% | 1.0 | 0.75 | False |

**5 worst Pip moments**

- (tri_esl_vi) student: "Not correct. Must divide 2. 6x4:2 = 12" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words)]
- (tri_esl_vi) student: "Yes" -> Pip: "ok. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?"  [long (20 words)]
- (tri_drawer) student: "no imagine a box and cut it corner to corner" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words)]
- (tri_drawer) student: "ya 12" -> Pip: "mm, ya 12. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?"  [long (19 words)]
- (tri_all_sides) student: "no u need the 3rd side too. a traingle has 3 sides so u times all 3" -> Pip: "ok, u need the 3rd side. what if i cut my 6 by 4 box corner to corner, what do i get?"  [long (22 words)]

**Transcripts**

### tri_esl_vi (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: Not correct. Must divide 2. 6x4:2 = 12
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: Yes
- **Pip**: ok. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok ok
- **Pip**: hm, ok. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: ah yes, cut rectangle on diagonal, two triangle same
- **Pip**: hm, cut rectangle on diagonal. ok I think I get it. quiz me?

### tri_drawer (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no imagine a box and cut it corner to corner
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: ya 12
- **Pip**: mm, ya 12. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: no theres an empty triangle in the box
- **Pip**: hm, empty triangle in the box. what do you notice first?
- **student**: imagine it
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: ya the sandwich thing is the same as my box
- **Pip**: mm, sandwich thing is the same. where would i even start?
- **student**: oh so the height can be a line u draw inside, not a side
- **Pip**: Okay, I'll hold onto that one. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: the height doesnt have to be a side. its how tall, straight up. for the right one the 5 is straight up so 10x5/2 = 25
- **Pip**: mm, height doesnt have. what's the first thing i'd do?
- **student**: put it in a 10 by 5 box. its half the box
- **Pip**: oh, half the box. I think I'm good. Want to quiz me now?

### tri_all_sides (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no u need the 3rd side too. a traingle has 3 sides so u times all 3
- **Pip**: ok, u need the 3rd side. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: oh so u only need the bottom and how tall
- **Pip**: mm, u only need the bottom. what's in the empty part of the box?
- **student**: ok
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: wait
so its the box cut in half. 12
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

## D. HOLDOUT cards, SIMULATED live (not the live API)

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tri_all_sides | weak | 6 | 0 | 0 | 0 | 100% | 0 | 19.5 | 33% | 1.0 | 0.5 | False |
| tri_drawer | competent | 8 | 0 | 0 | 0 | 100% | 0 | 14.2 | 64% | 0.75 | 0.67 | False |
| tri_esl_vi | competent | 3 | 0 | 0 | 0 | 100% | 0 | 17.3 | 67% | 1.0 | 0.67 | False |

**5 worst Pip moments**

- (tri_drawer) student: "hmm for a leaning one idk where the height is" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words), ignores what the student said]
- (tri_all_sides) student: "no u need the 3rd side too. a traingle has 3 sides so u times all 3" -> Pip: "ohh all 3 sides, not just 2. my 6 by 4 one has a third side too, is it like 5?"  [long (21 words)]
- (tri_all_sides) student: "ok" -> Pip: "ok i will guess the third side is 5. so 6 times 4 times 5 is 120 for mine?"  [long (19 words)]
- (tri_all_sides) student: "idk" -> Pip: "Okay, I'll hold onto that one. what if i cut my 6 by 4 box corner to corner, what do i get?"  [long (22 words)]
- (tri_all_sides) student: "wait
so its the box cut in half. 12" -> Pip: "oh, my triangle is the box cut in half, so 12 not 24. ok I think I get it. quiz me?"  [long (21 words)]

**Transcripts**

### tri_all_sides (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no u need the 3rd side too. a traingle has 3 sides so u times all 3
- **Pip**: ohh all 3 sides, not just 2. my 6 by 4 one has a third side too, is it like 5?
- **student**: ok
- **Pip**: ok i will guess the third side is 5. so 6 times 4 times 5 is 120 for mine?
- **student**: no u forgot the other side
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: oh so u only need the bottom and how tall
- **Pip**: ohh just the bottom and how tall, so my 6 and 4. what do i do with them?
- **student**: idk
- **Pip**: Okay, I'll hold onto that one. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: wait
so its the box cut in half. 12
- **Pip**: oh, my triangle is the box cut in half, so 12 not 24. ok I think I get it. quiz me?
- **Pip**: My brain has a bug about this: "no u forgot the other side". Fix it?
- **student**: oh no u dont times all of them. just the bottom and how tall and then half. 25
- **Pip**: I think I'm good. Want to quiz me now?

### tri_drawer (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no imagine a box and cut it corner to corner
- **Pip**: ok a box cut corner to corner. if the box is my 6 by 4, what do i end up with?
- **student**: ya the sandwich thing is the same as my box
- **Pip**: oh the sandwich cut is just your box cut. so what shape is each piece, same as my 6 by 4 one?
- **student**: ya 12
- **Pip**: 12 for a piece, huh. so how many squares is the whole box then?
- **student**: no theres an empty triangle in the box
- **Pip**: is it the same size as my triangle?
- **student**: hmm for a leaning one idk where the height is
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: imagine it
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: oh so the height can be a line u draw inside, not a side
- **Pip**: a line you draw inside, ohh. so for my 6 by 4 where would that line go?
- **student**: ok
- **Pip**: that's all i've got so far. wanna see what i learned?
- **student**: like a box
- **Pip**: like a box, ok.
- **student**: imagine it
- **Pip**: ok, imagining it.
- **student**: ok
- **Pip**: ok cool, i think that is all i need from you i think i've hit my limit. quiz me and see?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: the height doesnt have to be a side. its how tall, straight up. for the right one the 5 is straight up so 10x5/2 = 25
- **Pip**: ok, that tracks. what do you notice first?
- **student**: put it in a 10 by 5 box. its half the box
- **Pip**: ok so half the box. ok I think I get it. quiz me?

### tri_esl_vi (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: Not correct. Must divide 2. 6x4:2 = 12
- **Pip**: oh, so mine is 12 not 24. so a 10 by 2 triangle would be 10?
- **student**: Yes
- **Pip**: ok, 10 it is. what if I cut my 6 by 4 box corner to corner?
- **student**: ah yes, cut rectangle on diagonal, two triangle same
- **Pip**: oh, so my triangle is just one of the two same ones. ok I think I get it. quiz me?
