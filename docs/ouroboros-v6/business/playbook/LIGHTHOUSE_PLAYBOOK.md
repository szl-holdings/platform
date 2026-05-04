# Lighthouse Customer Playbook — Regulated Verticals

**Goal:** sign three lighthouse design partners in the next 90 days. One per vertical (finance, healthcare, defense/public sector).

## Why three, why these verticals

Three is enough to claim the runtime is "deployed in regulated production" without overcommitting. One per vertical is enough to triangulate that the runtime works across compliance regimes (GDPR, HIPAA, StateRAMP) without forcing the founder to learn three procurement processes simultaneously.

## Vertical 1 — Finance

**Why first:** AI agent deployments in finance are accelerating fastest, the procurement cycle is shorter than healthcare or defense, and the buyer (CISO or Head of AI Governance) often has internal authority to sign.

**Targets:**
- Mid-market regional banks deploying customer-service agents.
- Asset managers using AI for research summarization with compliance oversight.
- Insurance companies running claims-triage models.
- Crypto/DeFi compliance teams (different regulatory regime, easier procurement).

**Pitch wedge:** SR 11-7 model risk management requires "effective challenge" — Ouroboros provides continuous, mathematically grounded effective challenge at runtime.

**Procurement path:** CISO → security review (4–6 weeks) → pilot scope → 90-day pilot → go/no-go.

**Required artifacts:** SOC2 Type 1 attestation (minimum), threat model, privacy posture (already shipped), demo deployment in their cloud or air-gapped.

## Vertical 2 — Healthcare

**Why second:** HIPAA discipline forces real privacy posture; the air-gapped HSM driver is genuinely differentiating; once one healthcare logo is signed, others follow.

**Targets:**
- Health-tech vendors selling AI to hospitals (their compliance pain is acute).
- Mid-size health systems with internal AI deployment.
- Clinical-trial software companies running LLM document review.
- PBMs and large pharmacies running prescription summarization.

**Pitch wedge:** "Right to deletion" interaction with append-only ledger is normally a blocker — Ouroboros has a written GDPR-compatible posture that healthcare DPOs already accept (plaintext deletable, hash retained).

**Procurement path:** Privacy Officer + Security → BAA negotiation (8–12 weeks) → pilot scope → 90-day pilot → contract.

**Required artifacts:** HIPAA-aware threat model (already shipped), BAA template, air-gapped deployment doc, DPO-friendly privacy posture (already shipped).

## Vertical 3 — Defense / Public Sector

**Why third:** longest procurement cycle but largest contract size and the strongest moat once signed; air-gapped mode is mandatory and Ouroboros already supports it.

**Targets:**
- Defense primes deploying AI for ISR or logistics.
- Public-sector AI governance offices (state-level, federal CDO offices).
- Government cloud providers (AWS GovCloud, Azure Government).
- FFRDCs running AI safety research with deployment mandates.

**Pitch wedge:** the air-gapped INTERNAL_HSM anchor driver works without phoning home to anything. Sigstore is optional. This is rare.

**Procurement path:** technical evaluation → ATO discussion → SBIR or OTA contract vehicle → 6–12 month pilot.

**Required artifacts:** StateRAMP gap analysis, threat model with full A1–A8 adversary classes (already shipped), supply-chain attestation (cosign-signed releases), air-gapped deployment runbook.

## The 90-day playbook

**Days 1–14: outreach.** 30 cold emails per vertical (90 total) using the [LIGHTHOUSE_CUSTOMER_EMAIL.md](../outreach/LIGHTHOUSE_CUSTOMER_EMAIL.md) template. Personalize on what they've recently posted about AI governance. Target a 5% reply rate (5 calls per vertical).

**Days 15–30: discovery calls.** 20-minute calls. Goal: understand their compliance pain and qualify for pilot fit. Disqualify hard if they don't have an existing AI deployment.

**Days 31–60: pilot proposal + procurement.** Send written pilot proposal with scope, timeline, success criteria, and design-partner pricing ($0 + locked Tier 3 rate). Navigate security review.

**Days 61–90: pilot live.** White-glove deployment. Founder on-call. Daily standup with their team for the first two weeks. Goal: one deployed primitive (witness anchor at minimum) by day 90.

## Success criteria

- 3 signed letters of intent by day 60.
- 1 deployed pilot (witness anchor live) by day 90.
- 1 public reference by day 180.

If the day-60 milestone misses, the diagnosis is usually pricing or licensing — go back to [PRICING.md](../PRICING.md) and [LICENSE_STRATEGY.md](../../ouroboros-unified-payload/docs/LICENSE_STRATEGY.md), not the product.

## What kills lighthouse deals

1. License ambiguity. Decide before outreach.
2. Missing SOC2 attestation. Get a Type 1 in flight before vertical 1.
3. Founder bandwidth. White-glove cannot be delegated; cap simultaneous pilots at three.
4. Over-promising on roadmap. Promise only what's already in the v0.2 payload + v0.3 already in flight.
5. Talking AGI / consciousness / over-unity. Lead with [NOT_THIS.md](../../ouroboros-unified-payload/docs/NOT_THIS.md) on first call.
