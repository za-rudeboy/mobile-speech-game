# Ranked Implementation Plan

## Purpose
This document turns the practical activity backlog into a ranked build plan for the actual app screens and data model.

It is intended to answer three questions:
- what should be built first
- which screens each activity needs
- what data must be stored to support those screens

## Planning Principles
- build the highest-value activities for Caelum first
- prefer reusable screen patterns over one-off screens
- keep touch-first interaction on every activity
- treat `help`, `break`, and `show me again` as shared system support, not a standalone game
- extend the current data model carefully instead of inventing a large new schema

## Main Decision
Keep the current route shape and treat each backlog item as an activity module inside it.

Use:
- `/`
- `/game/[gameId]/intro`
- `/game/[gameId]/play`
- `/game/[gameId]/feedback`
- `/parent`
- `/parent/targets`
- `/parent/corrections`
- `/parent/progress`

This avoids a routing rewrite. The app can still call them `games` in code while the product language calls them `activities`.

## Shared Screens To Build First
These are the reusable screens and overlays that every ranked activity depends on.

### 1. Home Screen
Purpose:
- show activity cards in ranked order
- show which activities are ready now versus later
- surface simple practice stats

Needs:
- activity card with title, one-line purpose, and status
- parent access button
- optional short daily streak or prompt count

### 2. Activity Intro Screen
Purpose:
- explain the activity in one short sentence
- give a visual preview
- start the session

Needs:
- title
- simple illustration or emoji scene
- `start` button
- optional parent hint

### 3. Activity Play Screen
Purpose:
- run the actual prompt loop

Needs:
- one visual scene
- one short spoken prompt
- touch response controls
- optional microphone button
- replay prompt button
- support controls for `help`, `break`, and `show me again`

### 4. Support Overlay
Purpose:
- handle breakdowns without forcing failure

Needs:
- `help`
- `break`
- `show me again`
- `try again`
- a short modeled scaffold or movement break response

### 5. Feedback Screen
Purpose:
- confirm the correct answer
- replay the target phrase
- continue to the next prompt

Needs:
- correct answer highlight
- short spoken model
- `next` button

### 6. Parent Targets Screen
Purpose:
- enable or delay targets and activities

Needs:
- group targets by activity
- toggle status
- show current difficulty order

### 7. Parent Progress Screen
Purpose:
- show what is improving and where support is still needed

Needs:
- prompts practiced
- success by touch versus speech
- support usage
- concept stability over time

### 8. Parent Corrections Screen
Purpose:
- review speech interpretation and support breakdown patterns

Needs:
- corrected attempts
- repeated misunderstood phrases
- common support actions used

## Ranked Build Order

### Rank 1. Shared Shell + Support System
Build first because every other activity depends on it.

Scope:
- Home screen
- Intro screen
- Play screen shell
- Feedback screen
- Support overlay
- session state and persistence

Why first:
- `help`, `break`, and `show me again` are central to Caelum's profile
- this creates the reusable app skeleton
- later activities can ship as content plus play variants

Data model impact:
- keep current `PracticeSession` and `PromptAttempt`
- add support-tracking fields to `PromptAttempt`
- add an activity ordering field to targets or prompts

Recommended fields:
- `PromptAttempt.support_action_used`
- `PromptAttempt.support_action_count`
- `PromptAttempt.visual_support_level`
- `PromptAttempt.model_replay_count`
- `PromptAttempt.break_taken`

### Rank 2. Where Is It?
Build first among activities because it is concrete, highly visual, and already aligns with the current MVP.

Screens needed:
- intro
- play variant: tap choice or tap object
- feedback

Primary goals:
- `in`
- `on`
- `under`
- `next to`
- `where`

Why this rank:
- strong fit for Caelum's current needs
- low language load
- easy to understand with touch and visual support
- directly useful for receptive and expressive language

Data model needs:
- `PromptTemplate.prompt_type` values like `tap_location_choice` and `tap_scene_object`
- `TargetConcept.category = location`
- scene keys for simple placement scenes

### Rank 3. Daily Phrase Practice
Build second because it addresses intelligibility and functional communication without needing exact phoneme targeting.

Screens needed:
- intro
- play variant: listen, repeat, choose, or tap to request
- feedback

Primary goals:
- `I want ___`
- `help me`
- `all done`
- `my hand hurts`

Why this rank:
- high daily-life value
- supports communication repair and intelligibility together
- works well with parent-recorded or TTS phrase models

Data model needs:
- support phrase-level targets in addition to single concepts
- store phrase families or sentence frames

Recommended fields:
- `TargetConcept.category = functional_phrase`
- `PromptTemplate.model_phrase`
- `PromptTemplate.frame_slots`

