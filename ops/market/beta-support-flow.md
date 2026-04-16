# Beta Support Flow

**Last updated:** April 2026  
**Purpose:** Defines how beta (design partner and TestFlight/Play internal) support requests are received, triaged, and resolved.

---

## Support Philosophy at Beta Stage

Beta support is personal. Design partners and early testers are not submitting tickets into a queue — they are in a direct relationship with the founder. The support model reflects that.

The goal is:
- Zero unacknowledged issues for more than 4 hours during business hours
- Zero unresolved P0 issues for more than 24 hours
- Feedback treated as gold — not just issues to close

---

## Support Channels

| Channel | Who | When to Use |
|---|---|---|
| Direct Slack message (dedicated partner channel) | Design partners | Primary channel — fastest response |
| Direct email | Design partners | Longer-form questions, file attachments |
| Phone / video call | Design partners | P0 issues, complex troubleshooting, relationship check-ins |
| TestFlight feedback | Mobile beta testers | Bug reports through TestFlight feedback form |
| App Store Connect crash reports | Mobile | Crash diagnostics — founder monitors |
| security@szlholdings.com | Anyone | Security disclosures |

**For design partners:** A dedicated Slack channel is set up at pilot kickoff. This is the primary support channel. Response time target: 2 hours during business hours.

**For mobile beta testers (non-design-partner):** TestFlight feedback form is the primary channel. Response time target: 24 hours.

---

## Issue Classification

### P0 — Critical (Respond Within 1 Hour, Resolve Within 4 Hours)

| Issue Type | Examples |
|---|---|
| Platform completely inaccessible | Login broken, all pages returning 500, API down |
| Data integrity concern | Partner reports seeing another org's data |
| Security disclosure | Any reported vulnerability |
| Auth broken | Cannot log in, sessions not persisting |

**P0 response:** Phone call to partner within 1 hour of report. Full founder attention until resolved. Rollback if not fixable in 30 minutes.

---

### P1 — High (Respond Within 2 Hours, Resolve Within 24 Hours)

| Issue Type | Examples |
|---|---|
| Key workflow blocked | Cannot complete an approval cycle, Proof Chain not logging |
| Domain pack feature broken | Aegis signals not loading, Terra maps not rendering |
| Mobile crash on core flow | App crashes on login, domain workspace not loading |
| Integration broken | API authentication failing |

**P1 response:** Acknowledge immediately. Diagnose with partner via Slack. Escalate to phone call if not resolved in 2 hours.

---

### P2 — Medium (Respond Within 4 Hours, Resolve Within 48 Hours)

| Issue Type | Examples |
|---|---|
| Non-blocking bug | UI element misaligned, incorrect label |
| Feature gap discovered | Missing filter, export not working for a specific format |
| Performance issue | Slow page load, delayed AI response |
| Confusing UX | Navigation unclear, instruction missing |

**P2 response:** Acknowledge same day. Log in issue tracker. Give partner timeline estimate.

---

### P3 — Low / Enhancement (Respond Within 24 Hours, No Commit to Resolution Date)

| Issue Type | Examples |
|---|---|
| Nice-to-have feature request | New dashboard widget, export format |
| Minor text or label issue | Typo, capitalization |
| Documentation gap | Partner looking for a doc that does not exist |

**P3 response:** Acknowledge within 24 hours. Add to product feedback log. Communicate if/when it will be addressed.

---

## Triage Protocol

When a support request arrives:

1. **Read fully** — understand the issue before responding
2. **Classify** — P0 / P1 / P2 / P3
3. **Acknowledge** — respond to partner immediately with classification and next step
4. **Diagnose** — gather correlation ID, reproduction steps, screenshot/recording if applicable
5. **Reproduce** — reproduce the issue in the development environment if possible
6. **Resolve or escalate** — fix forward, roll back, or schedule fix with timeline

**Correlation ID is critical for debugging.** Ask the partner to provide:
- The URL they were on when the issue occurred
- The approximate time (to match against logs)
- The `X-Correlation-Id` if they can access browser dev tools

---

## Mobile-Specific Support

### TestFlight Crash Reports

Crashes reported via TestFlight appear in App Store Connect → TestFlight → Crashes.

Review crash reports weekly (or immediately if a partner reports a specific crash):
1. Open crash log in App Store Connect
2. Identify the crash type and stack trace
3. Reproduce locally or in development build
4. Fix and deploy via OTA update (JS changes) or new build (native changes)

### Sentry (When Configured)

Once Sentry is configured (`SENTRY_DSN` set in EAS secrets):
- Crashes will appear in sentry.io with full stack traces
- Session replay may be available for mobile
- Alert rules should be set for P0 crash rate thresholds

### OTA Rollback

If a mobile update causes a regression:

```bash
# Roll back to the previous embedded bundle
eas update --channel production --rollback-to-embedded
```

Notify affected testers via TestFlight message or Play Console tester message.

---

## Feedback Capture Protocol

Every support interaction generates product feedback. Capture it.

When a partner reports an issue or feature request:
1. Acknowledge and resolve the immediate issue
2. Log the underlying feedback in the product feedback tracker:
   - What was reported
   - The underlying need or problem
   - Priority assignment
   - Resolution (if applicable)

Monthly, review the feedback log in the weekly product review (see `founder-support-control-room.md`).

**Design partner feedback is the most valuable input into the product roadmap.** Feedback that is not logged is feedback that is lost.

---

## Escalation Flow

```
Partner reports issue
    └─> Founder classifies (P0/P1/P2/P3)
         └─> Acknowledge immediately
              └─> Diagnose with partner
                   └─> P0: Roll back or emergency fix
                   └─> P1: Fix within 24h or roll back affected feature
                   └─> P2: Schedule and communicate timeline
                   └─> P3: Log and communicate roadmap intent
                        └─> Communicate resolution to partner
                             └─> Log in feedback tracker
```

---

## Support Metrics to Track

| Metric | Target |
|---|---|
| Time to acknowledge (all priorities) | < 2 hours during business hours |
| Time to resolve P0 | < 4 hours |
| Time to resolve P1 | < 24 hours |
| Open P2 issues | < 5 at any time |
| Unacknowledged issues | 0 at end of each business day |

Review these metrics monthly in the founder control room review.

---

*See also: `founder-support-control-room.md` (operational visibility), `mobile-beta-final.md` (mobile beta lifecycle)*
