# NIST AI RMF and Generative AI Profile crosswalk

**Assessment date:** 2026-07-25
**Assessment commit:** `36e924f2c8ec34d7e725fa1da6606dfa609e9eda`
**Status:** Internal evidence crosswalk; no NIST certification, endorsement, or
conformity claimed

## Claim boundary

The
[NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
is voluntary. Its Core organizes outcomes into four functions:
**Govern, Map, Measure, and Manage**, with Govern operating across the other
functions. NIST states that AI RMF 1.0 is being revised.

[NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative
Artificial Intelligence Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
is a cross-sectoral companion to AI RMF 1.0, not a certification program.
The authoritative publication is available at
[DOI 10.6028/NIST.AI.600-1](https://doi.org/10.6028/NIST.AI.600-1).

This document maps repository evidence; it does not establish organizational
adoption, control effectiveness, legal compliance, or operation in production.

## Evidence labels

| Label | Meaning in this document |
|---|---|
| **MEASURED** | A static repository property or local check was directly observed at the assessment commit. It does not prove deployed operation. |
| **MODELED** | Source, schema, workflow, or controlled documentation contains a relevant mechanism, but effectiveness was not demonstrated end to end. |
| **PLANNED** | A roadmap or architecture target exists without sufficient implementation evidence. |
| **UNKNOWN** | The current evidence cannot support a safe conclusion. |

## AI RMF Core crosswalk

Official Core reference:
[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/).
NIST's
[AI RMF Playbook](https://www.nist.gov/itl/ai-risk-management-framework/nist-ai-rmf-playbook)
contains voluntary suggestions and is not a checklist that must be adopted in
full.

| Function | Evidence label | Repository evidence | Gap to credible operation |
|---|---|---|---|
| **Govern** | **MODELED** | [`AGENTS.md`](../AGENTS.md), [`docs/A11OY_NON_NEGOTIABLES.md`](A11OY_NON_NEGOTIABLES.md), [`docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`](A11OY_PUBLIC_CLAIMS_DOCTRINE.md), the policy engine, approval modes, proof doctrine, and known-gaps register define governance intent and engineering controls. | Obtain organizational approval, named accountability, risk appetite, training and competence records, third-party governance, policy-operation evidence, periodic review, and independent assurance. Repository doctrine alone is not an operating governance program. |
| **Map** | **MODELED** | Architecture, product-surface, ontology, data-flow, source-of-truth, and risk documents describe system context and dependencies; [`docs/PRODUCT_SURFACES.md`](PRODUCT_SURFACES.md) and `audit/source-of-truth.json` provide reusable inventory inputs. | Establish one current AI-system inventory with owners, intended use, affected parties, deployment context, data/model/tool dependencies, impact analysis, legal obligations, and lifecycle state for each in-scope system. |
| **Measure** | **MODELED** | CI, security scanning, evaluation packages, readiness documents, proof verification, and test harnesses provide measurement mechanisms. The baseline docs-claims check produced a reproducible result in this workcell. | Approve risk metrics and thresholds, validate measurement methods, measure representative deployed behavior, cover bias/safety/security/privacy and human factors, retain longitudinal results, and independently review effectiveness. |
| **Manage** | **MODELED** | [`packages/policy-engine/src/evaluator.ts`](../packages/policy-engine/src/evaluator.ts) models allow, block, escalation, and approval outcomes; proof, incident, rollback, and known-gap documents define response paths. | Demonstrate prioritization, accountable treatment decisions, residual-risk acceptance, live escalation, rollback and containment across all deployed agent paths; test recovery and continuously track closure. |

No Core function is labeled as fully implemented because this assessment did
not examine an approved organization-wide program or representative production
evidence.

## NIST AI 600-1 risk crosswalk

The risk group names below follow NIST AI 600-1. A repository mechanism can be
relevant to a risk without demonstrating that the risk is adequately managed.

| Generative AI risk | Evidence label | Relevant repository evidence | Unclosed evidence need |
|---|---|---|---|
| CBRN Information or Capabilities | **UNKNOWN** | No dedicated CBRN evaluation or access-control evidence was established in this assessment. | Define applicable use cases, refusal policy, expert review, evaluations, monitoring, and incident response before making a mitigation claim. |
| Confabulation | **MODELED** | Evaluation, provenance, confidence, claim-review, and refusal concepts exist in doctrine and packages. | Run domain-specific factuality and calibration evaluations against versioned datasets and retain failure analysis. |
| Dangerous, Violent, or Hateful Content | **MODELED** | Policy and guardrail code can block actions or require approval. | Establish tested content-risk policies across every supported model, modality, locale, and tool path. |
| Data Privacy | **MODELED** | Privacy documentation, tenant-scoped retrieval, memory sensitivity checks, redaction, and retention logic exist. | Complete data-flow inventories, privacy impact assessments, deletion/retention tests, model-provider controls, and deployed cross-tenant isolation evidence. |
| Environmental Impacts | **MODELED** | `apps/energy-harvest/` contains energy-budget and provenance concepts. | Measure actual training/inference energy and water impacts with defined boundaries and independent methodology; do not generalize simulator output. |
| Harmful Bias or Homogenization | **PLANNED** | Evaluation and governance architecture can host bias assessments. | Approve affected-party and domain-specific metrics, representative datasets, subgroup analyses, remediation thresholds, and recurring operational measurement. |
| Human-AI Configuration | **MODELED** | Human-approval modes, escalation, confidence language, and public-claim boundaries are documented. | Test automation bias, overreliance, explanation comprehension, override, escalation, and informed approval with representative operators. |
| Information Integrity | **MODELED** | Proof-chain, DSSE, replay, verifier, citation, and provenance mechanisms exist in source and documentation. | Demonstrate complete coverage from input through decision and action, trusted signer identity, tamper rejection, source quality, and recovery from poisoned information. |
| Information Security | **MEASURED** | SHA-pinned workflows, secret scanning, dependency review, CodeQL, SBOM generation, and policy adapters are present in the repository. | Static controls do not prove deployed security. Complete threat modeling, adversarial testing, runtime monitoring, incident exercises, and per-artifact provenance verification. |
| Intellectual Property | **MODELED** | License scanning, dependency review, source attribution rules, and vendor-copy prohibitions exist. | Establish dataset/model/tool rights records, generated-output review, opt-out handling, and legal decisions for each deployed use. |
| Obscene, Degrading, and/or Abusive Content | **MODELED** | Policy and guardrail layers can represent block and approval outcomes. | Add versioned safety evaluations, model/modality coverage, user reporting, escalation, and measured false-positive/false-negative review. |
| Value Chain and Component Integration | **MODELED** | Lockfile controls, dependency review, SBOM workflows, signature/attestation configuration, inventories, and integration boundaries are present. | Verify external models, datasets, plugins, tools, MCP servers, and providers; bind provenance to each released artifact; monitor upstream changes and incident obligations. |

## Evidence priorities

1. Approve a current AI-system inventory and accountable owners.
2. Select applicable AI RMF and AI 600-1 outcomes per system rather than claiming
   repository-wide compliance.
3. Define measurable acceptance thresholds and versioned evaluation datasets.
4. Produce representative deployment evidence for policy enforcement, human
   approval, refusal, incident handling, and rollback.
5. Bind signed provenance to released artifacts as described in
   [`SLSA_POSTURE.md`](SLSA_POSTURE.md).
6. Record residual risk, accountable acceptance, review cadence, and closure
   evidence.

The approved public boundary is “mapped to NIST AI RMF and AI 600-1 with
documented evidence gaps,” not “NIST certified,” “NIST compliant,” or
“production-proven.”
