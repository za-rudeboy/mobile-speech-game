# Audio Strategy

## Purpose
This document defines where audio should help the MVP and where it should stay optional. The goal is to use audio to support understanding and participation, not to make the whole product depend on perfect speech recognition.

## Core Principle
Audio should be used in two separate ways:

1. audio output from the app
2. audio input from the child

These should be treated differently.

## 1. Audio Output
Audio output is the easier and safer place to start.

### Best Uses
- play spoken prompts
- play short praise or feedback
- play a recorded model of the target phrase
- play custom recordings for names or familiar words

### Best Source For Output Audio
For highly personal words, use parent-recorded clips.

Examples:
- his name
- sibling names
- favorite toy names
- family routines
- target phrases you want pronounced a specific way

This is better than synthetic speech for those items because:
- pronunciation is under your control
- the voice can be familiar and calming
- you avoid odd text-to-speech pronunciation

### Where Text-to-Speech Still Helps
Text-to-speech is still useful for:
- generic prompts
- quick prototypes
- fallback if a custom recording does not exist

Good rule:
- use recorded audio for high-value personal words
- use TTS for generic app language if needed

## 2. Audio Input
Audio input should be optional in every game.

The child should always be able to:
- tap an icon
- tap one of two choices
- drag an item
- speak the answer if he wants to

This means speech is encouraged but never required.

## Where Audio Input Makes Sense
Use child speech input only when:
- the app is asking for a one-word or two-word answer
- the possible answers are already known
- there are only 2 to 4 valid answers on screen
- a fallback tap option is visible

Good examples:
- `my turn` or `your turn`
- `in` or `on`
- `big` or `small`
- `same` or `different`

Bad examples for MVP:
- open-ended conversation
- long sentences
- narrative retell
- freeform question answering

## Recommended Interaction Pattern
For each prompt, the app should offer both:
- tap response
- microphone response

Suggested flow:
1. prompt appears
2. child can tap answer directly or tap the mic
3. if speech is clear enough, the app accepts the best guess
4. if confidence is low, the app shows 2 likely meanings
5. parent confirms the intended meaning
6. app gives feedback and stores the corrected example

## Why This Can Work
The important point is that the app does not need to solve general speech recognition.
It only needs to choose among a very small list of possible meanings for the current prompt.

That makes the problem much more realistic.

Example:
- current prompt answers are only `in`, `on`, `under`
- child says something approximate
- app makes a best guess among those 3 only
- parent can correct when needed

## Audio Modes By Screen

### Home Screen
Use:
- optional short spoken title for each game card

Do not use:
- autoplay narration everywhere

### Prompt Screen
Use:
- spoken prompt playback button
- optional automatic prompt playback once
- mic button for answer input

### Feedback Screen
Use:
- short praise sound or spoken phrase
- brief spoken model such as `my turn`

### Parent Mode
Use:
- playback of saved speech attempts for review
- playback of parent-recorded prompt clips

## Parent-Recorded Audio Library
The app should support a small personal audio library.

Useful recording types:
- child name
- family member names
- favorite objects
- praise phrases such as `nice job`
- target phrase models such as `my turn`, `your turn`, `under`, `next to`

Suggested metadata for each recording:
- recording id
- label
- transcript
- category
- file path
- duration
- created at

## Speech Recognition Strategy
The recognition strategy should stay constrained.

Recommended MVP behavior:
- recognize only during short answer windows
- compare the speech result only against current prompt options
- use prior parent-confirmed examples to improve ranking
- ask for confirmation when confidence is low

This is a best-guess interpreter, not a therapist and not a chatbot.

## What To Expect Realistically
A good MVP can probably do these things:
- detect one-word and two-word answers sometimes well
- improve within a small set of repeated prompts
- get better when the same target is practiced repeatedly

A good MVP will not reliably do these things:
- understand everything he says
- handle novel sentences well
- replace human interpretation
- work equally well in noisy environments

## Product Decision
Audio should be present in version 1, but in a narrow form.

Include now:
- playback of recorded prompts and feedback
- optional speech answers on simple prompts
- parent confirmation when uncertain
- saved examples for later review

Delay until later:
- open-ended voice interaction
- long spoken responses
- autonomous conversation
- remote AI voice features

## Library Direction
If the app is eventually built with Expo or React Native, the likely split is:
- one audio library for recording and playback
- one speech recognition library for short spoken answers

The product requirement is not perfect transcription.
The product requirement is quick recognition of a tiny answer set plus a graceful fallback path.

## Success Criteria
Audio is helping if it creates one or more of these outcomes:
- he enjoys hearing familiar recorded prompts
- he can answer by touch or speech without extra frustration
- parent correction gets faster over time
- the app gets better at recognizing a few repeated target words
- real-life carryover improves outside the app
