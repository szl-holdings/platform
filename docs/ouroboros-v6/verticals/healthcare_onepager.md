## Ouroboros for Healthcare: HIPAA-Aligned Receipts and FDA SaMD-Ready Provenance

Every clinical AI decision your system makes today produces a record that lives in a mutable platform log — one that satisfies none of [21 CFR Part 11](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence), [HIPAA Security Rule 164.312(b)](https://www.hhs.gov/hipaa/for-professionals/security/index.html), and FDA SaMD PCCP traceability simultaneously. Ouroboros does all three from a single hash-chained receipt generated at the moment of inference, with no PHI training data and encryption at rest and in transit.

### Why now

Most hospitals have deployed clinical AI without a per-decision audit trail. The [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html) requires audit controls under 164.312(b), but the dominant tooling — IBM watsonx.governance AI Factsheets — records lifecycle events, not individual inference decisions. A Factsheet cannot tell you what the model weighted for a specific patient encounter. The [FDA's finalized PCCP guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence) for AI-enabled SaMD now requires predetermined change control with real-world performance monitoring — a continuous per-inference evidence stream, not a quarterly PDF. The 2025 HHS proposed updates to the HIPAA Security Rule add MFA and encryption mandates expected to finalize in 2026. Health systems that instrument clinical AI with Ouroboros now satisfy both the existing rule and the proposed update from the same deployment.

### What it is

@szl-holdings/ouroboros runtime v6.1.0 ships 91 primitives across 23 workspaces. The companion SKU @szl-holdings/guardrails v0.1.0 generates per-decision tamper-evident receipts, hash-chained and encrypted, with no PHI retained in the receipt payload itself. Three of the 9 Λ trust axes address clinical dimensions directly: Lara (Non-measurability) makes clinical uncertainty explicit and machine-auditable rather than hidden in model confidence scores; Oppenheimer (Moral) gates decisions by consequence weight, blocking high-stakes outputs that breach a defined Λ floor; Socrates (Being) verifies being-aligned consent conditions before a decision receipt is issued. The mathematical construction behind the closed-form Λ scalar is publicly archived at Zenodo DOI [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926) (v2, Apr 30 2026). 1,500+ tests passing, including 54 dedicated guardrails tests.

### Why we win

- IBM watsonx.governance AI Factsheets capture model development, training runs, and deployment events at the lifecycle level. They provide no real-time gating — a model can produce a harmful clinical output between monitoring cycles and no Factsheet will record it. Ouroboros gates at inference, not at assessment. The receipt exists before the output is delivered to the clinician.
- Google Vertex AI returns safety attribute scores per output (harassment, dangerous content categories), but these are platform-side categorical filters with no composite trust scalar and no cryptographic binding. The score lives in a GCP Audit Log that privileged IAM principals can modify. Ouroboros receipts are Merkle-chained: cryptographic detection of post-hoc alteration requires no platform access.
- NVIDIA NeMo Guardrails fires Colang DSL rules using a learned safety classifier — non-deterministic outputs that vary between calls, with no formal proof structure and no per-decision audit artifact suitable for [21 CFR Part 11](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11) electronic records submission. Ouroboros is closed-form and deterministic: the same inputs always produce the same Λ scalar, and the Part 11-compliant receipt is generated automatically.

### Compliance map

| Standard | Clause | Ouroboros primitive | Λ axis | Receipt evidence |
|---|---|---|---|---|
| HIPAA Security Rule | 164.312(a)(1) — Access control: unique user identification | SECURE-02 (Access Enforcement) + HUMAN-05 (Identity Tag) | Λ₆ Security | DID-keyed Λ receipt with access control attestation, per inference |
| HIPAA Security Rule | 164.312(b) — Audit controls: hardware, software, procedural mechanisms for ePHI access | AUDIT-01 → AUDIT-06 (Receipt Stack) | Λ₆ Accountability | Per-inference Λ₆ audit receipt with event ID, timestamp, and accessor identity |
| HIPAA Security Rule | 164.312(c)(1) — Integrity: ePHI not improperly altered or destroyed | AUDIT-06 (Immutability Primitive) | Λ₆ Accountability | Merkle-chain integrity receipt; tampering is cryptographically detectable |
| HIPAA Security Rule | 164.312(d) — Person or entity authentication | HUMAN-05 (Identity Tag) + SECURE-04 (Crypto Primitive) | Λ₆ Security | DID-signed Λ receipt with authenticator attestation |
| FDA 21 CFR Part 11 | 11.10(e) — Audit trails for record creation, modification, deletion | AUDIT-01 → AUDIT-05 | Λ₆ Accountability | Immutable Λ₆ audit trail satisfying electronic records requirements |

### Pilot offer

1. 90-day no-cost pilot on one clinical AI workflow of your choice — sepsis prediction, prior authorization review, or radiology triage. Ouroboros runtime and @szl-holdings/guardrails SKU deployed in a HIPAA-scoped staging environment; no production PHI required for instrumentation.
2. BAA paperwork handled white-glove — SZL Holdings provides a legally reviewed BAA template at Day 1 of engagement. Subcontractor BAA flow-down to cloud infrastructure (AWS, Azure) with published BAAs already in place. Stephen Lutar is the designated Security Officer; the BAA names him explicitly.
3. Per-decision Λ trace report at Day 90 — a structured audit trail report covering every inference event during the pilot window, formatted to satisfy 164.312(b) audit controls evidence requirements and suitable for your AI governance committee's review.

### Contact

Stephen Lutar, Founder, SZL Holdings — partnerships@szlholdings.com

---

SZL Holdings · Ouroboros runtime v6.1.0 · 91 primitives · 9 Λ axes · 1,500+ tests

---

### Sources

- [HIPAA Security Rule — HHS](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [FDA PCCP Guidance for AI/ML SaMD](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence)
- [21 CFR Part 11 — Electronic Records](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11)
- [IBM watsonx.governance product page](https://www.ibm.com/products/watsonx-governance)
- [NIST AI RMF — Healthcare context](https://www.nist.gov/itl/ai-risk-management-framework)
- [Ouroboros Zenodo v2 — DOI 10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)
