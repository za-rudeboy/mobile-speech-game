# MVP Implementation Plan

## What We're Building
A parent-guided speech therapy app with 3 mini-games, local data persistence, parent controls, and optional constrained speech recognition. Touch-first, speech-optional, low-frustration.

Built with Expo 54, React Native 0.81.5, TypeScript strict, Expo Router 6.

---

## Tech Stack Decisions

| Decision | Choice | Why |
|---|---|---|
| **Storage** | `expo-sqlite` (raw SQL, no ORM) | 7-entity relational model needs joins; works in Expo Go |
| **State** | `Zustand` (2 stores: useGameStore + useDataStore) | Game state threads through 4+ component levels; Context would be painful |
| **Navigation** | Stack-only (no tabs) | Tab bar breaks the focused game UX; games need full-screen immersion |
| **Dev workflow** | Expo Go for Waves 1-4, dev build at Wave 5 | Everything except speech recognition works in Expo Go |
| **Content** | TypeScript constants first, then DB | Hardcoded seed data until vertical slice is playable |
| **Visuals** | Emoji + colored View shapes | Unblocks everything; real art is post-MVP polish |
| **Audio** | `expo-speech` (TTS) then add `expo-audio` + `expo-speech-recognition` in Wave 5 | TTS needs zero permissions; speech recognition needs dev build |
| **Parent access** | Long-press 3s on Parent button | Zero setup friction; PIN is v1.1 |

## Packages to Install (by wave)

```
Wave 1: zustand
Wave 2: expo-speech
Wave 3: expo-sqlite
Wave 5: expo-speech-recognition, expo-audio
```

---

## What's Deferred (intentionally)

- Parent-recorded audio library
- Custom speech scoring algorithm (the `candidate_score` formula from data model doc)
- Drag interactions (tap-only for all games in v1)
- Prompt adaptation engine (random selection for now)
- Phase 2-4 language targets (ship Phase 1 only: `my`, `your`, `in`, `on`, `big`, `small`)
- comparison game removed from current product direction
- Real illustrations (emoji placeholders for v1)

---

## Hidden Requirements

These are things the product docs implicitly assume but never explicitly state. Each must be addressed during implementation.

1. **Visual assets** — Every game needs scenes (avatars, objects). Emoji placeholders solve this for v1.
2. **Seed data** — 18 prompt templates must exist before any game renders. No game works without content.
3. **Game state machine** — Branching flow (prompt -> touch/speech -> confidence check -> maybe confirm -> feedback) is never explicitly described as a system requirement, but every game depends on it.
4. **Prompt selection algorithm** — Who picks the 4 prompts per session? Answer: random from enabled targets, hardcoded count of 4.
5. **First-run setup** — No child profile exists on first launch. Auto-create a default profile in code.
6. **Parent mode access control** — How to prevent child from entering? Long-press (3 seconds) on Parent button.
7. **Mic permission denial** — Graceful fallback to touch-only mode. Never addressed in product docs.
8. **iOS silent mode** — TTS won't play unless `playsInSilentModeIOS: true` is configured in audio session.

---

## Navigation Structure

```
/ (Home - no tabs, full screen)
|-- /game/[gameId]/intro    -> Game Intro Card
|-- /game/[gameId]/play     -> Active Prompt (+ confirmation bottom sheet overlay)
|-- /game/[gameId]/feedback -> Reward/Feedback
|-- /parent                 -> Parent Mode root
|   |-- /parent/targets     -> Toggle targets on/off
|   |-- /parent/corrections -> Review speech corrections
|   |-- /parent/progress    -> Weekly stats + notes
```

Game state lives in Zustand, NOT in navigation params. Routes only receive `gameId` and `promptIndex`.

---

## 5-Wave Build Order

### Wave 1: Foundation

**Effort:** ~2 days, parallelizable (T1 and T2 have no dependencies on each other)

#### T1. Navigation Skeleton

**What:** Delete stock tabs template. Create Expo Router Stack layout with all routes. Wire placeholder screens (blank View + Text title only). No bottom tabs.

**Routes to create:**
- `/` (Home)
- `/game/[gameId]/intro`
- `/game/[gameId]/play`
- `/game/[gameId]/feedback`
- `/parent`
- `/parent/targets`
- `/parent/corrections`
- `/parent/progress`

