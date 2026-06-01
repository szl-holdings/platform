# Design Partner Onboarding

Phase A · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Define the structured path that turns a qualified prospect into a paying
design partner who provides product-shaping feedback, real domain data,
and a reference relationship.

## Who Qualifies as a Design Partner

A design partner is a customer that:

1. Owns a real workload in at least one of the seven canonical domain
   surfaces (Aegis, Vessels, Terra, Carlota Jo, Command, CORTEX mobile,
   or the SZL flagship for portfolio operators).
2. Will commit to a 90-day engagement with weekly working sessions.
3. Will provide either real production-style data (under MSA + DPA) or
   a credible synthetic dataset their team will react to as if it were
   real.
4. Will allow the founder to use anonymized usage as a reference to
   investors and other prospects.

A maximum of **three** design partners run concurrently. Beyond three,
the founder cannot maintain the cadence specified in
`founder-operating-rhythm.md`.

## Stage Map

| Stage | Duration | Exit Criteria | Owner |
|-------|----------|---------------|-------|
| 0. Inbound qualified | 1–3 days | Domain match confirmed; budget signal present; decision-maker identified | Founder |
| 1. Discovery call | 30 min | Real workload mapped to ≥1 canonical product; pain quantified in time/$ | Founder |
| 2. Tailored demo | 60 min | Live demo on staging using their data shape; one "I would use this tomorrow" reaction captured | Founder |
| 3. Pilot agreement | 5–7 days | Signed pilot MSA + DPA + scope letter; success metric agreed | Founder + Counsel |
| 4. Onboarding (first 14 days) | 14 days | Workspace provisioned; data loaded; user accounts created; cadence locked | Founder + Engineering |
| 5. Active partner | 60–90 days | Weekly working sessions; bi-weekly metric review; reference call recorded | Founder |
| 6. Convert or graduate | 30-day window | Either signed annual contract OR documented decision-not-to-convert with reason | Founder |

## Inbound Qualification Filter

Reject inbound that fails any of these:

- Workload does not map cleanly to a canonical domain surface
- "Want to see what you have" without a real problem statement
- Title below VP / Director without a sponsor
- Budget cycle more than 6 months out
- Asks the platform to be the system of record for regulated data the
  team has not yet classified (defer until Phase 6 — see scale memo)

## Tailored Demo Script

The demo is a real, non-mocked walkthrough of the customer's workload on
staging. Always:

1. Pre-load a workspace seeded with their data shape (synthetic if real
   data is not yet available under DPA)
2. Show the canonical 9-step decision loop on a single concrete decision
   in their domain: Signal → Context → Recommendation → Simulation →
   Policy → Execution → Proof → Outcome → Learning
3. Show the proof chain entry that the demo just produced
4. Show one place the system honestly says "we don't know" instead of
   hallucinating

Never demo a feature that is not in the running build. If the prospect
asks about a not-yet-shipped capability, mark it explicitly as roadmap
on the spot.

## Pilot Agreement Template Inputs

The MSA + DPA + scope letter (handled by counsel) must capture:

- One named primary contact and one named decision-maker
- One success metric with a concrete numeric threshold
- Pilot price (small, non-zero — pricing tells you commitment)
- Data classification + retention window
- Reference rights (anonymous OK by default; named requires explicit
  written approval per use)

## Anti-Patterns

- Free pilots with no money attached — they always slip
- Demos before discovery — produces feature requests, not commitment
- More than three concurrent partners — burns the founder
- "Custom" features built only for one partner — track all requests in
  `founder-pipeline-dashboard-spec.md` and only ship if 2+ partners ask

## Linked Docs

- `demo-to-pilot-flow.md` — operational steps from demo to signed pilot
- `partner-first-14-days.md` — onboarding micro-cadence
- `customer-launch-pack.md` — assets handed to a new partner
- `inbound-routing-and-response-sla.md` — pre-qualification timing
