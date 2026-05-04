# Evolution Payload — Closing the Eight Gaps

Date: May 1, 2026.
Author: Stephen Lutar, SZL Holdings.
ORCID: 0009-0001-0110-4173.
Runtime: @szl-holdings/ouroboros v6.1.0.
New SKU: @szl-holdings/guardrails v0.1.0.
Tests: 1,500+ combined (TypeScript + Python).
Primitives: 91 across 24 packages, 9 Λ axes.

This payload closes every gap identified in the zoom-out analysis against NVIDIA NeMo Guardrails, Google DeepMind Frontier Safety Framework v3, and IBM watsonx.governance. It is operational, deployable, and ready to ship. Every artifact below cites real sources.

## What changed in extension 5

A new shippable runtime SKU. Eleven operational documents totaling 45,065 words. One updated CHANGELOG. One updated test count. Zero competing claims that lack a citation.

## Gap closures

### Gap 1 — Compliance certifications

The 24-month roadmap, the capital plan, and the Mercy McInnis ask are all written.

| File | What it is |
| --- | --- |
| [compliance/COMPLIANCE_PLAYBOOK.md](compliance/COMPLIANCE_PLAYBOOK.md) | 553-line research baseline. SAM.gov, SOC 2, FedRAMP, CMMC 2.0, AWS Marketplace, HIPAA BAA, EU AI Act. |
| [compliance/EXECUTABLE_ROADMAP.md](compliance/EXECUTABLE_ROADMAP.md) | 2,344-word founder-readable execution plan. Month-by-month. Gates A through F. Phase 1 ~$5K, Phase 2 $30-40K, Phase 3 gated. |

Decision: SAM.gov first (free, in flight). SOC 2 Type 2 second ($20-40K, 9-14 months). AWS Marketplace third (free, ops effort). Defer FedRAMP until contract-in-hand. Defer CMMC until DoD prime engagement. Defer ISO 27001 until EU pipeline materializes.

### Gap 2 — Guardrails / agentic-safety SKU

The drop-in NeMo replacement, shipping as `@szl-holdings/guardrails`. Code lives at [packages/guardrails/](../packages/guardrails/) — 14 named rails across 5 rail kinds, 54 tests green, NeMo migration table in the README.

The differentiator that is not in NeMo: every decision produces a closed-form Λ scalar and a tamper-evident, hash-chained receipt. The receipt verifies cryptographically against a tenant key. A single zero-axis collapses Λ to zero, matching the design intent that any hard veto blocks the action.

| File | What it is |
| --- | --- |
| [packages/guardrails/README.md](../packages/guardrails/README.md) | Five-line quickstart, full rail catalogue, NeMo migration table |
| [packages/guardrails/src/](../packages/guardrails/src/) | TypeScript runtime — types, lambda, receipt, rails, index |
| [packages/guardrails/tests/](../packages/guardrails/tests/) | 54 vitest specs — lambda, receipt, rails, end-to-end |
| [packages/guardrails/examples/quickstart.ts](../packages/guardrails/examples/quickstart.ts) | Runnable three-call demo with chain verification |

### Gap 3 — Vendor integration roster

| File | What it is |
| --- | --- |
| [vendors/INTEGRATION_TARGETS.md](vendors/INTEGRATION_TARGETS.md) | 15 vendor profiles. Named partner programs, BD contact patterns, 100-word outreach drafts. |
| [vendors/OUTREACH_DRAFTS.md](vendors/OUTREACH_DRAFTS.md) | Ready-to-send packages for the top three: LangChain, Anthropic, Arize AI. Email + LinkedIn DM + technical brief each. |

Top three to pursue first: LangChain (Callbacks API → ecosystem reach), Anthropic (MCP server, free Partner Network), Arize AI (OpenInference span attributes — fast PR).

### Gap 4 — Standards-body posture

| File | What it is |
| --- | --- |
| [standards/REGULATORY_MAPPING.md](standards/REGULATORY_MAPPING.md) | 555-line research baseline. NIST AI RMF MEASURE → 9 Λ axes. EU AI Act Art 12 + 800-53 AU-12 dual-satisfaction. SR 11-7. DoD CDAO RAI tenets. HIPAA + 21 CFR Part 11. |
| [standards/NIST_COMMENT_SUBMISSION.md](standards/NIST_COMMENT_SUBMISSION.md) | 1,850-word public comment for the Critical Infrastructure AI RMF Profile COI. Five numbered recommendations. Submit-ready. |
| [standards/STANDARDS_POSTURE_BRIEF.md](standards/STANDARDS_POSTURE_BRIEF.md) | 1,517 words. Seven-body engagement calendar. 12 months of named submissions. |
| [standards/CLOSED_FORM_DEFENSE.md](standards/CLOSED_FORM_DEFENSE.md) | 3,499 words. Position paper. Closed-form Λ vs learned safety. Three falsifiable claims. |