### Rank 4. Do What I Say
Build third because novel instructions are a core weakness and this activity can reuse the location scene system.

Screens needed:
- intro
- play variant: action-following scene
- feedback

Primary goals:
- novel 1-step directions
- familiar 2-step directions
- action words with concrete objects

Why this rank:
- directly targets an identified daily challenge
- can build on `Where Is It?` scene logic
- strengthens receptive language with visual scaffolds

Data model needs:
- prompt support for action sequences
- store whether demonstration was shown before success

Recommended fields:
- `PromptTemplate.prompt_type = follow_direction`
- `PromptTemplate.demo_scene_key`
- `PromptAttempt.demo_was_shown`

### Rank 5. Build The Sentence
Build after the first receptive activities because it depends on stable visual understanding and sentence frames.

Screens needed:
- intro
- play variant: sentence builder with tiles
- feedback

Primary goals:
- `I want ___`
- `I need help`
- `It is next to the ___`
- `My ___ hurts`

Why this rank:
- expands 2 to 3 word utterances into more consistent functional sentences
- complements Daily Phrase Practice
- still keeps output constrained and predictable

Data model needs:
- support sentence frame prompts with slots
- store chosen tile order

Recommended fields:
- `PromptTemplate.prompt_type = build_sentence`
- `PromptTemplate.frame_slots`
- `PromptAttempt.selected_tokens_json`

### Rank 6. Picture Questions
Build next because it increases comprehension flexibility but usually requires stronger attention and broader language load.

Screens needed:
- intro
- play variant: picture question
- feedback

Primary goals:
- `what`
- `where`
- `who`

Why this rank:
- important, but slightly more language-heavy
- easier once the child already understands the main scene and answer patterns

Data model needs:
- question prompts with either choice mode or open constrained answer mode

Recommended fields:
- `PromptTemplate.prompt_type = picture_question`
- `PromptTemplate.question_type`

### Rank 7. Movement Search
Build last as a distinct activity because movement should already appear earlier as a support pattern.

Screens needed:
- intro
- play variant: search and tap or search and act
- feedback

Primary goals:
- sustain participation
- generalize known concepts with movement
- reduce fatigue in longer sessions

Why this rank:
- movement is important immediately, but can ship earlier as part of support flows
- it becomes a stronger standalone activity after the other content exists

Data model needs:
- mostly reuse existing prompt and attempt structures
- only add a movement flag if analytics are useful

Recommended fields:
- `PromptTemplate.requires_movement`

## Recommended Screen Variants
Do not create one screen per activity. Create one shared play route with a small number of render variants.

Recommended variants:
- `choice_buttons`
- `tap_scene_object`
- `follow_direction`
- `repeat_and_use`
- `build_sentence`
- `picture_question`

This keeps the route structure stable while letting the content model drive the UI.

## Recommended Data Model Changes
Keep the existing 7-entity model, but extend it so it can support the ranked backlog.

### Keep As-Is
- `ChildProfile`
- `PracticeSession`
- `SpeechMappingExample`
- `ParentObservation`

### Extend
#### TargetConcept
Add:
- `activity_id`
- `teaching_priority`
- `is_functional_phrase`

#### PromptTemplate
Add:
- `activity_id`
- `model_phrase`
- `frame_slots`
- `question_type`
- `demo_scene_key`
- `requires_movement`

#### PromptAttempt
Add:
- `support_action_used`
- `support_action_count`
- `visual_support_level`
- `model_replay_count`
- `break_taken`
- `demo_was_shown`
- `selected_tokens_json`

## Suggested Seed Content Order
Seed content in the same order as the ranked build plan.

1. Shared support actions and core UI strings
2. `Where Is It?` prompts
3. `Daily Phrase Practice` prompts
4. `Do What I Say` prompts
5. `Build The Sentence` prompts
6. `Picture Questions` prompts
7. `Movement Search` prompts

## Delivery Phases

### Phase A
- shared shell
- support overlay
- `Where Is It?`

### Phase B
- `Daily Phrase Practice`
- `Do What I Say`

### Phase C
- `Build The Sentence`
- `Picture Questions`

### Phase D
- `Movement Search`
- progress refinements
- speech interpretation refinements

## What This Changes From The Older MVP Plan
- `Repair And Regulation Buttons` are no longer treated like separate content. They are a shared system feature.
- `Where Is It?` becomes the first activity to fully implement.
- `Daily Phrase Practice` moves ahead of comparison games because it better matches Caelum's current functional needs.
- The app should be structured around reusable play variants, not a growing list of bespoke screen implementations.
