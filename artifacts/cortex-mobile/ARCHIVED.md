# ARCHIVED — `cortex-mobile`

**Status:** Archived
**Date:** 2026-04-18
**Decision:** Archive — scaffold only, no real application code

## Rationale

`cortex-mobile` was a bare Expo Router scaffold created to explore an "8-domain
workspace switcher" concept. After audit it contained only:

- `app/auth/` and `app/workspace/` — empty route directories, no screens
- `expo-env.d.ts` — auto-generated Expo type reference
- No `package.json`, `app.json`, `eas.json`, or implemented business logic
- Not registered as an artifact; not in pnpm workspace

The scaffold never ran as an application and had no path to production.

## Canonical mobile app

All mobile work lives in **`artifacts/szl-holdings-mobile`** — the CORTEX mobile
flagship with ~180 source files, full Expo configuration, EAS profiles, push
notifications, biometric auth, offline sync, and eight domain workspaces.

Do not add work to this directory.
