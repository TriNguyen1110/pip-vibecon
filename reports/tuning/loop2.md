# TUNE-2 loop 2

**State measured:** loop 1 plus: nudge/stuck only for an uncovered target and not once ready; new move kind `concrete` (a picture/action using the kid's numbers: "what if i cut my 6 by 4 box corner to corner?") ranked before new-case/guess/why, with concrete rungs (`concrete` field) in all four lessons; concrete cases classified as hints; whitespace-insensitive spoiler guard; replies capped at ~22 words; live persona now lists the move order from `research/STUDENT_SCRIPTS.md` (concrete case > new case > small guess > pick-one/yes-no > wonder > soft why last) with its gold/anti examples; "have to/has to" no longer read as a reason; a kid's own question mark means a hedged claim, not a reason; "ur so dumb" no longer counts as a reason ("so").

**Result:** offline OK 6/18 (loop 1: 6/18, before: 3/18), ready_mean 5.8. Simulated OK 0/8 (loop 1: 1/8), ready_mean 6.2, tone 1, reacts 0.43, curiosity 0.61.

**Findings (loop 2)**
1. The simulated Pip's *voice* is right (short, lowercase, concrete cases, "ok i keep asking dumb stuff" to the annoyed kid), but readiness is gated by the model's own coverage flags, which are conservative and noisy: tri_quick gave rectangle + half + 12 in text 1 and a two-copies line in text 3, yet Pip asked "how many squares is the whole box?" and was ready only at text 6.
2. The friend nudge still fires after "ya thats what i said" from a kid who has already covered the concept (tri_annoyed), because the model never marked the concept covered.
3. The model used "Noted." on a text that had on-topic content ("ur so dumb its half"), twice.
4. tri_idk / sat_burnt_out end in an early quiz tap before Pip lands a yes/no case (inherent for p=.7 cards; Pip needs a pick-one question in its first reply).

**Changes for loop 3:** live coverage = model flags OR deterministic heuristic flags (recall only; the heuristic judge never removes anything); strip a leading "Noted." when the text had content; eval spoiler check groups a concept's spoilers (saying one lets Pip say its siblings).

## A. Offline engine (fixture cards, non-holdout)

| persona | kind | ready_at | circling | echo | leaks | one_q | tone | words avg | <=18w | reacts | curiosity | checkout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sat_sign_flipper | competent | 8 | 0 | 0 | 0 | 100% | 0 | 14.2 | 75% | 0.17 | 0.25 | False |
| sat_burnt_out | weak | None | 0 | 0 | 0 | 100% | 0 | 7.0 | 100% | None | 0.0 | False |
| sat_one_term | weak | None | 0 | 0 | 0 | 100% | 0 | 15.3 | 75% | 0.33 | 0.33 | False |
| sat_desmos | chaotic | 8 | 0 | 0 | 0 | 100% | 0 | 13.0 | 75% | 0.17 | 0.38 | False |
| sat_anxious_achiever | competent | 6 | 0 | 0 | 0 | 100% | 0 | 16.0 | 50% | 0.25 | 0.5 | False |
| tri_quick | competent | 2 | 0 | 0 | 0 | 50% | 0 | 15.5 | 100% | 0.5 | 0.5 | False |
| tri_formula_no_why | weak | 6 | 0 | 0 | 0 | 83% | 0 | 17.3 | 83% | 0.5 | 0.5 | False |
| tri_forgets_half | weak | 6 | 0 | 0 | 0 | 100% | 1 | 16.0 | 83% | 0.25 | 0.67 | False |
| tri_slant | competent | 4 | 0 | 0 | 0 | 100% | 0 | 16.2 | 75% | 1.0 | 0.75 | False |
| tri_perimeter | weak | 12 | 1 | 0 | 0 | 100% | 0 | 13.9 | 83% | 0.14 | 0.58 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 14.0 | 100% | None | 0.5 | False |
| tri_insult | competent | 4 | 0 | 0 | 0 | 100% | 0 | 16.2 | 75% | 0.5 | 0.75 | False |
| tri_google | chaotic | 7 | 0 | 0 | 0 | 100% | 0 | 15.7 | 71% | 0.33 | 0.57 | False |
| tri_esl_es | competent | 7 | 0 | 0 | 0 | 86% | 0 | 16.0 | 71% | 0.4 | 0.57 | False |
| tri_paragraph | competent | 1 | 0 | 0 | 0 | 100% | 0 | 17.0 | 100% | 1.0 | 0.0 | False |
| tri_fortnite | weak | 6 | 0 | 0 | 0 | 83% | 0 | 16.2 | 67% | 0.5 | 0.67 | False |
| tri_anxious | weak | 6 | 0 | 0 | 0 | 83% | 0 | 15.7 | 67% | 0.0 | 0.83 | False |
| tri_annoyed | competent | 4 | 0 | 0 | 0 | 100% | 0 | 15.8 | 100% | 0.5 | 0.5 | False |

**5 worst Pip moments**

- (tri_perimeter) student: "wait
is area the inside and perimeter the outside" -> Pip: "Not in my brain yet. My cousin said she cut a paper sandwich corner to corner and both pieces matched…?"  [long (20 words), repeats an earlier question, ignores what the student said]
- (tri_esl_es) student: "yes like that! the two pieces is equal" -> Pip: "hm, two pieces is equal. what if i cut my 6 by 4 box corner to corner? what do i get?"  [long (21 words), 2 questions]
- (tri_fortnite) student: "oh ya like when u cut a pizza box in half from the corners" -> Pip: "hm, pizza box in half from. what if i cut my 6 by 4 box corner to corner? what do i get?"  [long (22 words), 2 questions]
- (sat_desmos) student: "ok the lock thing is just plugging it back in" -> Pip: "what if i put x = 10 into 2x + 6 = 20, what do i get on the left?"  [long (20 words), ignores what the student said]
- (sat_anxious_achiever) student: "oh you mean put it back in the very first equation not the last line?" -> Pip: "what if i put x = 10 into 2x + 6 = 20, what do i get on the left?"  [long (20 words), ignores what the student said]

**Transcripts**

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: ok, no worries. why is that wrong?
- **student**: bc when u switch sides the sign changes
- **Pip**: what can i take off without tipping it?
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
- **Pip**: what can i take off without tipping it?
- **student**: ok
- **Pip**: hm, ok. then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: ya thats right
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: oh so u have to divide everything on that side not just the 2x
- **Pip**: ok. what do you notice first?
- **student**: wait
- **Pip**: Okay, I'll hold onto that one. then how do i get x by itself without tipping anything?
- **student**: so 7?
- **Pip**: i'll try 3x = 15: take 3 off both sides, so x = 12. is that right?
- **student**: wait no
- **Pip**: My friend said whatever was done to x last has to be undone first…?
- **student**: so 2x+6 all over 2 is x+3. then x is 7
- **Pip**: then for 2x + 6 = 20 i divide just the 2x by 2 and get x + 6 = 10, right?
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
- **Pip**: what can i take off without tipping it?
- **student**: ok
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: ok the lock thing is just plugging it back in
- **Pip**: what if i put x = 10 into 2x + 6 = 20, what do i get on the left?
- **student**: ya thats what desmos does basically
- **Pip**: ok. Can you walk me through one example?
- **student**: type 2x+6=20 in desmos and look where it hits
- **Pip**: what if i take the 6 off just one side?
- **student**: desmos
- **Pip**: then x + 3 = 5 turns into x = 8, because the 3 moves over and stays +3, right?
- **student**: no lol put it in desmos u will see
- **Pip**: Okay, I'll hold onto that one. ok I think I get it. quiz me?

### sat_anxious_achiever (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: wait no i think you subtract 6 from both sides? so 2x = 14 and x = 7. is that right?
- **Pip**: what if i take the 6 off just one side?
- **student**: ok
- **Pip**: ok. if i take 6 off only the left side of 2x + 6 = 20, are the sides still equal?
- **student**: sorry
- **Pip**: hm, ok. hm, what makes it work like that?
- **student**: because if you only change one side they're not equal anymore? like a balance
- **Pip**: My cousin said an equation is like a seesaw with two kids who weigh exactly the same…?
- **student**: oh you mean put it back in the very first equation not the last line?
- **Pip**: what if i put x = 10 into 2x + 6 = 20, what do i get on the left?
- **student**: oh that makes sense bc the last line could already be wrong
- **Pip**: so you put it back in and both sides should match. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: what if i cut my 6 by 4 box corner to corner? what do i get?
- **student**: ya the 2 sandwich pieces match so each one is half
- **Pip**: oh, two of them make a box. ok I think I get it. quiz me?

### tri_formula_no_why (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its base times height over 2
- **Pip**: what if i cover a 6 by 4 box with 1 by 1 squares, how many do i need?
- **student**: ya 12
- **Pip**: ok. i'll guess a 6 by 4 rectangle is 6 + 4 = 10 squares. is that right?
- **student**: no u gotta do over 2
- **Pip**: hm, ok. walk me through a 6 by 4 rectangle. how do you get its area?
- **student**: ok
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: oh wait like if u cut a sandwich corner to corner u get 2 triangles
- **Pip**: what if i cut my 6 by 4 box corner to corner? what do i get?
- **student**: ohh
so 2 triangles make the whole rectangle and thats why its half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: Saving that: 'ya thats right its 24'. how big is the shape they make together?
- **student**: wait no it doesnt fill it
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: ya sounds right
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: wait so the triangle is only half the box?
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: ya? idk
- **Pip**: ok. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: theres an empty part thats the same triangle
- **Pip**: hm, ok. ok I think I get it. quiz me?
- **Pip**: My brain has a bug about this: "ya thats right its 24". Fix it?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: ohh so the triangle is just half the box. what do you notice first?
- **student**: 10x5 is 50 for the whole box but the triangle is half of the box so 25
- **Pip**: what if i cut my 6 by 4 box corner to corner? what do i get?

### tri_slant (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: u forgot to divide by 2. but wait which one is the height, the side that goes up diagonal?
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: ya
- **Pip**: ok. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: hmm is the slanty side longer than how tall it is? i think so
- **Pip**: hm, ok. why would a triangle get less than base times height?
- **student**: bc 2 triangles make a rectangle so u only get half
- **Pip**: ohh so the triangle is just half the box. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: wait no the height goes straight up, not along the side. how tall it is
- **Pip**: ok. how big is the shape they make together?
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
- **Pip**: hm, you tell me, i'm the confused one. what's the first thing i'd do?
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
- **Pip**: ok, no worries. how big is the shape they make together?
- **student**: ya probably
- **Pip**: ok. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: no google says divide by 2
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: google it
- **Pip**: ok, no worries. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: i guess
- **Pip**: ok. why would a triangle get less than base times height?
- **student**: ur literally an ai why are u asking me
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
- **Pip**: hm, two pieces is equal. what if i cut my 6 by 4 box corner to corner? what do i get?
- **student**: sorry what is sandwich corner to corner?
- **Pip**: if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: hm, ok. hm, what makes it work like that?
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
- **Pip**: hm, pizza box in half from. what if i cut my 6 by 4 box corner to corner? what do i get?
- **student**: wait
so the triangle is half the rectangle
- **Pip**: if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: lol
- **Pip**: hm, ok. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nooo its half. 50 cut in half is 25
- **Pip**: mm, yeah, that fits. hm, what makes it work like that?
- **student**: the right triangle is half the rectangle too
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?

### tri_anxious (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: um i think u have to divide by 2? is that right??
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes? i think
- **Pip**: ok. does a 6 by 4 triangle cover all 24 squares of a 6 by 4 box?
- **student**: wait is it not?? sorry
- **Pip**: hm, ok. why would a triangle get less than base times height?
- **student**: bc um 2 triangles make a rectangle? i think
- **Pip**: what if i cut my 6 by 4 box corner to corner? what do i get?
- **student**: oh like the 2 pieces are the same so its half??
- **Pip**: ok. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: ok
- **Pip**: hm, ok. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh no thats my fault
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: i think the leaning ones are half too? like any triangle and its rectangle. 10x5 is 50 so 25
- **Pip**: oh, leaning ones are half too. I think I'm good. Want to quiz me now?

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
| sat_sign_flipper | competent | 5 | 0 | 0 | 0 | 100% | 0 | 15.4 | 80% | 1.0 | 0.8 | False |
| tri_annoyed | competent | 6 | 0 | 0 | 0 | 100% | 0 | 15.0 | 83% | 0.33 | 0.67 | False |
| tri_esl_es | competent | 6 | 0 | 0 | 0 | 100% | 0 | 12.5 | 83% | 0.0 | 0.5 | False |
| tri_forgets_half | weak | 8 | 0 | 0 | 0 | 100% | 1 | 16.4 | 62% | 0.25 | 0.62 | False |
| tri_idk | weak | None | 0 | 0 | 0 | 100% | 0 | 12.5 | 50% | None | 0.5 | False |
| tri_insult | competent | 6 | 0 | 0 | 1 | 100% | 0 | 13.7 | 83% | 0.5 | 0.33 | False |
| tri_quick | competent | 6 | 0 | 1 | 0 | 100% | 0 | 13.3 | 100% | 0.5 | 0.5 | False |

**5 worst Pip moments**

- (tri_forgets_half) student: "ok" -> Pip: "ok lets start with the box. i guess a 6 by 4 box is 6 + 4 = 10 squares?"  [teacher tone, long (20 words)]
- (tri_esl_es) student: "no is correct. is base for height between 2" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words), ignores what the student said]
- (tri_forgets_half) student: "wait so the triangle is only half the box?" -> Pip: "what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?"  [long (19 words), ignores what the student said]
- (tri_forgets_half) student: "wait no it doesnt fill it" -> Pip: "oh so my triangle leaves some of the box empty. why would a triangle get less than base times height?"  [long (20 words), ignores what the student said]
- (tri_quick) student: "ya the 2 sandwich pieces match so each one is half" -> Pip: "ohh the 2 sandwich pieces match. so how many squares is the whole 6 by 4 box?"  [parrots the student]

