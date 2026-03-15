# MVP V1 Level Progression And Copy

## TL;DR
> **Summary**: Expand the current touch-only MVP into a rule-driven V1 progression system that uses level-tagged prompt content, tokenized copy, and bounded parent-facing progress visibility without introducing any audio or speech-input work.
> **Deliverables**:
> - Game-level progression engine with end-of-session promotion/demotion rules
> - Canonical V1 copy integration with `child_name` and `parent_label` token substitution
> - Rewritten level-tagged prompt seeds and runtime selection logic for 6-10 prompt sessions
> - Parent progress surfaces that expose current level, recent accuracy, and enabled concepts
> **Effort**: Large
> **Parallel**: YES - 2 waves
> **Critical Path**: 1 -> 4 -> 5 -> 6

## Context
### Original Request
Expand the currently built MVP using `docs/project-summary.md`, `docs/mvp-v1-level-progression-and-copy.md`, and `docs/mvp-v1-copy-keys.json`, increasing difficulty slightly while keeping the app touch-only for now and leaving audio for a later phase.

### Interview Summary
- Build the full progression engine, not just a content refresh.
- Keep verification as tests-after with existing repo constraints: `npm run lint` plus agent-executed runtime QA; do not add a new test framework in this phase.
- Tokenize copy now using the `child_name` and `parent_label` placeholders from `docs/mvp-v1-copy-keys.json`.
- Keep interaction touch-first and low-friction; when the spec offers a choice between drag and tap, prefer tap-target interactions for this phase.

### Metis Review (gaps addressed)
- Lock progression to the game level, because the level definitions in `docs/mvp-v1-level-progression-and-copy.md` are written per game rather than per target.
- Add explicit migration work before any progression logic; the current SQLite setup in `db/database.ts` uses `CREATE TABLE IF NOT EXISTS` only and cannot evolve existing installs safely.
- Fix current data-integrity issues in `store/game-store.ts` before progression depends on attempt history: unstable attempt IDs, session IDs assigned too late, and non-transactional attempt saves.
- Prevent scope creep by excluding settings/profile screens, drag interactions, fast add-ons, automated speech/correction work, and new test infrastructure.

## Work Objectives
### Core Objective
Ship a decision-complete V1 implementation path that upgrades the current seed-driven touch MVP into a progression-based system with canonical copy, predictable difficulty growth, and parent-visible status while preserving the app's local-first, low-frustration character.

### Deliverables
- SQLite schema and data-layer updates that support game-level progression, recent performance tracking, and migration of existing installs.
- Canonical V1 content definitions derived from `docs/mvp-v1-level-progression-and-copy.md` and `docs/mvp-v1-copy-keys.json`.
- Store/runtime logic that builds 6-10 prompt sessions using the 70/30 mastered/new mix and applies end-of-session level changes.
- Touch-only game UI updates for 2-, 3-, and 4-choice rounds plus tap-target action prompts.
- Parent mode updates showing enabled concepts, current game level, and recent performance summaries.

### Definition of Done (verifiable conditions with commands)
- `npm run lint` completes successfully.
- `grep` over `app/`, `data/`, `db/`, and `store/` finds no hardcoded gameplay copy literals that should now come from the canonical V1 content module, except for allowed navigation labels such as `Parent Mode`, `Targets`, `Corrections`, and `Progress`.
- `grep` over app code finds no rendered `{child_name}` or `{parent_label}` placeholders.
- Expo web smoke QA confirms each game starts, shows the expected number of answer choices for the selected level, and advances through a session longer than the old fixed 4-prompt flow.
- Parent mode shows current level and recent performance for each game without exposing any audio/speech controls.

