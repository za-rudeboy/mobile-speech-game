# Audio UX Spec

## Purpose
This document describes exactly how audio should behave on each major screen in the MVP. The goal is to make audio supportive, predictable, and optional.

## UX Principles
- audio should help comprehension, not dominate the experience
- speech input should always be optional
- every voice interaction should have a visible touch alternative
- spoken prompts should be short and repeatable
- audio feedback should be brief and calm
- if recognition is uncertain, the app should ask for confirmation instead of pretending it understood

## Audio Types
The MVP uses four audio types:

1. prompt playback
2. target phrase model playback
3. child speech input
4. feedback audio

## Global Controls
Across the app, audio should follow these rules:

- no constant autoplay loops
- prompt audio may autoplay once when a screen opens
- every prompt screen should have a visible replay button
- microphone button should be visible only when speech input is allowed
- parent mode should expose saved audio examples only to the parent

## Home Screen
Purpose of audio:
- introduce the game title if helpful
- support children who respond well to spoken cues

Recommended behavior:
- no autoplay on screen load
- tapping a game card may play a short spoken label
- optional speaker icon on each game card

Example:
- `My Turn / Your Turn`
- `Where Is It?`
- `Daily Phrase Practice`

Do not:
- autoplay all game labels in sequence
- add background music

## Game Intro Screen
Purpose of audio:
- orient him to the activity
- make the game feel familiar and predictable

Recommended behavior:
- one short spoken intro line
- replay button for the intro
- intro should be skippable

Example spoken lines:
- `Let's practice turns.`
- `Let's find where things go.`
- `Let's practice a helpful phrase.`

Preferred source:
- recorded parent clip or short TTS fallback

## Prompt Screen
This is the most important screen for audio design.

### Prompt Playback
Recommended behavior:
- autoplay prompt once when the screen opens
- show a speaker button to replay it
- if he taps replay repeatedly, the app should allow it

Examples:
- `Whose turn?`
- `Where is the car?`
- `Say the helpful phrase.`

### Child Response Options
The child should always see two ways to answer:
- touch response
- speech response via microphone button

The microphone should feel like an invitation, not a requirement.

### Microphone Interaction
Recommended mic behavior:
- tap mic to start listening
- clear listening state appears visually
- short listening window, around 2 to 3 seconds
- stop automatically after short silence
- if no speech is detected, return to idle without penalty

Visual states:
- idle mic
- listening
- processing
- needs confirmation

### Recognition Outcome States
If confidence is high:
- accept answer
- go to feedback state

If confidence is low:
- show confirmation sheet with 2 likely meanings

If nothing useful is captured:
- let him try again
- keep touch buttons active

## Speech Confirmation Sheet
Purpose:
- recover from uncertain recognition without friction

Recommended behavior:
- appears as a simple modal or bottom sheet
- shows at most 2 likely options
- includes `try again`
- parent or child can tap the intended answer

Audio behavior:
- optional playback of the child recording for parent review
- no long verbal explanation from the app

## Feedback State
Purpose of audio:
- reinforce success
- model the target phrase briefly

Recommended behavior:
- short success sound or short spoken praise
- one target model phrase only
- avoid long verbal praise sequences

Examples:
- `Yes. My turn.`
- `Under.`
- `Big.`

Good pattern:
- visual success first
- audio model second
- then advance

## Parent Targets Screen
Purpose of audio:
- preview what the child will hear
- let the parent verify recordings

Recommended behavior:
- tap any target to play its model audio
- show whether audio source is recorded clip or TTS
- allow replacement recording later

## Parent Corrections Screen
Purpose of audio:
- review misunderstood attempts
- confirm whether stored mappings are still useful

Recommended behavior:
- each correction item may include a play button for the original clip
- parent can hear the clip, see what the app guessed, and see what was confirmed

Useful layout fields:
- child audio clip
- guessed answer
- confirmed answer
- number of times seen

## Parent Progress Screen
Purpose of audio:
- mostly visual data, with optional drill-down to recordings

Recommended behavior:
- no autoplay
- optional playback only when reviewing a specific target or correction

## Audio Content Rules
Prompt audio should be:
- short
- concrete
- consistent across repetitions

Feedback audio should be:
- brief
- predictable
- low stimulation

Model phrase audio should be:
- one word or one short phrase
- spoken clearly
- not overloaded with extra language

## Personal Recordings Strategy
Use parent-recorded clips for:
- names
- target words that matter a lot
- familiar praise phrases
- any word TTS mispronounces

Use TTS for:
- generic prototype prompts
- temporary filler prompts
- low-priority system phrases

## Accessibility and Regulation
If audio seems to increase stress or overload, the app should allow:
- replay on demand only
- disabling autoplay
- muting feedback sounds
- using touch-only mode

## Success Criteria
The audio UX is working if:
- he understands prompts faster
- he uses replay when needed
- speech feels optional rather than pressured
- confirmation sheets are brief and manageable
- recorded parent voice increases engagement or clarity
