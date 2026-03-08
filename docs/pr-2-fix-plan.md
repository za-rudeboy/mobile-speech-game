# PR #2 Fix Plan (Post-Merge of PR #1)

## Goal
Ship a small, focused follow-up PR that fixes two production-impacting gaps from PR #1:

1. Game prompt selection must come from SQLite (enabled prompts), not hardcoded seed arrays.
2. App boot database initialization must handle failures safely.

## Scope
- In scope: prompt source integration + startup error handling + verification.
- Out of scope: feature work, UI redesign, schema changes, audio/speech phase.

## Why This PR
- Parent target management currently cannot fully control gameplay if prompt selection is decoupled from DB state.
- Unhandled DB init failures can cause noisy runtime errors or unstable boot behavior.

## Files To Change
1. `store/game-store.ts`
2. `app/_layout.tsx`
3. (Optional, small) `types/index.ts` only if type tweaks are needed for async loading state

## Implementation Plan

### 1) Move Prompt Selection to DB
**File:** `store/game-store.ts`

- Replace hardcoded prompt pool usage (`ALL_SEED_PROMPTS`) with DB-backed selection:
  - Use `getEnabledPromptsByGame(gameId)` from `@/db`.
  - Shuffle DB prompts and slice to `PROMPTS_PER_SESSION`.
- Update `startGame` flow to support async prompt loading.

Recommended pattern:
- Keep existing `startGame(gameId)` API for callers.
- Set a temporary phase/loading state while DB prompts load.
- On success:
  - populate `prompts`
  - set `currentPromptIndex = 0`
  - set `gamePhase = 'intro'`
- On failure or empty prompt result:
  - log error
  - reset to safe idle state (or explicit fallback state)

Acceptance criteria:
- Toggling prompt/target availability in parent flows changes what can appear in game sessions.
- No gameplay prompt should appear if disabled in DB.

### 2) Harden Root DB Initialization
**File:** `app/_layout.tsx`

- Wrap `getDatabase()` call in an async effect with `try/catch`.
- Ensure rejection is always handled (`void init()` pattern is fine).
- Keep startup resilient if DB init fails (log + continue with controlled state).

Acceptance criteria:
- No unhandled promise rejection from root DB init path.
- App does not crash from init failure in supported fallback scenarios.

### 3) Keep PR Small and Focused
- Do not refactor unrelated store logic.
- Do not change navigation or parent UI in this PR.
- Do not add audio/speech logic.

## Test & Verification Checklist

### Automated
- `npm run lint`
- `npx tsc --noEmit`
- `npx expo export --platform web` (or `npm run web` smoke run)

### Manual
1. Launch app and start each game from home.
2. In parent mode, disable at least one relevant target/prompt.
3. Start the associated game repeatedly and verify disabled prompt does not appear.
4. Confirm app boots without unhandled runtime errors in console.

## Risk Notes
- Main risk is async race conditions in `startGame` (user tapping quickly, navigation before prompts are loaded).
- Mitigation:
  - gate transitions on loaded prompt state
  - keep deterministic state updates for `gamePhase`

## Suggested PR Metadata

### Branch name
`fix/db-backed-prompt-selection-and-init-guard`

### Commit message
`fix(game): load prompts from sqlite and handle db init failures`

### PR title
`fix: use DB-enabled prompts for gameplay and guard root DB init errors`

### PR summary bullets
- replace hardcoded prompt selection with `getEnabledPromptsByGame` in game store
- add guarded async DB initialization in root layout
- verify lint, typecheck, and web bundle/manual parent-toggle behavior
