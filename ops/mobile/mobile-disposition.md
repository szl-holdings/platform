# Mobile Disposition — SZL Holdings Platform

Updated: 2026-04-16
Authority: Phase 12 Mobile Release Readiness

---

## Decision Summary

| Role | App | Rationale |
|------|-----|-----------|
| **Flagship Mobile** | `artifacts/szl-holdings-mobile` | Full CORTEX app; complete `app.json`, `eas.json`, all Expo deps; named "CORTEX" in app config |
| **Deferred Scaffold** | `artifacts/cortex-mobile` | Partial route scaffold only; no `package.json`, no `app.json`; deferred |

---

## Flagship: CORTEX (`artifacts/szl-holdings-mobile`)

### Designation Rationale

`artifacts/szl-holdings-mobile` is the CORTEX app. Evidence:

1. **`app.json` name field**: `"name": "CORTEX"` — explicit app identity.
2. **Complete configuration**: Full `app.json`, `eas.json`, `package.json`; all Expo plugins,
   permissions, and push notification config are present.
3. **Bundle ID**: `com.szlholdings.executive.mobile` registered across iOS and Android.
4. **EAS profiles**: development / preview / production build profiles configured in `eas.json`.
5. **Full feature set**: Biometric auth, push notifications, secure storage, New Architecture,
   GraphQL via urql, offline-capable query persistence, camera, screen capture prevention.
6. **Shared library**: Consumes `@szl-holdings/mobile-shared` (`lib/mobile-shared`) for
   shared push hooks, error boundary, skeleton loader, and offline banner.

### Release Path

| Stage | Target | Blockers |
|-------|--------|---------|
| Alpha | TestFlight + Play Internal | EAS project UUID; Firebase credentials; push token backend |
| Beta | TestFlight External | Physical device test; screen capture prevention; Sentry |
| Production | App Store + Google Play | Store listing assets; Apple/Google account credentials |

### Bundle ID

`com.szlholdings.executive.mobile`

---

## Deferred: `artifacts/cortex-mobile`

### Current State

`artifacts/cortex-mobile` contains:
- `app/auth/` — route files for auth flow
- `app/workspace/` — route files for workspace views
- `node_modules/` — Expo toolchain installed via workspace
- `expo-env.d.ts` — Expo type declarations

It has **no `package.json`**, **no `app.json`**, and **no `eas.json`**. It cannot be built
or run as a standalone app in its current state.

### Disposition

Deferred. The route files here represent a possible future architecture where domain workspaces
live in a separate route directory. Two paths exist:

1. **Consolidate into szl-holdings-mobile** — Move the route files under the flagship app's
   `app/` directory structure. Clean, simple, one build target.
2. **Promote to standalone app** — Add `package.json`, `app.json`, and EAS config; wire to
   the same `lib/mobile-shared` and `api-server` endpoints as the flagship.

**Recommended path**: Consolidate into `szl-holdings-mobile` (Option 1). The CORTEX app
already covers all 8 workspaces. A separate scaffold adds build complexity without user-facing
benefit. Revisit only if a compelling architectural need emerges post-Alpha.

**Resume trigger**: After CORTEX Alpha ships and the team has validated the workspace
navigation model on real devices.

---

## Shared Library: `lib/mobile-shared`

`@szl-holdings/mobile-shared` is the centralized shared library for all SZL Holdings mobile
development. It provides:

- `ErrorBoundary` component
- `SkeletonLoader` component
- `KeyboardAwareScrollViewCompat` component
- `useApiStatus` hook
- Push notification registration and handler utilities (`/notifications` subpath)

Both `szl-holdings-mobile` and any future mobile app should consume `lib/mobile-shared`
rather than duplicating these primitives. See `lib/mobile-shared/README.md` for import patterns.

---

## Mobile Architecture Principles

1. **One app, not many.** CORTEX is the mobile platform. Domain workspaces are navigation
   targets within CORTEX, not separate apps.
2. **Shared lib, not forked code.** `lib/mobile-shared` provides common primitives. All mobile
   apps consume it.
3. **Credentials must be real before builds.** Firebase placeholder files in
   `szl-holdings-mobile` will cause build failures. `ops/mobile/eas-and-store-secrets-matrix.md`
   tracks the full credential matrix.
4. **EAS, not local builds.** All production builds go through EAS. Local builds are for
   simulator only.
5. **Backend parity.** Mobile surfaces consume the same `api-server` endpoints as web surfaces.

---

## Related Files

- `ops/mobile/flagship-release-readiness.md` — CORTEX pre-release checklist and go/no-go gate
- `ops/mobile/eas-and-store-secrets-matrix.md` — EAS profiles and credential inventory
- `ops/mobile/push-notification-setup.md` — Push notification architecture and credential dependencies
- `ops/mobile/store-asset-inventory.md` — App Store and Play Store asset requirements
- `ops/mobile/reviewer-notes-and-test-accounts.md` — Test accounts and App Review notes
- `ops/mobile/testflight-play-internal-runbook.md` — Step-by-step submission runbook