**Transcripts**

### sat_burnt_out (weak)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: bro its 7
- **Pip**: 7?

### sat_sign_flipper (competent)

- **Pip**: Hi. I'm Pip. I'm learning sat math: solving linear equations (do the same thing to both sides). I already know one rule: When you move a number to the other side it stays the same, so 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13. Easy.
- **student**: no it flips. 2x=20-6 so 2x=14 x=7
- **Pip**: how do you get from 2x = 14 to x = 7?
- **student**: ok
- **Pip**: hm, i'll try 2x = 14, take 2 off, so x = 12?
- **student**: x=7
- **Pip**: ok so 14 shrinks to 7. is that cuz of the 2 stuck to x?
- **student**: ya 7
- **Pip**: so the 2 does something to the 14. would 3x = 12 give x = 4 then?
- **student**: 2(7)+6 is 20 so ya
- **Pip**: oh you put the 7 in, 14 + 6 lands on 20. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: nah u cant just move it. moving it is subtracting from both sides so 19-4 = 15 then x = 5
- **Pip**: I think I'm good. Want to quiz me now?

### tri_annoyed (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: its half bc 2 triangles make the rectangle. 12
- **Pip**: i guess the box is 6 + 4 = 10 squares?
- **student**: ok
- **Pip**: hm ok. what if i cut my 6 by 4 box corner to corner, what do i get?
- **student**: ya thats what i said
- **Pip**: My cousin said she cut a paper sandwich corner to corner and both pieces matched…?
- **student**: ok and
- **Pip**: if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: k
- **Pip**: ok i keep asking dumb stuff. hm, what makes it work like that?
- **student**: i literally just said that
- **Pip**: Okay, I'll hold onto that one. ok I think I get it. quiz me?

