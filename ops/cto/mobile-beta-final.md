# Mobile Beta Final — CTO Disposition

Updated: 2026-04-16
Authority: CTO Pass Phase I

---

## Canonical Mobile App: Confirmed

**`artifacts/szl-holdings-mobile` is the one and only CORTEX mobile app.**

There is no ambiguity. The disposition below is final.

| App | Role | Status |
|-----|------|--------|
| `artifacts/szl-holdings-mobile` | Flagship CORTEX app | Active — all builds, releases, and dev work |
| `artifacts/cortex-mobile` | Empty route scaffold | Archived / deferred — no builds, no releases |

---

## `cortex-mobile` — Archived

`artifacts/cortex-mobile` contains:
- Two empty route directories (`app/auth/`, `app/workspace/`) with no implemented screens
- An auto-generated `expo-env.d.ts` type reference
- No `package.json`, no `app.json`, no `eas.json`
- No implemented components, business logic, or build configuration

It is not buildable, not runnable, and not a release target. Its `DEFERRED.md` file documents this clearly. No work should be directed here.

**Action for any future operator**: If you encounter `artifacts/cortex-mobile`, ignore it or refer to `DEFERRED.md`. All mobile work belongs in `artifacts/szl-holdings-mobile`.

---

## Store-Facing Materials Audit

The following items are documented in `ops/mobile/store-asset-inventory.md`. This section flags any description, permission, or screenshot claim that overstates the current feature set as of this audit.

### Flags — Items That Overstate the Current Build

| Item | Location | Issue | Disposition |
|------|----------|-------|-------------|
| AR property intelligence overlays | `app.json` `NSCameraUsageDescription` | AR overlay is not yet implemented. Camera currently used for QR scanning and document capture only. | Update permission string before App Store submission to remove AR overlay claim. |
| AR property viewer screenshot plan | `store-asset-inventory.md` screenshot #7 | "AR property viewer" listed as screenshot; the feature is a placeholder per reviewer notes. | Remove from screenshot plan until AR is implemented. Replace with a different differentiator screen. |
| Voice command interface (screenshot #5) | `store-asset-inventory.md` | Voice command UI exists in the app shell; functional implementation status should be verified on device before using as a primary store screenshot. | Confirm voice routing is functional on physical device before including in store submission. |
| Screen capture prevention | `flagship-release-readiness.md` | `expo-screen-capture` is installed but not yet invoked on sensitive screens. Not a store-facing overstatement, but a security claim that is incomplete. | Do not list "screen capture prevention" as a feature in store copy until the invocation is wired. |

### Items Confirmed Accurate

| Item | Status |
|------|--------|
| 8 domain workspaces (list in store description) | All 8 workspace tiles are wired in the app |
| Biometric auth (Face ID / Touch ID) | Fully implemented via `expo-local-authentication` |
| PIN fallback with secure enclave | Implemented via `expo-secure-store` |
| 5-attempt lockout | Implemented in auth logic |
| Push notifications config | Plugin configured; functional after Firebase credentials are in place |
| Offline mode with sync | `SyncEngineProvider` + `OfflineBanner` from `mobile-shared` |
| Bundle ID and app name | `com.szlholdings.executive.mobile`, "CORTEX" — correct |
| Age rating (4+) | No objectionable content — accurate |
| Privacy policy / support URLs | Configured in `app.json` extra fields |
| `ITSAppUsesNonExemptEncryption: false` | Correctly set in `app.json` |

### Permissions vs Reality

| Permission | Declared Rationale | Actual Use | Flag? |
|------------|-------------------|------------|-------|
| Face ID (`NSFaceIDUsageDescription`) | Secure command access | Implemented | No |
| Camera (`NSCameraUsageDescription`) | AR overlays + document scanning | QR/document only (AR not implemented) | Yes — revise string |
| Notifications (`NSUserNotificationUsageDescription`) | Alerts and briefings | Implemented (after Firebase creds) | No |
| Android INTERNET | API calls | Required | No |
| Android USE_BIOMETRIC / USE_FINGERPRINT | Biometric auth | Implemented | No |
| Android POST_NOTIFICATIONS | Push alerts | Implemented (after Firebase creds) | No |
| Android RECEIVE_BOOT_COMPLETED | Background sync resume | Standard; verify it is actively used | Low priority |

---

## Beta Narrative Guidance

The CORTEX app is a real, functional executive command app — not a prototype. The beta story should reflect that clearly without overselling future capabilities.

**What to say:**

> CORTEX is the SZL Holdings mobile app. It provides access to eight business domain workspaces from a single secured interface. Biometric auth, offline sync, cross-domain alerts, and swipe-to-action cards are working in this build. The beta goal is to find anything broken or confusing before the public launch.

**What to avoid saying:**

- "AR property intelligence overlays" — not yet implemented
- "Voice-activated command interface" — verify functional completeness before including
- "Screen capture protection" — not yet wired in app code

**Tone**: Confident and factual. The app ships real functionality. Beta testers should know what works and what is coming.

---

## Related Files

- `artifacts/cortex-mobile/DEFERRED.md` — archived scaffold notice
- `ops/mobile/mobile-disposition.md` — full disposition rationale
- `ops/mobile/flagship-release-readiness.md` — pre-release checklist and go/no-go gate
- `ops/mobile/store-asset-inventory.md` — complete store asset requirements
- `ops/cto/manual-console-actions-master.md` — required external console actions
- `ops/cto/beta-support-flow.md` — full beta lifecycle from invite to release notes
