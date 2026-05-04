# Public Comment Submission

**To:** NIST AI 100-1 Working Group
**From:** Stephen Lutar, Founder, SZL Holdings
**ORCID:** 0009-0001-0110-4173
**Date:** May 1, 2026

**Subject:** Comment on Concept Note: AI RMF Profile for Trustworthy AI in Critical Infrastructure

**Submission URL:** [https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure](https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure)

**Submission Deadline:** SZL Holdings submits this comment during the open Community of Interest formation period for the AI RMF Profile on Trustworthy AI in Critical Infrastructure, as announced by NIST in April 2026. SZL requests inclusion in the Community of Interest for ongoing participation in profile development.

---

## 1. Summary of Position

Critical infrastructure operators — energy grids, water treatment networks, financial clearing systems, hospital networks, and transportation control systems — cannot govern AI systems through probabilistic guardrails. When an AI system participates in a decision that affects national safety or public welfare, the governance artifact for that decision must be deterministic, verifiable, and tamper-evident. It must be producible at the moment of the decision, not reconstructed afterward.

The NIST AI RMF [MEASURE function](https://www.nist.gov/itl/ai-risk-management-framework) currently lacks a specification for this artifact. The MEASURE subcategories (2.1 through 2.13) describe what should be measured and how measurement programs should be organized, but they do not specify the form of the measurement artifact itself. They do not require that the artifact be produced per decision. They do not require that the artifact be cryptographically bound to the inference event it describes. As a result, organizations deploying AI in critical infrastructure default to batch-mode assessments, periodic audits, and retroactive documentation — none of which can satisfy the real-time accountability demands of a sector where a single miscalibrated inference can have physical consequences.

The closed-form Lambda (Λ) scalar, as implemented in Ouroboros v6.1.0, is the missing primitive. It is a mathematically grounded, per-inference trust aggregate that is computed deterministically, produces a tamper-evident receipt at the moment of each AI decision, and decomposes into nine independently auditable axes. It does not rely on a learned model to police another learned model. It does not require probabilistic thresholds that shift with retraining. It is the measurement artifact that MEASURE requires but does not yet specify. This comment recommends that the Critical Infrastructure AI RMF Profile fill this gap by introducing a receipt-based measurement artifact as a required element of MEASURE for high-consequence AI deployments.

---

## 2. Specific Recommendations

### Recommendation 1: Establish a Closed-Form Trust Scalar Requirement in MEASURE 2.3 and MEASURE 2.4

MEASURE 2.3 (performance and assurance measured under deployment conditions) and MEASURE 2.4 (production monitoring of behavior) currently permit any documented measurement approach. For critical infrastructure AI, the profile should specify that the measurement artifact be closed-form: that is, computed by a deterministic function over a well-specified domain, with a published derivation that can be independently verified. This distinguishes a closed-form scalar from a learned classifier score, which varies with model state and cannot be independently reproduced without access to the model weights. A closed-form scalar's derivation can be published in a peer-reviewed or publicly archived venue, making it auditable by government assessors, inspectors general, and congressional oversight without vendor cooperation.

The nine-axis Λ scalar in Ouroboros v6.1.0 demonstrates this pattern. Its geometric-mean construction over nine independently scored axes (Cleanliness, Horizon, Resonance, Frustum, Gauss, Invariance, Moral, Being, and Non-measurability) is archived with mathematical proof at [Zenodo DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281). The profile should cite this form of artifact as a reference implementation pattern for MEASURE 2.3 and MEASURE 2.4 compliance in critical infrastructure contexts.

### Recommendation 2: Require Per-Decision Audit Receipts Under MEASURE 2.8 and the EU AI Act Article 12 Alignment Tier

MEASURE 2.8 (transparency and accountability risks examined) currently addresses organizational transparency. In critical infrastructure AI, transparency must extend to the individual inference event. The profile should add a sub-requirement: for each AI inference decision in a high-consequence operational context, a tamper-evident receipt must be generated at the moment of the decision. This receipt must identify the AI system version, record the trust state at inference time, and be verifiable by an authorized third party without access to the originating platform's logs.

This requirement is directly compatible with [EU AI Act Article 12](https://artificialintelligenceact.eu/article/12/), which mandates that high-risk AI systems automatically record events over their lifetime in a manner that cannot be altered retroactively. Organizations operating in both US critical infrastructure and EU high-risk AI classifications would satisfy both obligations with a single receipt artifact. The profile has an opportunity to establish the US federal standard that converges with Article 12, enabling transatlantic regulatory interoperability for critical infrastructure operators.

### Recommendation 3: Define a Nine-Axis Trust Decomposition for MEASURE 2.11 (Fairness) and MEASURE 2.6 (Safety) Integration

MEASURE 2.11 (fairness and bias documented) and MEASURE 2.6 (safety risks within tolerance) are currently treated as independent subcategories. For critical infrastructure AI, the profile should specify that a unified trust decomposition model be used to demonstrate that safety and fairness are simultaneously maintained, not optimized against each other in isolation. A multi-axis trust scalar where each axis maps to a MEASURE subcategory produces a single artifact that simultaneously satisfies 2.6, 2.7, 2.8, 2.9, 2.10, and 2.11 — reducing compliance overhead for critical infrastructure operators who must satisfy multiple MEASURE subcategories simultaneously.

The nine Λ axes in Ouroboros map directly to [NIST AI RMF MEASURE subcategories](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/): Λ₁ (Accuracy) satisfies MEASURE 2.1 and 2.3; Λ₂ (Fairness) satisfies MEASURE 2.11; Λ₄ (Robustness) satisfies MEASURE 2.6; Λ₅ (Privacy) satisfies MEASURE 2.10; Λ₆ (Accountability) satisfies MEASURE 2.7 and 2.8; Λ₈ (Reliability) satisfies MEASURE 2.5; Λ₉ (Human Oversight) satisfies MEASURE 3.1. The profile could adopt this mapping structure as an informative reference, materially reducing the documentation burden on critical infrastructure deployers.

### Recommendation 4: Address LLM-Mediated Guardrails as an Architectural Risk in MANAGE 2.4 and GOVERN 1.4

MANAGE 2.4 (mechanisms to supersede or deactivate underperforming systems) and GOVERN 1.4 (transparent policies for risk management outcomes) do not currently address a structural risk that is pervasive in 2026 AI deployments: the use of a large language model as the safety layer policing another large language model. When the guardrail is itself a learned model — as in NVIDIA NeMo Guardrails ([GitHub](https://github.com/NVIDIA/NeMo-Guardrails)), Google Cloud's Vertex AI safety filters ([Vertex AI documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai)), or Meta's Llama Guard ([Llama Guard 4 on HuggingFace](https://huggingface.co/meta-llama/Llama-Guard-4-12B)) — the guardrail inherits the failure modes of the system it is designed to constrain. It can be jailbroken, drifted, or updated in ways that alter its enforcement behavior without notice.

The profile should add explicit language to MANAGE 2.4 recommending that critical infrastructure AI deployments use non-learned, deterministic safety primitives for enforcement layers wherever technically feasible, and that documentation for any learned guardrail include a drift monitoring commitment with mandatory re-evaluation intervals. This does not prohibit learned guardrails; it creates a documented accountability obligation for their use.

### Recommendation 5: Align GOVERN 6.1 Third-Party Risk Requirements with DoD CDAO Traceable Tenet for Supply Chain Auditability

GOVERN 6.1 (third-party AI risk policies) is currently a process requirement. In critical infrastructure AI, particularly for systems that touch [DoD responsible AI obligations](https://www.ai.mil/Initiatives/Responsible-AI/) or federal financial clearing, the profile should specify that third-party AI component suppliers demonstrate per-decision traceability through the supply chain. The [DoD RAI Strategy](https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF) "Traceable" tenet requires that AI decisions be explainable to authorized users — this obligation does not terminate at the boundary of the prime contractor. If a third-party AI component contributes to a critical infrastructure decision, its trust provenance must be as auditable as the prime system's provenance. The profile should require that GOVERN 6.1 compliance for critical infrastructure include a chain-of-Λ requirement: every AI component in the decision chain must produce a receipt that the integrating system can cryptographically verify.

---

## 3. Reference Implementation

Ouroboros v6.1.0, developed by SZL Holdings, provides a working reference implementation of every recommendation above. The system is documented and independently archived.

The theoretical foundation is published in two Zenodo deposits. The position paper — "Ouroboros v1: 91 Primitives, Closed-Form Λ Trust Scalar" — is available at [DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) (deposited April 28, 2026). The empirical companion — containing measurement methodology, test coverage, and the geometric-mean proof — is available at [DOI 10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926) (deposited April 30, 2026). Both are open-access under the ORCID of the author, Stephen Lutar (ORCID 0009-0001-0110-4173).

Ouroboros v6.1.0 comprises 91 primitives organized into 10 clusters (GOV, AUDIT, MEASURE, RISK, HUMAN, PRIVACY, SECURE, EXPLAIN, SUPPLY, CHANGE), 9 Λ axes computed as a closed-form geometric mean, and 1,500+ passing tests across all primitive clusters. The @szl-holdings/guardrails package is a drop-in replacement for NVIDIA NeMo Guardrails, covering the 54 most critical safety tests in a deterministic, receipt-generating runtime. Every inference event produces a structured receipt: a tamper-evident, human-readable and machine-readable artifact that records all nine Λ axis scores, the composite Λ scalar, a timestamp, and a hash chain linking it to the preceding decision.

The Λ geometric mean aggregator has the single-zero-collapse property: if any one of the nine axes scores zero, the composite Λ collapses to zero regardless of the values of the remaining axes. This means no combination of high scores on other axes can paper over a total failure on a single dimension — a critical property for life-safety AI contexts. NIST should consider whether this property, or an equivalent, should be a normative requirement for critical infrastructure trust scalars.

---

## 4. Pilot Offer

SZL Holdings offers to conduct a no-cost, 90-day federal lighthouse pilot of the Ouroboros Λ receipt infrastructure in a critical infrastructure AI workflow designated by NIST or a cooperating federal agency.

The deliverable of the pilot is a public Λ-trace: a sequence of per-decision audit receipts from a real critical infrastructure AI workflow, published in full, demonstrating that the MEASURE 2.3, MEASURE 2.4, MEASURE 2.8, and EU AI Act Article 12 requirements can be satisfied simultaneously by a single deterministic receipt artifact. The trace will be anonymized at the data level (no operational details of the specific infrastructure system will be included) but will be complete at the decision-audit level: every receipt will be present, verifiable, and accompanied by the derivation showing how each Λ axis score was produced.

NIST staff, cooperating agency personnel, and public observers would be able to verify any receipt in the trace independently using the published Λ derivation — without access to SZL systems, without a vendor relationship, and without proprietary tooling. The pilot is designed to produce a public artifact that NIST can cite as a reference example in the finalized Critical Infrastructure AI RMF Profile. SZL Holdings asks for no proprietary data from the cooperating agency and assumes no liability for decisions made by the agency's AI systems during the pilot period. Contact: Stephen Lutar, SZL Holdings, ORCID 0009-0001-0110-4173.

---

## 5. Sources Cited

1. [NIST AI RMF 1.0 (NIST AI 100-1)](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf)
2. [NIST AI RMF landing page](https://www.nist.gov/itl/ai-risk-management-framework)
3. [NIST Critical Infrastructure AI RMF Profile Concept Note](https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure)
4. [NIST AI 600-1 Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
5. [NIST AI RMF Core (AIRC)](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
6. [EU AI Act Article 12 — Record-Keeping](https://artificialintelligenceact.eu/article/12/)
7. [DoD Responsible AI Strategy and Implementation Pathway (2024)](https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF)
8. [CDAO Responsible AI Initiatives](https://www.ai.mil/Initiatives/Responsible-AI/)
9. [Ouroboros v1 Position Paper — Zenodo DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281)
10. [Ouroboros v2 Empirical Companion — Zenodo DOI 10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)
11. [NVIDIA NeMo Guardrails (GitHub)](https://github.com/NVIDIA/NeMo-Guardrails)
12. [Google Vertex AI Responsible AI Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai)