**Depends on:** Nothing
**Blocks:** T3, T5

**QA:**
- `npx expo start` loads in Expo Go with no errors
- Navigating to each route shows its placeholder screen
- No TypeScript errors on `npm run lint`

#### T2. TypeScript Types + Seed Constants

**What:** Create TypeScript interfaces for all 7 entities. Create hardcoded prompt seed constants for My Turn / Your Turn (6 prompts). Use emoji as `visual_scene_key` values.

**Entities:**
1. ChildProfile
2. TargetConcept
3. PromptTemplate
4. PracticeSession
5. PromptAttempt
6. SpeechMappingExample
7. ParentObservation

**Files to create:**
- `types/index.ts` — all interfaces
- `data/seeds/prompts.ts` — 6 hardcoded PromptTemplate objects for Game 1

**Depends on:** Nothing
**Blocks:** T3, T6

**QA:**
- `npm run lint` passes with no TypeScript errors
- `data/seeds/prompts.ts` exports an array of 6 typed PromptTemplate objects

---

### Wave 2: First Playable Game

**Effort:** ~3-5 days. T3 is the critical path. T4 and T5 can be parallelized after T3 is done.

**Milestone: Vertical slice is playable. A 6-year-old can play a game.**

#### T3. My Turn / Your Turn Game Loop (Touch-Only)

**What:** Install Zustand. Create game store with state: `currentGame`, `prompts[]`, `currentPromptIndex`, `sessionResults[]`, `gamePhase` (idle/intro/playing/feedback/complete). Build all game screens with touch-only input. Game ends after 4 prompts and returns to Home.

**Screens:**
- `/game/[gameId]/intro` — game title, illustration description, Start button
- `/game/[gameId]/play` — prompt text, 2 large answer buttons, emoji scene display (no mic yet)
- `/game/[gameId]/feedback` — correct/incorrect indicator, target phrase model, Next button

**Store:** `store/useGameStore.ts`

**Visual approach:** Emoji for avatars and objects. Large tap targets in bottom half of screen.

**Depends on:** T1, T2
**Blocks:** T4, T5, T11, T12

**QA:**
- Launch in Expo Go
- Open My Turn / Your Turn from intro screen
- Complete 4 prompts by tapping answers
- Feedback screen appears after each prompt
- App returns to Home after 4th prompt
- Console log confirms 4 session results in Zustand store

#### T4. TTS Prompt Playback

**What:** Install `expo-speech`. On Active Prompt screen mount, call `Speech.speak()` with prompt's spoken text. Add a speaker button that replays the prompt. Configure audio session on app start for iOS silent mode.

**Depends on:** T3
**Blocks:** Nothing (enhancement layer)

**QA:**
- Play a game prompt with device volume up
- Prompt text is spoken aloud on screen load
- Speaker button replays it
- Audio plays with iOS silent switch ON

#### T5. Home Screen

**What:** Build Home screen with 3 large game cards. Game 1 fully enabled. Games 2 and 3 show "Coming Soon" (disabled, greyed). Parent button in top-right corner with long-press (3 seconds) to navigate to parent mode. Practice counter reads from Zustand session results.

**Depends on:** T1, T2
**Blocks:** Nothing

**QA:**
- Home screen renders without errors
- Tapping Game 1 Start navigates to game intro
- Games 2+3 cards are non-navigable
- Long-pressing Parent button for 3 seconds navigates to `/parent`

---

### Wave 3: Persistence + Parent Mode

**Effort:** ~3-4 days. T6 then T7 are sequential. T8, T9, T10 are parallel after T7.

#### T6. expo-sqlite Schema + First-Run Seeding

**What:** Install `expo-sqlite`. Create schema with 7 tables matching entity types. On first launch: seed 1 default ChildProfile, 20 TargetConcepts (Phase 1 status: `enabled`, Phase 2-4: `later`), 18 PromptTemplates (6 per game). Expose typed CRUD functions.

**Files to create:**
- `db/schema.sql` — CREATE TABLE statements
- `db/database.ts` — open DB, run migrations, seed data, expose CRUD

**Depends on:** T2, T3
**Blocks:** T7, T8, T9, T10

