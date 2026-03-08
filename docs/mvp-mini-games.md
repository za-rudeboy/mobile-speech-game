# MVP Mini-Games

## Product Goal
Build a very small mobile app that teaches high-value language concepts through short, visual, parent-guided interactions. The app should support speech, but every activity must also work with touch so communication does not fail when speech recognition fails.

## Shared MVP Rules
All three mini-games should follow the same design constraints:

- one task per screen
- large tap targets
- minimal text on screen
- parent can quickly correct misunderstood speech
- immediate visual feedback
- short sessions, ideally 1 to 3 minutes
- no open-ended chatbot behavior

Each game should support two input paths:

- child taps the answer
- child says the answer and the app guesses from a small set

If speech confidence is low, the app should show 2 options and let the parent or child confirm.

## Mini-Game 1: My Turn / Your Turn

### Purpose
Teach:

- `my`
- `your`
- `mine`
- `yours`
- `me`
- `you`

### Core Interaction
Use two characters only:

- the child
- the parent or a friendly avatar

Use objects that can be passed back and forth:

- ball
- car
- snack
- tablet

### Screen 1: Game Select Card
Elements:

- title: `My Turn / Your Turn`
- simple illustration of two people sharing an item
- start button

### Screen 2: Turn Prompt
Elements:

- large picture of the child and parent
- one object in the middle
- spoken prompt such as `Whose turn?`
- two large answer buttons: `my turn` and `your turn`
- microphone button for speech input

Behavior:

- if he taps correctly, animate the object moving to the correct person
- if he speaks, the app matches to one of the two choices

### Screen 3: Possession Prompt
Elements:

- picture of one person holding the object
- spoken prompt such as `Whose ball?`
- two buttons: `mine` and `yours`
- optional smaller subtitle for parent only

Behavior:

- immediate feedback animation
- spoken model such as `It is yours`

### Screen 4: Action Prompt
Elements:

- object shown between two people
- spoken prompt such as `Give it to me` or `Give it to you`
- child either drags object or chooses a button

Behavior:

- teaches pronouns in action, not isolation

### Screen 5: Parent Correction Sheet
Shown only when speech recognition is unclear.

Elements:

- `Did he mean:`
- option A
- option B
- `try again`

Behavior:

- parent taps the intended meaning
- app stores the correction for future matching

## Mini-Game 2: Where Is It?

### Purpose
Teach:

- `in`
- `on`
- `under`
- `next to`
- `where`
- `which`

### Core Interaction
Use familiar objects and containers:

- toy in a box
- cup on a table
- teddy under a blanket
- car next to a block

### Screen 1: Game Select Card
Elements:

- title: `Where Is It?`
- illustration showing one hidden object and one visible object
- start button

### Screen 2: Place the Object
Elements:

- one movable toy
- one container or surface
- spoken prompt such as `Put the ball in the box`
- 3 or 4 visual placement zones

Behavior:

- child drags the toy or taps a placement choice
- feedback shows the correct location clearly

### Screen 3: Find the Object
Elements:

- scene with multiple objects in different places
- spoken prompt such as `Which one is under the table?`
- touchable objects only, no text answers needed

Behavior:

- child taps the matching object
- app highlights and names the concept

### Screen 4: Answer a Where Question
Elements:

- single object placed clearly
- spoken prompt `Where is the car?`
- answer buttons: `in`, `on`, `under`, `next to`
- microphone button for speech input

Behavior:

- correct answer triggers short phrase model such as `The car is under`

### Screen 5: Parent Correction Sheet
Same pattern as Game 1.

Use case:

- app is unsure whether he said `on` or `under`
- parent selects intended answer
- app saves the example under this concept

## Mini-Game 3: Which Is Bigger?

### Purpose
Teach:

- `big`
- `small`
- `bigger`
- `same`
- `different`
- `more`

### Core Interaction
Use clear visual differences, not subtle ones.

Good examples:

- two balls of different sizes
- two stacks with different amounts
- two shapes that are identical or not identical

### Screen 1: Game Select Card
Elements:

- title: `Which Is Bigger?`
- illustration of two very different sized objects
- start button

### Screen 2: Big or Small
Elements:

- two objects side by side
- spoken prompt `Point to the big one`
- touchable objects only

Behavior:

- object selected gets highlighted
- app says `big` or `small`

### Screen 3: Bigger Comparison
Elements:

- two or three objects of increasing size
- spoken prompt `Which is bigger?`
- microphone button optional

Behavior:

- start with two objects only
- move to three only after success is stable

### Screen 4: Same or Different
Elements:

- two objects shown side by side
- prompt `Same or different?`
- two buttons: `same` and `different`

Behavior:

- use very obvious examples at first
- later vary color, size, and shape separately

### Screen 5: More
Elements:

- two groups of items, such as 2 apples and 5 apples
- prompt `Which has more?`
- touchable groups only

Behavior:

- use low counts first so the comparison is visual, not academic

### Screen 6: Parent Correction Sheet
Same correction flow as other games.

## Home Screen Sketch
The MVP home screen should be extremely simple.

Elements:

- app title
- 3 large game cards
- parent button in corner
- progress indicator with simple labels such as `practiced today`

Game cards:

- `My Turn / Your Turn`
- `Where Is It?`
- `Which Is Bigger?`

## Parent Mode Sketch
Parent mode should be lightweight, not a full dashboard.

### Parent Screen 1: Targets
Show:

- enabled targets for each game
- toggle targets on or off
- mark targets as easy, practicing, or later

### Parent Screen 2: Corrections
Show:

- recent misunderstood attempts
- parent-confirmed meaning
- how often each target is confused

### Parent Screen 3: Progress
Show:

- targets practiced this week
- targets answered correctly with touch
- targets answered correctly with speech
- notes field for real-life observations

## MVP Scope Guardrails
Keep version 1 deliberately small.

Include:

- 3 mini-games
- 10 to 20 targets total
- speech plus touch input
- parent correction loop
- local progress tracking

Do not include yet:

- open conversation
- generative AI companion
- long text prompts
- complex rewards system
- too many categories
- cloud-only recognition

## What Good Looks Like
The MVP is successful if it helps create:

- short enjoyable practice sessions
- less frustration when the app misunderstands him
- better comprehension of a small set of concepts
- carryover into daily routines and play
