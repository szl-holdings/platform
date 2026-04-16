# Risk Register

Phase I · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The honest, named-risk list. Each risk has a likelihood, an impact, an
owner, a current mitigation, and a date for re-review.

## Scoring

| Likelihood | Definition |
|-----------|------------|
| L1 | Very unlikely (<5% in next 12 months) |
| L2 | Unlikely (5–20%) |
| L3 | Possible (20–50%) |
| L4 | Likely (50–80%) |
| L5 | Very likely (>80%) |

| Impact | Definition |
|--------|------------|
| I1 | Inconvenience; no customer effect |
| I2 | One customer affected briefly |
| I3 | Multiple customers affected; recoverable |
| I4 | Material business impact (revenue, reputation, deal loss) |
| I5 | Existential — company-ending |

Top-priority risks are L4–L5 × I3–I5.

## Top Risks

### R1 — Single-founder dependency (L5 × I5)

**Risk:** All commercial, operational, and ultimate technical decisions
flow through the founder. Founder unavailability for >2 weeks creates
a customer-trust failure cascade.

**Mitigations today:**
- All operational knowledge codified in `ops/scale/`
- Counsel relationship pre-established
- Engineering has independent deploy + rollback ability

**Mitigations needed:**
- Designated number-two ops person (covered in `next-hires-or-outsourcing.md`)
- Documented succession plan with counsel
- Quarterly business continuity rehearsal

**Owner:** Founder
**Re-review:** Quarterly

---

### R2 — Replit single-vendor concentration (L3 × I5)

**Risk:** Hosting, database, secrets, and AI provider proxying are all
on Replit. A material Replit outage or business event would suspend
every customer.

**Mitigations today:**
- Documented Replit infra incident path per `incident-triage-model.md`
- Application-level smoke + watch
- Subprocessor list includes Replit explicitly

**Mitigations needed:**
- Documented exit plan if migration becomes necessary (target: 90-day
  exit)
- Quarterly check on Replit financial / strategic posture
- Optional: alternate hosting evaluation when ARR exceeds threshold
  (covered in `scale-constraints-memo.md`)

**Owner:** Founder
**Re-review:** Quarterly

---

### R3 — SOC 2 / ISO 27001 absence (L4 × I4)

**Risk:** Enterprise procurement increasingly requires named
certifications. Each missed deal due to lack of certification is real
revenue.

**Mitigations today:**
- Aligned controls per `ops/security/production-hardening-checklist.md`
- Honest answer in `buyer-faq.md` and `diligence-fast-path.md`
- Commitment to start audit on first contract requiring it

**Mitigations needed:**
- Auditor selected and engaged when revenue threshold hit
- Pen test commitment in writing for next 6 months
- Continuous-control monitoring tooling evaluated

**Owner:** Founder
**Re-review:** Bi-annually or per enterprise opportunity

---

### R4 — Partner over-customization drift (L4 × I3)

**Risk:** Building partner-specific features that fork the platform
and increase maintenance burden disproportionately to revenue.

**Mitigations today:**
- "Custom features only when 2+ partners request" rule in
  `design-partner-onboarding.md`
- Pipeline doc tracks partner-feature requests for pattern recognition

**Mitigations needed:**
- Quarterly review of all partner-specific code paths
- Hard delete of any unused partner-specific path

**Owner:** Founder + Engineering
**Re-review:** Quarterly

---

### R5 — AI provider dependency cascade (L3 × I3)

**Risk:** OpenAI / Anthropic / Gemini outage or pricing change
materially affects customer-facing functionality.

**Mitigations today:**
- All three providers integrated; can route around one
- Provider tokens captured per request for cost tracking
- Honest "we don't know" surfaces when provider is down

**Mitigations needed:**
- Circuit breaker per provider (per `ops/security/threat-model-summary.md`
  residual risks list)
- Local fallback for narrow cases where it makes sense
- Per-customer cost cap visible in admin

**Owner:** Engineering
**Re-review:** Quarterly

---

### R6 — Schema drift across tiers (L3 × I3)

**Risk:** Workspace, Staging, and Production drift apart in schema or
feature flags, leading to on-fire releases.

**Mitigations today:**
- Forward-only migrations
- Smoke tests per `staging-and-prod-smoke-tests.md` cover schema-derived
  health
- Code review enforces schema discipline

**Mitigations needed:**
- Automated drift detector per `scale-constraints-memo.md`

**Owner:** Engineering
**Re-review:** Per release

---

### R7 — Mobile store rejection (L3 × I3)

**Risk:** App Store or Play Store reject CORTEX during submission,
delaying release.

**Mitigations today:**
- Reviewer notes prepared per `ops/mobile/reviewer-notes-and-test-accounts.md`
- Privacy manifest and data disclosure in plan
- Test accounts provisioned for reviewers
- Bundle ID and certs all in correct names

**Mitigations needed:**
- First submission used as a "rehearsal" — assume revisions are likely
- Build the back-and-forth response time into the timeline

**Owner:** Founder + Engineering
**Re-review:** Per submission

---

### R8 — Audit log tampering or gap (L2 × I5)

**Risk:** Audit log gap or tampering destroys the proof-chain promise
that is core to the SZL value proposition.

**Mitigations today:**
- All sensitive routes go through `lib/audit`
- Audit gaps treated as P1 minimum
- Tier 1 telemetry alarm on audit write failure rate

**Mitigations needed:**
- External immutable log sink (per
  `ops/security/threat-model-summary.md` residual risks)

**Owner:** Engineering
**Re-review:** Quarterly

---

### R9 — Cross-tenant data leak (L2 × I5)

**Risk:** A bug exposes one tenant's data to another tenant.

**Mitigations today:**
- All queries scoped via `callerOrgIds` + `inArray`
- Tier 1 telemetry alarm on cross-tenant access anomalies
- P0 incident playbook ready

**Mitigations needed:**
- Periodic adversarial test by an outside auditor
- Automated test that asserts isolation on every release

**Owner:** Engineering
**Re-review:** Per release

---

### R10 — Founder pipeline accuracy (L4 × I3)

**Risk:** Pipeline forecast diverges from reality; cash planning fails;
hiring or commitments based on bad forecasts.

**Mitigations today:**
- Conversion targets per stage in `conversion-ops-map.md` are
  founder-stage targets, not benchmarks
- Stalled-list discipline per `founder-control-room-checklist.md`

**Mitigations needed:**
- Pipeline page in `artifacts/command` per
  `founder-pipeline-dashboard-spec.md`
- Backtesting forecast accuracy quarterly

**Owner:** Founder
**Re-review:** Monthly

---

## How This List is Used

- Top of every Friday writeup: any new risk added this week?
- Top of every quarterly roadmap reset: full walk
- Source for the risk section of every investor update
- Source for the risk section of every enterprise diligence response

## What Is Not in the Register

- Risks that have been mitigated to L1 × I1 — removed
- Speculative future-state risks not realistic in next 12 months
- Personal or non-business risks