**QA:**
- After first launch, console logs "Database initialized"
- Query in dev: `SELECT COUNT(*) FROM target_concepts` returns 20
- `SELECT COUNT(*) FROM prompt_templates` returns 18

#### T7. Session + Attempt Persistence

**What:** On game session end (after 4 prompts), write PracticeSession row and 4 PromptAttempt rows to SQLite. Home screen practice counter reads from DB instead of in-memory Zustand.

**Depends on:** T6
**Blocks:** T9, T10

**QA:**
- Complete a game session
- `SELECT COUNT(*) FROM practice_sessions` returns 1
- `SELECT COUNT(*) FROM prompt_attempts` returns 4
- `was_correct_for_prompt` reflects actual answers

#### T8. Parent Targets Screen

**What:** `/parent/targets` — read TargetConcepts from DB grouped by game. Render each as a labeled checkbox row. Toggle updates `status` between `enabled` and `later`. Enabled targets control which prompts appear in games.

**Depends on:** T6
**Blocks:** Nothing

**QA:**
- Navigate to Parent > Targets
- Disable "my" target
- Start a game — verify no prompts using "my" target appear

#### T9. Parent Corrections Screen

**What:** `/parent/corrections` — read PromptAttempts where `was_parent_corrected = true`, grouped by raw speech text to final answer. Display as FlatList. Initially empty (populates in Wave 5).

**Depends on:** T7
**Blocks:** Nothing

**QA:**
- Screen renders without errors
- Empty state shows appropriate message
- Manually inserted test row appears correctly

#### T10. Parent Progress Screen

**What:** `/parent/progress` — aggregate stats from SQLite: prompts practiced this week, touch correct count, speech matched count (0 until Wave 5). Target status labels (new/practicing/improving/stable). Notes field for ParentObservation with timestamp.

**Depends on:** T7
**Blocks:** Nothing

**QA:**
- After 2 game sessions, shows "practiced this week: 8 prompts"
- Notes field saves text and persists after app restart

---

### Wave 4: Remaining Games

**Effort:** ~4-5 days, parallel with each other. Can overlap with Wave 3 tail (T8-T10).

#### T11. Where Is It? (Touch-Only)

**What:** Create 6 prompts for location targets (`in`, `on`, `under`, `next to`). Build game screens reusing shared infrastructure from T3. Screen types: (a) tap-choice with 4 location buttons, (b) tap-object with positioned emoji scenes. Enable on Home screen.

**Depends on:** T3, T5
**Blocks:** T13

**QA:**
- Navigate to Where Is It? from Home
- Complete 4-prompt session
- All prompts render without errors
- Touch answers work, session completes

#### T12. Daily Phrase Practice (Touch-Only)

**What:** Create 6 prompts for `help me`, `all done`, `I want ___`, and `my hand hurts`. Screen types: (a) listen and choose the helpful phrase, (b) use a short phrase in a familiar scene. Enable on Home screen.

**Depends on:** T3, T5
**Blocks:** T13

**QA:**
- Navigate to Daily Phrase Practice from Home
- Complete 4-prompt session
- Phrase choices render without errors
- Session completes, `npm run lint` passes

**Milestone: Full touch-only MVP. Top ranked activities playable. Parent mode functional.**

---

### Wave 5: Speech Layer

**Effort:** ~5-7 days, sequential chain. Requires switching from Expo Go to dev build.

#### T13. Dev Build Setup

**What:** Install `expo-speech-recognition` and `expo-audio`. Configure `app.json` plugins. Run `npx expo prebuild --clean` then `npx expo run:ios` and `npx expo run:android`.

**Depends on:** T11, T12
**Blocks:** T14

**QA:**
- Dev build compiles without errors on both platforms
- App launches from dev build

#### T14. Microphone Permission Flow

**What:** Create `useMicPermission()` hook. Request permission on first mic button tap. If denied: show toast, hide mic button for session (touch-only fallback). If granted: proceed to recognition. Persist permission state.

**Depends on:** T13
**Blocks:** T15

**QA:**
- Reset permissions, tap mic, system dialog appears
- Deny: mic button disappears, touch buttons remain
- Grant: mic enters listening state

#### T15. Speech Recognition + Confidence Logic

