# Flagship Mobile Release Readiness — CORTEX

Updated: 2026-04-16

## Flagship Identification

**CORTEX** lives in `artifacts/szl-holdings-mobile`. The app is named "CORTEX" in `app.json`
and provides unified command access across all 8 SZL Holdings business domains. It is the
sole flagship mobile app for initial release.

`artifacts/cortex-mobile` contains partial route scaffolding only (no `package.json`, no
`app.json`). Its route files (`app/auth`, `app/workspace`) are deferred pending an
architectural decision. See `mobile-disposition.md` for full context.

**First-run operator guide**: `artifacts/szl-holdings-mobile/SETUP.md`

---

## App Identity

| Field | Value |
|-------|-------|
| Directory | `artifacts/szl-holdings-mobile` |
| App Name | CORTEX |
| iOS Bundle ID | `com.szlholdings.executive.mobile` |
| Android Package | `com.szlholdings.executive.mobile` |
| Version | 2.0.0 |
| Build Number | 1 (auto-increments via EAS `autoIncrement: true`) |
| Deep Link Scheme | `szl-holdings://` |

---

## Readiness Matrix

Items are split into two tracks:

### Track 1 — Code-Ready (already in repo, no operator action needed)

| Item | Status | Notes |
|------|--------|-------|
| iOS Bundle ID | Ready | `com.szlholdings.executive.mobile` in `app.json` |
| Android package name | Ready | Same as bundle ID |
| App version | Ready | 2.0.0 |
| EAS build profiles | Ready | dev / preview / production in `eas.json` |
| EAS CLI version requirement | Ready | `>= 16.0.0` |
| EAS credentials source | Ready | `credentialsSource: "remote"` on production |
| EAS auto-increment | Ready | Build number auto-increments |
| App icon (iOS) | Ready | `./assets/images/icon.png` (1024×1024) |
| Adaptive icon (Android) | Ready | Foreground + `#090810` background |
| Splash screen | Ready | `./assets/images/splash-icon.png`, `#090810` bg |
| Face ID permission string | Ready | `NSFaceIDUsageDescription` in `infoPlist` |
| Camera permission string | Ready | `NSCameraUsageDescription` in `infoPlist` |
| Notifications permission string | Ready | `NSUserNotificationUsageDescription` in `infoPlist` |
| Android permissions | Ready | Internet, Biometric, Notifications declared |
| iOS Privacy Manifest | Ready | `NSPrivacyAccessedAPITypes` configured |
| Encryption compliance | Ready | `ITSAppUsesNonExemptEncryption: false` |
| Biometric auth plugin | Ready | `expo-local-authentication` configured |
| Push notifications plugin | Ready | `expo-notifications` configured |
| Secure storage plugin | Ready | `expo-secure-store` configured |
| New Architecture | Ready | `newArchEnabled: true` |
| Shared mobile library | Ready | `@szl-holdings/mobile-shared` consumed |
| Credential template files | Ready | `*.template` files in app directory |
| `.gitignore` | Ready | Excludes all credential files |

### Track 2 — Operator Action Required (cannot be completed in repo)

These require external accounts and must be completed by an operator before the first build.
See `artifacts/szl-holdings-mobile/SETUP.md` for the step-by-step walkthrough.

| Item | Blocking? | Action Required |
|------|-----------|----------------|
| EAS project UUID | Yes | Run `eas init` in app dir; set UUID in `app.json` |
| OTA updates enabled | No (post-UUID) | Set `updates.enabled: true` after UUID is set |
| Firebase `google-services.json` | Yes | Download from Firebase Console → replace placeholder |
| Firebase `GoogleService-Info.plist` | Yes | Download from Firebase Console → replace placeholder |
| APNs Auth Key | Yes (iOS push) | Create in Apple Developer portal → upload to Firebase |
| Apple ID (appleId in eas.json) | Yes (submit only) | Your Apple account email |
| Apple Team ID | Yes (submit only) | developer.apple.com → Membership |
| ASC App ID | Yes (submit only) | Create app in App Store Connect, copy 10-digit ID |
| Google Play service account key | Yes (submit only) | Create in Play Console → API access → replace placeholder |
| Push token backend route | Yes (push) | Create `POST /api/push/register` in `api-server` |

---

## Release Ladder

| Phase | Target | Gate |
|-------|--------|------|
| Alpha | TestFlight Internal + Play Internal | All "operator action" blocking items complete |
| Beta | Expanded TestFlight + Play Closed | Crash rate below 0.1%; Sentry integrated |
| Production | App Store + Play Store | App review approval; all store assets complete |

---

## Go / No-Go Checklist (Alpha Gate)

- [ ] `eas init` completed; real UUID in `app.json`; `updates.enabled: true`
- [ ] Real `google-services.json` in place (not placeholder)
- [ ] Real `GoogleService-Info.plist` in place (not placeholder)
- [ ] APNs key uploaded to Firebase Console
- [ ] `eas build --profile preview --platform ios` succeeds
- [ ] `eas build --profile preview --platform android` succeeds
- [ ] Biometric + PIN auth verified on physical iOS and Android device
- [ ] Push notification received end-to-end (requires push token backend route)
- [ ] Offline banner shows; sync restores on reconnect
- [ ] TestFlight internal build accepted by App Store Connect

---

## Known Code-Level Gaps (to address before Beta)

1. **Push token backend** — `POST /api/push/register` does not exist in `api-server`.
   Required for the app to register device tokens. See `push-notification-setup.md`.
2. **Screen capture prevention** — `expo-screen-capture` is installed; not yet invoked
   on sensitive workspace screens.
3. **Sentry crash reporting** — Not yet integrated. Add `@sentry/react-native` before Beta.

---

## Deferred

| Path | Status | Notes |
|------|--------|-------|
| `artifacts/cortex-mobile` | Deferred | Partial scaffold; no build config; see `mobile-disposition.md` |

---

*Source of truth for mobile release gating. Update status fields as items resolve.*
