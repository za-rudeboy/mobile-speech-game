# Product Memory

This file captures product decisions and working preferences that should persist across implementation passes.

## Where Is It?

- The game should feel balanced across all four core relations:
  - `in`
  - `on`
  - `under`
  - `next to`
- Avoid sessions that skew heavily toward `in` and `on`.
- Current balancing fix was committed in `0877cdf` with message:
  - `fix(where-is-it): balance relation selection`
- Difficulty is acceptable with four answer choices; the main issue was repetition, not answer count.

## Do What I Say

- Preferred direction: make the game more practical and less static.
- The first interaction upgrade should be:
  - drag-first
  - always-visible tap fallback
  - one short demo replay on `Show me again`
  - wrong drag snaps back and stays on the same prompt
- First prompt scope:
  - `give`
  - `put`
  - `take`
- Keep `show me` prompts on the simpler path for now.
- Preferred first recipient set for people-target prompts:
  - `Caelum`
  - `Dad`
  - `Mom`
- Build a light reusable interaction foundation, but only wire it into `Do What I Say` first.

## General Product Preference

- Prefer games that feel action-based and dynamic when that improves comprehension.
- Keep touch support visible at all times to reduce frustration and keep sessions moving.
- Use visual support and short demos before escalating complexity.
