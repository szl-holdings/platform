# Enterprise Evaluation Flow

Phase E · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The structured path an enterprise buyer follows from first contact
through signed master agreement. Distinct from
`design-partner-onboarding.md` (small, founder-led) — this is for
named-account, multi-stakeholder organizations.

## When to Use This Flow

Trigger this flow if any of:

- Buyer is a Fortune 1000 enterprise or government / quasi-government
- Buyer has a procurement function that will run a separate process
- Buyer requires SOC 2 / ISO 27001 / FedRAMP-equivalent diligence
- Buyer requires a Master Service Agreement on their paper
- Initial deal size is targeted >$250k ARR

Otherwise use the design partner flow.

## Stages

| Stage | Duration | Exit | Buyer-side Owner | SZL Owner |
|-------|----------|------|------------------|-----------|
| 1. Executive intro | 1 week | Sponsor confirmed at VP+ | Sponsor | Founder |
| 2. Evaluator brief | 1 day | Brief reviewed; technical contact named | Technical lead | Founder |
| 3. Technical demo | 1 hour | Architecture Q&A complete | Technical lead + arch | Founder + Engineering |
| 4. Security & diligence | 2–6 weeks | All buyer security questions answered | InfoSec | Founder + Counsel |
| 5. Pilot or POC | 30–90 days | Defined success criteria met | Sponsor | Founder |
| 6. Procurement & legal | 4–12 weeks | Signed MSA + Order Form | Procurement, Legal | Counsel + Founder |
| 7. Contract | n/a | Annual contract live | All | Founder |

Total expected calendar time: 4–9 months. This is consistent with
enterprise procurement; setting any other expectation creates pipeline
fiction.

## What Happens at Each Stage

### Stage 1 — Executive intro

- Founder takes the meeting. No proxy.
- Goal: confirm a real workload at this enterprise that maps to a
  canonical SZL product surface.
- Output: a one-paragraph mutual statement of the workload + sponsor
  name + next-meeting date.

### Stage 2 — Evaluator brief

- Send `one-page-evaluator-brief.md` (the populated PDF version)
- Send `buyer-faq.md` (PDF)
- Schedule the technical demo within 5 business days

### Stage 3 — Technical demo

- Live demo on Staging using a workspace prepped to the buyer's data
  shape
- Architecture Q&A — the buyer's architect attends; founder + engineering
  attend
- Show the proof chain explicitly — enterprise buyers care about
  defensibility
- Show the env registry / secret model honestly — enterprise InfoSec
  will ask about secret rotation; we have a real story
  (`ops/security/rotate-now.md`)

### Stage 4 — Security & diligence

Run the `diligence-fast-path.md` playbook. The buyer will send one of
several standard questionnaires (CAIQ, SIG-Lite, vendor-specific).
The founder's job is to map every question to existing SZL
documentation — we have most answers; we know where the gaps are.

Common tracks during this stage:

- SOC 2 status — currently: not certified; controls in place per
  `ops/security/threat-model-summary.md` and `ops/security/production-hardening-checklist.md`
- ISO 27001 — same answer as SOC 2
- Penetration test — none completed yet; commit to one before contract
  if buyer requires
- Data residency — Replit-hosted; buyer must accept this or we accept
  buyer-side hosting requirements (rare)
- Subprocessors list — current AI providers, Clerk, Stripe, Replit
- DPA — standard; counsel-prepared

### Stage 5 — Pilot or POC

- 30–90 day paid POC
- Defined success criteria in writing, signed by sponsor
- POC is on Production (not Staging) once cutover is complete; until
  then on Staging with explicit consent
- POC concludes with a formal go / no-go meeting with the sponsor

### Stage 6 — Procurement & legal

- Counsel-led
- Standard fallback positions documented (limit of liability cap,
  IP indemnity, audit rights, data return on termination)
- Founder stays in the room — enterprise procurement always escalates;
  founder availability accelerates close

### Stage 7 — Contract

- Annual minimum
- Quarterly business review cadence agreed in the order form
- Named primary contact and named technical contact on each side

## Anti-Patterns

- Treating an enterprise like a design partner — they will not move
  fast, and pretending they will create false pipeline
- Overcommitting on certifications we do not yet hold — we say what is
  in place today and what is on the roadmap; both honestly
- Negotiating contracts before security diligence is done — almost
  always restarts the process

## Linked Docs

- `buyer-faq.md` — pre-emptive answers
- `one-page-evaluator-brief.md` — leave-behind
- `diligence-fast-path.md` — running playbook for Stage 4
- `customer-launch-pack.md` — handoff for Stage 7
