# Data Model and Parent-Taught Learning Loop

## Purpose
This document defines the minimum data the app should store to support:

- concept practice
- parent-corrected speech interpretation
- simple progress tracking
- future personalization

The goal is not to build a general speech AI system. The goal is to help the app gradually learn one child's patterns in a narrow set of activities.

## System Goals
The data model should let the app do these things:

1. know which targets are active
2. present prompts tied to those targets
3. accept touch or speech input
4. ask the parent to confirm uncertain speech
5. save corrected examples
6. improve future ranking of likely meanings
7. show simple progress over time

## Core Entities

### 1. Child Profile
Represents the current learner.

Suggested fields:

- `child_id`
- `display_name`
- `birth_year`
- `notes`
- `preferred_rewards`
- `created_at`
- `updated_at`

Notes:
- keep this minimal
- do not store unnecessary personal detail

### 2. Target Concept
Represents a language target such as `my`, `under`, or `bigger`.

Suggested fields:

- `target_id`
- `slug`
- `label`
- `category` such as `pronoun`, `location`, `comparison`
- `game_id`
- `status` such as `enabled`, `later`, `mastered`
- `difficulty_order`
- `prompt_examples`
- `created_at`
- `updated_at`

Example:
```json
{
  "target_id": "target_under",
  "slug": "under",
  "label": "under",
  "category": "location",
  "game_id": "where_is_it",
  "status": "enabled",
  "difficulty_order": 8
}
```

### 3. Prompt Template
Represents one interaction pattern used in a mini-game.

Suggested fields:

- `prompt_id`
- `game_id`
- `target_ids`
- `prompt_type` such as `choose_between_two`, `drag_to_place`, `tap_object`
- `spoken_text`
- `visual_scene_key`
- `answer_options`
- `correct_answer`
- `enabled`

Example:
```json
{
  "prompt_id": "prompt_turn_01",
  "game_id": "my_turn_your_turn",
  "target_ids": ["target_my", "target_your"],
  "prompt_type": "choose_between_two",
  "spoken_text": "Whose turn?",
  "visual_scene_key": "ball_between_people",
  "answer_options": ["my turn", "your turn"],
  "correct_answer": "my turn"
}
```

### 4. Practice Session
Represents one short session in the app.

Suggested fields:

- `session_id`
- `child_id`
- `game_id`
- `started_at`
- `ended_at`
- `prompt_count`
- `notes`

### 5. Prompt Attempt
Represents a single child response to a single prompt.

Suggested fields:

- `attempt_id`
- `session_id`
- `prompt_id`
- `target_ids`
- `input_mode` such as `touch` or `speech`
- `raw_speech_text` if speech is used
- `audio_clip_path` if saved locally
- `model_top_guess`
- `model_second_guess`
- `model_confidence`
- `final_interpreted_answer`
- `was_parent_corrected`
- `was_correct_for_prompt`
- `response_time_ms`
- `created_at`

Example:
```json
{
  "attempt_id": "attempt_20260307_001",
  "session_id": "session_20260307_a",
  "prompt_id": "prompt_turn_01",
  "target_ids": ["target_my", "target_your"],
  "input_mode": "speech",
  "raw_speech_text": "mah tuhn",
  "audio_clip_path": "audio/2026/03/07/a1.m4a",
  "model_top_guess": "my turn",
  "model_second_guess": "your turn",
  "model_confidence": 0.61,
  "final_interpreted_answer": "my turn",
  "was_parent_corrected": false,
  "was_correct_for_prompt": true
}
```

### 6. Speech Mapping Example
Represents a parent-confirmed relationship between a speech attempt and its intended meaning.

Suggested fields:

- `mapping_id`
- `child_id`
- `target_id` or phrase label
- `raw_speech_text`
- `audio_clip_path`
- `context_tag` such as `turns`, `location`, `comparison`
- `confirmed_by_parent`
- `times_seen`
- `last_seen_at`

Example:
```json
{
  "mapping_id": "map_014",
  "child_id": "child_01",
  "target_id": "target_next_to",
  "raw_speech_text": "neh toh",
  "audio_clip_path": "audio/2026/03/08/a4.m4a",
  "context_tag": "location",
  "confirmed_by_parent": true,
  "times_seen": 3,
  "last_seen_at": "2026-03-08T16:40:12Z"
}
```

### 7. Parent Observation
Represents real-world carryover notes outside the app.

Suggested fields:

- `observation_id`
- `child_id`
- `target_id`
- `note_text`
- `observed_at`