**What:** On mic tap: start recognition with `contextualStrings` set to prompt's `answer_options`. 2-3 second listening window. Compare transcript against options using string similarity. Thresholds: >0.75 auto-accept, 0.45-0.75 show confirmation, <0.45 return to idle.

**Depends on:** T14
**Blocks:** T16

**QA:**
- Say "my turn" clearly — auto-accept fires, feedback shows
- Say garbled sound — confirmation sheet appears
- Touch buttons never disappear during recognition

#### T16. Speech Confirmation Sheet

**What:** Bottom sheet modal (Reanimated slide-up). Shows "Did he mean:" + top 2 candidates as large buttons + "Try Again". Parent or child taps intended answer. Sets `was_parent_corrected: true`. "Try Again" dismisses and re-enables input.

**Depends on:** T15
**Blocks:** T17

**QA:**
- Sheet animates up from bottom
- Tapping option routes to feedback with `was_parent_corrected = true`
- "Try Again" dismisses and restores prompt state

#### T17. Speech Mapping Persistence

**What:** After confirmation resolves: write SpeechMappingExample to SQLite. On subsequent recognitions: query stored mappings, boost confidence for prior confirmed matches (+0.2). Parent Corrections screen (T9) now shows real data.

**Depends on:** T16, T7
**Blocks:** Nothing (MVP complete)

**QA:**
- Say "mah tuhn", confirm as "my turn" — row appears in Parent Corrections
- Say "mah tuhn" again in next session — auto-accepts without confirmation (boosted score)

**Milestone: Full MVP with optional speech.**

---

## Dependency Graph

```
Wave 1 (parallel):
|-- T1: Navigation skeleton
|-- T2: Types + seed data

Wave 2 (after Wave 1):
|-- T3: Game 1 loop (needs T1+T2) [CRITICAL PATH]
|   |-- T4: TTS (needs T3)
|-- T5: Home screen (needs T1+T2, parallel with T3)

Wave 3 (after Wave 2):
|-- T6: SQLite schema (needs T2+T3)
|   |-- T7: Persistence (needs T6)
|       |-- T8: Parent Targets (parallel after T6)
|       |-- T9: Parent Corrections (parallel after T7)
|       |-- T10: Parent Progress (parallel after T7)

Wave 4 (after Wave 2, parallel with Wave 3 tail):
|-- T11: Where Is It?
|-- T12: Daily Phrase Practice

Wave 5 (after Wave 4, sequential):
T13 -> T14 -> T15 -> T16 -> T17

Critical Path: T1 -> T3 -> T4 -> [T11+T12] -> T13 -> T15 -> T16 -> T17
```

---

## AI Failure Points to Guard Against

These are the specific places where implementation is most likely to go wrong:

1. **Building the database before any UI renders.** Hardcoded constants until Wave 3. No database writes until Game 1 works end-to-end.
2. **Building all 3 games simultaneously.** Game 1 must be fully playable before starting Games 2 or 3. Extract shared patterns only after Game 1 proves the flow.
3. **Wiring speech recognition before touch flow works.** Speech is Wave 5. The entire touch-only flow must be production-ready first.
4. **Premature animation polish.** Feedback = color flash + TTS for v1. No Reanimated spring physics or particle effects.
5. **Over-engineering parent mode.** Three simple FlatList screens. No charts, no filtering, no export.
6. **Passing objects through Expo Router params.** Expo Router params are strings only. Game state lives in Zustand. Routes only receive `gameId`.
7. **Forgetting to seed prompt content.** Games are empty without seed data. The seed file is a non-negotiable gate before any game screen work.

---

## Post-MVP Roadmap (not in scope for this plan)

- Parent-recorded audio library (record + manage personal clips)
- Custom speech scoring algorithm with prior mapping bonuses
- Drag interactions for placement prompts
- Prompt adaptation engine (adjust selection based on success rates)
- Phase 2-4 language targets
- "More" (counted groups) prompt type
- Real illustrations replacing emoji
- Parent PIN / access control
- Reanimated animations for feedback and transitions
- Cross-device backup / export

---

## Success Criteria

The MVP is successful if it helps create:
- Short enjoyable practice sessions
- Less frustration when the app misunderstands him
- Better comprehension of a small set of concepts
- Carryover into daily routines and play