### Must Have
- Game progression is persisted per `child_id + game_id` in SQLite.
- Level advancement happens only at session end after `3 correct in a row` within the current session.
- Level regression happens only at session end when the last 5 prompts in the current session are below `60%` accuracy.
- Session composition targets 6 prompts by default, clamps to the available pool, and stays within the documented `6 to 10` range whenever sufficient prompts exist.
- The `70% mastered / 30% new` mix is implemented by level band: lower completed levels are the mastered pool; the current level is the new/challenging pool.
- Prompt seeds are explicitly tagged with a `difficulty_level` and a stable `prompt_group` so runtime selection never has to guess how many answer choices to display.
- Touch-only action prompts use tap targets, not drag-and-drop, for this phase.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No audio playback, speech recognition, speech confirmation sheets, or corrections-flow changes.
- No settings/profile screen for editing child or parent labels.
- No automated test framework, CI workflow, or `__tests__` setup.
- No drag interactions, animations for level-up celebrations, charts/graphs, or fast add-on content (`help me`, speed rounds, two-step directions, repair phrases).
- No runtime slicing of answer options from a larger superset; each playable prompt seed must already encode the correct answer count for its level.
- No automated promotion of `target_concepts.status` to `mastered`; target toggles remain parent-controlled in this phase.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after with existing repo tooling only; use `npm run lint` plus agent-executed runtime QA on Expo web.
- QA policy: Every task includes a happy-path and failure/edge-path scenario.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. Extract shared dependencies into Wave 1 so Wave 2 can execute in parallel.

Wave 1: schema/data model, canonical copy/content source, persistence integrity fixes, seed rewrite.
Wave 2: progression engine, gameplay UI/runtime updates, feedback copy flow, parent progress visibility.

### Dependency Matrix (full, all tasks)
| Task | Depends On | Why |
| --- | --- | --- |
| 1 | - | Establish migration-safe persistence model before new progression logic lands |
| 2 | - | Create canonical copy source and token rules before UI/content consumers switch over |
| 3 | - | Fix persistence correctness before history-driven progression reads attempt data |
| 4 | 1, 2 | Rebuild prompt/target content against the new schema and canonical copy source |
| 5 | 1, 3, 4 | Session composition and level updates depend on stable storage and level-tagged prompts |
| 6 | 2, 4, 5 | Gameplay UI needs tokenized content plus the new runtime/session model |
| 7 | 2, 5, 6 | Feedback copy and progression messaging depend on canonical content and runtime outcomes |
| 8 | 1, 5 | Parent progress visibility depends on persisted progression summaries |

