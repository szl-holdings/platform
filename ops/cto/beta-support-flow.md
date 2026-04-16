# Beta Support Flow — CORTEX Mobile

Updated: 2026-04-16
Authority: CTO Pass Phase I

This document defines the complete beta lifecycle for the CORTEX mobile app. Each stage is described with the inputs required, the actions taken, the artifacts produced, and the owner. The lifecycle runs from initial invite through post-beta release notes.

---

## Beta Lifecycle Overview

```
Invite → Access → Setup → Feedback → Crash/Support → Release Notes
```

Each stage gates the next. Do not move a tester forward until their current stage is confirmed complete.

---

## Stage 1: Invite

**Goal**: Get the right people into the beta with minimal friction and no confusion about access level.

### iOS (TestFlight)

1. Operator opens App Store Connect → CORTEX → TestFlight → Internal Testing group "SZL Team".
2. Add tester Apple ID emails one at a time, or upload a CSV. Up to 100 internal testers.
3. TestFlight sends an email invite from Apple automatically.
4. For external beta (post-Alpha): TestFlight → External Testing → Create group → Add up to 10,000 testers → Submit for App Review (required for external groups).

### Android (Play Internal Testing)

1. Operator opens Play Console → CORTEX → Testing → Internal testing → Testers tab.
2. Add tester emails to a named list (e.g., "SZL Team"). Save the list.
3. Share the opt-in URL displayed on the tester list page. Testers must visit the URL to opt in before they can install.

### Invite Message Template

> Subject: CORTEX Mobile Beta — Your Access Is Ready
>
> You have been added to the CORTEX internal beta. CORTEX is the SZL Holdings mobile app. It provides access to eight business domain workspaces from a single secured interface. This is a pre-release build — you are helping us verify the experience before launch.
>
> [iOS] Accept your TestFlight invite from Apple to install.
> [Android] Use this link to opt in, then install from the Play Store: [OPT_IN_URL]
>
> Your access is internal and confidential. Please do not share the opt-in link or screenshots outside the team.
>
> For support or feedback: mobile-feedback@szlholdings.com

---

## Stage 2: Access

**Goal**: Tester has the app installed, signed in, and can see the home dashboard.

### Tester Steps

1. Accept TestFlight invite (iOS) or visit opt-in URL and install from Play Store (Android).
2. Open CORTEX.
3. On first launch: biometric prompt appears. If biometric is unavailable, tap "Use PIN".
4. Enter the PIN provided in the TestFlight notes or release notes (retrieve from password manager; never store in plain text here).
5. Home dashboard loads — all 8 domain workspace tiles should be visible.

### Operator Verification

- Confirm the tester shows as "Installed" in TestFlight or Play Console.
- If a tester cannot get past the auth screen, escalate to Stage 5 (Crash/Support) immediately — do not let them wait.

### Known Access Gate Issues

| Issue | Cause | Resolution |
|-------|-------|-----------|
| "No builds available" in TestFlight | Build not yet processed by Apple | Wait 15–30 min after submit; check App Store Connect build status |
| Android app not showing in Play Store | Tester has not accepted opt-in URL | Resend the opt-in URL; tester must click it from the device they intend to install on |
| Biometric prompt loops | No biometric enrolled on device | Tap "Use PIN" to proceed; biometric setup can be done later in Settings |
| App crashes on launch | Firebase credentials not in build | This is a known Alpha-phase issue if credentials were not replaced before `eas build`. Requires a new build with real credentials. |

---

## Stage 3: Setup

**Goal**: Tester understands what to test, how to report feedback, and what is known to be incomplete.

### What to Send Testers After Access Is Confirmed

```
Welcome to the CORTEX Beta

What works:
• All 8 domain workspaces (tap any tile on the home screen)
• Biometric + PIN authentication
• Offline mode (enable airplane mode — look for the orange banner)
• Cross-domain signal feed (home screen)
• Swipe-to-action cards

Known gaps in this build:
• Push notifications require a setup step we are completing — expect them in the next build
• Voice command interface is functional but limited; more commands coming
• AR property viewer in Terra is a placeholder — the full feature is in development

How to test:
1. Open each workspace and navigate at least two levels deep
2. Enable airplane mode for 2 minutes, then return to the app and re-enable
3. Tap the mic icon and try a spoken command ("Show Vessels alerts")
4. Try locking the app and unlocking with biometric or PIN

Report anything that breaks, confuses, or feels wrong.
Feedback: mobile-feedback@szlholdings.com or in-app feedback button (Settings → Send Feedback)
```

### Operator Setup Checklist

- [ ] Demo account seeded with realistic data (`POST /api/admin/seed/reset-demo` to restore)
- [ ] TestFlight notes / Play release notes include PIN reference (password manager pointer, not plain text)
- [ ] Known issues section is current for this build
- [ ] Feedback email inbox is monitored

---

## Stage 4: Feedback

**Goal**: Collect structured, actionable feedback from testers. Avoid feedback that cannot be acted on.

### Feedback Channels

| Channel | Use Case | Owner |
|---------|----------|-------|
| `mobile-feedback@szlholdings.com` | General feedback, confusion, UX issues | Product / CTO |
| In-app feedback button (Settings → Send Feedback) | Quick one-tap reports with device context | Product |
| TestFlight tester feedback | iOS testers can leave feedback directly in TestFlight | Product |
| Play Console reviews | Internal testing track allows tester comments | Product |

