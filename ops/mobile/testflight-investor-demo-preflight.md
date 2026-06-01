# TestFlight Investor Demo — Preflight Checklist

Updated: 2026-04-18

> **Purpose**: A focused, sequential checklist for getting CORTEX onto investor
> iPhones via TestFlight. This is a condensed version of the full operator
> setup guide — use `artifacts/szl-holdings-mobile/SETUP.md` for the
> step-by-step walkthrough with explanations.

---

## Phase 1 — Accounts and Tools (one-time)

- [ ] Apple Developer Program membership active (developer.apple.com — $99/year)
- [ ] Expo account created at expo.dev
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS CLI: `eas login`
- [ ] App record created in App Store Connect → My Apps → "+" → iOS App
  - Name: **CORTEX**
  - Bundle ID: `com.szlholdings.executive.mobile`
  - Note the 10-digit **Apple ID (ASC App ID)**

---

## Phase 2 — Project Linking

- [ ] Run `eas init` inside `artifacts/szl-holdings-mobile`
- [ ] Copy the EAS project UUID into **both** places in `app.json`:
  - `extra.eas.projectId`
  - `updates.url` (replace the placeholder UUID in the URL)
- [ ] Set `updates.enabled` to `true` in `app.json`
- [ ] Fill in `eas.json` `submit.testflight.ios`:
  - `appleId` → your Apple ID email
  - `appleTeamId` → developer.apple.com → Membership → Team ID
  - `ascAppId` → 10-digit ID from App Store Connect

---

## Phase 3 — EAS Environment Variables

These are baked into the binary at build time. Without them the app starts but
cannot reach the backend or authenticate users.

```bash
cd artifacts/szl-holdings-mobile

eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN \
  --value "YOUR_REPLIT_DOMAIN"
# Example: "my-project.username.repl.co"

eas secret:create --scope project --name EXPO_PUBLIC_REPL_ID \
  --value "YOUR_REPL_ID"
# Find this: echo $REPL_ID in the Replit shell
```

- [ ] `EXPO_PUBLIC_DOMAIN` secret created (Replit production domain, no https://)
- [ ] `EXPO_PUBLIC_REPL_ID` secret created (Replit project ID)

---

## Phase 4 — Firebase Credentials

Push notifications require real Firebase files — the placeholders in the repo
will cause the build to succeed but push will be non-functional.

- [ ] Firebase project created at console.firebase.google.com
- [ ] iOS app added (bundle ID: `com.szlholdings.executive.mobile`)
- [ ] `GoogleService-Info.plist` downloaded → copied to `artifacts/szl-holdings-mobile/`
- [ ] APNs Auth Key (.p8) created in Apple Developer portal → Certificates, Identifiers & Profiles → Keys
- [ ] APNs Auth Key uploaded to Firebase Console → Project Settings → Cloud Messaging → iOS app

> **Note**: If push notifications are not required for the investor demo, you can
> skip the APNs key upload. The app will build and run without it — only push
> delivery will fail silently.

---

## Phase 5 — Build

```bash
cd artifacts/szl-holdings-mobile

# Build iOS for TestFlight internal distribution
eas build --profile testflight --platform ios
```

EAS will:
1. Prompt for Apple credentials on first run (or use stored remote credentials)
2. Auto-generate an App Store Distribution Certificate and App Store Provisioning Profile
   (required for TestFlight — this is different from an ad hoc profile used for direct
   device installs)
3. Upload the signed `.ipa` to expo.dev

Build time: approximately 20–40 minutes.

- [ ] Build completes without errors on expo.dev dashboard
- [ ] iOS `.ipa` artifact available for download (or ready for `eas submit`)

---

## Phase 6 — Submit to TestFlight

```bash
# Submit the latest iOS build to TestFlight
eas submit --profile testflight --platform ios --latest
```

- [ ] Build appears in App Store Connect → TestFlight → iOS Builds
- [ ] Build passes Apple's automated checks (takes 15–30 min)
- [ ] Build is eligible for internal testing (no Apple review required for internal)

---

## Phase 7 — TestFlight Internal Group

In App Store Connect → CORTEX → TestFlight:

- [ ] Create group: **"SZL Investor Demo"**
- [ ] Add internal testers by Apple ID email (up to 100 testers, instant access)
- [ ] Add test notes:

  ```
  Test Account
  Email:    demo@szlholdings.com
  Password: [retrieve from password manager — do not write here]

  Demo flow:
  1. Launch → biometric prompt (Face ID or tap "Use PIN")
  2. Sign In → authenticate via Replit OAuth
  3. Verify 8 domain workspace tiles on the home screen
  4. Open Vessels workspace → browse signal feed
  5. Switch to Aegis workspace
  6. Enable airplane mode → confirm offline banner appears
  7. Re-enable network → confirm sync resumes
  ```

- [ ] TestFlight invite sent to all demo attendees

---

## Phase 8 — On-Device Verification

Test these on a physical iPhone before the investor meeting:

- [ ] App launches without crash
- [ ] Biometric (Face ID / Touch ID) prompt appears on launch
- [ ] Auth screen loads; Sign In button works
- [ ] OAuth flow completes; user is redirected to the shell
- [ ] All 8 domain workspace tiles are visible on the home screen
- [ ] Vessels workspace opens and shows a signal feed (or "No signals" empty state)
- [ ] Offline banner appears when airplane mode is enabled
- [ ] Offline banner dismisses and sync resumes when network is restored
- [ ] Navigator (AI chat FAB) opens and responds to a query

---

## Investor Demo Script (2–3 minutes)

1. Launch app → show biometric unlock (Face ID)
2. Home screen → point out 8 domain workspaces (Defense, Fleet, Properties, Operations, Advisory, Portfolio, Intelligence, Founder)
3. Tap **Vessels** → show maritime signal feed
4. Tap **Aegis** (Defense) → show correlated security signal
5. Enable airplane mode → show offline banner and "Governed Autonomy" principle
6. Re-enable network → show sync resuming
7. Tap Navigator FAB → ask "What needs my attention today?" → show AI response

**Key talking points:**
- Unified command across all business domains in one app
- Biometric auth + governed approvals — every action is attributed
- Works offline — sync resumes automatically
- Operator-grade, not a demo mockup — same data as the web platform

---

## Rollback

If a build has issues:
- App Store Connect → TestFlight → stop distributing the current build
- Distribute the previous build instead (no re-submission required)

---

## Related Documentation

- Full operator setup: `artifacts/szl-holdings-mobile/SETUP.md`
- EAS profiles and secrets: `ops/mobile/eas-and-store-secrets-matrix.md`
- Release readiness matrix: `ops/mobile/flagship-release-readiness.md`
- Push notification setup: `ops/mobile/push-notification-setup.md`
- Reviewer notes: `ops/mobile/reviewer-notes-and-test-accounts.md`
- Investor demo scenario: `ops/benchmark/mobile-series-a-pass.md`