### Agent Dispatch Summary (wave -> task count -> categories)
- Wave 1 -> 4 tasks -> `deep`, `writing`, `quick`, `deep`
- Wave 2 -> 4 tasks -> `deep`, `visual-engineering`, `quick`, `quick`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add migration-safe progression schema and typed data contracts

  **What to do**: Replace the current one-pass migration approach in `db/database.ts` with explicit SQLite versioned migrations using `PRAGMA user_version`, and extend the persisted model so the app can store game-level progression safely. Add these exact type/schema changes: `PromptTemplate.difficulty_level: 1 | 2 | 3 | 4`, `PromptTemplate.prompt_group: string`, `PromptTemplate.feedback_key: string`, `PracticeSession.level_started: number`, `PracticeSession.level_ended: number`, `PracticeSession.accuracy: number`, and a new `game_progress` table with columns `child_id`, `game_id`, `current_level`, `highest_level_unlocked`, `last_session_accuracy`, `updated_at` and a composite primary key on `child_id + game_id`. Expose typed DB helpers for `getGameProgress(childId, gameId)`, `upsertGameProgress(progress)`, and `getPromptsForGameLevels(gameId, levelNumbers, enabledTargetIds)` using the repo's existing typed-row mapper pattern.
  **Must NOT do**: Do not add per-target or per-prompt progression tables, do not rely on `CREATE TABLE IF NOT EXISTS` alone for schema evolution, and do not change the speech/corrections tables.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: schema design plus migration sequencing must be correct on existing installs.
  - Skills: none — the repo's DB layer is small and self-contained.
  - Omitted: `playwright` — not needed for schema authoring.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5, 8 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `db/database.ts` — existing SQLite open/migrate/seed flow and typed row mappers to preserve.
  - Pattern: `types/index.ts` — current domain types that must be extended rather than replaced.
  - Pattern: `data/seeds/targets.ts` — existing `difficulty_order` and game grouping that progression must continue to respect.
  - Pattern: `docs/data-model-and-learning-loop.md` — product-level expectation for target status, prompt templates, sessions, and attempts.
  - External: `docs/mvp-v1-level-progression-and-copy.md` — authoritative level definitions and progression rules.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "PRAGMA user_version" db/database.ts` succeeds.
  - [ ] `grep -q "CREATE TABLE IF NOT EXISTS game_progress" db/database.ts` succeeds.
  - [ ] `grep -q "difficulty_level" types/index.ts && grep -q "prompt_group" types/index.ts && grep -q "feedback_key" types/index.ts` succeeds.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Fresh schema boots successfully
    Tool: Bash
    Steps: Run `npm run lint`; then run `npm run web`, open the app in Expo web, and confirm the home screen renders without a database initialization error.
    Expected: Lint passes and the app loads to the home screen with the three game cards visible.
    Evidence: .sisyphus/evidence/task-1-progression-schema.txt

  Scenario: Existing-install migration path is present
    Tool: Bash
    Steps: Run `grep -n "PRAGMA user_version" db/database.ts`; run `grep -n "ALTER TABLE prompt_templates" db/database.ts`; run `grep -n "game_progress" db/database.ts`.
    Expected: The file contains explicit version checks, an `ALTER TABLE` path for prompt metadata, and creation of `game_progress` without removing existing speech/corrections tables.
    Evidence: .sisyphus/evidence/task-1-progression-schema-grep.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `db/database.ts`, `types/index.ts`

- [ ] 2. Create the canonical V1 copy/content source and token helpers

  **What to do**: Add a new TypeScript content module at `data/content/mvp-v1.ts` that mirrors the structure and values from `docs/mvp-v1-copy-keys.json` and is the only runtime source of truth for gameplay copy. Add defaults to `data/constants.ts` exactly as `DEFAULT_CHILD_NAME = 'Sam'`, `DEFAULT_PARENT_LABEL = 'Dad'`, `DEFAULT_SESSION_PROMPT_COUNT = 6`, `MIN_SESSION_PROMPT_COUNT = 6`, and `MAX_SESSION_PROMPT_COUNT = 10`. In the same content module, add a pure helper `resolveCopyTokens(text, { childName, parentLabel })` that replaces `{child_name}` and `{parent_label}` only; do not add settings screens, context providers, i18n libraries, or JSON imports.
  **Must NOT do**: Do not import `docs/mvp-v1-copy-keys.json` directly at runtime, do not leave literal token placeholders in any rendered string, and do not move unrelated navigation labels into the gameplay copy module.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: this task is mainly about canonicalizing wording and data shape faithfully.
  - Skills: none — straightforward structured content work.
  - Omitted: `frontend-ui-ux` — UI changes belong in later tasks.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 6, 7 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `data/constants.ts` — current home/game constants file; extend it with V1 defaults rather than scattering new literals.
  - Pattern: `docs/mvp-v1-copy-keys.json` — exact strings, keys, token names, and default values to mirror.
  - Pattern: `docs/mvp-v1-level-progression-and-copy.md` — prompt wording, feedback wording, and allowed touch-only interactions.
  - Pattern: `app/game/[gameId]/play.tsx` — current runtime location where prompt text is rendered.
  - Pattern: `app/game/[gameId]/feedback.tsx` — current runtime location where success/failure text is rendered.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `test -f data/content/mvp-v1.ts` succeeds.
  - [ ] `grep -q "DEFAULT_CHILD_NAME = 'Sam'" data/constants.ts && grep -q "DEFAULT_PARENT_LABEL = 'Dad'" data/constants.ts` succeeds.
  - [ ] `grep -q "resolveCopyTokens" data/content/mvp-v1.ts` succeeds.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Canonical copy helpers exist and are referenced
    Tool: Bash
    Steps: Run `npm run lint`; run `grep -n "resolveCopyTokens" data/content/mvp-v1.ts`; run `grep -n "DEFAULT_SESSION_PROMPT_COUNT" data/constants.ts`.
    Expected: Lint passes and the canonical content module plus token/default exports are present.
    Evidence: .sisyphus/evidence/task-2-canonical-copy.txt

  Scenario: No raw gameplay token placeholders are left rendered by accident
    Tool: Bash
    Steps: Run `grep -R "{child_name}\|{parent_label}" app data store components` after task 6/7 consumers are wired, but validate this task's helper API now by ensuring the only matches are inside `data/content/mvp-v1.ts` and docs.
    Expected: Before UI wiring, matches are confined to the canonical content source; no ad hoc token replacement logic is introduced elsewhere.
    Evidence: .sisyphus/evidence/task-2-canonical-copy-grep.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `data/content/mvp-v1.ts`, `data/constants.ts`

- [ ] 3. Repair session and attempt persistence before progression depends on history

  **What to do**: In `store/game-store.ts`, create a single ID helper that returns stable IDs using timestamp plus random base36 suffixes without adding new packages. Generate and store `activeSessionId` in `startGame` instead of `endGame`, keep it in store state, and use it for every `PromptAttempt` created during the session. Update `endGame` so it persists the already-correct session ID and writes attempts in one batch. In `db/database.ts`, replace the sequential `saveAttempts` loop with a single transaction so partial attempt history cannot be committed if a session save fails.
  **Must NOT do**: Do not add dependencies for UUID generation, do not keep `Date.now().toString()` as the only ID source, and do not leave the session ID remap happening only at session end.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: isolated correctness work in one store file plus one DB helper.
  - Skills: none — no external library decision required.
  - Omitted: `git-master` — no git operations are part of the implementation task itself.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `store/game-store.ts` — current `startGame`, `submitAnswer`, and `endGame` flow that mis-times session IDs.
  - Pattern: `db/database.ts` — current `saveSession`, `saveAttempt`, and `saveAttempts` behavior.
  - Pattern: `types/index.ts` — session/attempt contracts to keep aligned.
  - Pattern: `app/index.tsx` — weekly stats/practice counter already depend on persisted attempt history remaining consistent.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "activeSessionId" store/game-store.ts` succeeds.
  - [ ] `grep -q "BEGIN TRANSACTION\|withTransactionAsync" db/database.ts` succeeds.
  - [ ] `grep -q "Date.now().toString()" store/game-store.ts` fails.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Session IDs are created before the first answer
    Tool: Bash
    Steps: Run `grep -n "activeSessionId" store/game-store.ts`; inspect that `startGame` assigns it and `submitAnswer` reads it.
    Expected: Session IDs are created at game start and reused for every attempt in the session.
    Evidence: .sisyphus/evidence/task-3-session-integrity.txt

  Scenario: Attempt writes are atomic
    Tool: Bash
    Steps: Run `grep -n "saveAttempts" -A20 db/database.ts` and verify the implementation uses one transaction wrapper instead of a `for...of` loop calling `saveAttempt` repeatedly.
    Expected: The code commits all attempts together or rolls back the batch on failure.
    Evidence: .sisyphus/evidence/task-3-session-integrity-transaction.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `store/game-store.ts`, `db/database.ts`

