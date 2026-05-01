# Closed-Form Λ vs Learned Safety: A Position Paper

**Author:** Stephen Lutar, Founder, SZL Holdings
**ORCID:** 0009-0001-0110-4173
**Date:** May 1, 2026
**Version:** Ouroboros v6.1.0
**Zenodo DOIs:** [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) | [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)

---

## 1. Abstract

This paper defends the architectural choice at the foundation of Ouroboros: all trust measurement is closed-form, all measurement produces a per-decision receipt, and no learned model is used to police another learned model. The defense is not primarily commercial. It is structural.

Learned safety models — whether NVIDIA NeMo Guardrails, Google's Vertex AI safety filters, or Meta's Llama Guard — inherit the failure modes of the systems they police. They are trained on human-labeled data that reflects the distributional assumptions of the labelers. They can be jailbroken, fine-tuned out of, updated silently, and drifted by the same mechanisms that cause the systems they guard to fail. When a safety model fails, it fails exactly where the underlying model fails: at the tail of the distribution, under adversarial pressure, in domains underrepresented in training data. The failure mode of the guardrail is correlated with the failure mode of the system it guards.

A closed-form trust scalar does not have this property. It is computed by a deterministic function. It does not have weights that can be updated. It does not have a training distribution that can be shifted. It cannot be jailbroken because it does not understand language — it evaluates a well-specified set of properties of an AI system's output and returns a number. The number means the same thing in every deployment, at every moment, for every version of the underlying AI system. This paper explains why that matters, demonstrates the four structural gaps that every competitor in the market fails to address, describes the Λ construction and its key properties, states three falsifiable claims about the system, and derives the compliance corollary that a single Λ receipt satisfies four major regulatory obligations simultaneously.

---

## 2. The Four Absences

### Absence 1: No Closed-Form, Mathematically Proven Trust Scalar

