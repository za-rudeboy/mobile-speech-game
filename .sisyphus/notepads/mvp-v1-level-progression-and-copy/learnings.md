# Learnings

## 2026-03-08 Session Start

### Repo state
- Branch: feat/mvp-v1.1
- Expo 54 / React Native 0.81 / React 19
- Stack: Expo Router + Zustand + expo-sqlite
- DB migration is currently `CREATE TABLE IF NOT EXISTS` only — no versioning
- Current sessions are fixed 4 prompts (`PROMPTS_PER_SESSION = 4`)

### Key bugs found (must fix before progression reads history)
- `attempt_id` uses `Date.now().toString()` — collision risk
- `session_id` in attempts is set to `currentGameId` during play, only remapped at `endGame`
- `saveAttempts` is a non-atomic sequential loop

### Data layer patterns
- Typed Row interface → typed mapper function → exported async function
- DB singletons via `getDatabase()` with in-memory fallback for web
- Seeds run on first launch only via `seedIfFirstRun` count guard

### Plan decisions locked
- Progression unit: per GAME (not per target)
- Session-length default: 6 prompts (MIN 6, MAX 10)
- Level changes: end-of-session only
- Promotion: 3-consecutive-correct streak AND ≥80% overall accuracy
- Regression: last-5 accuracy < 60%, floor at Level 1
- Mix: mastered pool = levels < current_level; new pool = current_level; Level 1 = all level-1 prompts
- Tokenization: constants in `data/constants.ts`; helper in `data/content/mvp-v1.ts`
- Action prompts: tap_object (not drag_to_place)
- Test infra: lint + manual Expo web QA only, no new test framework
- 2026-03-08: Added explicit SQLite versioned migrations in db/database.ts using PRAGMA user_version (v1 base schema, v2 prompt_templates columns, v3 practice_sessions columns, v4 game_progress table) while preserving web in-memory fallback and existing seed insert behavior.
- 2026-03-08: Extended typed row mappers and contracts for progression (PromptTemplate difficulty_level/prompt_group/feedback_key, PracticeSession level_started/level_ended/accuracy, new GameProgress + getGameProgress/upsertGameProgress/getPromptsForGameLevels).

## 2026-03-08 Task 1 Complete

### Schema migration approach (IMPORTANT for future tasks)
- TABLE_CREATION_SQL has ORIGINAL v1 schemas (NO new columns)
- New columns added ONLY via ALTER TABLE in versioned migrations
- Fresh install: v1 schema created → ALTER TABLE adds all new columns → user_version = 4
- Existing v1 install: CREATE TABLE is no-op → ALTER TABLE adds new columns → user_version = 4
- PromptTemplate has: difficulty_level (1|2|3|4), prompt_group (string), feedback_key (string)  
- PracticeSession has: level_started (number), level_ended (number), accuracy (number)
- GameProgress table: child_id+game_id PK, current_level, highest_level_unlocked, last_session_accuracy, updated_at
- New DB exports: getGameProgress, upsertGameProgress, getPromptsForGameLevels

### Pre-existing TypeScript errors (expected — NOT bugs):
- data/seeds/prompts.ts, prompts-game2.ts, prompts-game3.ts: PromptTemplate objects missing difficulty_level, prompt_group, feedback_key → FIXED by Task 4 (full seed rewrite)
- store/game-store.ts: PracticeSession object missing level_started, level_ended, accuracy → FIXED by Task 3 (add placeholder values 1, 1, 0) and Task 5 (real progression values)
- expo lint (ESLint) passes cleanly — these are tsc-only errors

- 2026-03-08: Created `data/content/mvp-v1.ts` as canonical V1 gameplay copy source (typed constants mirroring `docs/mvp-v1-copy-keys.json` sections for ui.global, ui.confirm, answer_labels, and games.* prompts/feedback) and added pure `resolveCopyTokens(text, { childName, parentLabel })` that replaces only `{child_name}` and `{parent_label}`. Extended `data/constants.ts` with DEFAULT_CHILD_NAME='Sam', DEFAULT_PARENT_LABEL='Dad', DEFAULT_SESSION_PROMPT_COUNT=6, MIN_SESSION_PROMPT_COUNT=6, MAX_SESSION_PROMPT_COUNT=10.
- 2026-03-08: Rewrote all prompt seed files to the V1 4-level ladder with 6 prompts per level, enforced prompt metadata (`difficulty_level`, `prompt_group`, `feedback_key`) on every entry, removed legacy/off-spec wording, and updated `seedIfFirstRun` prompt insert SQL to persist new prompt metadata columns.
- 2026-03-08: Implemented V1 progression in `store/game-store.ts` by replacing fixed-count sessions with level-aware prompt selection (`DEFAULT_SESSION_PROMPT_COUNT`, level-1 all-new pool, level>1 mixed 4 mastered + 2 current-level with backfill) and end-of-session level evaluation/persistence (`accuracy`, `maxConsecutiveCorrect`, `lastFiveAccuracy`, promotion/regression rules, and fire-and-forget `upsertGameProgress`).