- [ ] 4. Rewrite level-tagged targets and prompt seeds for all three games

  **What to do**: Rewrite `data/seeds/prompts.ts`, `data/seeds/prompts-game2.ts`, `data/seeds/prompts-game3.ts`, and `data/seeds/targets.ts` so they align with the new canonical content module and the V1 level ladder. Each prompt seed must include `difficulty_level`, `prompt_group`, `feedback_key`, and an explicit `answer_options` array sized for its level; do not rely on runtime trimming. Implement these exact gameplay decisions in the seeds: Game 1 Level 3 and Level 4 action prompts use `prompt_type: 'tap_object'` with tappable person targets, not drag; Game 2 Level 1 has only `in` and `on`, Level 2 adds `under`, Level 3 adds `next to`, Level 4 mixes all four location words across `put`, `where`, and `which` prompt groups; Game 3 Level 1 uses `big/small`, Level 2 uses `same/different`, Level 3 uses `more`, Level 4 uses `bigger`. Ensure there are at least 6 playable prompts per level per game so the new 6-prompt default session can avoid forced duplication at the same level.
  **Must NOT do**: Do not keep off-spec wording such as `smaller`, do not keep old copy such as `Caelum's turn is?`, and do not unlock fast add-on content from the bottom of `docs/mvp-v1-level-progression-and-copy.md`.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is the largest content rewrite and must stay perfectly aligned with the V1 spec.
  - Skills: none — all source material is already in the repo.
  - Omitted: `playwright` — runtime QA happens after the engine/UI consumes the seeds.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6, 7 | Blocked By: 1, 2

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `data/seeds/prompts.ts` — current Game 1 seed structure to preserve while replacing content.
  - Pattern: `data/seeds/prompts-game2.ts` — current Game 2 seed structure to preserve while expanding levels.
  - Pattern: `data/seeds/prompts-game3.ts` — current Game 3 seed structure to preserve while expanding levels.
  - Pattern: `data/seeds/targets.ts` — existing target ordering and statuses that must stay parent-toggle-compatible.
  - Pattern: `docs/mvp-v1-level-progression-and-copy.md` — exact level-by-level language targets, allowed prompt forms, and mastery checks.
  - Pattern: `docs/mvp-v1-copy-keys.json` — exact strings and feedback keys that seeds must reference.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -R "smaller\|Caelum's turn is\|Dad's turn is" data/seeds` returns no matches.
  - [ ] `grep -R "difficulty_level\|prompt_group\|feedback_key" data/seeds` returns matches in all three prompt seed files.
  - [ ] `grep -R "drag_to_place" data/seeds` returns no matches.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Seed content matches the agreed V1 touch-only design
    Tool: Bash
    Steps: Run `npm run lint`; run `grep -R "tap_object" data/seeds`; run `grep -R "drag_to_place" data/seeds`; run `grep -R "smaller" data/seeds`.
    Expected: Lint passes, tap-object prompts exist for Game 1 action levels, drag prompts do not exist, and off-spec wording is gone.
    Evidence: .sisyphus/evidence/task-4-seed-rewrite.txt

  Scenario: Every level has enough prompts to support the new session length
    Tool: Bash
    Steps: Inspect each seed file and count prompts per `difficulty_level` using a one-off script or grep grouping.
    Expected: Each game has at least 6 prompts tagged for each implemented level; no level is missing its required prompt groups.
    Evidence: .sisyphus/evidence/task-4-seed-rewrite-counts.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `data/seeds/prompts.ts`, `data/seeds/prompts-game2.ts`, `data/seeds/prompts-game3.ts`, `data/seeds/targets.ts`

- [ ] 5. Implement deterministic session composition and session-end level evaluation

  **What to do**: Rework `store/game-store.ts` and supporting DB helpers so progression is driven entirely by `game_progress.current_level` per game. Use `DEFAULT_SESSION_PROMPT_COUNT = 6` from `data/constants.ts`; when `current_level === 1`, select 6 prompts from level 1 only. When `current_level > 1`, build each session as `4 mastered + 2 current`, where the mastered pool is all enabled prompts from levels below `current_level` and the current pool is all enabled prompts from `current_level`; if either pool is short, backfill from the other pool, and only duplicate prompts after all eligible unique prompts have been used, never repeating the same prompt twice in a row. Track session correctness in memory, compute `accuracy = correct / prompt_count`, compute `lastFiveAccuracy` from the last 5 attempts in the current session, and persist `level_started`, `level_ended`, and `accuracy` on the session record. Promotion rule: advance exactly one level when the session contains a streak of at least 3 consecutive correct answers and overall session accuracy is at least `0.8`. Regression rule: decrease exactly one level when `lastFiveAccuracy < 0.6`, but never below level 1. Otherwise keep the level unchanged. Apply all level changes only in `endGame`, never mid-session.
  **Must NOT do**: Do not implement per-target or per-prompt leveling, do not change levels mid-session, do not use the old fixed `PROMPTS_PER_SESSION` constant, and do not ignore parent-disabled targets when building prompt pools.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is the core behavior change and depends on multiple files staying aligned.
  - Skills: none — the logic is internal to the repo.
  - Omitted: `frontend-ui-ux` — runtime styling is handled later.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6, 7, 8 | Blocked By: 1, 3, 4

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `store/game-store.ts` — existing session lifecycle and prompt selection flow to extend.
  - Pattern: `db/database.ts` — add typed queries for `game_progress` plus level-band prompt reads.
  - Pattern: `data/constants.ts` — replace the old prompt-count constant with the new bounded session-length constants.
  - Pattern: `types/index.ts` — keep store state and persisted session types aligned.
  - Pattern: `docs/mvp-v1-level-progression-and-copy.md` — source of truth for `3 correct in a row`, `<60% in last 5`, `70/30 mix`, and `6 to 10` round guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "DEFAULT_SESSION_PROMPT_COUNT" store/game-store.ts` succeeds.
  - [ ] `grep -q "PROMPTS_PER_SESSION" store/game-store.ts` fails.
  - [ ] `grep -q "lastFiveAccuracy" store/game-store.ts && grep -q "level_ended" store/game-store.ts` succeeds.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Successful session advances exactly one level at session end
    Tool: Playwright
    Steps: Start Expo web, open `Which Is Bigger?`, play one full session by selecting the correct answer on every prompt using the visible prompt text, finish the session, then open Parent -> Progress.
    Expected: The game-level progress for `Which Is Bigger?` shows Level 2, not Level 3+, and the completed session records an accuracy of at least 80%.
    Evidence: .sisyphus/evidence/task-5-level-engine.png

  Scenario: Poor recent accuracy steps back one level only
    Tool: Playwright
    Steps: First complete one successful session so a game reaches Level 2, then start a second session in that same game, intentionally answer at least 3 of the last 5 prompts incorrectly, finish the session, and open Parent -> Progress.
    Expected: The game level drops by exactly one and never below Level 1.
    Evidence: .sisyphus/evidence/task-5-level-engine-regression.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `store/game-store.ts`, `db/database.ts`, `data/constants.ts`