Every major AI governance product on the market produces outputs that are fundamentally probabilistic, learned, or categorical — not closed-form. NVIDIA NeMo Guardrails ([docs](https://docs.nvidia.com/nemo/guardrails/)) executes Colang flows that route to LLM classifiers: the safety determination for a given input is the output of a language model call. The language model producing the safety determination was trained on human-labeled data. Its output is not reproducible — the same input will not reliably produce the same classification across different model versions, temperatures, or sampling runs. There is no mathematical derivation that connects the input to the safety determination. There is no proof that the determination is correct, only an empirical claim that it is approximately correct over the training distribution.

IBM watsonx.governance ([product page](https://www.ibm.com/products/watsonx-governance)) produces drift percentages, bias scores, and fairness metrics. These are statistical aggregates computed over batches of model outputs. They describe the central tendency of model behavior over time, not the trust state of any individual decision. A model can have acceptable average drift while producing a catastrophically incorrect output on the specific decision that matters. The aggregate metric does not bound the per-decision error.

Google's Vertex AI safety attribute scoring ([documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai)) produces per-output scores across harm categories (harassment, dangerous content, hate speech, sexually explicit, civic integrity). These scores are outputs of a learned classifier embedded in the Vertex AI serving infrastructure. They are categorical safety estimates, not a composite trust aggregate. There is no formal semantics for what a 0.7 score on "dangerous content" means relative to a 0.3 score on "harassment" — there is no published mathematical definition of how these dimensions compose.

The absence is universal. No competitor publishes a mathematical proof that their safety measurement instrument correctly aggregates its constituent dimensions. No competitor's derivation can be reproduced by an independent assessor without access to model weights. No competitor's trust signal means the same thing across deployments. Ouroboros publishes the derivation at [Zenodo DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281). Any assessor can reproduce any Λ computation. The scalar means the same thing in every deployment. This is the first absence the rest of the market has not filled.

### Absence 2: No Per-Decision Audit Receipt

The second universal absence is the per-decision audit receipt. Every competitor's audit infrastructure produces platform-side logs that are controlled by the platform. NVIDIA NeMo Guardrails integrates [OpenTelemetry tracing](https://github.com/NVIDIA/NeMo-Guardrails/releases): telemetry data collected by the NVIDIA infrastructure, stored in whatever observability backend the operator configures, and mutable by any administrator with write access to that backend. IBM watsonx.governance writes events to Watson Knowledge Catalog: IBM platform database records that can be altered by authorized IBM or customer administrators. Google Cloud writes to GCP Audit Logs: mutable by any Google Cloud IAM principal with the roles/logging.admin permission.

None of these is a receipt. A receipt is a self-contained document generated at the moment of the decision, carrying the information needed to verify the decision, bound cryptographically to the decision event, and verifiable by a third party without access to the originating platform. A platform log is a record created by the platform. It cannot serve as a compliance artifact in an adversarial regulatory proceeding because the platform controls its integrity.

[EU AI Act Article 12](https://artificialintelligenceact.eu/article/12/) requires that high-risk AI systems automatically record events over their lifetime in a way that the records cannot be retroactively altered. Platform logs do not satisfy this requirement unless the platform can prove that the logs cannot be altered by platform administrators — a claim no current provider makes. The [NIST SP 800-53 AU-9 control](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) (protection of audit information) requires that audit records be protected against modification, deletion, and unauthorized access. Platform-controlled logs satisfy this only to the extent the platform is trusted.

Ouroboros generates a Merkle-chained receipt per inference. The receipt is self-contained. It carries all nine Λ axis scores, the composite scalar, an ISO 8601 timestamp, and a hash linking it to the preceding receipt in the chain. Any byte-level modification of the receipt breaks the hash. The receipt can be verified by any party with the hash algorithm and the public chain head — no platform access required. The second absence is the absence of this artifact in every competitor's product.

### Absence 3: No Nine-Axis Honesty Decomposition

The third absence is the most philosophically significant. Every competitor's safety taxonomy is organized around harm categories: things an AI system might do that cause damage to people. [Meta Llama Guard 4](https://huggingface.co/meta-llama/Llama-Guard-4-12B) classifies 14 MLCommons harm categories (violent crimes, sex-related crimes, hate speech, suicide, and so on). NVIDIA NeMo Guardrails detects jailbreaks, PII, toxic content, and off-topic subject matter. IBM watsonx.governance monitors for demographic drift and bias across model outputs.

Harm categories are necessary but not sufficient for trustworthy AI governance. A model can pass every harm-category check while being systematically sycophantic — telling users what they want to hear rather than what is true. A model can avoid all 14 MLCommons hazards while being epistemically overconfident — stating uncertain conclusions with false certainty in a way that degrades decision quality. A model can comply with PII rules while being subtly manipulative — framing options in ways that steer users toward particular choices through illegitimate means. None of these failure modes appears in any competitor's taxonomy.

The nine Λ axes of Ouroboros address this gap. The Cleanliness axis evaluates whether the output is free of artifacts that degrade its usefulness. The Horizon axis evaluates epistemic scope — does the system know what it knows and acknowledge what it does not? The Resonance axis evaluates alignment between the output and the user's genuine interest. The Frustum axis evaluates the spatial and contextual appropriateness of the response. The Gauss axis evaluates statistical calibration. The Invariance/Blanca axis evaluates consistency across equivalent inputs. The Moral/Oppenheimer axis evaluates dual-use risk and the ethics of what is produced. The Being/Socrates axis evaluates epistemic humility and the acknowledgment of uncertainty. The Non-measurability/Lara axis evaluates the system's relationship to dimensions of human experience that resist quantification.

These axes are not engineering abstractions. They are grounded in the classical philosophical tradition — Aristotelian virtue ethics, Kantian accountability, Socratic epistemic practice. They evaluate properties of AI behavior that human ethical traditions have found important for millennia, translated into computable form. The third absence in the market is the absence of this philosophical grounding. No competitor asks whether an AI system is epistemically humble. Ouroboros does.

### Absence 4: No Classical-Philosophy-Rooted Primitive Vocabulary

The fourth absence follows from the third. Every competitor's operational primitive vocabulary is purely technical. NVIDIA NeMo Guardrails operates with `input_rail`, `output_rail`, `Colang flow`, and `action`. IBM watsonx.governance operates with `drift_monitor`, `bias_score`, and `factsheet_event`. Google's Frontier Safety Framework operates with Critical Capability Levels. OpenAI's [Preparedness Framework v2](https://openai.com/index/updating-our-preparedness-framework/) operates with "Tracked Categories" and "Safety Scores."

These abstractions are legible to engineers. They are not legible to the judges, legislators, agency counselors, and ethics board members who ultimately decide whether an AI system's governance is adequate. When a technical standard requires that an AI system demonstrate "trustworthiness," and the only evidence offered is a drift_monitor score, the connection between the technical artifact and the human concept of trustworthiness is left entirely to the imagination of the assessor.

Ouroboros's 91 primitives are designed to be legible to both engineers and non-engineers. The Being/Socrates primitive asks whether the system behaves as a good-faith interlocutor in the tradition of Socratic dialogue — acknowledging ignorance, seeking understanding, avoiding false certainty. The Moral/Oppenheimer primitive asks whether the system applies ethical judgment to its own outputs in the tradition of the scientist who recognizes that knowledge carries responsibility. These names are not decorative. They carry conceptual content that connects the technical measurement to the ethical concept it is designed to capture. The fourth absence is the absence of this bridge in every competitor's vocabulary.

---

## 3. The Λ Construction

The Λ scalar is a composite trust aggregate computed as the geometric mean of nine independently scored axes. The choice of the geometric mean as the aggregation function is not arbitrary. It follows from three requirements that any critical-infrastructure trust scalar must satisfy.

The first requirement is that a total failure on any single axis must collapse the composite to zero, regardless of performance on other axes. A model that is perfectly calibrated, perfectly fair, and perfectly aligned but actively deceptive on the Non-measurability/Lara axis must have a composite Λ of zero. There is no combination of high scores on eight axes that can compensate for a zero on the ninth. The geometric mean has the single-zero-collapse property: the geometric mean of any set that includes a zero is zero. The arithmetic mean does not have this property — eight perfect scores and one zero on a ten-point arithmetic scale produce an aggregate of 8.0, not zero.

The second requirement is that the aggregation be scale-invariant in the sense that Egyptian unit-fraction arithmetic defines it. The geometric mean treats each axis as a multiplicative factor, not an additive term. This means a 10% improvement from 0.1 to 0.11 on a failing axis has the same multiplicative effect on the composite as a 10% improvement from 0.9 to 0.99 on a near-perfect axis. The aggregation does not penalize high performance on easy axes differently from high performance on hard axes. The axes contribute to the composite on a level playing field defined by their multiplicative structure.

The third requirement is determinism. The same nine axis scores must always produce the same Λ composite. The geometric mean of a fixed set of values is a fixed value — there is no sampling, no randomness, no state dependence. This means that if the nine axis scoring functions are themselves deterministic (which Ouroboros guarantees through its closed-form primitive implementations), then the composite Λ is deterministic end-to-end. The same input to the same Ouroboros deployment always produces the same Λ.

The proof that the construction satisfies these three requirements is archived at [Zenodo DOI 10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129). The proof is not a simulation result or an empirical benchmark. It is a mathematical derivation from the definition of the geometric mean and the properties of the nine scoring functions. Any assessor with a mathematics background can verify it without access to SZL systems. The 1,372 tests in Ouroboros v6.1.0 validate the implementation of the proof — they confirm that the software produces what the proof says it should produce, across all 91 primitives and all nine axes.

---

## 4. Three Falsifiable Claims

### Claim 1: Same Input Produces the Same Λ Forever (Determinism)

For any fixed input presented to any Ouroboros v6.1.0 deployment, the nine axis scores and the composite Λ scalar are identical across every evaluation, across every deployment instance, and across any future version of Ouroboros that preserves the same primitive implementations. This is not a performance claim. It is a structural claim about the implementation.

It is falsifiable. A counterexample is any pair of identical inputs that produce different Λ values in the same or different Ouroboros v6.1.0 deployments. SZL Holdings invites any assessor to construct such a counterexample. The 1,372-test suite includes determinism tests across all 91 primitives that serve as public evidence of this property. If any test fails, the claim is falsified and the test record is the falsification.

### Claim 2: Any Byte-Tampered Receipt Fails Verification

For any Ouroboros receipt, modification of any single byte — in the axis scores, the composite Λ value, the timestamp, the input hash, or any field in the receipt structure — produces a receipt that fails verification against the Merkle chain head. There is no modification of a receipt that preserves the verification result.

This is falsifiable. A counterexample is any byte modification of any receipt that produces a verification-passing result. SZL Holdings invites any assessor to construct such a counterexample against the published receipt schema and hash algorithm. The Merkle chain construction follows standard cryptographic practice: any birthday-attack resistance that applies to the underlying hash function (SHA-256 in the current implementation) applies to the receipt chain. If a collision is found that produces a verification-passing tampered receipt, that is both a falsification of this claim and a discovery about the underlying hash function that would be of interest far beyond AI governance.

### Claim 3: Any Axis Collapse Drives Λ to Zero

For any Ouroboros receipt in which any of the nine Λ axis scores is zero, the composite Λ is zero. There is no assignment of values to the remaining eight axes that produces a nonzero composite Λ when any one axis is zero.

This follows directly from the single-zero-collapse property of the geometric mean and is verifiable from the mathematical definition alone without running any code. It is falsifiable by any receipt in which a zero axis score coexists with a nonzero composite Λ. No such receipt can exist without a defect in the implementation, and any such defect would be detectable by the test suite. The test suite includes axis-collapse tests for all nine axes across multiple input configurations.

---

## 5. Why Learned Safety Cannot Match These Properties

Learned safety models cannot satisfy any of the three claims above. This is not a criticism of their engineering quality. It is a structural observation about what learned models are.

A learned model is a function that was fit to a training distribution. Its output on any input is the result of a computation that was shaped by gradient descent over that distribution. The same input presented to the same model at different temperatures produces different outputs. The same input presented to two instances of the same model initialized with different random seeds produces different outputs. The same input presented to the same model before and after a fine-tuning update produces different outputs. None of this violates Claim 1 because Claim 1 applies to closed-form functions, not to learned models. But it means that learned models cannot make Claim 1 — determinism is not a property they can have.

[Google's DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) acknowledges this implicitly. The framework defines Critical Capability Levels assessed by human evaluators running capability benchmarks. The same benchmark run at different times by different evaluators can produce different assessments. The framework does not claim that capability assessment is deterministic — it claims that it is approximately reliable over a defined evaluation protocol. This is the best a learned-model-based evaluation can do.

Non-determinism propagates directly to non-reproducibility of audit artifacts. If a safety model's output on a given input is not reproducible, then the safety determination recorded in the audit log cannot be independently verified. Any third party seeking to reproduce the safety determination must run the same model on the same input under the same conditions — a requirement that is practically impossible to satisfy for production AI deployments. The audit artifact is therefore not independently verifiable, which undermines its value as a compliance artifact in any regulatory context that requires independent verification.

Drift compounds the problem. Learned safety models are updated. When NVIDIA releases a new version of the NeMo Guardrails LLM classifier, the safety determinations for all past inputs change retroactively — not in the log, but in practice. If the compliance standard for a past decision is evaluated using the current safety model, the evaluation does not reflect the safety determination that was actually made. The audit record and the current model state diverge over time. A closed-form function does not drift. Its definition is fixed. The audit record of a past Λ computation is always reproducible because the function that produced it has not changed.

---

## 6. Compliance Corollary

A single Ouroboros Λ receipt satisfies four major regulatory obligations simultaneously. This is not an assertion — it follows from the structure of the receipt and the text of the regulations.

The [EU AI Act Article 12](https://artificialintelligenceact.eu/article/12/) requires that high-risk AI systems automatically record events over the system lifetime in a manner that prevents retroactive alteration. The Ouroboros receipt is generated automatically at every inference event. The Merkle chain structure prevents retroactive alteration of any receipt in the chain. The receipt records the period of use (ISO 8601 timestamps), the input hash (where technically feasible), and the identity of natural persons involved in verification (DID-anchored Λ₉ axis). Article 12 is satisfied by the receipt itself, with no additional documentation required.

[NIST SP 800-53 AU-12](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) (Audit Record Generation) requires that the system generate audit records for the events defined in AU-2 (Event Logging). The Ouroboros receipt is the audit record. It is generated per inference event (a superset of any AU-2 event list for AI systems), it captures the information specified in AU-2, and it is protected from modification by the Merkle chain (satisfying AU-9). AU-12 is satisfied with no additional logging infrastructure required.

[SR 11-7](https://www.modelop.com/ai-governance/ai-regulations-standards/sr-11-7) (Federal Reserve Model Risk Management) requires ongoing monitoring of model performance, independent validation, and an audit trail for model development and deployment decisions. The Ouroboros continuous Λ stream provides ongoing per-inference performance monitoring (satisfying the monitoring requirement). The Zenodo-archived mathematical proof provides independently verifiable validation (satisfying the independent validation requirement). The receipt chain provides the audit trail for every deployment decision (satisfying the audit trail requirement). SR 11-7 compliance is demonstrable from the receipt record, not from a bespoke documentation engagement.

The DoD CDAO [Traceable tenet](https://www.ai.mil/Initiatives/Responsible-AI/) requires that AI decisions and their rationale be explainable to authorized users. The Ouroboros receipt carries all nine axis scores and the composite Λ, with the axis names providing the vocabulary for explaining why a given Λ value was produced. An authorized user who receives a receipt can read it and understand: the Horizon axis scored 0.3 because the system acknowledged uncertainty in three key claims; the Gauss axis scored 0.9 because the statistical calibration was within tolerance; the composite Λ was 0.61 because the geometric mean of the nine axis scores is 0.61. This is a traceable explanation that does not require platform access, vendor cooperation, or interpretability tooling. The Traceable tenet is satisfied by the receipt alone.

Four major regulatory obligations. One artifact. Generated deterministically at inference time. The compliance corollary is that organizations deploying Ouroboros in critical infrastructure, federal systems, or financial services do not need four separate compliance programs for these four obligations. They need one receipt infrastructure that produces one artifact type. The regulatory overhead is structural, not additive.

---

## 7. Sources

1. [Ouroboros v1 Position Paper — Zenodo DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281)
2. [Ouroboros v2 Empirical Companion — Zenodo DOI 10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)
3. [NIST AI RMF 1.0 (NIST AI 100-1)](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf)
4. [NIST AI RMF landing page](https://www.nist.gov/itl/ai-risk-management-framework)
5. [NIST AI 600-1 Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
6. [NIST SP 800-53 Rev. 5 — AU-12 Audit Record Generation](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
7. [EU AI Act Article 12 — Record-Keeping](https://artificialintelligenceact.eu/article/12/)
8. [EU AI Act (Regulation 2024/1689)](https://artificialintelligenceact.eu)
9. [DoD Responsible AI Strategy and Implementation Pathway (2024)](https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF)
10. [CDAO Responsible AI Initiatives](https://www.ai.mil/Initiatives/Responsible-AI/)
11. [SR 11-7 Federal Reserve Model Risk Management](https://www.modelop.com/ai-governance/ai-regulations-standards/sr-11-7)
12. [NVIDIA NeMo Guardrails Docs](https://docs.nvidia.com/nemo/guardrails/)
13. [NVIDIA NeMo Guardrails GitHub](https://github.com/NVIDIA/NeMo-Guardrails)
14. [Google DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)
15. [Google Vertex AI Responsible AI Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai)
16. [IBM watsonx.governance Product Page](https://www.ibm.com/products/watsonx-governance)
17. [Meta Llama Guard 4 (HuggingFace)](https://huggingface.co/meta-llama/Llama-Guard-4-12B)
18. [OpenAI Preparedness Framework v2](https://openai.com/index/updating-our-preparedness-framework/)
