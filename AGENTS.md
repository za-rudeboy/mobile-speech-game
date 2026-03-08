# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Expo Router screens and route layouts (`_layout.tsx`, `modal.tsx`, `app/(tabs)/...`).
- `components/`: Reusable UI and shared presentation logic (`components/ui/` for base UI pieces).
- `hooks/` and `constants/`: Cross-cutting app hooks and theme/config constants.
- `assets/images/`: Static app images/icons used by native and web builds.
- `docs/`: Product, UX, and architecture notes for the speech-learning direction.
- `scripts/`: Utility scripts (for example, `reset-project.js`).

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run start`: Start Expo dev server.
- `npm run android`: Launch Android target via Expo.
- `npm run ios`: Launch iOS simulator target via Expo.
- `npm run web`: Launch web target.
- `npm run lint`: Run Expo ESLint config checks.
- `npm run reset-project`: Restore a fresh starter structure when needed.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with `strict` mode enabled in `tsconfig.json`.
- Imports: Prefer alias imports with `@/` for project-root paths.
- Indentation: 2 spaces; keep component props and object literals vertically aligned when multiline.
- Naming:
  - Components: PascalCase (`ParallaxScrollView.tsx`).
  - Hooks: `use*` camelCase (`useThemeColor.ts`).
  - Route files: Expo Router conventions (`index.tsx`, `_layout.tsx`, grouped routes like `(tabs)`).
- Linting: Follow `eslint-config-expo`; run `npm run lint` before opening a PR.

## Testing Guidelines
- There is currently no committed unit/integration test framework in this repo.
- Minimum quality gate today: pass lint and manually verify core flows on at least one target (`android`, `ios`, or `web`).
- When adding tests, colocate as `*.test.ts(x)` near the unit under test and document the new command in `package.json`.

## Commit & Pull Request Guidelines
- Use Conventional Commit style, as seen in history (example: `feat: initialize project with Expo setup...`).
- Recommended format: `type(scope): short summary` (types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- PRs should include:
  - Clear description of behavior change.
  - Linked issue/task when applicable.
  - Screenshots/video for UI updates (Android/iOS/Web as relevant).
  - Verification notes listing commands run (for example, `npm run lint`, `npm run web`).

## Security & Configuration Tips
- Do not commit secrets; keep runtime keys in Expo config/env mechanisms.
- Review `app.json` changes carefully, especially app IDs, permissions, and plugin settings.