- [ ] 6. Update gameplay screens for tokenized copy, dynamic rounds, and touch-only answer layouts

  **What to do**: Update `app/game/[gameId]/intro.tsx` and `app/game/[gameId]/play.tsx` to consume the canonical V1 content and the new progression engine. In `intro.tsx`, show the current game title, the next session length (`6 prompts` by default), and the current level label (`Level 1` through `Level 4`) before starting. In `play.tsx`, remove the hardcoded `PROMPTS_PER_SESSION` display and use `prompts.length`; render 2-choice prompts as two large side-by-side buttons, 3-choice prompts as three stacked full-width buttons, and 4-choice prompts as the existing two-by-two grid. For Game 1 action prompts tagged as `tap_object`, replace generic answer buttons with two tappable person cards labeled from the seed `answer_options`, keeping the existing person illustration row above them. Always resolve prompt text through `resolveCopyTokens`, and replace the hardcoded `Caelum`/`Dad` scene labels with the defaults from `data/constants.ts`.
  **Must NOT do**: Do not add drag-and-drop, do not keep raw token placeholders in the rendered UI, and do not hide the prompt counter.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this task changes gameplay layout and touch targets across mobile/web breakpoints.
  - Skills: [`frontend-ui-ux`] — needed to keep the answer layouts intentional and touch-friendly.
  - Omitted: `playwright` — implementation only; QA uses Playwright afterward.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7 | Blocked By: 2, 4, 5

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `app/game/[gameId]/intro.tsx` — current start screen to extend with session/level context.
  - Pattern: `app/game/[gameId]/play.tsx` — current scene renderer, counter, and button layouts to replace.
  - Pattern: `data/constants.ts` — source for default names and session-length bounds.
  - Pattern: `docs/mvp-v1-copy-keys.json` — canonical copy keys the runtime helpers must surface after Task 2.
  - Pattern: `docs/mvp-v1-level-progression-and-copy.md` — answer-count growth and touch-only action-prompt guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "prompts.length" "app/game/[gameId]/play.tsx"` succeeds.
  - [ ] `grep -q "PROMPTS_PER_SESSION" "app/game/[gameId]/play.tsx"` fails.
  - [ ] `grep -q "resolveCopyTokens" "app/game/[gameId]/play.tsx" && grep -q "DEFAULT_PARENT_LABEL\|DEFAULT_CHILD_NAME" "app/game/[gameId]/play.tsx"` succeeds.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Level 1 session uses the new 6-prompt touch layout
    Tool: Playwright
    Steps: Open the home screen, activate `Where Is It?`, tap `Start Game`, and count prompts until the session completes.
    Expected: The counter starts at `Prompt 1 of 6`, Level 1 location prompts show exactly 2 answer choices, and the session returns home after prompt 6.
    Evidence: .sisyphus/evidence/task-6-gameplay-layout.png

  Scenario: Game 1 action prompt uses tappable person cards instead of drag
    Tool: Playwright
    Steps: Starting from Level 1, complete enough successful `My Turn / Your Turn` sessions to reach Level 3, open the next session, wait for an action prompt, and inspect the available answer controls.
    Expected: Two tappable person targets are present, no drag gesture is required, and the prompt remains solvable by touch on web.
    Evidence: .sisyphus/evidence/task-6-gameplay-layout-action.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/game/[gameId]/intro.tsx`, `app/game/[gameId]/play.tsx`, `data/constants.ts`