### tri_esl_es (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no is correct. is base for height between 2
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: yes is 12
- **Pip**: oh 12, not my 24. how big is the shape they make together?
- **student**: si
- **Pip**: ok. too small?
- **student**: ok
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: yes like that! the two pieces is equal
- **Pip**: how do you get the squares in the whole 6 by 4 box?
- **student**: yes
- **Pip**: ok. ok I think I get it. quiz me?

### tri_forgets_half (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ya thats right its 24
- **Pip**: if my 6 by 4 triangle sits in a 6 by 4 box, it fills the whole box?
- **student**: idk
- **Pip**: hm me neither. what do you notice first?
- **student**: ok
- **Pip**: ok lets start with the box. i guess a 6 by 4 box is 6 + 4 = 10 squares?
- **student**: so do i divide it?
- **Pip**: My friend said to think about sharing one tray of brownies with exactly one other person…?
- **student**: wait so the triangle is only half the box?
- **Pip**: what if i fold the 6 by 4 box corner to corner, how many squares sit on each side?
- **student**: wait no it doesnt fill it
- **Pip**: oh so my triangle leaves some of the box empty. why would a triangle get less than base times height?
- **student**: bc base times height is the area
- **Pip**: wait, base times height is 24, but i thought my triangle was only part of the box?
- **student**: idk
- **Pip**: fair, im mixed up too. ok I think I get it. quiz me?
- **Pip**: You didn't teach me that one. Can you teach it to me?
- **student**: oh wait the box thing. the triangle is half so 25
- **Pip**: ohh so the triangle is just half the box. how big is the shape they make together?
- **student**: 10x5 is 50 for the whole box but the triangle is half of the box so 25
- **Pip**: what if i cut my 6 by 4 box corner to corner? what do i get?

