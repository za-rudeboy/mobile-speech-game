# MVP V1 Level Progression And Copy Sheet

## Purpose
This document adds a practical difficulty ladder and a unified prompt wording set for MVP V1.

Use it to:
- keep wording consistent across screens
- prevent early over-mastery
- add challenge without adding confusion

## Global Difficulty Rules
Apply these rules across all mini-games.

- Start with 2 choices. Expand to 3, then 4 only when the same prompt type is already stable.
- Use concrete visuals before abstract variations.
- Change one variable at a time: object, scene, speaker, character position, or prompt form.
- Require `3 correct in a row` before leveling up.
- If accuracy drops below `60%` in the last 5 items, step back one level.
- Session mix: `70% mastered`, `30% new/challenging`.
- Keep rounds short: `6 to 10` prompts.

## Standard Prompt Style
Use a fixed style so language patterns are easy to learn.

- Receptive prompts (child points/taps): `Show me ...` or `Which one is ...?`
- Expressive prompts (child says answer): `Where is ...?` or `Whose ...?`
- Feedback model: short sentence using target word.

Examples:
- Prompt: `Where is the car?`
- Answer choices: `in`, `on`, `under`, `next to`
- Feedback: `The car is under.`

---

## Game 1: My Turn / Your Turn

### Goal
Perspective and possession words:
`my`, `your`, `mine`, `yours`, `me`, `you`

### Level 1 (Foundation)
- 2 choices only
- One familiar object (ball/tablet)
- Fixed character positions
- Prompt types:
  - `Whose turn?`
  - `My turn or your turn?`
- Answers:
  - `my turn` / `your turn`

### Level 2 (Possession)
- Add possession prompts with same visuals
- Prompt types:
  - `Whose ball?`
  - `Is it mine or yours?`
- Answers:
  - `mine` / `yours`

### Level 3 (Action Pronouns)
- Add give/request actions
- Prompt types:
  - `Give it to me.`
  - `Give it to Dad.` (or parent name)
- Response type:
  - drag object to correct person or tap person
- Note:
  - Use parent name before introducing `you` in action prompts.

### Level 4 (Perspective Shift)
- Swap only one perspective variable at a time
- Keep one prompt type per short round before mixing prompt types
- Introduce `me/you` action contrast only after stable success with named action prompts
- Keep character positions fixed first, then rotate positions later
- Prompt examples:
  - `I have the ball. Is it mine or yours?`
  - `Now it is your turn.`

### Mastery Check
- Same concept with new objects and new scenes
- Include turn, possession, and at least one action prompt
- Pass criterion:
  - `>=80%` across 2 different scenes

---

## Game 2: Where Is It?

### Goal
Location and question words:
`in`, `on`, `under`, `next to`, `where`, `which`

### Level 1 (Two Locations)
- Start with `in` and `on`
- One object + one container/surface
- Prompt types:
  - `Put the ball in the box.`
  - `Which one is on the table?`

### Level 2 (Add Under + Early Where Questions)
- Introduce `under`
- Keep object and background simple
- Prompt types:
  - `Where is the car?`
  - `Which one is under the table?`

### Level 3 (Add Next To + Distractors)
- Introduce `next to`
- Show 3 to 4 candidate objects/positions
- Prompt types:
  - `Put the teddy next to the box.`
  - `Which one is next to the cup?`

### Level 4 (Generalization)
- Rotate through home-like scenes (room, kitchen, outside)
- Mix all location words
- Add quick alternation between receptive and expressive prompts
- Prompt examples:
  - `Where is the spoon?`
  - `Which one is under the chair?`

### Mastery Check
- Correct in unfamiliar visual scene, not previously practiced
- Pass criterion:
  - `>=80%` with all four location words
  - success on both `Where is ...?` and `Which one is ...?` prompt forms

---

## Game 3: Daily Phrase Practice

### Goal
Functional daily-life phrases:
`help me please`, `all done`, `I want ___`, `my hand hurts`

### Level 1 (Model And Match)
- Pair a familiar visual with one target phrase
- Prompt types:
  - `i want a banana please.`
  - `help me please.`

### Level 2 (Use In Familiar Routines)
- Use snack, cleanup, break, and hurt/help scenes
- Prompt type:
  - `What can Caelum say?`

### Level 3 (Generalize With New Scenes)
- Keep the same phrase, but vary the objects and setting
- Prompt types:
  - `I want water please.`
  - `All done.`

### Level 4 (Mixed Functional Set)
- Mix request, help, stop, and hurt phrases in one round
- Prompt types:
  - `I want ___.`
  - `My hand hurts.`

### Mastery Check
- Mixed set: request + help + finished + hurt/support phrases in one round
- Pass criterion:
  - `>=80%` over 10 mixed prompts

---

## Copy Sheet (UI + Voice)
Use these exact strings for MVP consistency.

Assumption for this pass:
- Parent label is `Dad`.
- Child label should be replaced with the child's name in production.
- Use pronouns for turn and possession targets.
- Use names first only for early action-prompt scaffolding.

### Global UI Strings
- `Start`
- `Try again`
- `Nice work`
- `Let’s do another one`
- `I’m not sure. Did you mean...`

### Parent Confirmation Sheet
- Title: `I’m not sure. Did you mean...`
- Option A: `{candidate_1}`
- Option B: `{candidate_2}`
- Button: `Try again`

### Game 1 Strings
- `Whose turn is it?`
- Buttons: `My turn` / `Your turn`
- `Whose ball is this?`
- Buttons: `Mine` / `Yours`
- `Give the ball to Dad.`
- `Give the ball to Caelum.` (replace `Sam` with the child's name)
- Later prompt after action success: `Give the ball to me.`
- Later prompt after action success: `Give the ball to you.`
- Feedback:
  - `Yes, it is my turn.`
  - `Yes, it is your turn.`
  - `Yes, it is mine.`
  - `Yes, it is yours.`
  - `Yes, give it to Dad.`
  - `Yes, give it to Caelum.`

### Game 2 Strings
- `Put the ball in the box.`
- `Put the cup on the table.`
- `Put the teddy under the blanket.`
- `Put the car next to the block.`
- `Where is the car?`
- `Which one is under the table?`
- Buttons: `In` / `On` / `Under` / `Next to`
- Feedback:
  - `The car is in the box.`
  - `The cup is on the table.`
  - `The teddy is under the blanket.`
  - `The car is next to the block.`

### Game 3 Strings
- `Show me the big one.`
- `Show me the small one.`
- `Which one is bigger?`
- `Are they the same or different?`
- `Which one has more?`
- Feedback:
  - `Yes, this one is big.`
  - `Yes, this one is small.`
  - `Yes, this one is bigger.`
  - `They are the same.`
  - `They are different.`
  - `This one has more.`

---

## Fast Add-Ons For A Quick Learner
If he masters the base levels quickly, add one variable at a time.

1. New visual scene, same language target.
2. New object set, same prompt structure.
3. Two-step direction: `Put it in the box, then give it to me.`
4. Gentle speed round (no penalties).
5. Functional repair phrases: `help me please`, `again`, `not that`, `I don’t know`.

These increase challenge while keeping frustration low.

See: docs/mvp-v1-copy-keys.json