- [ ] 7. Replace feedback flow copy with canonical V1 wording

  **What to do**: Update `app/game/[gameId]/feedback.tsx` so the screen resolves all messages from the canonical content source using the prompt seed's `feedback_key`. Structure the feedback UI as: heading line `Nice work` on correct answers and `Try again` on incorrect answers, body line equal to the resolved canonical feedback sentence, and CTA text `Let's do another one` whenever more prompts remain in the session. Keep the current success/error background tint behavior. On incorrect answers, show the correct canonical feedback sentence immediately; do not show raw answer labels such as `The answer was: under`.
  **Must NOT do**: Do not add a new results screen, do not expose raw placeholder tokens, and do not reintroduce generic fallback strings except as a defensive final fallback when a `feedback_key` is missing.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: focused UI/copy wiring in one screen after the content source exists.
  - Skills: none — straightforward wiring plus copy substitution.
  - Omitted: `frontend-ui-ux` — main layout work already happens in Task 6.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: none | Blocked By: 2, 5, 6

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `app/game/[gameId]/feedback.tsx` — current feedback tint and next-prompt flow.
  - Pattern: `docs/mvp-v1-copy-keys.json` — canonical feedback keys and values the runtime helper must expose after Task 2.
  - Pattern: `docs/mvp-v1-level-progression-and-copy.md` — exact global UI strings and per-game feedback wording.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "Nice work" "app/game/[gameId]/feedback.tsx" && grep -q "Try again" "app/game/[gameId]/feedback.tsx"` succeeds.
  - [ ] `grep -q "feedback_key" "app/game/[gameId]/feedback.tsx"` succeeds.
  - [ ] `grep -q "The answer was:" "app/game/[gameId]/feedback.tsx"` fails.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Correct answer shows canonical success feedback
    Tool: Playwright
    Steps: Start any game, answer the first prompt correctly, and wait for the feedback screen.
    Expected: The screen shows `Nice work`, the body uses the canonical sentence for that prompt, and the CTA reads `Let's do another one`.
    Evidence: .sisyphus/evidence/task-7-feedback-success.png

  Scenario: Incorrect answer still models the correct language target
    Tool: Playwright
    Steps: Start any game, answer the first prompt incorrectly, and wait for the feedback screen.
    Expected: The screen shows `Try again`, the body presents the resolved canonical correction sentence, and no raw `The answer was:` fallback is visible.
    Evidence: .sisyphus/evidence/task-7-feedback-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/game/[gameId]/feedback.tsx`, `data/content/mvp-v1.ts`

- [ ] 8. Extend parent mode with bounded progression visibility and level context

  **What to do**: Update `app/parent/progress.tsx` and `app/parent/targets.tsx` to surface progression without adding extra setup burden. In `progress.tsx`, add one compact game card per `GameId` showing `Level N`, `Highest unlocked`, `Last session accuracy`, and `Enabled concepts`; keep the weekly totals and notes sections underneath. In `targets.tsx`, keep the existing enable/later toggle behavior but add a read-only section subtitle per game in the format `Current level: N of 4`. Use `getGameProgress` and existing `getTargets` data; do not add charts, history drill-down, or mastery-edit controls.
  **Must NOT do**: Do not add new parent-mode routes, do not modify `app/parent/corrections.tsx`, and do not let parents edit level numbers directly.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: small bounded UI/data work on existing parent screens.
  - Skills: [`frontend-ui-ux`] — useful for keeping the new summaries readable on mobile.
  - Omitted: `playwright` — QA happens after the screens are wired.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: none | Blocked By: 1, 5

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `app/parent/progress.tsx` — current weekly stats, target list, and notes layout to preserve.
  - Pattern: `app/parent/targets.tsx` — existing per-game grouping and toggle interactions to preserve.
  - Pattern: `data/constants.ts` — game metadata and level bounds.
  - Pattern: `db/database.ts` — new `game_progress` accessors plus current `getTargets()` and stats queries.
  - Pattern: `docs/low-fidelity-wireframes.md` — parent targets screen purpose and low-friction expectations.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm run lint` passes.
  - [ ] `grep -q "Current level:" app/parent/targets.tsx` succeeds.
  - [ ] `grep -q "Highest unlocked" app/parent/progress.tsx && grep -q "Last session accuracy" app/parent/progress.tsx` succeeds.
  - [ ] `grep -q "Corrections" app/parent/corrections.tsx` still succeeds and the file is otherwise unchanged.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Parent progress shows per-game level summary
    Tool: Playwright
    Steps: Open Parent Mode from the home screen, navigate to `Progress`, and inspect the top game summary cards.
    Expected: Each game shows `Level N`, `Highest unlocked`, `Last session accuracy`, and `Enabled concepts` before the notes section.
    Evidence: .sisyphus/evidence/task-8-parent-progress.png

  Scenario: Targets screen stays low-friction while showing progression context
    Tool: Playwright
    Steps: Open Parent Mode -> `Targets`, inspect each game section, and toggle one target off and back on.
    Expected: The screen shows `Current level: N of 4` for each game, toggles still work, and no editable level control is present.
    Evidence: .sisyphus/evidence/task-8-parent-targets.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `app/parent/progress.tsx`, `app/parent/targets.tsx`, `db/database.ts`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit after Wave 1 foundation lands: `feat(data): add v1 progression schema and canonical content model`
- Commit after Wave 2 behavior/UI lands: `feat(gameplay): add v1 level progression and parent progress surfaces`
- Final verification-only cleanup commit if needed: `chore(qa): align lint and verification artifacts`

## Success Criteria
- The codebase can express all V1 copy and progression rules without any audio dependencies.
- Each game can run a 6-prompt default session with level-appropriate prompts and answer counts.
- The app advances or steps back levels using deterministic session-end rules only.
- Parent mode shows enough information to understand current difficulty without introducing extra setup burden.
