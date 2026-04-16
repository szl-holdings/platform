# DEFERRED — `cortex-mobile`

**Status:** Deferred Expo Router scaffold. Not the canonical mobile app.
**Updated:** 2026-04-16

## Canonical mobile app

The flagship CORTEX mobile app lives at **`artifacts/szl-holdings-mobile`**.
It is the only mobile artifact under active development and the sole target
for TestFlight, Play Internal, and App Store / Google Play release.

- App name in `app.json`: `CORTEX`
- iOS bundle / Android package: `com.szlholdings.executive.mobile`
- Full Expo configuration, EAS profiles, push notifications, biometric auth,
  offline sync, and `@szl-holdings/mobile-shared` consumption.
- 167 source files across `src/`, with a complete app shell, eight domain
  workspaces, secure storage, and shared mobile primitives.

## What this directory actually contains

`artifacts/cortex-mobile/` is an empty Expo Router scaffold. The current
contents are limited to:

- `app/auth/` — empty route directory (no screens implemented)
- `app/workspace/` — empty route directory (no screens implemented)
- `expo-env.d.ts` — auto-generated Expo type reference (one line; not
  source code)
- `.expo/` — local Expo CLI cache (gitignored in practice)
- `node_modules/` — transient install artifacts (gitignored)

There is **no `package.json`, no `app.json`, no `eas.json`, and no
implemented screens, components, or business logic** in this directory.
Nothing here builds, ships, or runs as an application.

## Disposition

| Class | Action |
|-------|--------|
| SHELL | Retained as historical scaffold; no work to be done here |

Do not add features, dependencies, or workflows targeting this directory.
All mobile work belongs in `artifacts/szl-holdings-mobile`.

## References

- `ops/mobile/mobile-disposition.md` — full disposition rationale
- `ops/mobile/flagship-release-readiness.md` — readiness matrix for CORTEX
- `ops/frontier/disposition-matrix.md` — repo-wide artifact classification
- `ops/benchmark/mobile-series-a-pass.md` — Series A mobile signal
- `ops/benchmark/mobile-beta-to-launch.md` — alpha → launch path
