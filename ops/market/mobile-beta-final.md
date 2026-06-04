# Mobile Beta — Final

**Last updated:** April 2026  
**Canonical mobile path:** `artifacts/szl-holdings-mobile` (CORTEX-style unified command app)

---

## One Canonical Mobile Path

SZL Holdings has one mobile beta path. There are two mobile apps in the codebase:

| App | Directory | Status | Path Forward |
|---|---|---|---|
| szl-holdings-mobile | `artifacts/szl-holdings-mobile` | **Canonical** — primary mobile beta | TestFlight + Play Internal Testing |
| cortex-mobile | `artifacts/cortex-mobile` (if exists) | Deferred | Defer to post-first-production |

**Decision:** szl-holdings-mobile is the flagship mobile app for the design partner and beta phase. It is the CORTEX-style unified command surface — all domain workspaces in one app. Do not run two parallel mobile betas. Split attention kills both.

---

## App Identity

| Field | Value |
|---|---|
| App name | CORTEX (or "SZL Holdings" — confirm brand decision before store submission) |
| iOS Bundle ID | `com.szlholdings.executive.mobile` |
| Android Package | `com.szlholdings.executive.mobile` |
| Directory | `artifacts/szl-holdings-mobile` |

---

## Current Mobile Capabilities

The mobile app provides unified command access to all domain workspaces:

**Authentication:**
- Biometric auth (Face ID / Touch ID) via expo-local-authentication
- PIN setup with SHA-256 hashing via expo-crypto
- Secure storage via expo-secure-store
- 5-attempt lockout with 30-second cooldown
- Status: Built and functional

**Offline:**
- SyncEngineProvider + OfflineBanner in mobile-shared
- Status: Built — needs verification on physical device in airplane mode

**Push Notifications:**
- expo-notifications configured
- Daily digest scheduling built
- Status: Token registration with backend needs verification

**Domain workspaces:**
- All 8 domain workspace tiles on home screen
- Per-domain navigation and content
- Status: Functional

---

## Beta Lifecycle

```
Internal build → TestFlight Internal → Play Internal Testing → Invited Beta → Production
```

### Phase 1: Internal Build (Current)

**Who:** Founder + 1–2 internal reviewers  
**Purpose:** Verify core flows work on real devices  
**Target:** Before first design partner pilot goes live  

**What to verify:**
- [ ] Auth flow: biometric prompt → PIN → login → workspace access
- [ ] All 8 domain workspace tiles visible on home screen
- [ ] Tap domain workspace → content loads
- [ ] Offline mode: airplane mode → OfflineBanner appears
- [ ] Network reconnection → sync resumes
- [ ] Settings → Security → biometric re-enrollment works
- [ ] Push notification received on device

---

### Phase 2: TestFlight Internal (Alpha)

**Who:** Design partners + invited internal testers (up to 100 on TestFlight, no Apple review required)  
**Purpose:** Partner validation of mobile command access  
**Target:** Concurrent with first design partner pilot activation  

**TestFlight setup:**
1. Register App ID in Apple Developer Portal
2. Create app in App Store Connect
3. Note 10-digit ASC App ID → add to `eas.json`
4. Build: `eas build --profile preview --platform ios`
5. Submit: `eas submit --profile production --platform ios --latest`
6. Create internal testing group "SZL Design Partners"
7. Add testers by Apple ID email

**Test notes for TestFlight (do not hardcode credentials):**
```
Test Account:
Email:    [retrieve from Replit Secrets: SMOKE_TEST_EMAIL]
Password: [retrieve from Replit Secrets: SMOKE_TEST_PASSWORD]
```

---

### Phase 3: Play Internal Testing (Alpha)

**Who:** Android users in design partner cohort  
**Purpose:** Android parity with iOS alpha  
**Target:** Concurrent with TestFlight Internal  

**Play Console setup:**
1. Create app in Google Play Console
2. Complete mandatory store listing fields
3. Link Google Cloud project, create service account with Release Manager permissions
4. Download JSON key → `artifacts/szl-holdings-mobile/google-play-service-account.json`
5. Build: `eas build --profile production --platform android`
6. Submit: `eas submit --profile production --platform android --latest`
7. Add testers by email to internal testing track

---

### Phase 4: Invited Beta (External Beta)

**Who:** Wider invited audience — prospective customers, advisors, press  
**Trigger:** At least one design partner has successfully used the alpha and provided written validation  
**Platform:** TestFlight external testing (up to 10,000 testers, Apple review required) + Play closed testing  

---

### Phase 5: Production (App Store / Play Store)

**Who:** Public  
**Trigger:** First paying customer onboarded and mobile is core to their agreement  
**Requires:** Full store listing assets, privacy manifest (iOS), App Store review  

---

## EAS Configuration

EAS build profiles in `eas.json` (confirm actual values in file):

| Profile | Distribution | Purpose |
|---|---|---|
| development | Internal (simulator) | Local development builds |
| preview | Internal | TestFlight / Play Internal distribution |
| production | Store | App Store / Play Store release |

---

## EAS Secrets Required

| Secret | Used For | Status |
|---|---|---|
| `EXPO_TOKEN` | CI-triggered builds | Set in EAS Secrets when CI is configured |
| `APPLE_TEAM_ID` | iOS signing | Set in `eas.json` or EAS Secrets |
| `ASC_APP_ID` | App Store Connect submission | Set when App Store Connect app is created |
| `SENTRY_DSN` | Crash reporting | Set in EAS Secrets when Sentry is configured |

Firebase credentials:
- `google-services.json` → required before EAS build; `.gitignore` prevents accidental commit
- `GoogleService-Info.plist` → required before iOS EAS build

**All credentials go in EAS Secrets or local files excluded by `.gitignore`. No credentials in source code.**

---

## OTA Updates

Once EAS project UUID is set in `app.json` and `updates.enabled: true`:

```bash
# Push a JS-only update without store re-submission
eas update --channel production --message "Fix: [description]"

# Rollback OTA update
eas update --channel production --rollback-to-embedded
```

OTA updates work for JavaScript changes only. Native code changes (new SDK additions, permission changes) require a new store build.

---

## Store Assets Required Before Production

| Asset | Spec | Status |
|---|---|---|
| App icon | 1024×1024 PNG | Needed |
| iPhone screenshots (6.7") | 1290×2796 | Needed |
| iPhone screenshots (6.5") | 1284×2778 | Needed |
| iPad screenshots | 2048×2732 | Needed |
| Android phone screenshots | 1080×1920 | Needed |
| Android feature graphic | 1024×500 | Needed |
| App description | 4000 chars max | Draft needed |
| Privacy policy URL | Required | szlholdings.com/legal/privacy |
| iOS Privacy Manifest | NSPrivacyTrackedData etc. | Needed |

---

## Mobile SLOs

| SLO | Target |
|---|---|
| App launch time (cold start) | < 2 seconds |
| Crash rate | < 1% of sessions |
| Offline sync time (on reconnection) | < 30 seconds |

---

*See also: `ops/mobile/testflight-play-internal-runbook.md` (detailed submission steps), `beta-support-flow.md` (beta support escalation)*
