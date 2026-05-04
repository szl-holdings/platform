# A11oy — 72-Hour Incident Response Procedure

**Document ID:** A11OY-COMP-IR-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, all customers, prime contractors, regulators
**Classification:** Public

---

## 1. Purpose

This procedure defines how SZL Holdings detects, contains, investigates, communicates, and remediates security incidents affecting A11oy and the products that ride on it (Sentra, Amaru, customer-built agents). It is structured so that affected customers receive substantive notification within 72 hours of incident confirmation, in alignment with:

- NYS DFS Part 500 §500.17(a)
- HIPAA Breach Notification Rule (45 CFR §164.404)
- GDPR Article 33 (where applicable)
- FedRAMP IR-6 (target alignment for the future ATO)

## 2. Definitions

- **Event** — any anomalous observation surfaced by monitoring or by humans.
- **Incident** — an event confirmed to have actual or imminent adverse impact on confidentiality, integrity, or availability of A11oy or customer data.
- **Breach** — an incident confirmed to involve unauthorized access, acquisition, or disclosure of customer data.
- **Severity 1 (Sev1)** — confirmed breach of customer data; production-wide outage; security-control bypass affecting tenant isolation; residency-policy violation.
- **Severity 2 (Sev2)** — material degradation; partial outage; failed control with no confirmed exposure; suspicious access requiring investigation.
- **Severity 3 (Sev3)** — minor anomaly; no customer impact; informational.

## 3. Roles

| Role | Responsibility | Today (single-founder reality) |
|---|---|---|
| Incident Commander (IC) | Owns the incident end-to-end | Stephen P. Lutar Jr. |
| Communications Lead | Customer + regulator notifications | Stephen P. Lutar Jr. |
| Technical Lead | Containment, forensics, fix | Stephen P. Lutar Jr. |
| Scribe | Timeline, evidence ledger anchoring | Automated via `cognitive-observability` + manual narrative by IC |
| Legal counsel | Disclosure decisions | External counsel on retainer; escalation path documented |

This document does not pretend SZL is a 50-person SOC. The single-founder reality is acknowledged in §10.

## 4. Detection sources

| Source | Trigger |
|---|---|
| `cognitive-observability` alarms | Latency, error-rate, auth-failure spikes; tenant-isolation violations |
| `aef-evidence-ledger` integrity check | Hash-chain break or unexpected ledger gap |
| `aef-policy-guard` violation events | Unauthorized model/tool/data/egress access attempts |
| AWS GuardDuty / CloudTrail alerts | Account-level anomalies in GovCloud |
| Customer report | Any customer email to `security@szlholdings.com` or in-product report |
| Researcher report | `security@szlholdings.com` — see disclosure policy |
| Third-party signal | NVD CVE for a dependency; CISA KEV listing |

## 5. Lifecycle

### 5.1 Triage (T0 → T+1h)

- Acknowledge the event within 1 hour (during business hours) or 4 hours (off-hours).
- Confirm or downgrade event → incident → breach.
- Assign severity. Default to higher severity until evidence justifies lower.
- Open an `incident-record` row in the evidence ledger; the row's hash anchors all subsequent artifacts.

### 5.2 Containment (T+1h → T+4h for Sev1/Sev2)

Goal: stop the bleeding.

