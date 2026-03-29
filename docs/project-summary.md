# Project Summary

## What We Are Trying To Achieve
This project is exploring a custom mobile app to support language development for a 6-year-old autistic child with speech and language delays.

The app is not intended to be:
- a replacement for speech therapy
- an open-ended AI companion
- a general speech recognition system

The app is intended to be:
- a parent-guided communication support tool
- highly customized to one child
- narrow, predictable, and low-frustration
- useful for practicing language concepts that matter in daily life

The core idea is to build something that can:
- present simple, visual language games
- support both touch and speech input
- use parent-recorded audio where pronunciation matters
- make a best guess at short spoken answers from a very small answer set
- let the parent confirm or correct uncertain interpretations
- gradually improve at understanding this child's recurring speech patterns

## Product Direction
The current direction is an MVP with a ranked set of short activities focused on language concepts and functional communication rather than object naming.

The app should:
- always allow touch as a fallback
- treat speech as optional, not mandatory
- keep answer choices very small when using voice input
- keep audio calm and supportive
- store progress and parent corrections locally

## Why This Direction Makes Sense
The strongest version of the idea is not `AI that understands everything he says`.
It is a constrained, parent-taught interpreter inside a simple learning app.

That makes the problem smaller and more realistic:
- the child answers one-word or two-word prompts
- the app only guesses among a few valid answers
- the parent corrects mistakes when needed
- the app learns from repeated confirmed examples

## MVP Shape
The current MVP shape is:

1. `Where Is It?`
2. `Daily Phrase Practice`
3. `Do What I Say`
4. `My Turn / Your Turn`
5. `Build The Sentence`
6. `Picture Questions`
7. `Movement Search`

These activities focus on concepts such as:
- location words
- functional phrases
- simple directions
- pronouns and possession
- basic question understanding

The newer [Ranked Implementation Plan](./ranked-implementation-plan.md) is the source of truth for build order. It keeps the same reusable route shell, but prioritizes `Where Is It?`, shared support controls, and functional phrase practice ahead of lower-value content.

## Audio Direction
Audio is part of the plan, but in a narrow way.

Use audio for:
- prompt playback
- target phrase modeling
- parent-recorded clips for names and key words
- optional child voice answers on simple prompts

Do not use audio for:
- open-ended conversation
- long spoken responses
- fully autonomous voice interaction

## Product Guardrails
To keep the project grounded, version 1 should remain:
- small
- local-first
- parent-guided
- visually simple
- optional in its use of speech input

The app should avoid:
- high-friction correction loops
- pretending to understand when confidence is low
- too many targets at once
- too much stimulation through sound or visuals

## Document Index

### Core Product Notes
- [Language Target List](./language-target-list.md)
- [Practical Activity Backlog](./app-activity-backlog.md)
- [Ranked Implementation Plan](./ranked-implementation-plan.md)
- [MVP Mini-Games](./mvp-mini-games.md)
- [MVP V1 Level Progression And Copy Sheet](./mvp-v1-level-progression-and-copy.md)
- [MVP V1 Copy Keys (JSON)](./mvp-v1-copy-keys.json)
- [Low-Fidelity Wireframes](./low-fidelity-wireframes.md)
- [Data Model And Learning Loop](./data-model-and-learning-loop.md)
- [Sources](./sources.md)

### Audio Notes
- [Audio Strategy](./audio-strategy.md)
- [Audio UX Spec](./audio-ux-spec.md)
- [Audio Technology Decision](./audio-technology-decision.md)
- [Audio Risks And Mitigations](./audio-risks-and-mitigations.md)

## Recommended Reading Order
If coming back to this later, read in this order:

1. [Project Summary](./project-summary.md)
2. [Language Target List](./language-target-list.md)
3. [Practical Activity Backlog](./app-activity-backlog.md)
4. [Ranked Implementation Plan](./ranked-implementation-plan.md)
5. [MVP Mini-Games](./mvp-mini-games.md)
6. [MVP V1 Level Progression And Copy Sheet](./mvp-v1-level-progression-and-copy.md)
7. [Low-Fidelity Wireframes](./low-fidelity-wireframes.md)
8. [Audio Strategy](./audio-strategy.md)
9. [Data Model And Learning Loop](./data-model-and-learning-loop.md)
10. [Sources](./sources.md)

## Current State
The product concept is now defined enough to support a technical design phase when ready.

What is already clear:
- the purpose of the app
- the initial scope
- the target concepts
- the screen flow
- the role of parent correction
- the role of audio playback and optional voice input

What is intentionally not decided yet:
- production-level speech recognition approach
