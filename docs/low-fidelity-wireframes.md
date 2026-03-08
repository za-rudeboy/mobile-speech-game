# Low-Fidelity Wireframes

## Purpose
These wireframes describe the smallest useful interface for the MVP. They are intentionally low fidelity so layout, interaction order, and parent controls can be decided before visual design or implementation.

## Design Principles
- one task per screen
- large touch targets
- minimal reading required
- speech is optional, never mandatory
- parent controls stay available but out of the way
- feedback is immediate and obvious

## Screen Inventory
The MVP needs these screens:

1. Home
2. Game Intro Card
3. Active Prompt Screen
4. Speech Confirmation Sheet
5. Reward / Feedback State
6. Parent Targets Screen
7. Parent Corrections Screen
8. Parent Progress Screen

## 1. Home Screen
Purpose:
- let him start quickly
- keep the app visually calm
- show only the 3 mini-games

```text
+--------------------------------------------------+
| App Title                             [Parent]   |
| Practice today: 6 prompts                         |
|                                                  |
| +----------------------------------------------+ |
| | My Turn / Your Turn                          | |
| | share toys, turns, and ownership             | |
| |                    [Start]                   | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Where Is It?                                 | |
| | in, on, under, next to                       | |
| |                    [Start]                   | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Which Is Bigger?                             | |
| | big, small, same, different, more            | |
| |                    [Start]                   | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

Notes:
- each game appears as a large card
- progress is lightweight, not score-heavy
- no clutter, badges, ads, or navigation tabs

## 2. Game Intro Card
Purpose:
- orient him before each session
- make the activity feel predictable

```text
+--------------------------------------------------+
| [Back]                                           |
|                                                  |
|              My Turn / Your Turn                 |
|                                                  |
|        [ illustration of two people sharing ]    |
|                                                  |
|              We will practice turns              |
|                                                  |
|                  [Start Game]                    |
+--------------------------------------------------+
```

Notes:
- one sentence maximum
- illustration should preview the task
- this screen can be skipped later for familiar users

## 3. Active Prompt Screen
Purpose:
- present one language target
- allow touch or speech response

### Example: My Turn / Your Turn
```text
+--------------------------------------------------+
| [Back]                            Prompt 2 of 6  |
|                                                  |
|      [ child avatar ]   ball   [ parent avatar ] |
|                                                  |
|                 Whose turn?                      |
|                                                  |
|       +----------------+  +----------------+     |
|       |    My turn     |  |   Your turn    |     |
|       +----------------+  +----------------+     |
|                                                  |
|                    [Mic]                         |
+--------------------------------------------------+
```

### Example: Where Is It?
```text
+--------------------------------------------------+
| [Back]                            Prompt 3 of 6  |
|                                                  |
|             [ table ]                            |
|        [ car ] placed under table                |
|                                                  |
|                Where is the car?                 |
|                                                  |
|   +---------+ +---------+ +---------+ +--------+ |
|   |   in    | |   on    | | under   | | next to| |
|   +---------+ +---------+ +---------+ +--------+ |
|                                                  |
|                    [Mic]                         |
+--------------------------------------------------+
```

### Example: Which Is Bigger?
```text
+--------------------------------------------------+
| [Back]                            Prompt 1 of 6  |
|                                                  |
|          [ small ball ]   [ big ball ]           |
|                                                  |
|               Point to the big one               |
|                                                  |
|         child taps object directly               |
|                                                  |
|                    [Mic]                         |
+--------------------------------------------------+
```

Notes:
- only show the controls needed for the specific prompt
- touch should be the default path
- the microphone is optional and visually secondary

## 4. Speech Confirmation Sheet
Purpose:
- recover gracefully when speech recognition is uncertain
- keep the parent in the loop

```text
+------------------------------------------+
| Did he mean:                             |
|                                          |
|   +----------------------------------+   |
|   | My turn                          |   |
|   +----------------------------------+   |
|                                          |
|   +----------------------------------+   |
|   | Your turn                        |   |
|   +----------------------------------+   |
|                                          |
|            [Try Again]                   |
+------------------------------------------+
```

Notes:
- appear as a bottom sheet or modal
- show at most 2 likely options
- this screen is for parent use, but the child can also point

## 5. Reward / Feedback State
Purpose:
- confirm success immediately
- model the target language briefly

### Example success overlay
```text
+--------------------------------------------------+
|                                                  |
|      [ child avatar gets the ball animation ]    |
|                                                  |
|                 Yes. My turn.                    |
|                                                  |
|                    [Next]                        |
+--------------------------------------------------+
```

Notes:
- keep feedback short and consistent
- avoid overstimulating effects
- success should move quickly into the next prompt

## 6. Parent Targets Screen
Purpose:
- let you control what concepts are active
- keep difficulty aligned with his current level

```text
+--------------------------------------------------+
| [Back]               Targets                      |
|                                                  |
| My Turn / Your Turn                              |
| [x] my     [x] your   [ ] mine   [ ] yours       |
| [ ] me     [ ] you                               |
|                                                  |
| Where Is It?                                     |
| [x] in     [x] on     [ ] under  [ ] next to     |
| [ ] where  [ ] which                             |
|                                                  |
| Which Is Bigger?                                 |
| [x] big    [x] small  [ ] bigger [ ] same        |
| [ ] different       [ ] more                     |
|                                                  |
|                 [Save]                           |
+--------------------------------------------------+
```

Notes:
- targets should be easy to enable and disable
- do not force complex setup

## 7. Parent Corrections Screen
Purpose:
- review where speech matching is failing
- improve the parent-taught interpreter over time

```text
+--------------------------------------------------+
| [Back]             Recent Corrections             |
|                                                  |
| "mah tuhn"  ->  my turn      4 times            |
| "nuh to"    ->  next to      2 times            |
| "bee"       ->  big          3 times            |
|                                                  |
| tap item for examples and notes                  |
+--------------------------------------------------+
```

Notes:
- parent-facing only
- this should support lightweight review, not data overload

## 8. Parent Progress Screen
Purpose:
- show whether targets are actually improving
- keep the focus on practical outcomes

```text
+--------------------------------------------------+
| [Back]                Progress                    |
|                                                  |
| This week                                         |
| - practiced: 24 prompts                           |
| - touch correct: 18                               |
| - speech matched: 9                               |
|                                                  |
| Target status                                     |
| - my: improving                                   |
| - your: improving                                 |
| - on: stable                                      |
| - under: still hard                               |
|                                                  |
| Notes                                              |
| [ He used "my turn" during board game ]          |
+--------------------------------------------------+
```

Notes:
- the notes field matters because carryover outside the app is the real measure
- progress language should be plain, not clinical

## Key Mobile Layout Notes
- portrait-first layout is fine for MVP
- cards and buttons should work on phone and tablet
- active prompt screen should keep the answer area in the bottom half for easier reach
- avoid tiny icons and dense nav patterns

## Interaction Sequence
Typical child flow:

1. open app
2. choose one of 3 games
3. complete 4 to 6 prompts
4. receive brief feedback after each prompt
5. return to home or continue another short round

Typical parent flow:

1. open parent mode
2. enable or disable a few targets
3. review recent speech corrections
4. check whether any targets are transferring into daily life

## Scope Discipline
If a screen does not directly support:
- target practice
- speech confirmation
- parent control
- progress review

it should not exist in version 1.
