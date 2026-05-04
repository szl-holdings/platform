# Founder Release Approval

Phase H · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Define what the founder is approving — and what they are not — when
they sign off on a production release. Provides the approval template
filled in for every release.

## What the Founder is Approving

A founder release approval signifies:

1. The candidate change set is appropriate for production today
2. All quality gates per `release-blocker-policy.md` are green
3. The release notes (customer-facing and internal) are accurate
4. The deploy window timing is correct
5. The founder is personally available for the post-deploy watch
6. Affected partners have been notified (or notification is queued for
   immediately post-deploy)

## What the Founder is NOT Approving

- The technical correctness of individual code changes (that is what
  code review APPROVED is for)
- The completeness of the test suite (that is what CI gates are for)
- The performance characteristics under load (that is what the
  Tier 1/2/3 telemetry is for)

The founder approval is the **commercial and operational** ack, not a
second engineering review. Engineering APPROVED is upstream and is the
technical sign-off.

## Approval Template

The founder fills out this template for every release. The completed
template is appended to `what-changed.md` and committed.

```
Release: vX.Y.Z
Train: web | mobile-native | mobile-ota | hotfix
Window: <ISO timestamp> founder local
Last known-good tag (rollback target): vA.B.C

Changes in this release:
  - <PR/issue number> — <one-line description> — owner: <name>
  - ... (one line per change)

Schema changes in this release:
  - <migration filename> — forward-compatible: yes | no — owner: <name>

External subprocessor changes:
  - none | <list>

Affected canonical surfaces:
  - flagship | aegis | terra | vessels | carlota-jo | command | mobile | api-server
    (mark each)

Affected partners (notification status):
  - <partner> — notified | queued

Quality gates (verified at <timestamp>):
  - lint:       green
  - typecheck:  green
  - unit:       green
  - integration:green
  - code-review:APPROVED for all
  - staging:    deployed
  - e2e:        green
  - smoke:      green

Open incidents at sign time:
  - none | <list>

Blockers waved (must be empty for normal trains):
  - none | <blocker # + rationale per release-blocker-policy.md>

Founder availability for watch window:
  - confirmed at <timestamp>

Approval:
  Approved by: Stephen Lutar
  Approved at: <ISO timestamp>
  Signature method: explicit "APPROVED" in #releases channel + commit to what-changed.md
```

## Where the Approval is Recorded

Two records, both required:

1. A message in the engineering #releases channel with the explicit
   word "APPROVED" and a link to the candidate list
2. The completed template appended to `what-changed.md` in the same
   commit as the release tag

This dual record is intentional. The channel record is timely; the
file record is durable. Either alone is insufficient.

## What Happens If Approval Is Refused

A refused approval is normal. It is not a failure mode.

Possible refusals and follow-ups:

| Reason | Follow-up |
|--------|-----------|
| A blocker is open | Hold the train; ship next week |
| Founder is not available for the watch window | Reschedule to next available window |
| Notes inaccurate | Engineering revises, founder re-reviews |
| Partner notification not done | Notify, then reapprove |
| New customer commitment intersects with the change set | Defer or reshape; document in what-changed.md |

A refused approval is logged in `what-changed.md` as a `held` entry
with the reason and the new target window.

## Hotfix Approval

For hotfixes, the template is shortened:

```
Hotfix: vX.Y.Z+1
Bug: <P0 or P1 issue number>
Fix scope: <one paragraph>
Risk: <one paragraph>
Forward-compatible at schema level: yes
Founder available for watch: yes
Approval: Stephen Lutar at <ISO timestamp>
```

The full template is not required for hotfixes — speed is the point.

## Mobile Approval

Mobile native and OTA approvals use the same template with these
mobile-specific fields added:

```
Mobile platforms: ios | android | both
Build profile: preview | production
EAS build IDs: <iOS build id>, <Android build id>
TestFlight / Play Internal status: distributed | queued
OTA channel (if OTA): production | staging
Rollback path: stop-distribute | halt-rollout | OTA rollback
```

## Why This is Heavyweight

It looks heavy. It is intentionally so. The cost of a bad release at
founder-stage is high — partner trust is unrecoverable. The 10 minutes
to fill out the template are the cheapest insurance available.

The approval template is the same one used for growth capital diligence —
buyers review it as evidence of a controlled release process.
