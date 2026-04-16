# Next 10 Founder Actions

Updated: 2026-04-16

These are the 10 highest-leverage actions the founder should take next to move the platform from "built" to "in market." Ordered by unlock value — each action gates or accelerates subsequent ones.

---

## Action 1: Secure the Apple Developer and Google Play Accounts

**Why first**: Everything in mobile is blocked until these accounts exist.

**Do this**:
1. Go to developer.apple.com → enroll in Apple Developer Program ($99/year)
2. Go to play.google.com/console → pay $25 one-time registration fee
3. Approval takes 24–48 hours for Apple; Google is immediate

**Unlocks**: CORTEX TestFlight Alpha, App Store submission path, push notification setup.

---

## Action 2: Create Firebase Projects for CORTEX Push Notifications

**Why now**: Firebase credentials are required before any EAS production build.

**Do this**:
1. Go to console.firebase.google.com → Create project "CORTEX Production"
2. Add an Android app with package `com.szlholdings.cortex` → download `google-services.json`
3. Add an iOS app with bundle ID `com.szlholdings.cortex` → download `GoogleService-Info.plist`
4. Place both files in `artifacts/cortex-mobile/` (they are gitignored)
5. Create APNs auth key in Apple Developer portal → upload to Firebase iOS config

**Unlocks**: EAS build without placeholder warning, push notification delivery.

---

## Action 3: Create an Expo Account and Link the CORTEX EAS Project

**Why now**: The EAS project ID in `app.json` is a placeholder.

**Do this**:
1. Create account at expo.dev
2. `cd artifacts/cortex-mobile && npx eas init`
3. EAS will replace the placeholder project ID with a real UUID
4. Create an EXPO_TOKEN (Access Tokens in expo.dev account settings) and store it securely

**Unlocks**: `eas build`, `eas submit`, CI-triggered builds.

---

## Action 4: Run the First CORTEX Preview Build and Test on Physical Device

**Why now**: The app has never been tested outside the Expo Go sandbox.

**Do this**:
1. Complete Actions 1–3 above
2. `cd artifacts/cortex-mobile && eas build --profile preview --platform all`
3. Install the APK (Android) and IPA (iOS TestFlight internal) on physical devices
4. Walk through every flow in `ops/mobile/reviewer-notes-and-test-accounts.md`
5. Log any crashes or broken flows — fix before proceeding

**Unlocks**: Confidence that the Alpha is actually shippable. Reveals hidden native compatibility issues.

---

## Action 5: Capture Store Screenshots and Commission the App Icon

**Why now**: Store submissions block on visual assets. Icon design takes time.

**Do this**:
1. Commission CORTEX app icon from a designer: dark background, SZL brand blue, CORTEX wordmark, neural-grid motif. Deliver as 1024×1024 PNG with no transparency.
2. Run CORTEX on iPhone 15 Pro Max simulator → take screenshots of 8 key screens (see `ops/mobile/store-asset-inventory.md` for content plan)
3. Resize screenshots for 6.5" (1284×2778) and Android phone (1080×1920) sizes
4. Create 1024×500 Android feature graphic (dark brand banner)

**Unlocks**: App Store and Play Console store listing completion.

---

## Action 6: Publish Privacy Policy and Terms of Service

**Why now**: Both stores require a privacy policy URL before any app submission.

**Do this**:
1. Publish a privacy policy at `szlholdings.com/legal/privacy` covering: authentication data, push notification tokens, usage analytics, biometric (on-device only)
2. Publish terms of service at `szlholdings.com/legal/terms`
3. Update `app.json` `extra.privacyUrl` and `extra.supportUrl` to point to live URLs

**Unlocks**: App Store Connect store listing, Google Play store listing, GDPR baseline compliance.

---

## Action 7: Create App Records in App Store Connect and Google Play Console

**Why now**: The ASC App ID (needed in `eas.json`) only exists after creating the app record.

**Do this**:
1. App Store Connect → My Apps → "+" → New App → Name: "CORTEX — Unified Command", Bundle ID: `com.szlholdings.cortex`
2. Note the ASC App ID (10-digit number) → update `eas.json` submit section
3. Google Play Console → Create app → "CORTEX — Unified Command" → Business → Free
4. Complete store listings using content from `ops/mobile/store-asset-inventory.md`

**Unlocks**: `eas submit --platform ios/android` — the final submission step.

---

## Action 8: Submit CORTEX to TestFlight and Play Internal Testing

**Why now**: This is the Alpha milestone that proves the mobile path is real.

**Do this**:
1. `eas build --profile production --platform all` (from `artifacts/cortex-mobile/`)
2. `eas submit --platform ios --latest` → build goes to TestFlight
3. `eas submit --platform android --latest` → build goes to Play Console internal testing
4. Create internal tester group in TestFlight: "SZL Team"
5. Add all internal testers → they install via TestFlight/Play
6. Include test notes from `ops/mobile/reviewer-notes-and-test-accounts.md`

**Unlocks**: Real-device internal testing, investor demo on mobile, path to external beta.

---

## Action 9: Wire One High-Value API Connection to Live Data

**Why now**: The platform currently uses seeded demo data for most domain modules. One live connection dramatically raises the credibility of investor demos.

**Recommended first connection**: Vessels commercial module (most complete schema + clearest data source).

**Do this**:
1. Pick the Vessels voyage P&L or freight rate module
2. Ensure the database tables have real or realistic imported data
3. Wire the frontend module to the live API endpoint instead of mock data
4. Test end-to-end: real query → real render → no hardcoded values

**Unlocks**: Credible live demo for shipping/maritime prospects, proof that the data layer works end-to-end.

---

## Action 10: Brief One Investor or Design Partner on the Full Platform

**Why now**: The platform has never been externally validated. Real feedback from a prospect will surface the most important gaps faster than any internal review.

**Do this**:
1. Schedule a 45-minute demo session with one target investor or potential design partner
2. Walk them through: szlholdings.com → CORTEX mobile (TestFlight build) → Vessels or Aegis deep-dive
3. Use the demo account: demo@szlholdings.com
4. Record their questions — every "what does this do?" is a UX gap to fix
5. Leave them with the executive summary: `ops/frontier/executive-summary.md` (adapted for audience)

**Unlocks**: Real market signal, first LOI or investment signal, clarity on what to build next.

---

## Summary Table

| # | Action | Effort | Blocks Without It |
|---|--------|--------|------------------|
| 1 | Apple + Google accounts | 1 hour | CORTEX mobile path |
| 2 | Firebase credentials | 1 hour | Push notifications, EAS builds |
| 3 | Expo account + EAS link | 30 min | All EAS commands |
| 4 | First preview build + device test | 4 hours | Shipping confidence |
| 5 | Screenshots + icon | 1–2 days | Store listings |
| 6 | Privacy policy + TOS | 2 hours | Store submissions |
| 7 | App Store + Play Console records | 1 hour | `eas submit` |
| 8 | Submit to TestFlight + Play Internal | 2 hours | Alpha milestone |
| 9 | Wire one live API connection | 1–2 days | Demo credibility |
| 10 | External brief / demo | 45 min | Market validation |

---

*These 10 actions, executed in order, will advance the platform from pre-Alpha to externally validated Alpha within 2–3 weeks of focused execution.*
