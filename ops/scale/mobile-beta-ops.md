# Mobile Beta Ops (CORTEX)

Phase G · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

How the canonical CORTEX mobile app is operated through internal alpha
→ TestFlight + Play Internal → public store release. Built on the
Phase K Mobile Honest Pass deliverables.

## Canonical Path — Reaffirmed

| Class | Artifact | Status |
|-------|----------|--------|
| Canonical | `artifacts/szl-holdings-mobile` | Active CORTEX app; full Expo + EAS config |
| Deferred scaffold | `artifacts/cortex-mobile` | Empty Expo Router scaffold; no `package.json` / `app.json`; carries `artifacts/cortex-mobile/DEFERRED.md` |

All mobile work happens in `artifacts/szl-holdings-mobile`. Source of
truth: `ops/mobile/phase-k-mobile-honest-pass.md`.

## Phase Map

| Phase | Audience | Distribution | Source of Procedure |
|-------|----------|--------------|---------------------|
| Internal alpha | Founder + engineering | Local Expo Go + dev builds | `artifacts/szl-holdings-mobile/SETUP.md` |
| TestFlight + Play Internal | Internal team + invited founder beta testers | EAS production builds → TestFlight + Play Internal track | `ops/mobile/testflight-play-internal-runbook.md` |
| External beta | Invited design partners + their executives | TestFlight external + Play closed beta | Same runbook |
| Public release | Anyone | App Store + Google Play | Same runbook + store listing |

The platform is currently at the boundary between Internal Alpha and
TestFlight + Play Internal. The boundary requires real EAS + Firebase
credentials per the secrets matrix.

## Exit Criteria — Internal Alpha to TestFlight

All must pass:

- [ ] EAS project linked (`eas init` complete inside the canonical dir)
- [ ] Real Firebase configs in place (`google-services.json`,
      `GoogleService-Info.plist`) — not the `.example` placeholders
- [ ] Real `google-play-service-account.json` in place
- [ ] Bundle ID `com.szlholdings.executive.mobile` registered in Apple
      Developer + Google Play
- [ ] `eas build --profile preview --platform ios` succeeds
- [ ] `eas build --profile preview --platform android` succeeds
- [ ] App installs and runs cleanly on iPhone 13+ and Pixel 6+
- [ ] Biometric auth works on physical devices (not simulator)
- [ ] PIN setup + 5-attempt lockout works
- [ ] Offline mode + sync resumption verified on airplane mode
- [ ] Sentry initialized (recommended pre-Alpha per
      `ops/mobile/testflight-play-internal-runbook.md`)

## Exit Criteria — TestFlight to External Beta

All must pass:

- [ ] ≥3 internal testers have installed and used CORTEX for ≥1 week
- [ ] No crash-on-launch reports for 7 consecutive days
- [ ] At least one domain workspace renders real data end-to-end
- [ ] Push notifications delivered to ≥3 testers
- [ ] Reviewer notes drafted per `ops/mobile/reviewer-notes-and-test-accounts.md`

## Exit Criteria — External Beta to Public Release

All must pass:

- [ ] ≥10 external testers have used CORTEX for ≥2 weeks
- [ ] All required store listing assets in place per
      `ops/mobile/store-asset-inventory.md`
- [ ] Privacy Manifest complete (iOS)
- [ ] Data Collection Disclosure complete (both platforms)
- [ ] Privacy policy URL live (`https://szlholdings.com/legal/privacy`)
- [ ] Support URL live (`https://szlholdings.com/contact`)
- [ ] Mobile crash rate <1% of sessions over the last 7 days
- [ ] Reviewer test account credentials handed off in TestFlight + Play
      reviewer notes

## Operator Cadence

| Cadence | Action | Owner |
|---------|--------|-------|
| Per JS-only fix | OTA update via `eas update --channel production` | Engineering |
| Per native change | New EAS build + TestFlight + Play submission | Engineering |
| Weekly during alpha | Sentry crash review | Founder + Engineering |
| Per release | Update `what-changed.md` with mobile entry | Founder |
| Quarterly | App store assets and reviewer notes refreshed | Founder + Engineering |

## Manual Console Actions for Mobile

All operator console actions for CORTEX are listed in
`manual-console-actions-master.md`. The mobile-specific ones include:

- EAS project creation + linking
- TestFlight build distribution
- Play Internal track upload
- Store listing creation (App Store Connect + Play Console)
- Reviewer notes hand-off

## Rollback for Mobile

| Issue Type | Path |
|-----------|------|
| JS-only bug | OTA via `eas update --channel production --rollback-to-embedded` or new fix update |
| Native bug | Stop distribution (TestFlight) or halt rollout (Play); revert to previous release; ship JS-only OTA fix |
| Privacy / data leak | Immediate stop on both stores; P0 incident per `incident-triage-model.md` |

## What Mobile Beta Does NOT Cover

- Push notification routing changes (separate task per existing
  follow-up board)
- Custom splash screen / icon (separate task per existing follow-up)
- Cross-domain badge counts (separate task per existing follow-up)
- App store submission to public availability — this is gated on the
  exit criteria above

## Truth Statement

Mobile is a governed command surface for existing tenants, not a
standalone consumer product. Any positioning that contradicts this
contradicts `ops/mobile/phase-k-mobile-honest-pass.md` and is rejected.
