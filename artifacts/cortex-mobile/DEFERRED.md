# DEFERRED — `cortex-mobile`

**Status:** Deferred scaffold. Not the canonical mobile app.
**Updated:** 2026-04-16

## Canonical mobile app

The flagship CORTEX mobile app lives at **`artifacts/szl-holdings-mobile`**.
It is the only mobile artifact under active development and the sole target
for TestFlight, Play Internal, and App Store / Google Play release.

- App name in `app.json`: `CORTEX`
- iOS bundle / Android package: `com.szlholdings.executive.mobile`
- Full Expo configuration, EAS profiles, push notifications, biometric auth,
  offline sync, and `@szl-holdings/mobile-shared` consumption.

## What this directory is

`artifacts/cortex-mobile/` contains an empty Expo Router scaffold
(`app/auth/` and `app/workspace/` route directories) with **no
`package.json`, no `app.json`, and no implementation files**. It was an
exploratory route layout that has been superseded by the full CORTEX
implementation in `artifacts/szl-holdings-mobile`.

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
