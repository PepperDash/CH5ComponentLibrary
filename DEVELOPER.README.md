# Crestron CH5 Components Library - Developer Readme

## Build Requirements

- Node 24 (the version CI uses) and the npm that ships with it
- Install with `npm ci`. The repository uses `package-lock.json` only.

### Available Scripts

- `npm run build` - type checks and builds the library into `dist`
- `npm test` - runs the tests once (Vitest with jsdom)
- `npx vitest` - runs the tests in watch mode
- `npm run lint` - runs ESLint

### Tests

Spec files live next to the code as `*.spec.ts`. They describe how the library behaves today, including a few
known quirks, which are marked with a "Known quirk" comment. If a change makes one of those tests fail, the
behaviour of the library changed: update the test only when that change is intended.

The library keeps its state in module level singletons, so each test loads a fresh copy through `loadLib()`
from `src/test-helpers.ts`. The same file has helpers that fake the native interfaces of the Android, iOS and
WebXPanel containers.

### Development checklist

1. Run `npm run lint` and `npm test` before opening a pull request. CI runs both before it builds and releases.
2. Use Conventional Commits. The commit type decides whether a release is published (see `.releaserc.json`).
