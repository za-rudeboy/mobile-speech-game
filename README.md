# Caelum Speech App

A mobile app built with Expo and React Native to support parent-guided language development through short, visual mini-games. The product is designed to be touch-first, with optional speech features.

## Product Direction

The app focuses on three core goals:
- Teach practical language concepts through constrained game prompts
- Keep interactions low-frustration and child-friendly
- Let parent controls shape what targets and prompts are available

Current implementation includes:
- Expo Router-based navigation
- Zustand state stores for app/game state
- SQLite-backed local data and prompt enablement
- Parent mode flows for targets, progress, and corrections

## Tech Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript (strict mode)
- Expo Router 6
- expo-sqlite
- Zustand

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- iOS Simulator and/or Android Emulator (optional, for device targets)

### Install

```bash
npm install
```

### Run

```bash
npm run start
```

Target-specific commands:

```bash
npm run android
npm run ios
npm run web
```

## Available Scripts

- `npm run start` - Start Expo development server
- `npm run android` - Start and open Android target
- `npm run ios` - Start and open iOS simulator target
- `npm run web` - Start web target
- `npm run lint` - Run ESLint checks (Expo config)
- `npm run reset-project` - Reset project scaffold using local script

## Project Structure

- `app/` - Expo Router screens and route layouts
- `components/` - Shared UI and reusable presentation components
- `hooks/` - Reusable hooks
- `constants/` - Theme and global constants
- `db/` - SQLite access, schema, and data layer utilities
- `store/` - Zustand stores and app/game state orchestration
- `data/` - Seed and content data used by game flows
- `assets/images/` - Static images and icons
- `docs/` - Product, UX, architecture, and implementation planning docs

## Development Workflow

1. Create a feature branch
2. Make focused changes
3. Run checks:

```bash
npm run lint
```

4. Manually verify at least one runtime target (`android`, `ios`, or `web`)
5. Open a pull request with summary + verification notes

## Documentation

For product context and architecture notes, start with:
- `docs/project-summary.md`
- `docs/mvp-implementation-plan.md`
- `docs/data-model-and-learning-loop.md`
- `docs/mvp-mini-games.md`

## Security Notes

- Do not commit secrets or runtime keys
- Review `app.json` changes carefully (IDs, permissions, plugins)

## License

Private project.