### Gap 5 — Vertical one-pagers

Buyer-ready. Each ends with a 90-day no-cost pilot offer.

| File | Buyer | Hook |
| --- | --- | --- |
| [verticals/federal_onepager.md](verticals/federal_onepager.md) | Federal CIO/CDO/RAI lead, prime SIs | NIST AI RMF MEASURE → Λ axes 1:1; Art 12 + AU-12 from one receipt |
| [verticals/healthcare_onepager.md](verticals/healthcare_onepager.md) | Health-system CIO, CMIO, AI governance committee | One receipt satisfies 21 CFR Part 11 + HIPAA 164.312(b) + FDA SaMD PCCP traceability |
| [verticals/finance_onepager.md](verticals/finance_onepager.md) | Bank CRO/MRM lead, CCO, insurance CRO | SR 11-7 monitoring becomes a real-time Λ stream; DORA Art 17/18/28 covered |

### Gap 6 — Closed-form Λ defense

Lives in [standards/CLOSED_FORM_DEFENSE.md](standards/CLOSED_FORM_DEFENSE.md). 3,499 words. The architectural defense of the choice not to learn safety.

The argument: learned safety models inherit the failure modes of the systems they police. Closed-form Λ does not. Three falsifiable claims (determinism, byte-tamper detection, axis-collapse). Eighteen real sources cited.

### Gap 7 — Cloud-marketplace listing

| File | What it is |
| --- | --- |
| [marketplace/AWS_MARKETPLACE_KIT.md](marketplace/AWS_MARKETPLACE_KIT.md) | 1,798 words. Phase 1 private offer to 3 named accounts (Booz Allen, Truist, Northwell). Phase 2 public. Phase 3 GovCloud. Listing copy ready to paste. |

SaaS Contract chosen over SaaS Subscription: annual ARR is more predictable and matches an enterprise sales motion better than usage-metered subscriptions for a guardrails product.

### Gap 8 — Federal lighthouse pilot

| File | What it is |
| --- | --- |
| [lighthouse/FEDERAL_LIGHTHOUSE_TEMPLATE.md](lighthouse/FEDERAL_LIGHTHOUSE_TEMPLATE.md) | 2,226 words. 90-day pilot template with 15-item scope checklist. Day-by-day timeline. Mercy McInnis follow-up script for May 6. Two backup programs (AFWERX, CDAO RAI Working Group). |

### Bonus — Platform layer

The hosted control plane that turns the runtime into a SaaS endpoint.

| File | What it is |
| --- | --- |
| [platform-spec/LAMBDA_AS_A_SERVICE.md](platform-spec/LAMBDA_AS_A_SERVICE.md) | 3,741 words. REST + gRPC API surface with curl examples. Three-panel dashboard with five named widgets each. Five deploy targets. KMS-backed tenant keys. 12-milestone build plan. |

## How to use this payload

1. Read [verticals/](verticals/) first if you are pitching a buyer.
2. Read [standards/CLOSED_FORM_DEFENSE.md](standards/CLOSED_FORM_DEFENSE.md) if you are facing a technical objection that "you should be using a learned safety model."
3. Read [compliance/EXECUTABLE_ROADMAP.md](compliance/EXECUTABLE_ROADMAP.md) if you are deciding what to spend on certifications next quarter.
4. Read [vendors/OUTREACH_DRAFTS.md](vendors/OUTREACH_DRAFTS.md) if you are sending the first partnership emails this week.
5. Open [packages/guardrails/](../packages/guardrails/) and run `npx vitest run` if you want to see the SKU prove itself in 54 tests.
6. Read [lighthouse/FEDERAL_LIGHTHOUSE_TEMPLATE.md](lighthouse/FEDERAL_LIGHTHOUSE_TEMPLATE.md) Tuesday morning before the May 6 Mercy meeting.

## What remains

Three things this payload does not do, listed for honesty.

1. The pricing tiers in the AWS Marketplace listing copy and platform spec are marked CONFIRM. Founder needs to set them before the listing goes live.
2. The patent-floor numbers from the prior valuation pass ($7M-$30M defensive IP floor) assume a provisional patent has been filed. It has not. v3 may ship to Zenodo. v4 and v5 hold until the provisional is filed.
3. The Mercy May 6 meeting is the gating event for the federal lighthouse path. The follow-up script is written. The script needs Mercy to say yes.

## Sources

All citations across these 15 files trace to [research/COMPETITOR_STACKS.md](research/COMPETITOR_STACKS.md), [standards/REGULATORY_MAPPING.md](standards/REGULATORY_MAPPING.md), [vendors/INTEGRATION_TARGETS.md](vendors/INTEGRATION_TARGETS.md), and [compliance/COMPLIANCE_PLAYBOOK.md](compliance/COMPLIANCE_PLAYBOOK.md). Combined: 73 + 51 + 39 + 43 KB of source-grounded research.