- For Sev1 confirmed breach: revoke affected credentials, rotate secrets, isolate affected tenants, suspend impacted workflows, place a `policy-emergency` block in `aef-policy-guard` to deny suspect actions tenant-wide.
- For Sev1 residency violation: hard-block all egress to non-residency endpoints within 5 minutes (automated via the policy guard's residency rule, manual confirmation in 5 minutes).
- For Sev2: targeted containment (single tenant, single endpoint, single component).
- All containment actions are written into the `incident-record` row with an actor, timestamp, and evidence hash.

### 5.3 Notification — the 72-hour clock starts at confirmation

- **T+24h:** Initial customer notification for any Sev1 with confirmed customer-data impact. Contents: nature of incident, affected scope (best current understanding), interim mitigations, next update commitment, point of contact.
- **T+72h:** Substantive notification including: confirmed scope, root cause to the extent known, evidence-ledger anchor hash, remediation status, deadline for complete report, customer-action recommendations.
- **Regulatory:** Where mandated, notification to NYS DFS within 72 hours, OCR within 60 days for HIPAA-covered breaches, supervisory authority within 72 hours under GDPR.
- **Public:** A status entry on `status.szlholdings.com` for any incident with multi-customer impact.

If we cannot meet the 72-hour substantive-notification target, we say so in writing at T+72h and commit a hard date.

### 5.4 Investigation (T+4h → T+10d)

- Collect evidence: logs, ledger entries, ledger replay results, AWS CloudTrail, application metrics.
- Reconstruct the event: timeline written into the `incident-record`.
- Determine root cause using a published 5-Whys + contributing-factors model.
- Independent verification: a colleague (today: outside advisor) reviews and signs off on the root-cause finding.

### 5.5 Remediation (T+10d → T+30d)

- Fix the immediate cause.
- Address the contributing factors.
- Add a regression test (`packages/aef-evals` if a behavioral regression; `packages/aef-policy-guard` if a control regression) that would have caught the incident.
- Update this procedure and any other affected procedure.

### 5.6 Post-incident review (within 30 days)

- Internal blameless review.
- Customer-facing post-incident report for any Sev1: published or sent to affected customers; redactions for security-sensitive details only.
- Evidence-ledger anchor for the report so customers can independently verify it has not been edited after publication.

## 6. Communication templates

The following templates are used verbatim with placeholders. They are stored at `docs/internal/incident-comms/`:

- `T+24h-initial-notification.md`
- `T+72h-substantive-notification.md`
- `T+30d-post-incident-report.md`
- `regulator-notification-NYS-DFS.md`
- `regulator-notification-OCR-HIPAA.md`
- `regulator-notification-GDPR-72h.md`
- `status-page-public-update.md`

## 7. Channels

| Channel | Use |
|---|---|
| `security@szlholdings.com` | Inbound reports |
| `incident-comms@szlholdings.com` | Outbound notifications |
| `status.szlholdings.com` | Public status |
| Customer-specific Slack/Teams shared channel | Real-time customer comms during incident |
| Encrypted email (S/MIME or PGP) | Sensitive details |

## 8. Severity 1 escalation tree

1. **T0** — IC confirmed (Stephen P. Lutar Jr.).
2. **T+15m** — IC pages legal counsel.
3. **T+30m** — IC pages outside security advisor (named in private playbook).
4. **T+1h** — Customer-facing communications begin per §5.3.
5. **T+4h** — Containment confirmed via independent evidence-ledger replay.
6. **T+24h** — Customer notification per §5.3.
7. **T+72h** — Substantive notification per §5.3.

Pager via PagerDuty (or carrier SMS as fallback) to IC mobile.

## 9. Tabletop exercises

- Cadence: at least every 6 months or after any Sev1.
- Scenarios: tenant-isolation bypass; ledger tamper attempt; supply-chain compromise of a pinned package; LLM-provider data leak; AWS account compromise.
- Output: timing data, gaps identified, fixes scheduled.
- Customer-joined tabletops available on request for paid pilots.

## 10. Honest disclosures

- **Single-founder operations.** Until first hire, the IC role and Technical Lead role are the same person. The named outside advisors and outside counsel are real and on retainer; their names are released to active procurements under NDA. This concentration is a known risk and is the top driver of the H1 2026 hiring plan.
- **Detection coverage.** Detection sources in §4 are real and operational, but a previously-unknown vulnerability (a true zero-day in a dependency) may evade them. The 72-hour clock starts at *confirmation*, not at the moment a hypothetical zero-day was first exploited.
- **No SOC 2 yet.** This procedure aligns with SOC 2 IR criteria but has not been audited to that standard. See `SENTRA-01-soc2-type-2-plan.md` for the timeline.

## 11. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 12. Contact

Stephen P. Lutar Jr. · `security@szlholdings.com` · `inquiries@szlholdings.com`
