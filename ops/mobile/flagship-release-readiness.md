# Flagship Mobile Release Readiness — CORTEX

Updated: 2026-04-16

## Flagship Selection Rationale

**CORTEX** (`artifacts/cortex-mobile`) is the sole flagship mobile app for the initial release. It provides unified access to all 8 SZL Holdings business domains in a single native app and is the highest-value mobile surface in the portfolio.

`szl-holdings-mobile` is deferred until CORTEX ships and proves the platform.

---

## Release Readiness Matrix

| Area | Status | Blocking? | Notes |
|------|--------|-----------|-------|
| Bundle ID configured | Pending | Yes | Set `com.szlholdings.cortex` in app.json |
| App version set | Pending | Yes | Set to `1.0.0` |
| EAS project linked | Pending | Yes | Run `eas init` in cortex-mobile |
| App icons (all sizes) | Pending | Yes | Generate via Expo icon pipeline |
| Splash screen | Pending | No | Should reflect SZL brand palette |
| Biometric auth | Ready | — | expo-local-authentication implemented |
| PIN fallback | Ready | — | SHA-256 hashed, 5-attempt lockout |
| Secure storage | Ready | — | expo-secure-store configured |
| Deep link scheme | Pending | No | `cortex://` scheme needed |
| Camera permission rationale | Pending | Yes | Required by App Store review |
| Location permission rationale | Pending | Yes | Required by App Store review |
| Notifications permission | Pending | Yes | Required by App Store review |
| Push token registration | Pending | Yes | Backend endpoint `/api/push/register` needed |
| Firebase google-services.json | Pending | Yes | Replace placeholder before build |
| Firebase GoogleService-Info.plist | Pending | Yes | Replace placeholder before build |
| Offline mode verified | Pending | No | Test on physical device |
| Screen capture prevention | Pending | No | Sensitive workspace protection |
| Privacy manifest (iOS) | Pending | Yes | Required for iOS 17+ |
| Physical device test | Pending | Yes | Auth, push, offline, sync |
| Sentry crash reporting | Pending | No | Recommended before Alpha |

---

## Release Ladder

| Phase | Target | Gate |
|-------|--------|------|
| Alpha | TestFlight Internal + Play Internal | All blocking items resolved |
| Beta | Expanded TestFlight + Play Closed | Zero crash rate <0.1% |
| Production | App Store + Play Store | App review approval |

---

## Known Technical Gaps Before Alpha

1. **EAS Project ID** — `app.json` has placeholder UUID; must run `eas init`
2. **Firebase credentials** — placeholder files in repo; real files must be in `.gitignore`
3. **Push token backend** — no route exists at `/api/push/register` yet
4. **Privacy Manifest** — `PrivacyInfo.xcprivacy` file required for iOS 17 compliance
5. **Store screenshots** — none captured; need physical device or simulator renders
6. **App Store Connect app record** — not yet created; ASC App ID unknown

---

## Go / No-Go Checklist (Alpha Gate)

- [ ] `eas build --profile preview --platform all` succeeds without errors
- [ ] Biometric + PIN auth works on physical iOS and Android device
- [ ] Push notification arrives from backend trigger
- [ ] Offline mode shows banner; sync restores on reconnect
- [ ] No P0 crashes in Sentry within 15-minute smoke session
- [ ] Firebase config files verified (not placeholders)
- [ ] TestFlight build accepted by App Store Connect

---

## Deferred Apps

| App | Status | Resume Trigger |
|-----|--------|----------------|
| szl-holdings-mobile | Deferred | After CORTEX Alpha ships |
| All other mobile stubs | Archived | Not scheduled |

---

*Source of truth for mobile release gating. Update status fields as each item is resolved.*
