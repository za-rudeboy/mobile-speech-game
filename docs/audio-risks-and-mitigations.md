# Audio Risks And Mitigations

## Purpose
This document lists the main ways audio could frustrate or overload the child, and how the product should respond. The goal is to keep voice features helpful rather than disruptive.

## Risk 1: The App Misunderstands Him Too Often
### Why it matters
Frequent wrong guesses can make the experience feel unfair or exhausting.

### Signs
- he stops using the mic
- he gets upset after voice attempts
- he starts tapping only, even when he wanted to speak

### Mitigations
- keep answer choices very small
- always show touch fallback
- show confirmation when confidence is low
- never act overly certain when confidence is weak
- prioritize easier targets first

## Risk 2: Speech Feels Mandatory
### Why it matters
If the mic feels like a test, the app may create pressure instead of practice.

### Signs
- hesitates when the mic appears
- avoids the task entirely
- waits for adult rescue before responding

### Mitigations
- keep touch and drag input visible at all times
- make the mic visually secondary
- allow full touch-only play mode
- avoid language like `say it now`

## Risk 3: Audio Creates Sensory Overload
### Why it matters
Too much sound, repetition, or busy feedback may dysregulate him.

### Signs
- covers ears
- gets agitated after repeated sounds
- leaves the app quickly

### Mitigations
- no background music
- brief and calm feedback audio
- replay only when needed
- settings to mute effects or disable autoplay
- consistent volume behavior

## Risk 4: Wrong Pronunciation Models
### Why it matters
If the app pronounces names or key phrases oddly, it reduces trust and may teach the wrong model.

### Signs
- parent notices incorrect pronunciation
- child ignores the prompt or looks confused

### Mitigations
- prefer recorded parent clips for names and personal words
- use TTS only as fallback
- allow recordings to be replaced easily

## Risk 5: Similar Words Get Confused
### Why it matters
Some targets are acoustically or conceptually easy to mix up.

Examples:
- `on` vs `under`
- `my` vs `mine`
- `big` vs `bigger`

### Signs
- same pair keeps showing up in corrections
- confidence scores remain low on specific targets

### Mitigations
- start with more distinct pairs
- avoid similar targets in the same early session
- use stronger visual contrast
- delay harder target pairs until simpler ones stabilize

## Risk 6: Noisy Environments Break Recognition
### Why it matters
Household noise can make speech input unreliable even if the core design is good.

### Signs
- recognition quality changes dramatically by room or time of day
- parent corrections spike during noisy play

### Mitigations
- recommend short, quiet practice sessions
- make touch fallback immediate
- use short listening windows
- let the parent replay or ignore bad attempts

## Risk 7: Parent Correction Becomes Too Much Work
### Why it matters
If the parent has to fix everything, the feature becomes a burden.

### Signs
- confirmation sheet appears constantly
- parent avoids speech mode altogether
- sessions become admin-heavy

### Mitigations
- auto-accept only high-confidence matches
- keep speech optional
- store corrected mappings so repeat corrections decrease over time
- show only top 2 guesses, not long candidate lists

## Risk 8: The Child Learns the App, Not the Concept
### Why it matters
He may memorize app patterns without understanding the language in real life.

### Signs
- performs well in-app but not during daily routines
- correct answers seem tied to one picture layout only

### Mitigations
- vary visual examples within the same concept
- keep parent observations in progress notes
- judge success by carryover outside the app
- reuse targets during real-life play and routines

## Risk 9: Playback Becomes Repetitive Or Annoying
### Why it matters
Even correct prompts can become irritating if overused.

### Signs
- ignores prompt audio
- taps through too quickly
- seems irritated by repeated voice playback

### Mitigations
- no looping prompts
- replay on demand
- short wording
- skip intro audio for familiar games

## Risk 10: Voice Input Triggers Performance Anxiety
### Why it matters
If he feels watched or corrected, speech use may decrease.

### Signs
- whispers or refuses when the mic appears
- looks to the parent for approval first
- uses speech less over time

### Mitigations
- present voice as one option, not the goal
- reward communication success, not pronunciation quality
- avoid visible failure states
- let the app move on quickly after touch responses

## Risk 11: Saved Audio Raises Privacy Concerns
### Why it matters
Child speech clips are sensitive.

### Signs
- discomfort about keeping recordings
- uncertainty about who can access them

### Mitigations
- local-only storage by default
- allow deleting saved clips
- let parent disable recording retention
- no remote sharing by default

## Risk 12: The Product Grows Too Complex Too Fast
### Why it matters
Audio features can multiply quickly and derail the MVP.

### Signs
- too many audio settings
- too many recording categories
- too many edge cases before basic play works

### Mitigations
- support a small recording library first
- keep only 3 mini-games in v1
- use speech only on narrow prompt types
- delay advanced voice features

## Good Friction Vs Bad Friction
Good friction:
- quick confirmation between 2 likely answers
- optional replay button
- simple parent review of saved clips

Bad friction:
- repeated failed recognition loops
- long voice instructions
- forcing speech before touch is allowed
- loud or distracting feedback

## Product Rule
When audio creates uncertainty, the app should reduce demand, not increase it.

That means:
- offer touch
- shorten the prompt
- ask for simple confirmation
- move on without drama

## What Success Looks Like
Audio is working well when:
- he participates willingly
- you do not feel trapped in constant corrections
- speech attempts are encouraged but not pressured
- recognition helps enough to be worth having
- daily-life language use improves outside the app