Example:
- `Used "my turn" during Lego without prompting`

## Minimum Storage Strategy
For MVP, store data locally on device.

Store locally:
- child profile
- active targets
- prompt templates
- attempts
- speech mappings
- parent observations

Avoid in MVP:
- cloud account system
- remote audio storage
- cross-device sync
- large analytics pipeline

This keeps privacy risk lower and reduces system complexity.

## Parent-Taught Learning Loop
This is the core logic of the app.

### Step 1: Present a Narrow Prompt
The app presents one prompt with a very small answer set.

Example:
- `Whose turn?`
- possible meanings: `my turn`, `your turn`

### Step 2: Accept Input
The child responds by:
- tapping
- speaking
- dragging in some prompt types

### Step 3: Generate a Small Guess Set
If speech is used, the app should not attempt open-ended interpretation.
It should rank only against the currently valid options for that prompt.

Example:
- valid answers on this screen are only `my turn` and `your turn`
- the recognizer returns the top 2 guesses with confidence

### Step 4: Decide Whether To Auto-Accept
Use a simple confidence rule.

Suggested MVP rule:
- if confidence is high and the top guess is clearly ahead, accept it
- otherwise show a confirmation sheet

Example:
- `0.92 my turn` and `0.18 your turn` -> accept
- `0.57 on` and `0.49 under` -> ask parent

### Step 5: Parent Confirms or Corrects
If the app is unsure, show:
- guess A
- guess B
- try again

The parent selects the intended meaning.
That final choice becomes the stored interpretation.

### Step 6: Save the Corrected Example
Save:
- audio clip if available
- raw transcript or phonetic approximation
- final confirmed meaning
- context tag
- timestamp

This becomes a new example that can influence future ranking.

### Step 7: Update Simple Per-Target Statistics
Update stats such as:
- times practiced
- touch correct count
- speech accepted count
- speech corrected count
- recent success rate

### Step 8: Adapt Future Prompts Lightly
Use the saved history to make the app a bit smarter.

Examples:
- show `my` and `your` more often if still unstable
- reduce `big` if consistently easy
- prefer prompts where speech confusion can be clarified cleanly

## Interpretation Strategy For MVP
Do not train a complex custom model in version 1.
Use a small ranking layer.

Possible MVP strategy:
1. get speech-to-text or phonetic approximation from device
2. compare result only against current prompt options
3. boost candidates that match prior parent-confirmed mappings
4. use context to break ties

Pseudo-logic:
```text
candidate_score =
  base_match_score
  + prior_confirmed_mapping_bonus
  + context_bonus
  - confusion_penalty
```

Example:
- child says `neh toh`
- prompt options are `under` and `next to`
- previous confirmed mappings show `neh toh` often means `next to`
- current context is location game
- final ranking prefers `next to`

## Suggested Stats Per Target
Track only a few meaningful numbers.

- `times_presented`
- `touch_correct`
- `speech_attempts`
- `speech_auto_accepted`
- `speech_parent_corrected`
- `last_practiced_at`
- `carryover_notes_count`
- `status`

Derived labels can be simple:
- `new`
- `practicing`
- `improving`
- `stable`
- `later`

## Example JSON Shape
```json
{
  "child_profile": {
    "child_id": "child_01",
    "display_name": "Kiddo"
  },
  "targets": [
    { "target_id": "target_my", "label": "my", "status": "enabled" },
    { "target_id": "target_under", "label": "under", "status": "enabled" }
  ],
  "sessions": [
    { "session_id": "session_01", "game_id": "where_is_it" }
  ],
  "attempts": [
    {
      "attempt_id": "attempt_01",
      "prompt_id": "prompt_where_01",
      "input_mode": "speech",
      "model_top_guess": "under",
      "model_second_guess": "on",
      "final_interpreted_answer": "under",
      "was_parent_corrected": true
    }
  ]
}
```

## Privacy Guardrails
For this kind of app, privacy should be conservative.

Recommended MVP defaults:
- local-only storage
- parent controls audio retention
- ability to delete speech samples
- no sharing by default
- no remote model training on child audio

## Scope Guardrails
Version 1 does not need:
- user accounts
- therapist portal
- cloud dashboards
- cross-child training
- generalized autism speech recognition
- long-term predictive analytics

## What Good Looks Like
The learning loop is working if:
- the parent spends less time correcting over time
- the app gets better at ranking likely meanings within each game
- progress reflects actual daily-life gains, not just in-app taps
- targets can be added or removed without changing the whole system
