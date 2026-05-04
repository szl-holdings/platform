# A11oy — Bias Testing Methodology

**Document ID:** A11OY-COMP-BIAS-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, NYS Office of Information Technology Services, NYC AEDT-impacted buyers, civil-rights-sensitive procurements
**Classification:** Public; aligned to NIST AI RMF 1.0 (MANAGE-2.3) and NYC Local Law 144 audit principles

---

## 1. Purpose and scope

A11oy is a generic agent fabric. It does not, by itself, make consequential decisions about people. However, A11oy is the substrate on which Sentra and Amaru (and customer-built agents) run, and those agents may participate in:

- **Adverse-action workflows** (security incident classification, fraud flagging)
- **Allocation workflows** (alerting prioritization, ticket routing, resource scheduling)
- **Information-quality workflows** (summarization, retrieval, ranking)

This document defines the methodology SZL Holdings uses to identify, measure, and mitigate bias in A11oy-hosted agents. It is intended to be cited in procurement responses and verified by external evaluators.

This methodology is **not** a substitute for a customer's own AEDT audit (where applicable, e.g., NYC Local Law 144). It is a vendor-side companion methodology that produces evidence the customer's auditor can use.

## 2. Definitions

- **Protected attribute** — an attribute (race, sex, age, disability status, national origin, veteran status, religion, sexual orientation, pregnancy, genetic information) protected under federal law, EU AI Act Annex III, NYS Human Rights Law, or buyer-specified categories.
- **Subject population** — the set of natural persons potentially affected by an agent's outputs.
- **Disparate impact** — a statistically meaningful difference in agent outcomes across protected groups, irrespective of intent.
- **Adverse action** — any agent output that, if accepted, denies, removes, restricts, or penalizes the subject.

## 3. NIST AI RMF mapping

| RMF Function | A11oy practice |
|---|---|
| GOVERN-1.1 | This document is reviewed and re-published every 12 months or on significant model/architecture change, whichever is sooner. |
| GOVERN-3.2 | Bias testing is a release blocker. No agent is promoted to production for an in-scope use case without a current Bias Test Report. |
| MAP-1.1 / MAP-3.4 | Each customer-deployed agent is mapped to one of three risk tiers (§4) and a context envelope. |
| MEASURE-2.11 / 2.12 | Disparate-impact metrics are computed at every release and on a continuous monitoring schedule (§7). |
| MANAGE-2.3 | Mitigation actions are tracked and re-tested. |

## 4. Risk tiering

Every A11oy-hosted agent is assigned one of three tiers. Tier governs which test battery applies.

| Tier | Definition | Examples | Required tests |
|---|---|---|---|
| **T1 — Information** | Agent produces information for a human decider; output cannot directly take adverse action. | Document summarization, retrieval, status reports. | Quality + factuality only (§5). |
| **T2 — Influencing** | Agent produces a recommendation, ranking, or score that a human is expected to follow most of the time. | Alert prioritization, ticket routing. | T1 tests + disparate impact on ranking outputs (§6.A). |
| **T3 — Acting** | Agent takes or proposes adverse action; or its output is used in a consequential decision about a person. | Fraud flagging, account suspension recommendations, eligibility scoring. | T1 + T2 tests + adverse-impact analysis + counterfactual fairness + buyer AEDT support (§6.B–D). |

## 5. Quality and factuality (all tiers)

Computed via the `aef-evals` package on every release:

- **Faithfulness** — output is grounded in retrieved context (RAGAS faithfulness ≥ 0.85 target).
- **Answer relevancy** — output addresses the question (RAGAS ≥ 0.85).
- **Toxicity rate** — Detoxify-scored output ≤ 0.02 mean.
- **PII leak rate** — regex + ML detector; 0 tolerance for unredacted SSN/MRN/PAN; ≤ 0.001 for other PII categories.

## 6. Bias test battery

### 6.A Disparate impact on ranking / classification outputs (T2 + T3)

For each protected attribute available in the test fixture:

1. Construct paired or counterfactual fixtures that vary only the protected attribute (or a strong proxy).
2. Compute selection-rate ratio (4/5ths rule). Threshold: ≥ 0.80.
3. Compute equalized-odds difference. Threshold: ≤ 0.10.
4. Compute calibration error per group. Threshold: ≤ 0.05.
5. Run McNemar / chi-square for significance with Holm-Bonferroni correction.

Failures block the release. Mitigation must be retested before re-attempt.

### 6.B Adverse-impact analysis (T3)

In addition to §6.A:

- Construct an outcome distribution per protected group at the buyer-specified decision threshold.
- Report disparate-impact ratio at multiple thresholds (sensitivity analysis).
- Document the human-in-the-loop control that prevents the agent from acting unilaterally.
- Document the appeal pathway exposed to the subject.

### 6.C Counterfactual fairness (T3)

For each protected attribute:

- Generate counterfactual input by flipping/varying the attribute (or strongest proxy in the embedding space).
- Measure output difference: classification flip rate, ranking change, score delta.
- Threshold: flip rate ≤ 5% on the held-out fairness fixture.

### 6.D Buyer AEDT support (T3, AEDT-applicable customers)

- SZL provides the buyer's auditor with the raw test fixtures and result tables under NDA.
- SZL does not represent itself as the auditor. The buyer's independent auditor produces the AEDT audit; SZL provides evidence inputs.

## 7. Continuous monitoring

After release, agents in production emit fairness telemetry through `cognitive-observability`:

- Group-conditional outcome rates, ranks, and scores (no PII; cohorts defined by hashed attribute).
- Drift alarms fire at a 0.05 absolute change in disparate-impact ratio over a rolling 7-day window.
- Drift alarms create a `compliance-incident` record in the evidence ledger and notify the customer's designated reviewer.

## 8. Test fixtures and data sources

- **Public benchmark fixtures:** BOLD, BBQ, HolisticBias, RealToxicityPrompts, WinoBias, Stereoset, Civil Comments demographic-tagged subsets.
- **Synthetic counterfactual fixtures:** generated via a documented prompt pipeline; persisted hashed in the evidence ledger so a buyer can reproduce.
- **Customer fixtures (with consent):** customers may supply de-identified outcome logs to be folded into custom fairness fixtures. Retention and deletion follow `AMARU-02-retention-deletion.md`.

## 9. Test cadence

| Trigger | Frequency |
|---|---|
| Major release | Full battery |
| Model swap (new LLM provider/version) | Full battery |
| Domain profile change | Full battery |
| Minor release | §5 + §6.A only |
| Continuous | §7 monitoring |
| Annual refresh | Full battery + methodology re-publication |

## 10. Reporting

For each batter run, SZL produces a **Bias Test Report** containing:

1. Agent ID and version, A11oy SHA, A11oy package versions
2. Tier classification and rationale
3. Fixtures used (with hashes)
4. Per-test results with thresholds and pass/fail
5. Mitigations applied (if any), with retest deltas
6. Open issues and risk acceptance from the agent owner
7. Evidence-ledger anchor hash (so the report can be replayed)

Active customers receive the Bias Test Report relevant to their deployed agents on every release.

## 11. Limitations and honest disclosures

- **Protected-attribute inference.** SZL does **not** infer protected attributes from production traffic. All bias telemetry uses customer-provided cohorts or synthetic counterfactuals. This means SZL can miss real-world disparate impact that only appears in production. The continuous-monitoring system in §7 partially mitigates this.
- **Intersectionality.** The default battery measures one protected attribute at a time. Intersectional analysis (e.g., race × sex) is supported but is opt-in due to small-sample risk.
- **Foundation-model bias.** A11oy hosts agents that consume third-party LLMs. SZL does not redo the foundation-model vendor's safety testing. SZL measures the *system* outputs the customer experiences.
- **Self-attestation.** Until an external assessor reviews this methodology, all results are SZL self-reported. SZL will commission an independent algorithmic-audit attestation in 2027.

## 12. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 13. Contact

Stephen P. Lutar Jr. · inquiries@szlholdings.com