### Feedback Triage Tags

Use these tags when logging issues to distinguish severity:

| Tag | Meaning |
|-----|---------|
| `blocker` | Prevents tester from using the app at all |
| `regression` | Something that worked in a previous build is now broken |
| `ux` | Confusing or frustrating but not broken |
| `missing` | Expected feature not present |
| `enhancement` | Nice to have, not critical |

### Feedback Response SLA (Internal Beta)

| Severity | First Response | Resolution Target |
|----------|---------------|-------------------|
| Blocker | 4 hours | Next build |
| Regression | 24 hours | Next build |
| UX / Missing | 48 hours | Scheduled |
| Enhancement | 1 week | Backlog |

---

## Stage 5: Crash Reporting and Support

**Goal**: Identify crashes quickly, diagnose root cause, and protect tester experience.

### Crash Reporting Setup (Pre-Beta Gate)

Sentry is the recommended crash reporting solution. It is not yet integrated. Complete before the Beta gate:

```bash
cd artifacts/szl-holdings-mobile
pnpm add @sentry/react-native
```

Then:
1. Create a Sentry project at sentry.io (React Native type)
2. Copy the DSN
3. Set `SENTRY_DSN` in EAS secrets: `eas secret:create --name SENTRY_DSN --value <dsn>`
4. Initialize Sentry in the app root layout (consult Sentry React Native docs for Expo init pattern)
5. Monitor the Sentry dashboard after each build is distributed

Until Sentry is integrated, crashes must be reported via email or in-app feedback. Ask testers to include:
- Device model and OS version
- Steps taken before the crash
- Any error messages visible on screen

### Support Escalation Path

```
Tester reports issue via email or in-app
  ↓
Product triage: tag severity (blocker / regression / ux)
  ↓
If blocker: notify CTO immediately; pause tester onboarding
  ↓
Engineering diagnoses via Sentry (or manual report if Sentry not yet set up)
  ↓
Fix merged and new build submitted to TestFlight / Play
  ↓
Tester notified when new build is available
```

### OTA Updates (Post-EAS UUID Setup)

For JS-only fixes that do not require a new native build:

```bash
cd artifacts/szl-holdings-mobile
eas update --channel production --message "Fix: [description]"
```

Testers receive the update automatically on next app launch (no install required). Only available after the real EAS project UUID is set and `updates.enabled: true` in `app.json`.

### Rollback

- **iOS**: App Store Connect → TestFlight → stop distributing the current build; testers revert to previous installed version or install an older build manually
- **Android**: Play Console → Internal testing → Halt current release; restore previous release
- **OTA rollback**: `eas update --channel production --rollback-to-embedded`

---

## Stage 6: Release Notes

**Goal**: Every build distributed to testers has release notes that set accurate expectations.

### Release Notes Template

```
CORTEX — Build [VERSION] ([BUILD_NUMBER])
Released: [DATE]

What's new:
• [Feature or fix — specific, honest, one line each]
• [...]

Known issues in this build:
• [Honest list of incomplete or broken items]
• [...]

What to test:
• [2–3 specific flows to exercise]

Feedback: mobile-feedback@szlholdings.com
```

### Release Notes Principles

1. **Be specific.** "Fixed crash on Vessels workspace" is better than "Bug fixes."
2. **Be honest.** If push notifications are not working, say so.
3. **Set expectations.** List known gaps so testers do not file duplicate reports.
4. **Keep it short.** Testers read notes before installing; long notes get skipped.

### Release Notes for Alpha Build 1 (Template)

```
CORTEX — Build 2.0.0 (1)
Released: [DATE]

What's new:
• First internal alpha build
• All 8 domain workspaces accessible from home screen
• Biometric + PIN authentication
• Offline mode with sync banner
• Cross-domain signal feed

Known issues:
• Push notifications disabled (Firebase credentials required; coming in Build 2)
• Voice command routing is partial — not all commands are wired
• AR property viewer in Terra workspace is a placeholder
• Screen capture prevention not yet wired on sensitive screens

What to test:
• Unlock flow (biometric or PIN)
• Navigate into at least 3 domain workspaces
• Enable airplane mode and confirm offline banner appears; re-enable and confirm sync

Feedback: mobile-feedback@szlholdings.com
```

---

## Stage Completion Checklist

| Stage | Operator Confirms |
|-------|------------------|
| Invite | Tester appears in TestFlight or Play tester list; invite accepted |
| Access | Tester shows as "Installed"; can reach home dashboard |
| Setup | Setup message sent; known issues communicated |
| Feedback | Feedback channel confirmed active; first feedback received and triaged |
| Crash/Support | Sentry configured (Beta gate); at least one crash report tested end-to-end |
| Release Notes | Every distributed build has notes before distribution |

---

## Related Files

- `ops/cto/mobile-beta-final.md` — canonical app confirmation and store-facing audit
- `ops/cto/manual-console-actions-master.md` — external console actions required before builds
- `ops/mobile/testflight-play-internal-runbook.md` — CLI commands for build and submit
- `ops/mobile/reviewer-notes-and-test-accounts.md` — test accounts and Apple reviewer notes
- `ops/mobile/flagship-release-readiness.md` — go/no-go checklist for Alpha gate