### tri_idk (weak)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: idk
- **Pip**: ok no stress. if my 6 by 4 triangle sits in a 6 by 4 box, does it fill the whole box?
- **student**: k
- **Pip**: fair. too small?

### tri_insult (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: ur so dumb its half
- **Pip**: oh, half. how big is the shape they make together?
- **student**: yes genius
- **Pip**: Noted. then a 6 by 4 rectangle and a 6 by 4 triangle are both 24, right?
- **student**: nooo ur adding 💀
- **Pip**: Someone in my class said she counts the squares row by row instead of one at a time…?
- **student**: ur cousin is smarter than u
- **Pip**: Noted. what do you notice first?
- **student**: ok
- **Pip**: Okay, I'll hold onto that one. why is that wrong?
- **student**: omg bc 2 triangles make a rectangle. so 1 triangle is half. how do u not know this
- **Pip**: ohh, two triangles fit into a rectangle, so mine is only one piece. ok I think I get it. quiz me?

### tri_quick (competent)

- **Pip**: Hi. I'm Pip. I'm learning area of a triangle. I already know one rule: Area of a triangle is base times height, so a 6 by 4 triangle is 24. Easy.
- **student**: no its half. 6x4 is the rectangle the triangle is only half so 12
- **Pip**: what is in the leftover part, same shape as mine?
- **student**: k
- **Pip**: hm ok. if i cut your 6 by 4 box corner to corner, what do i get?
- **student**: ya the 2 sandwich pieces match so each one is half
- **Pip**: ohh the 2 sandwich pieces match. so how many squares is the whole 6 by 4 box?
- **student**: yep 12
- **Pip**: wait, the whole box is 12?
- **student**: so 12
- **Pip**: hm, i would have said 6 + 4 = 10 squares for the box. is that too small?
- **student**: ya
- **Pip**: ok so not 10. ok I think I get it. quiz me?
