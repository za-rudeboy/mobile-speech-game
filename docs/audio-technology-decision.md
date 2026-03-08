# Audio Technology Decision

## Purpose
This document explains which audio modes are worth using in the MVP and why. It is a product decision document, not a coding plan.

## Decision Summary
For the MVP, audio should be split into three layers:

1. recorded audio clips for personal words and phrase models
2. text-to-speech for generic fallback prompts
3. constrained speech recognition for short child answers

This mixed approach is better than choosing only one method.

## Option 1: Recorded Audio Clips
### Best for
- names
- family words
- favorite objects
- target phrase models
- praise phrases

### Strengths
- pronunciation is exactly how you want it
- the voice can be familiar and reassuring
- recordings can reflect your family's natural style
- works well even before any speech recognition exists

### Weaknesses
- requires manual recording effort
- may need rerecording as prompts change
- can become harder to manage if the content library grows too much

### Product decision
Use recorded clips as the preferred source for high-value personal language.

## Option 2: Text-to-Speech
### Best for
- temporary prompts
- generic instructions
- early prototyping
- fallback when no recording exists

### Strengths
- fast to generate
- easy to change
- no recording session needed

### Weaknesses
- names may be pronounced wrong
- tone can feel less personal
- some voices sound unnatural or overly robotic

### Product decision
Use TTS as a fallback, not the primary voice for key child-facing words.

## Option 3: Full Open-Ended Speech Recognition
### Best for
- not the MVP

### Strengths
- sounds appealing on paper

### Weaknesses
- too error-prone for this use case
- fragile with speech delays or atypical pronunciation
- creates frustration if the app acts certain when it is wrong
- much harder to design well

### Product decision
Do not rely on open-ended recognition in version 1.

## Option 4: Constrained Speech Recognition
This means the app only tries to identify a spoken answer from a small known list.

Example:
- prompt asks `Whose turn?`
- valid answers are only `my turn` and `your turn`

### Strengths
- much more realistic than open-ended recognition
- supports participation without requiring perfect speech
- works well with parent correction
- pairs naturally with your interpreter-layer idea

### Weaknesses
- still won’t be perfect
- requires careful prompt design
- depends on keeping answer sets small

### Product decision
This should be the speech-input approach for the MVP.

## Decision Matrix

| Need | Best choice |
|---|---|
| exact pronunciation of names | recorded audio |
| quick generic prompt | TTS |
| child answers with one or two words | constrained recognition |
| open conversation | delay |
| progress review of speech attempts | recorded child clips |

## Why a Mixed Approach Wins
If you choose only recorded audio:
- playback is strong
- child participation by voice is missing

If you choose only TTS:
- setup is easy
- personal pronunciation quality is weaker

If you choose only recognition:
- input is interesting
- output quality and control are weaker
- risk goes up fast

A mixed approach gives:
- high control where pronunciation matters
- speed where flexibility matters
- voice input only where it is realistically supportable

## MVP Decision Rules
Use recorded audio when:
- the word is personal
- correct pronunciation matters a lot
- it will be heard often

Use TTS when:
- the phrase is generic
- the prompt may change frequently
- you need a temporary fallback

Use speech recognition when:
- there are only 2 to 4 likely answers
- the child can also answer by touch
- parent confirmation is available if confidence is low

Do not use speech recognition when:
- the answer could be anything
- the utterance is long
- the task is emotionally sensitive or likely to frustrate him

## Library Direction
Based on current docs and libraries, the most likely future stack would be:
- `expo-audio` for recording and playback
- `expo-speech` for TTS fallback
- `expo-speech-recognition` for short-answer recognition

Why this direction looks promising:
- Expo audio supports recording and playback in a mobile-friendly flow
- Expo speech provides a simple TTS fallback
- Expo speech recognition supports on-device recognition features and contextual hints that match the constrained-answer approach

Alternative if needed:
- `@react-native-voice/voice` as a fallback recognition library

## Product Risks In This Decision
Even the preferred approach has limits:
- constrained recognition may still misclassify similar targets like `on` and `under`
- too much TTS can make the app feel generic
- too many recordings can become a content-management problem

That is why the MVP should stay small and the target list should stay narrow.

## Final Recommendation
For version 1:
- yes to parent-recorded playback
- yes to optional speech answers on narrow prompts
- yes to icon/tap fallback on every prompt
- yes to parent confirmation when the app is unsure
- no to open-ended AI voice interaction
