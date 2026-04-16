# Mobile Disposition — SZL Holdings Platform

Generated: 2026-04-16
Authority: Phase 2-3 Product Topology & Portfolio Rationalization

---

## Decision Summary

| Role | App | Rationale |
|------|-----|-----------|
| **Flagship Mobile** | `cortex-mobile` | Full 8-domain unified command; deepest feature set; biometric auth; cross-domain signals |
| **Secondary Warm Path** | `szl-holdings-mobile` | Holdings companion; ship after CORTEX reaches TestFlight; shares mobile-shared lib |
| **Archive** | All stub mobile dirs (deleted in Phase 1) | aegis-mobile, alloy-mobile, carlota-jo-mobile, lyte-mobile, stephen-mobile, terra-mobile, vessels-mobile |

---

## Flagship: CORTEX Mobile (`artifacts/cortex-mobile`)

### Designation Rationale

CORTEX is the correct flagship mobile app because:

1. **Scope breadth** — It is the only mobile app designed to span all 8 business domains (Aegis, Vessels, Terra, Carlota Jo, Command, Lyte, IMPERIUM, SZL Holdings). No other mobile app offers this coverage.
2. **Feature depth** — Biometric auth (Face ID / Touch ID), PIN with SHA-256 lockout, voice commands, push notifications, offline sync via `lib/offline-engine`, cross-domain badge counts.
3. **Strategic fit** — CORTEX is the mobile expression of the "governed operational intelligence" platform story. A single app that surfaces all domain intelligence is a stronger investor narrative than domain-specific companion apps.
4. **Backend integration** — Connects to `api-server` via the same REST/WebSocket/SSE paths used by web surfaces. Shares `lib/mobile-shared` with `szl-holdings-mobile`.
5. **Release readiness** — EAS configuration is in place; has the most complete pre-release checklist of any mobile artifact. Credential files need production values before TestFlight submission (see `ops/mobile/eas-secrets-matrix.md`).

### Release Path

| Stage | Target | Blockers |
|-------|--------|---------|
| Internal Alpha | TestFlight + Play Internal Testing | Production Firebase credentials; push token backend registration |
| Beta | TestFlight External | Deep linking; physical device auth flow testing; screen capture prevention |
| Production | App Store + Google Play | Store listing assets (see `ops/mobile/store-assets-checklist.md`) |

### Bundle ID

`com.szlholdings.cortex`

---

## Secondary Warm Path: SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)

### Designation Rationale

`szl-holdings-mobile` is a validated secondary path because:

1. **Real code exists** — Full Expo app structure, not an empty stub.
2. **Defined audience** — Holdings-specific companion for investors and portfolio stakeholders.
3. **Shared infrastructure** — Uses `lib/mobile-shared` already proven with CORTEX, reducing incremental build cost.
4. **Credential state** — Both `google-services.json` and `GoogleService-Info.plist` contain confirmed placeholder credentials; these must be replaced with production Firebase values before any build.

### Deferral Condition

Ship only after CORTEX achieves stable TestFlight distribution and the first external beta is underway. Estimated trigger: CORTEX beta launch (Phase 4).

---

## Archive: Deprecated Mobile Stubs

All of the following were empty directories with no `package.json` — deleted in Phase 1:

| Directory | Status |
|-----------|--------|
| `artifacts/aegis-mobile` | Deleted — empty stub |
| `artifacts/alloy-mobile` | Deleted — empty stub |
| `artifacts/carlota-jo-mobile` | Deleted — empty stub |
| `artifacts/lyte-mobile` | Deleted — empty stub |
| `artifacts/stephen-mobile` | Deleted — empty stub |
| `artifacts/terra-mobile` | Deleted — empty stub |
| `artifacts/vessels-mobile` | Deleted — empty stub |

Domain-specific mobile functionality is covered by CORTEX workspaces, not separate apps. This is the correct architectural decision: one app, domain-specific workspaces.

---

## Mobile Architecture Principles

1. **One app, not many.** CORTEX is the mobile platform. Domain packs add workspaces to CORTEX, not standalone apps.
2. **Shared lib, not forked code.** `lib/mobile-shared` provides the SyncEngine, OfflineBanner, and common components. Both CORTEX and the SZL Holdings mobile app consume it.
3. **Credentials must be real before builds.** Firebase placeholder values in `szl-holdings-mobile` will cause silent failures. `ops/mobile/eas-secrets-matrix.md` tracks the full credential matrix.
4. **EAS, not local builds.** All production builds go through Expo Application Services. Local builds are for simulator only.
5. **Backend parity.** Mobile surfaces consume the same `api-server` endpoints as web surfaces. No mobile-specific API is created unless there is a measurable performance or capability reason.

---

## Related Files

- `ops/mobile/flagship-mobile-release-plan.md` — Detailed CORTEX pre-release checklist
- `ops/mobile/eas-secrets-matrix.md` — Firebase and EAS credential status
- `ops/mobile/store-assets-checklist.md` — App Store / Play Store asset requirements
- `ops/mobile/testflight-play-internal-runbook.md` — Submission runbooks
