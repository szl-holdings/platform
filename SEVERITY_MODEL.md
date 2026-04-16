# Severity Model — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineering, support, on-call responders, enterprise buyers
**Supersedes:** [INCIDENT_SEVERITY_MATRIX.md](INCIDENT_SEVERITY_MATRIX.md) (retained for reference)
**Companion docs:** [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) · [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md) · [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md)

---

## Overview

This document is the authoritative severity classification reference for all platform incidents. It governs how incidents are classified, how response is calibrated, and when escalation is required.

Severity classification happens at the time of detection and may be upgraded or downgraded as more information becomes available. The Incident Commander owns severity classification once one is declared.

---

## Severity Levels

### P0 — Critical (Outage or Data Emergency)

**Definition:** Complete platform failure or confirmed data breach. All users or data are affected. Every minute counts.

**Qualifying criteria (any one is sufficient):**
- All platform web applications return 5xx or are unreachable
- Authentication system is completely broken (no user can authenticate)
- Data breach is confirmed or strongly suspected (unauthorized access, data exfiltration)
- Database corruption or unrecoverable data loss
- API server completely unresponsive
- Security incident with active exploitation in progress

**What P0 is NOT:**
- A single user or org experiencing issues (→ P2)
- A non-critical feature broken (→ P2 or P3)
- Suspected but unconfirmed breach (→ investigate at P1, escalate to P0 if confirmed)

**Response targets:**
| Milestone | Target |
|-----------|--------|
| First acknowledgment | < 15 minutes |
| Incident Commander declared | < 15 minutes |
| Active response underway | < 30 minutes |
| Status page update posted | < 30 minutes |
| Customer notification (if applicable) | < 1 hour |
| Resolution target | < 2 hours |
| Post-incident review | Within 24 hours |

**Escalation:**
- Stephen Lutar: immediate (24/7)
- Engineering lead: immediate (24/7)
- Legal counsel: immediately if data breach confirmed
- Status page: update immediately and every 15 minutes

---

### P1 — High (Major Degradation)

**Definition:** Core platform functionality significantly degraded. Service is partially available but major features or many users are affected.

**Qualifying criteria (any one is sufficient):**
- A core product area is inaccessible (Lyte, Aegis, Terra, Vessels, PRISM returning consistent errors)
- Authentication broken for a subset of users or org types
- Significant performance degradation (>50% slower than baseline p95)
- Database queries failing intermittently on critical paths
- A recent deployment causing visible regressions across multiple users
- AI governance layer (Covenant Policy, Proof Chain) not recording correctly
- Billing or payment system broken

**Response targets:**
| Milestone | Target |
|-----------|--------|
| First acknowledgment | < 1 hour |
| Incident Commander declared | < 1 hour |
| Active response underway | < 2 hours |
| Status page update posted | < 1 hour |
| Status update cadence | Every 2 hours |
| Resolution target | < 8 hours |
| Post-incident review | Within 48 hours |

**Escalation:**
- Stephen Lutar: within 1 hour
- Engineering lead: within 1 hour
- Status page: update within 1 hour if user-facing

---

### P2 — Medium (Partial Issue)

**Definition:** Non-critical functionality broken or isolated issue with limited user impact. Service continues to operate.

**Qualifying criteria:**
- A single non-critical route or page returning errors
- One specific org or user experiencing issues (not systemic)
- Minor performance degradation (<50% from baseline)
- Analytics or monitoring data inaccurate or incomplete
- Non-critical API endpoint failing
- Feature working for most users but broken in specific edge cases
- Integration with a non-critical third party broken

**Response targets:**
| Milestone | Target |
|-----------|--------|
| First acknowledgment | < 4 hours |
| Investigation started | < 4 hours |
| Status update | End of business day |
| Resolution target | < 24 hours (next business day acceptable for off-hours detection) |
| Post-incident review | Recommended; not required |

**Escalation:**
- Engineering lead: notified at next check-in or proactively if trending toward P1
- Stephen: informed at scheduled check-in unless escalation warranted
- Status page: not updated unless becomes user-facing

---

### P3 — Low (Minor / Cosmetic)

**Definition:** Cosmetic, minor, or low-impact issue. No service degradation.

**Qualifying criteria:**
- Visual/styling bug on a non-critical page
- Minor copy error or stale content
- Non-functional feature already known to be incomplete
- Documentation outdated or incorrect
- Non-blocking UX confusion

**Response targets:**
| Milestone | Target |
|-----------|--------|
| Acknowledgment | Next business day |
| Resolution | Within 5 business days or next release cycle |

**Escalation:** None required. Log in issue tracker for next sprint.  
**Status page:** Not updated.

---

## Severity Decision Tree

```
Step 1: Is the entire site or auth system down, or is there a confirmed breach?
  Yes → P0

Step 2: Is a core product area completely broken, or are many users affected?
  Yes → P1

Step 3: Is this a security incident with active exploitation (but not yet confirmed breach)?
  Yes → P0 (escalate immediately; downgrade to P1 only if definitively ruled out)

Step 4: Is a single non-critical feature or a specific org/user affected?
  Yes → P2

Step 5: Is it cosmetic, copy, or minor documentation?
  Yes → P3
```

**When in doubt, classify higher.** It is always better to over-escalate a P2 as a P1 than to under-respond to a real outage. Downgrade at any point as evidence warrants.

---

## Severity Matrix

| Severity | Ack | Active Response | Resolution | Status Page | Escalation | Post-Mortem |
|----------|-----|----------------|------------|-------------|------------|-------------|
| P0 | < 15 min | < 30 min | < 2 hours | Immediate + every 15 min | Immediate to Stephen | Required (24h) |
| P1 | < 1 hour | < 2 hours | < 8 hours | < 1 hour + every 2 hours | < 1 hour to Stephen | Required (48h) |
| P2 | < 4 hours | < 4 hours | < 24 hours | Internal only | Next check-in | Recommended |
| P3 | Next biz day | Next sprint | 5 biz days | None | None | Not required |

---

## Severity Changes During Incidents

Severity must be re-evaluated whenever significant new information is available:

**Upgrade criteria:**
- Scope expands beyond initial assessment (e.g., one org → all orgs)
- Security issue discovered within a performance incident
- Resolution taking longer than the target resolution time without clear path

**Downgrade criteria:**
- Scope confirmed narrower than initially classified
- Issue isolated to non-production or non-critical path
- Workaround fully mitigates user impact

Every severity change must be logged in the incident record and communicated on the status page (if the incident is user-facing).

---

## Classification Responsibilities

| Phase | Who Classifies |
|-------|---------------|
| Initial detection | First responder to the alert or report |
| Incident declared | Incident Commander (takes over classification) |
| Severity change | Incident Commander (must be logged) |
| Retrospective | Post-incident review lead |

---

## Relationship to Support Severity

Customer-reported support issues follow a parallel severity model in [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md). When a support issue indicates a systemic platform problem, it is escalated to the platform incident model (P0–P3) and an Incident Commander is declared.

Support severity ↔ Platform severity mapping:

| Support Severity | Platform Severity |
|-----------------|-------------------|
| Critical (support) | P0 or P1 |
| High (support) | P1 or P2 |
| Medium (support) | P2 |
| Low (support) | P3 |

---

*Severity Model last reviewed: **2026-04-16** · Next review: **2026-07-01***
