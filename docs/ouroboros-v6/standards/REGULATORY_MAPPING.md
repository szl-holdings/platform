# Ouroboros Regulatory Mapping
## SZL Holdings — 91 Primitives × 9-Axis Λ Trust Scalar

**Classification:** Internal Strategy — Regulatory Affairs  
**Version:** 1.0 | **Date:** 2026-04-30  
**Scope:** Federal, Healthcare, and Finance verticals across US and EU jurisdictions

---

## Primitive Taxonomy Reference

For this mapping, Ouroboros primitives are grouped into functional clusters to facilitate clause-level matching. The 9-axis Λ trust scalar axes are designated **Λ₁–Λ₉** corresponding to: Accuracy, Fairness, Transparency, Robustness, Privacy, Security, Accountability, Reliability, and Human Oversight.

The following shorthand clusters are used in the tables:

| Cluster | Primitives | Description |
|---------|-----------|-------------|
| **GOV** | Gov-01 → Gov-12 | Governance, policy, and accountability primitives |
| **AUDIT** | Aud-01 → Aud-09 | Audit trail, logging, and receipt generation |
| **MEASURE** | Meas-01 → Meas-11 | Quantitative evaluation, metric, and TEVV primitives |
| **RISK** | Risk-01 → Risk-08 | Risk identification, scoring, and residual risk doc |
| **HUMAN** | Hum-01 → Hum-07 | Human-in-the-loop, override, and oversight primitives |
| **PRIVACY** | Priv-01 → Priv-09 | Data minimization, consent, and subject-right primitives |
| **SECURE** | Sec-01 → Sec-10 | Adversarial robustness, integrity, and cybersecurity |
| **EXPLAIN** | Exp-01 → Exp-08 | Explainability, interpretability, and model card |
| **SUPPLY** | Sup-01 → Sup-09 | Supply chain, third-party, and model provenance |
| **CHANGE** | Chg-01 → Chg-08 | Change control, version management, and decommission |

---

## 1. NIST AI Risk Management Framework (AI RMF 1.0 + Generative AI Profile)

> **Authority:** NIST AI 100-1 (January 2023); NIST AI 600-1 (July 2024)  
> **Source:** [https://www.nist.gov/itl/ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework)  
> **Profile PDF:** [https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

The AI RMF 1.0 consists of 19 categories and 72 subcategories across four functions. The Generative AI Profile (AI 600-1) adds 12 GenAI-specific risk categories and maps suggested actions to the same subcategory IDs (using format GV-x.x-NNN). Ouroboros's closed-form Λ scalar is uniquely positioned to satisfy the MEASURE function as a quantitative, auditable trust signal.

### 1A. GOVERN Function

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| GOVERN 1.1 | Legal and regulatory requirements involving AI are understood, managed, and documented | GOV-01 (Regulatory Register), GOV-02 (Policy Ledger) | Λ₆ (Accountability) receipt referencing reg-ID; policy diff log | **Covered** |
| GOVERN 1.2 | Trustworthy AI characteristics integrated into organizational policies | GOV-03 (Trustworthiness Policy), EXPLAIN-01 (Model Card) | Signed model card with Λ composite score embedded | **Covered** |
| GOVERN 1.3 | Risk tolerance levels defined and risk management activities calibrated | RISK-01 (Tolerance Threshold Primitive), GOV-04 | Λ threshold receipts per deployment tier | **Covered** |
| GOVERN 1.4 | Risk management outcomes established through transparent policies | GOV-05 (Transparency Policy), AUDIT-01 | Immutable policy receipt with timestamp | **Covered** |
| GOVERN 1.5 | Ongoing monitoring and periodic review of risk management | MEASURE-09 (Drift Monitor), MANAGE-4.1 wrapper | Automated Λ delta reports on cadenced schedule | **Covered** |
| GOVERN 1.6 | Inventory of AI systems resourced to risk priorities | GOV-06 (System Inventory), SUPPLY-01 | Λ-ranked system registry receipt | **Covered** |
| GOVERN 1.7 | Decommissioning and phase-out processes in place | CHANGE-08 (Decommission Primitive) | Signed decommission receipt with residual risk attestation | **Covered** |
| GOVERN 2.1 | Roles and responsibilities for AI risk management documented | GOV-07 (RACI Primitive) | Role-stamped Λ receipts (who approved which axis) | **Covered** |
| GOVERN 2.2 | Personnel receive AI risk management training | GOV-08 (Training Attestation) | Training completion Λ₆ receipt per user | **Partial** — training content not in-primitives |
| GOVERN 2.3 | Executive leadership accountable for AI risk decisions | GOV-09 (Exec Sign-off Primitive) | Executive-keyed Λ₆ receipt with digital signature | **Covered** |
| GOVERN 3.1 | Diverse teams involved in risk decision-making | GOV-10 (Diversity Attestation) | Demographic metadata on review receipts | **Partial** — demographic data sourced externally |
| GOVERN 4.1 | Safety-first mindset in design and deployment | GOV-11 (Safety Policy), RISK-02 | Λ₄ (Robustness) + Λ₈ (Reliability) floor receipts | **Covered** |
| GOVERN 5.1 | External feedback collected and integrated | GOV-12 (Feedback Loop Primitive), MEASURE-11 | Feedback intake receipt linked to Λ update cycle | **Covered** |
| GOVERN 6.1 | Third-party AI risk policies in place | SUPPLY-01 (Vendor Risk), SUPPLY-02 | Λ receipt from third-party attestation handshake | **Covered** |
| GOVERN 6.2 | Contingency processes for high-risk third-party failures | SUPPLY-09 (Circuit Breaker), CHANGE-07 | Failover receipt with Λ₈ reliability annotation | **Covered** |

### 1B. MAP Function

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| MAP 1.1 | Intended purposes, beneficial uses, laws, norms documented | RISK-03 (Use-Case Registry), GOV-01 | Λ composite at deployment context registration | **Covered** |
| MAP 1.5 | Organizational risk tolerances determined | RISK-01 | Λ floor/ceiling threshold receipts | **Covered** |
| MAP 2.1 | AI tasks and methods defined (classifiers, generative, recommenders) | EXPLAIN-02 (System Descriptor) | Method-tagged Λ receipt | **Covered** |
| MAP 2.2 | Knowledge limits and human oversight paths documented | HUMAN-01 (Override Doc), EXPLAIN-03 | Λ₉ (Human Oversight) receipts with handoff conditions | **Covered** |
| MAP 2.3 | Scientific integrity and TEVV documented | MEASURE-01 (TEVV Plan) | TEVV plan signed receipt; linked to Λ₁ accuracy baseline | **Covered** |
| MAP 3.5 | Human oversight processes assessed | HUMAN-02 (Oversight Assessment) | Λ₉ receipts from oversight simulation runs | **Covered** |
| MAP 4.1 | Third-party IP and legal risk mapping | SUPPLY-03 (IP Risk Primitive) | Legal-risk Λ receipt | **Covered** |
| MAP 5.1 | Likelihood and magnitude of impacts characterized | RISK-04 (Impact Matrix) | Impact Λ heat-map receipt | **Covered** |

### 1C. MEASURE Function — Λ Alignment Focus

The closed-form Λ scalar is the primary compliance instrument for MEASURE. Each Λ axis maps directly to a MEASURE subcategory, creating a one-to-one evidentiary bridge that is **unique among commercial AI frameworks**.

| Clause | Requirement | Λ Axis | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|--------|----------------------|-----------------|--------|
| MEASURE 1.1 | Risk measurement approaches selected for significant risks | Λ composite | MEASURE-01 (Risk Measurement Plan) | Λ priority-rank receipt | **Covered** |
| MEASURE 1.2 | Metrics and controls regularly reassessed | All Λ axes | MEASURE-09 (Drift Monitor) | Automated Λ delta receipts on policy cadence | **Covered** |
| MEASURE 1.3 | Independent assessors involved | Λ₆ (Accountability) | AUDIT-07 (Third-Party Assessor Link) | Co-signed Λ receipt with assessor DID | **Covered** |
| MEASURE 2.1 | Test sets, metrics, and TEVV tools documented | Λ₁ (Accuracy) | MEASURE-02 (Benchmark Registry) | Benchmark-linked Λ₁ receipt | **Covered** |
| MEASURE 2.3 | Performance/assurance measured under deployment conditions | Λ₁, Λ₄, Λ₈ | MEASURE-03 (Deployment Eval) | Λ₁+Λ₄+Λ₈ composite deployment receipt | **Covered** |
| MEASURE 2.4 | Production monitoring of behavior | Λ₄, Λ₈ | MEASURE-04 (Production Monitor) | Continuous Λ stream receipts | **Covered** |
| MEASURE 2.5 | Validity and reliability demonstrated | Λ₈ (Reliability) | MEASURE-05 (Validity Primitive) | Λ₈ validation receipt with confidence interval | **Covered** |
| MEASURE 2.6 | Safety risks evaluated, residual risk within tolerance | Λ₄ (Robustness) | RISK-05 (Safety Eval) | Λ₄ ≥ threshold attestation receipt | **Covered** |
| MEASURE 2.7 | Security and resilience evaluated | Λ₆ (Security) | SECURE-01 → SECURE-05 | Λ₆ adversarial-test receipt | **Covered** |
| MEASURE 2.8 | Transparency and accountability risks examined | Λ₃ (Transparency), Λ₆ | EXPLAIN-04, AUDIT-02 | Λ₃+Λ₆ dual-signed receipt | **Covered** |
| MEASURE 2.9 | Model explained, validated, output interpreted in context | Λ₃ | EXPLAIN-01 → EXPLAIN-05 | Model card with Λ₃ explainability score | **Covered** |
| MEASURE 2.10 | Privacy risk examined | Λ₅ (Privacy) | PRIV-01 → PRIV-05 | Λ₅ privacy-impact receipt | **Covered** |
| MEASURE 2.11 | Fairness and bias evaluated and documented | Λ₂ (Fairness) | MEASURE-06 (Bias Eval) | Λ₂ disparity-metric receipt per protected class | **Covered** |
| MEASURE 2.13 | TEVV metrics effectiveness evaluated | Λ composite | MEASURE-07 (Meta-Eval) | Meta-Λ calibration receipt | **Covered** |
| MEASURE 3.1 | Existing and emergent risks tracked over time | All Λ axes | MEASURE-09 (Drift Monitor) | Time-series Λ envelope receipts | **Covered** |
| MEASURE 4.2 | Trustworthiness validated by domain experts in deployment context | All Λ axes | AUDIT-07 (Expert Validation) | Expert-co-signed Λ receipt | **Partial** — expert engagement is process-dependent |

**Λ moat insight:** The closed-form, auditable nature of Λ allows MEASURE compliance artifacts to be generated programmatically at inference time, not only at assessment time — a capability no existing TEVV tooling achieves.

### 1D. MANAGE Function

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| MANAGE 1.1 | Determination whether AI system should proceed | RISK-06 (Go/No-Go Gate) | Λ gate receipt with pass/fail attestation | **Covered** |
| MANAGE 1.2 | Risk treatment prioritized by impact and likelihood | RISK-07 (Priority Queue) | Λ-ranked treatment receipt | **Covered** |
| MANAGE 1.3 | High-priority risk responses planned and documented | RISK-08 (Response Plan) | Response plan receipt co-signed by Λ₆ | **Covered** |
| MANAGE 2.4 | Mechanisms to supersede/deactivate underperforming systems | HUMAN-03 (Kill Switch), CHANGE-07 | Λ₄+Λ₈ floor-breach triggers deactivation receipt | **Covered** |
| MANAGE 3.1 | Third-party risks monitored and controls applied | SUPPLY-05 (Vendor Monitor) | Vendor Λ delta receipt on cadence | **Covered** |
| MANAGE 4.1 | Post-deployment monitoring including appeal/override | HUMAN-04 (Appeal Primitive), AUDIT-03 | Appeal receipt linked to Λ₂ fairness re-evaluation | **Covered** |
| MANAGE 4.3 | Incidents communicated and recovery documented | AUDIT-04 (Incident Primitive) | Incident Λ receipt with timeline and root-cause | **Covered** |

### 1E. NIST AI 600-1 Generative AI Profile

> **Source:** [https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

The GenAI Profile defines 12 risk categories mapped onto the same RMF function/subcategory IDs. Key Ouroboros mappings:

| GenAI Risk Category | Λ Axis | Primitive(s) | Receipt Evidence | Status |
|--------------------|--------|-------------|-----------------|--------|
| Confabulation / Hallucination | Λ₁ (Accuracy) | MEASURE-02, EXPLAIN-06 (Uncertainty Quant) | Λ₁ calibration receipt with hallucination rate | **Covered** |
| Data Privacy | Λ₅ (Privacy) | PRIV-01 → PRIV-09 | Λ₅ PII-leakage test receipt | **Covered** |
| Harmful Bias / Homogenization | Λ₂ (Fairness) | MEASURE-06, EXPLAIN-07 | Λ₂ disparity receipt across demographic slices | **Covered** |
| CBRN Information Access | Λ₆ (Security) | SECURE-07 (Content Filter), Oppenheimer module | Λ₆ dual-use review receipt (ITAR-flagged) | **Covered** |
| Dangerous / Violent Content | Λ₆ | SECURE-08 (Content Safety Primitive) | Λ₆ safety classification receipt | **Covered** |
| Data Poisoning | Λ₄ (Robustness) | SECURE-03 (Poisoning Detector) | Λ₄ training-integrity receipt | **Covered** |
| Intellectual Property | Λ₃ (Transparency) | SUPPLY-06 (IP Attribution) | Λ₃ provenance receipt with attribution chain | **Covered** |
| Obscene / Degrading Content | Λ₆ | SECURE-09 | Λ₆ content audit receipt | **Covered** |
| Value Chain / Third-Party | Λ₆, Λ₈ | SUPPLY-01 → SUPPLY-09 | Vendor Λ composite receipt | **Covered** |
| Cybersecurity | Λ₆ | SECURE-01 → SECURE-10 | Full Λ₆ red-team receipt | **Covered** |

---

## 2. EU AI Act (Regulation 2024/1689)

> **Authority:** Regulation (EU) 2024/1689 of the European Parliament and of the Council  
> **Enforcement timeline:** GPAI rules enforceable August 2, 2025; High-risk system rules (Articles 8–17) enforceable **August 2, 2026**  
> **Source:** [https://artificialintelligenceact.eu](https://artificialintelligenceact.eu) | [https://ai-act-service-desk.ec.europa.eu](https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act)

### 2A. Article 9 — Risk Management System

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| Art. 9(1) | Risk management system established, implemented, documented, maintained | RISK-01 → RISK-08, GOV-04 | Λ-anchored risk register receipt | **Covered** |
| Art. 9(2) | Continuous iterative process throughout AI lifecycle | MEASURE-09 (Drift Monitor) | Continuous Λ drift stream with lifecycle phase tagging | **Covered** |
| Art. 9(3) | Identification and analysis of known and foreseeable risks | RISK-03 (Use-Case Registry), RISK-04 | Risk enumeration receipt with Λ severity weighting | **Covered** |
| Art. 9(4) | Residual risk estimation after risk management measures | RISK-05, RISK-06 | Λ residual-risk receipt post-mitigation | **Covered** |
| Art. 9(5) | Testing to identify and address risks, including real-world testing | MEASURE-03 (Deployment Eval) | Λ pre/post deployment test receipt | **Covered** |
| Art. 9(6) | Conformance demonstrated with AI Act requirements | AUDIT-08 (Conformity Package) | Full Λ conformity receipt bundle | **Partial** — notified body involvement external |

### 2B. Article 12 — Record-Keeping (Logging)

> "High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system." — [Art. 12, EU AI Act](https://artificialintelligenceact.eu/article/12/)

The Λ receipt infrastructure is a native implementation of Article 12. Every Ouroboros inference event generates an immutable, timestamped receipt carrying all 9 Λ axes.

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| Art. 12(1) | Automatic logging of events over system lifetime | AUDIT-01 → AUDIT-09 (Receipt Stack) | Per-inference Λ receipt with event ID, timestamp, axes | **Covered** |
| Art. 12(2)(a) | Log period of each use (start/end timestamps) | AUDIT-02 (Session Logger) | Session-scoped Λ receipt with ISO 8601 timestamps | **Covered** |
| Art. 12(2)(b) | Reference database(s) used for verification | SUPPLY-04 (Data Provenance) | Λ₅ + provenance hash receipt | **Covered** |
| Art. 12(2)(c) | Input data where technically feasible | AUDIT-03 (Input Hash Logger) | Input hash chained into Λ receipt Merkle tree | **Covered** |
| Art. 12(2)(d) | Identity of natural persons involved in verification | HUMAN-05 (Human Identity Tag) | Human-keyed Λ₉ receipt with DID | **Covered** |

### 2C. Article 13 — Transparency

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| Art. 13(1) | Sufficient transparency for deployers to interpret output | EXPLAIN-01 → EXPLAIN-08 | Λ₃ transparency score with model card receipt | **Covered** |
| Art. 13(3)(a) | Provider contact details in instructions for use | GOV-02 (Provider Registry) | Metadata in Λ receipt header | **Covered** |
| Art. 13(3)(b) | System capabilities and limitations | EXPLAIN-02 (System Descriptor), EXPLAIN-03 | Λ₁ accuracy bounds receipt + limitations doc | **Covered** |
| Art. 13(3)(c) | Changes affecting system performance | CHANGE-01 → CHANGE-06 (Change Primitives) | Λ delta receipt on each version push | **Covered** |
| Art. 13(3)(d) | Human oversight measures per Art. 14 | HUMAN-01 → HUMAN-07 | Λ₉ oversight configuration receipt | **Covered** |
| Art. 13(3)(e) | Computational resources, expected lifetime, maintenance | MEASURE-08 (Resource Profiler) | Λ resource footprint receipt | **Partial** — hardware telemetry integration required |

### 2D. Article 14 — Human Oversight

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| Art. 14(1) | System designed to be effectively overseen by humans | HUMAN-01 → HUMAN-07 | Λ₉ ≥ minimum threshold receipt at design attestation | **Covered** |
| Art. 14(2) | Oversight minimizes risks to health, safety, fundamental rights | HUMAN-02 (Oversight Assessment) | Λ₉ x Λ₄ composite safety-oversight receipt | **Covered** |
| Art. 14(4)(a) | Understanding of system capabilities and limitations | EXPLAIN-02, EXPLAIN-03 | Λ₁+Λ₃ capability receipt delivered to deployer | **Covered** |
| Art. 14(4)(b) | Awareness of automation bias | EXPLAIN-07 (Bias Awareness Flag) | Λ₂ alert receipt flagging automation bias risk | **Covered** |
| Art. 14(4)(c) | Correct interpretation of output | EXPLAIN-04 (Output Interpreter) | Interpretation guide embedded in Λ₃ receipt | **Covered** |
| Art. 14(4)(d) | Decide not to use or disregard output | HUMAN-06 (Override Primitive) | Human override receipt with Λ₉ attestation | **Covered** |
| Art. 14(5) | For biometric / critical infrastructure: two natural persons | HUMAN-07 (Dual Auth Primitive) | Dual-signed Λ₉ receipt | **Covered** |

### 2E. Article 15 — Accuracy, Robustness, Cybersecurity

| Clause | Requirement | Ouroboros Primitive(s) | Receipt Evidence | Status |
|--------|-------------|----------------------|-----------------|--------|
| Art. 15(1) | Appropriate levels of accuracy, robustness, cybersecurity | Λ₁, Λ₄, Λ₆ | Tri-axis Λ baseline receipt at deployment | **Covered** |
| Art. 15(2) | Performance declared in instruction for use | MEASURE-02, EXPLAIN-01 | Λ₁ accuracy declaration receipt | **Covered** |
| Art. 15(3) | Resilience to attempts to alter outputs (adversarial robustness) | Λ₄ | SECURE-01 (Adversarial Test) → SECURE-05 | Λ₄ red-team receipt with attack typology | **Covered** |
| Art. 15(4) | Technical redundancy solutions | SECURE-06 (Redundancy Primitive), CHANGE-07 | Λ₈ failover receipt | **Partial** — infrastructure-layer redundancy external |
| Art. 15(5) | Cybersecurity measures aligned with state of the art | SECURE-01 → SECURE-10 | Full Λ₆ cybersecurity posture receipt | **Covered** |

---

## 3. FISMA + NIST SP 800-53 (Federal)

> **Authority:** Federal Information Security Modernization Act (44 U.S.C. § 3551 et seq.); NIST SP 800-53 Rev. 5 (updated August 2025)  
> **Source:** [https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

FISMA requires federal AI systems to be categorized (FIPS 199), assessed, and continuously monitored. SP 800-53 Rev. 5 expanded applicability to AI-integrated systems. Key families for Ouroboros:

### AC — Access Control

| Control | Requirement | Ouroboros Primitive(s) | Λ Axis | Status |
|---------|-------------|----------------------|--------|--------|
| AC-2 | Account Management | GOV-07 (RACI Primitive), HUMAN-05 | Λ₆ | **Covered** |
| AC-3 | Access Enforcement | SECURE-02 (Access Enforcement) | Λ₆ | **Covered** |
| AC-6 | Least Privilege | SECURE-02, GOV-09 | Λ₆ | **Covered** |
| AC-17 | Remote Access | SECURE-04 (Remote Auth) | Λ₆ | **Covered** |

### AU — Audit and Accountability

| Control | Requirement | Ouroboros Primitive(s) | Λ Axis | Status |
|---------|-------------|----------------------|--------|--------|
| AU-2 | Event Logging | AUDIT-01 → AUDIT-04 | Λ₆ | **Covered** |
| AU-6 | Audit Record Review, Analysis, Reporting | AUDIT-05 (Audit Review) | Λ₆ | **Covered** |
| AU-9 | Protection of Audit Information | AUDIT-06 (Immutability Primitive) | Λ₆ | **Covered** — Merkle-chained receipts |
| AU-12 | Audit Record Generation | AUDIT-01 (Receipt Generator) | Λ₆ | **Covered** — per-inference Λ receipt |

### RA — Risk Assessment

| Control | Requirement | Ouroboros Primitive(s) | Λ Axis | Status |
|---------|-------------|----------------------|--------|--------|
| RA-3 | Risk Assessment | RISK-01 → RISK-08 | Λ composite | **Covered** |
| RA-5 | Vulnerability Monitoring and Scanning | SECURE-05 (Vulnerability Scanner) | Λ₄, Λ₆ | **Covered** |
| RA-7 | Risk Response | RISK-07, RISK-08 | Λ composite | **Covered** |
| RA-10 | Threat Hunting (new in Rev. 5) | SECURE-10 (Threat Hunt Primitive) | Λ₄, Λ₆ | **Covered** |

### SI — System and Information Integrity

| Control | Requirement | Ouroboros Primitive(s) | Λ Axis | Status |
|---------|-------------|----------------------|--------|--------|
| SI-3 | Malicious Code Protection | SECURE-08, SECURE-09 | Λ₆ | **Covered** |
| SI-4 | System Monitoring | MEASURE-04 (Production Monitor) | Λ₄, Λ₈ | **Covered** |
| SI-7 | Software, Firmware, and Information Integrity | AUDIT-06 (Immutability), SUPPLY-07 | Λ₆ | **Covered** |
| SI-10 | Information Input Validation | SECURE-01, AUDIT-03 | Λ₁, Λ₄ | **Covered** |
| SI-12 | Information Management and Retention | AUDIT-09 (Retention Primitive) | Λ₆ | **Covered** |

**Λ mapping to FISMA:** The Λ₆ (Accountability) axis directly satisfies AU-family controls; Λ₄ + Λ₈ jointly cover SI-4 and RA-5. FISMA's continuous monitoring mandate is met by Ouroboros's streaming Λ receipts, which provide real-time attestation rather than periodic snapshots.

---

## 4. DoD Responsible AI Strategy (2022) + CDAO

> **Authority:** DoD Responsible AI Strategy and Implementation Pathway (June 2022, updated October 2024)  
> **Sources:** [https://www.ai.mil/Initiatives/Responsible-AI/](https://www.ai.mil/Initiatives/Responsible-AI/) | [https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF](https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF)

Five RAI tenets, adopted by DoD in 2020 and operationalized by CDAO:

| Tenet | Requirement | Λ Axis | Ouroboros Primitive(s) | Receipt Evidence | Status |
|-------|-------------|--------|----------------------|-----------------|--------|
| **Responsible** | AI used in accordance with US law, IHL, applicable treaties | Λ₆ (Accountability) | GOV-01 (Regulatory Register), AUDIT-08 | Λ₆ legal-compliance receipt | **Covered** |
| **Equitable** | Bias and discrimination actively identified and mitigated | Λ₂ (Fairness) | MEASURE-06 (Bias Eval), EXPLAIN-07 | Λ₂ disparity-metric receipt | **Covered** |
| **Traceable** | AI decisions, data, and design explainable to authorized users | Λ₃ (Transparency), Λ₆ | AUDIT-01 → AUDIT-09, EXPLAIN-01 → EXPLAIN-08 | Per-decision Λ₃+Λ₆ dual receipt | **Covered** — Λ receipts are the traceability artifact |
| **Reliable** | AI operates within intended parameters under foreseeable conditions | Λ₈ (Reliability), Λ₄ | MEASURE-05, SECURE-06 | Λ₈ validation receipt + Λ₄ robustness floor | **Covered** |
| **Governable** | Ability to detect, disengage, or modify AI in deployment | Λ₉ (Human Oversight) | HUMAN-03 (Kill Switch), CHANGE-07, MANAGE-2.4 | Λ₉ control receipt with override log | **Covered** |

**CDAO / Procurement Surface:** CDAO's RAI Toolkit explicitly references NIST AI RMF alignment. Ouroboros's Section 1 NIST mapping creates a direct bridge to CDAO procurement checklist requirements. The **Traceable** tenet is Ouroboros's strongest differentiator — Λ receipts are the only commercial artifact that provides per-inference traceability at DoD scale without manual documentation.

---

## 5. HIPAA + FDA — Healthcare Vertical

> **HIPAA Authority:** 45 CFR Parts 160, 164 (Privacy and Security Rules)  
> **FDA Authority:** 21 CFR Part 11 (Electronic Records); FDA AI Action Plan (2021–2026 updates)  
> **FDA PCCP Guidance:** [https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence)

### 5A. HIPAA Privacy Rule + Security Rule

| Clause | Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|--------|-------------|----------------------|--------|-----------------|--------|
| 45 CFR 164.308(a)(1) | Risk analysis of ePHI | RISK-01 → RISK-05, PRIV-01 | Λ₅ (Privacy) | Λ₅ PHI-risk receipt | **Covered** |
| 45 CFR 164.312(b) | Audit controls for ePHI access | AUDIT-01 → AUDIT-06 | Λ₆ | Per-access Λ₆ audit receipt | **Covered** |
| 45 CFR 164.312(c)(1) | Integrity controls (ePHI not improperly altered) | AUDIT-06 (Immutability) | Λ₆ | Merkle-chain integrity receipt | **Covered** |
| 45 CFR 164.312(a)(2)(iv) | Encryption and decryption | SECURE-04 (Crypto Primitive) | Λ₆ | Λ₆ encryption receipt | **Covered** |
| 45 CFR 164.530(j) | Documentation retention (6 years) | AUDIT-09 (Retention Primitive) | Λ₆ | Retention policy receipt with expiry | **Covered** |

### 5B. 21 CFR Part 11 — Electronic Records

| Clause | Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|--------|-------------|----------------------|--------|-----------------|--------|
| 21 CFR 11.10(a) | System validation for accuracy, reliability, consistent performance | MEASURE-02, MEASURE-05 | Λ₁, Λ₈ | Validation receipt with Λ₁+Λ₈ attestation | **Covered** |
| 21 CFR 11.10(b) | Generation of accurate and complete copies of records | AUDIT-02, AUDIT-09 | Λ₆ | Λ receipt copy generation with hash | **Covered** |
| 21 CFR 11.10(e) | Audit trails for record creation, modification, deletion | AUDIT-01 → AUDIT-05 | Λ₆ | Immutable Λ₆ audit trail | **Covered** |
| 21 CFR 11.10(k) | Control over system documentation | GOV-05, CHANGE-01 | Λ₆ | Documentation version-control receipt | **Covered** |
| 21 CFR 11.50 | Signed electronic records with associated information | HUMAN-05 (Identity Tag), AUDIT-08 | Λ₆, Λ₉ | DID-signed Λ receipt | **Covered** |

### 5C. FDA SaMD — AI/ML Guidance (2025–2026)

> FDA finalized Predetermined Change Control Plan (PCCP) guidance in 2025, requiring manufacturers of AI-enabled SaMD to pre-specify modification types, validation protocols, and real-world monitoring.

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| Predetermined Change Control Plan (PCCP) | CHANGE-01 → CHANGE-08 | Λ₁, Λ₄, Λ₈ | Pre-registered change type receipt linked to Λ threshold | **Covered** |
| Total Product Lifecycle (TPLC) monitoring | MEASURE-04, MEASURE-09 | All Λ | Continuous Λ stream across product lifecycle | **Covered** |
| Real-world performance monitoring | MEASURE-04 (Production Monitor) | Λ₁, Λ₈ | Λ₁+Λ₈ real-world-performance receipt | **Covered** |
| Algorithm change protocol validation | CHANGE-03 (Algo Change Primitive) | Λ₁ | Pre/post Λ₁ comparison receipt | **Covered** |
| Good Machine Learning Practice (GMLP) | MEASURE-01 → MEASURE-07 | Λ₁, Λ₂, Λ₄ | GMLP checklist embedded in Λ receipt | **Partial** — GMLP requires external clinical validation |

---

## 6. Finance Regulatory Vertical

### 6A. SR 11-7 — Federal Reserve Model Risk Management

> **Authority:** SR Letter 11-7 / CA 11-7 (Federal Reserve Board / OCC, April 2011)  
> **Source:** [https://www.modelop.com/ai-governance/ai-regulations-standards/sr-11-7](https://www.modelop.com/ai-governance/ai-regulations-standards/sr-11-7)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| Model development documentation | EXPLAIN-01 (Model Card), SUPPLY-08 | Λ₃ | Λ₃ model-card receipt with development provenance | **Covered** |
| Model validation (independent from development) | AUDIT-07 (Third-Party Assessor), MEASURE-01 | Λ₁, Λ₆ | Independent-validator-signed Λ receipt | **Covered** |
| Ongoing model monitoring | MEASURE-04, MEASURE-09 | Λ₁, Λ₄, Λ₈ | Continuous Λ monitoring stream | **Covered** |
| Model inventory with risk tier | GOV-06 (System Inventory) | Λ composite | Λ-tiered model registry receipt | **Covered** |
| Challenger model testing | MEASURE-03 (Deployment Eval) | Λ₁ | A/B Λ₁ comparison receipt | **Covered** |
| Conceptual soundness review | EXPLAIN-02, EXPLAIN-05 | Λ₃ | Conceptual soundness Λ₃ receipt | **Partial** — SR 11-7 expects domain-expert sign-off |

### 6B. DORA — Digital Operational Resilience Act

> **Authority:** Regulation (EU) 2022/2554; enforceable January 17, 2025  
> **Source:** [https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en](https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| ICT risk management framework | RISK-01 → RISK-08, SECURE-01 | Λ₄, Λ₆, Λ₈ | ICT risk Λ receipt | **Covered** |
| ICT incident classification and reporting | AUDIT-04 (Incident Primitive) | Λ₆ | Incident Λ₆ receipt with severity tier | **Covered** |
| Digital operational resilience testing (TLPT) | SECURE-01 → SECURE-05, MEASURE-03 | Λ₄ | Red-team Λ₄ receipt | **Covered** |
| Third-party ICT provider risk management | SUPPLY-01 → SUPPLY-09 | Λ₆, Λ₈ | Vendor Λ composite receipt | **Covered** |
| Information sharing on cyber threats | SECURE-10, AUDIT-04 | Λ₆ | Threat-intel sharing receipt | **Partial** — DORA ISACs require sector membership |

### 6C. SEC AI Rules + SOX Implications

> **SEC 2026 Examination Priorities:** AI supervision, explainability, and recordkeeping across all communication channels  
> **Source:** [https://www.wealthmanagement.com/regulation-compliance/sec-2026-examination-priorities-what-financial-services-firms-need-to-know](https://www.wealthmanagement.com/regulation-compliance/sec-2026-examination-priorities-what-financial-services-firms-need-to-know)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| SEC: AI tool supervision policies and procedures | GOV-04, GOV-11, AUDIT-05 | Λ₆ | AI supervision policy Λ₆ receipt | **Covered** |
| SEC: Prevention of misleading AI claims (Marketing Rule) | EXPLAIN-01, EXPLAIN-02, MEASURE-02 | Λ₁, Λ₃ | Λ₁+Λ₃ performance claim receipt (auditable) | **Covered** |
| SOX §302/§906: Executive certification of AI-impacted financial controls | GOV-09 (Exec Sign-off), AUDIT-08 | Λ₆ | Executive-signed Λ₆ receipt for AI-touched financial controls | **Covered** |
| SOX §404: Internal controls over financial reporting | AUDIT-01 → AUDIT-09, SECURE-07 | Λ₆ | Λ₆ ICFR control receipt | **Covered** |
| FINRA recordkeeping for AI-generated communications | AUDIT-02, AUDIT-09 | Λ₆ | Timestamped Λ communication receipt | **Covered** |

---

## 7. ISO/IEC 42001:2023 — AI Management Systems

> **Authority:** ISO/IEC 42001:2023 (published December 2023)  
> **Source:** [https://www.iso.org/standard/42001](https://www.iso.org/standard/42001)

ISO 42001 is a certifiable international standard (unlike NIST AI RMF, which is voluntary and non-certifiable). It applies when SZL seeks third-party certification, EU market access, or enterprise procurement in regulated markets. NIST AI RMF and ISO 42001 are complementary: NIST provides risk-based practice guidance; ISO 42001 provides the AIMS management system architecture.

**When ISO 42001 matters for SZL:** EU public procurement, ISO-audited supply chains, and any customer requiring third-party AI certification.

| ISO 42001 Clause | Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-----------------|-------------|----------------------|--------|-----------------|--------|
| Clause 4: Context of Organization | Understand internal/external issues; AI system scope | GOV-01, GOV-06 | Λ composite | Context-setting Λ receipt | **Covered** |
| Clause 5: Leadership | Top management commitment; AI policy | GOV-09 (Exec Sign-off), GOV-03 | Λ₆ | Executive Λ₆ policy receipt | **Covered** |
| Clause 6: Planning | AI risk and opportunity management; objectives | RISK-01 → RISK-08 | Λ composite | Risk-objective Λ receipt | **Covered** |
| Clause 8: Operation | AIMS operational processes; AI system lifecycle | All primitive clusters | All Λ axes | Full lifecycle Λ receipt chain | **Covered** |
| Clause 9: Performance Evaluation | Monitoring, measurement, internal audit | MEASURE-01 → MEASURE-09, AUDIT-07 | All Λ | Internal audit Λ receipt | **Covered** |
| Clause 10: Improvement | Nonconformity and continual improvement | MANAGE-4.2, CHANGE-01 | Λ composite | Improvement action Λ receipt | **Covered** |

**ISO 42001 vs. NIST AI RMF comparison:**

| Dimension | ISO/IEC 42001 | NIST AI RMF |
|-----------|--------------|-------------|
| Type | Certifiable international standard | Voluntary US framework |
| Structure | Management system (Clauses 4–10) | Four functions (Govern, Map, Measure, Manage) |
| Audit | Third-party certification body | Self-assessment or independent assessment |
| Jurisdiction | Global | Primarily US federal |
| SZL applicability | EU sales, enterprise procurement | Federal contracts, DoD, finance sector |

---

## 8. Sector Regulations

### 8A. GDPR Article 22 — Automated Decision-Making

> **Authority:** Regulation (EU) 2016/679, Article 22  
> **Source:** [https://gdpr-text.com/read/article-22/](https://gdpr-text.com/read/article-22/)

| Clause | Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|--------|-------------|----------------------|--------|-----------------|--------|
| Art. 22(1) | Right not to be subject to solely automated decisions with legal/significant effects | HUMAN-06 (Override), HUMAN-01 | Λ₉ | Λ₉ human-review receipt on high-stakes decisions | **Covered** |
| Art. 22(2)(b) | Explicit consent required | PRIV-03 (Consent Primitive) | Λ₅ | Consent receipt with decision-scope | **Covered** |
| Art. 22(3) | Meaningful information about logic, significance, consequences | EXPLAIN-04, EXPLAIN-08 | Λ₃ | Λ₃ explanation receipt for subject | **Covered** |
| Art. 22(4) | Suitable safeguards including human intervention and contestation | HUMAN-04 (Appeal Primitive), HUMAN-06 | Λ₉ | Appeal receipt with outcome record | **Covered** |

### 8B. CCPA / CPRA — Automated Decision Technology (California)

> **Authority:** CPPA Regulations (adopted July 24, 2025); CCPA as amended by CPRA  
> **Source:** [https://cppa.ca.gov/regulations/ccpa_updates.html](https://cppa.ca.gov/regulations/ccpa_updates.html)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| Risk assessments for significant ADMT uses | RISK-01 → RISK-05, PRIV-04 | Λ₂, Λ₅ | ADMT risk assessment Λ receipt | **Covered** |
| Consumer right to opt out of ADMT | PRIV-07 (Opt-Out Primitive), HUMAN-06 | Λ₅ | Opt-out Λ receipt with system-wide enforcement | **Covered** |
| Annual cybersecurity audit | SECURE-01 → SECURE-10, AUDIT-07 | Λ₆ | Annual Λ₆ audit receipt | **Covered** |
| Transparency in automated decision logic | EXPLAIN-04, EXPLAIN-08 | Λ₃ | Λ₃ logic receipt for California consumers | **Covered** |

### 8C. Colorado AI Act (SB 24-205)

> **Authority:** Colorado SB 24-205; effective February 1, 2026 (enjoined as of April 28, 2026 — court delay; legislative revision ongoing)  
> **Source:** [https://leg.colorado.gov/bills/sb24-205](https://leg.colorado.gov/bills/sb24-205)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| Reasonable care to protect against algorithmic discrimination | MEASURE-06 (Bias Eval), RISK-04 | Λ₂ | Λ₂ disparity receipt per protected class | **Covered** |
| Impact assessment for high-risk AI | RISK-04 (Impact Matrix), PRIV-04 | Λ composite | Impact assessment Λ bundle | **Covered** |
| Consumer notification of high-risk AI use | GOV-02, EXPLAIN-02 | Λ₃ | Consumer notification Λ₃ receipt | **Covered** |
| Affirmative defense via NIST AI RMF or ISO 42001 alignment | All NIST AI RMF mappings in Section 1 + ISO mappings in Section 7 | All Λ | Λ-anchored NIST/ISO compliance receipt | **Covered** — SZL's NIST/ISO dual mapping creates affirmative defense |

> **Note:** As of April 28, 2026, a federal court enjoined enforcement of SB 24-205 pending legislative revision. SZL should monitor for legislative changes before June 30, 2026 sunset deadline.

### 8D. EEOC + AI Hiring Guidance

> **Status:** EEOC withdrew its May 2023 AI hiring guidance from eeoc.gov in January 2025 under the new administration. Title VII, ADA, and ADEA disparate impact protections remain fully applicable to AI hiring tools regardless of EEOC guidance.  
> **Source:** [https://natlawreview.com/article/federal-government-quietly-removed-its-ai-hiring-guidance-four-states-are-writing](https://natlawreview.com/article/federal-government-quietly-removed-its-ai-hiring-guidance-four-states-are-writing)

| Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|-------------|----------------------|--------|-----------------|--------|
| Title VII disparate impact prevention in AI hiring | MEASURE-06, EXPLAIN-07 | Λ₂ | Λ₂ disparity receipt with adverse impact ratio | **Covered** |
| ADA reasonable accommodation in AI screening | PRIV-08 (Accommodation Flag), HUMAN-04 | Λ₂, Λ₉ | Accommodation override receipt | **Covered** |
| Audit trail for hiring AI decisions | AUDIT-01 → AUDIT-05 | Λ₆ | Per-decision Λ₆ audit receipt | **Covered** |
| Vendor liability if AI tool causes discrimination | SUPPLY-03 (IP/Legal Risk), GOV-09 | Λ₂ | Vendor liability Λ receipt | **Covered** |

---

## 9. ITAR / EAR Export Control — Oppenheimer Module

> **Authority:** International Traffic in Arms Regulations (22 CFR Parts 120–130, USML); Export Administration Regulations (15 CFR Parts 730–774, EAR/CCL)  
> **New control:** ECCN 4E091 (AI model weights), created January 2025 AI Diffusion Framework  
> **Source:** [https://www.federalregister.gov/documents/2025/01/15/2025-00636/framework-for-artificial-intelligence-diffusion](https://www.federalregister.gov/documents/2025/01/15/2025-00636/framework-for-artificial-intelligence-diffusion)

The Oppenheimer module (dual-use review primitives) must be assessed against both ITAR (USML defense articles) and EAR (dual-use CCL items) prior to any international transfer, including deemed exports to foreign nationals on US soil.

| Control | Requirement | Ouroboros Primitive(s) | Λ Axis | Receipt Evidence | Status |
|---------|-------------|----------------------|--------|-----------------|--------|
| ITAR 22 CFR 120.17 (deemed export) | Foreign national access to USML technical data requires authorization | SECURE-07 (Content Filter), GOV-01 (Regulatory Register) | Λ₆ | Λ₆ deemed-export screening receipt with nationality flag | **Covered** |
| EAR ECCN 4E091 | AI model weights with dual-use potential controlled; license required for D:5 countries | SECURE-07, EXPLAIN-02 (System Descriptor) | Λ₆ | ECCN classification receipt embedded in model card Λ₃ | **Partial** — BIS license determination requires legal counsel |
| EAR CCL 4A004 | Neural network hardware controls | SUPPLY-01 (Vendor Risk) | Λ₆ | Hardware provenance Λ receipt | **Partial** — hardware-layer external |
| Catch-all EAR 744 | End-use/end-user controls for AI with WMD potential | SECURE-07, AUDIT-08 (Conformity Package) | Λ₆ | End-use certification receipt | **Covered** |
| ITAR §126.4 exemptions | Government use exemptions (DoD contracts) | GOV-01, AUDIT-08 | Λ₆ | Government contract Λ exemption receipt | **Covered** |
| BIS May 2025 policy statement | Controls on advanced computing ICs used in AI training | SUPPLY-01, SUPPLY-04 | Λ₆ | Compute provenance Λ receipt | **Partial** — IC sourcing is supply-chain external |

> **Recommendation:** Before any Oppenheimer module deployment involving cross-border access, SZL must obtain a formal USML/CCL jurisdiction determination from export counsel. The Λ₆ dual-use review receipt chain provides the documentary foundation for a Technology Control Plan (TCP) or Technical Assistance Agreement (TAA).

---

## 10. Three Best NIST RFI / Comment Opportunities Open in 2026

### Opportunity 1: AI RMF Profile on Trustworthy AI in Critical Infrastructure

| Field | Detail |
|-------|--------|
| **Status** | Community of Interest forming; draft profile being developed (April 2026) |
| **Submission mechanism** | Join the Community of Interest at [https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure](https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure) |
| **Email contact** | NIST will issue a contact address when COI is formalized |
| **Why SZL should submit** | Ouroboros covers all 16 critical infrastructure sectors (energy, water, transportation, finance, healthcare). A submission demonstrating how Λ receipts serve as the TEVV and MEASURE implementation for critical infrastructure operators positions SZL as a reference architecture in the profile itself — a durable regulatory moat. |
| **Suggested angle** | Demonstrate Λ's closed-form auditable structure as the "measurement language" for critical infrastructure AI trustworthiness; propose Λ axis mapping as informative reference in the profile's MEASURE subcategories. |

### Opportunity 2: NIST AI Agent Security RFI (NIST-2025-0035) — Comment Period Closed March 9, 2026; Watch for NIST Response

| Field | Detail |
|-------|--------|
| **Status** | Public comment period closed March 9, 2026; NIST synthesizing responses. A follow-on workshop or second comment period is expected in mid-2026. |
| **Docket** | NIST-2025-0035 on regulations.gov |
| **Submission URL** | [https://www.regulations.gov](https://www.regulations.gov) — search NIST-2025-0035 |
| **Source:** | [https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems](https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems) |
| **Why SZL should submit** | Ouroboros's 91 primitives include a complete agentic orchestration layer. A follow-on comment or response to NIST's synthesis can demonstrate how the AUDIT primitive stack (immutable per-action receipts) solves AI agent identity and authorization — the RFI's core question. |
| **Suggested angle** | Propose Λ₆ receipt chain as the "agent identity attestation" mechanism; provide Ouroboros as a worked example of the secure agentic deployment pattern NIST is seeking to define. |

### Opportunity 3: NIST Cyber AI Profile (Final Public Draft) — Expected Mid-2026

| Field | Detail |
|-------|--------|
| **Status** | Preliminary draft comment period closed January 30, 2026. NIST is revising based on comments; final public draft expected mid-2026 for another comment round. |
| **Email for comments** | [cyberaiprofile@nist.gov](mailto:cyberaiprofile@nist.gov) |
| **Source:** | [https://csrc.nist.gov/News/2025/nist-releases-prelim-draft-cyber-ai-profile](https://csrc.nist.gov/News/2025/nist-releases-prelim-draft-cyber-ai-profile) |
| **Why SZL should submit** | The Cyber AI Profile maps NIST CSF 2.0 cybersecurity controls onto AI system contexts. Ouroboros's SECURE primitives (Sec-01 → Sec-10) and Λ₆ axis cover this domain end-to-end. A submission demonstrating Ouroboros as a reference implementation of the profile's recommended controls can yield informative reference status. |
| **Suggested angle** | Provide a crosswalk table showing Ouroboros SECURE primitives mapped to every Cyber AI Profile control objective; propose Λ₆ stream receipts as the "continuous monitoring evidence" artifact the profile requires. |

---

## 11. Three Regulations Where SZL Has a Unique Competitive Moat

### Moat 1: EU AI Act Article 12 (Logging) + NIST MEASURE Function — The Λ Receipt Infrastructure

No competitor in the AI governance tooling market generates **per-inference, closed-form, multi-axis trust receipts** at the moment of production. The market default is periodic batch assessments (SR 11-7 style) or static model cards. Ouroboros's AUDIT primitive stack (Aud-01 → Aud-09) generates Article 12-compliant immutable logs and MEASURE 2.3/2.4-compliant continuous attestation simultaneously, from the same artifact. This creates:

- A single Λ receipt that satisfies EU AI Act Article 12, NIST MEASURE 2.3–2.4, FISMA AU-2/AU-12, SR 11-7 monitoring, and 21 CFR Part 11 audit trail simultaneously
- Zero-incremental-cost compliance across multiple verticals from a single deployment
- A timestamped, Merkle-chained, DID-anchored evidence trail that satisfies discovery requirements in adversarial regulatory proceedings

**Business implication:** SZL can offer Article 12 compliance as a default product feature, not a professional services engagement.

### Moat 2: DoD RAI Tenet "Traceable" + CDAO Procurement Surface

DoD's "Traceable" tenet requires that AI decisions be explainable to authorized users at the moment of audit. Current DoD AI implementations rely on retroactive documentation. Ouroboros's per-inference Λ₃ (Transparency) + Λ₆ (Accountability) receipt chain provides **forward-chained traceability** — every decision carries its own explanation artifact at the time of generation, not reconstructed post-hoc. CDAO's RAI Toolkit has no existing vendor reference implementation for this capability. SZL can submit Ouroboros as the reference implementation, creating a durable procurement advantage across the $9.5B+ projected federal AI investment through 2027.

**Business implication:** CDAO checklist alignment can be demonstrated with zero bespoke documentation; Λ receipts are the checklist answer.

### Moat 3: Colorado AI Act SB 24-205 Affirmative Defense — NIST / ISO Dual Alignment

Colorado SB 24-205 (pending legislative revision) explicitly creates an **affirmative defense** for developers and deployers who demonstrate alignment with NIST AI RMF or ISO 42001. The law is the first state AI regulation in the US to provide this defense. SZL's Sections 1–7 mapping above constitutes a machine-readable, receipt-backed proof of dual alignment. As other states adopt similar affirmative-defense language (this model is being studied by 4+ states in 2026), SZL's Ouroboros compliance receipts become the **transferable safe harbor artifact** across the US state AI law landscape.

**Business implication:** SZL can offer compliance counsel pre-packaged Λ receipts as affirmative defense documentation — eliminating the need for bespoke state-by-state compliance programs.

---

## Appendix A: Gap Summary

| Gap | Description | Priority | Remediation Path |
|-----|-------------|----------|-----------------|
| GOVERN 2.2 | Training content not in-primitives | Medium | Integrate LMS receipt into Λ₆ training attestation primitive |
| GOVERN 3.1 | Demographic diversity metadata sourced externally | Low | Add PRIV-layer demographic-safe metadata to review receipts |
| MEASURE 4.2 | Domain expert engagement is process-dependent | Medium | Build expert-co-sign workflow into AUDIT-07 |
| Art. 15(4) | Hardware-layer redundancy external | Low | Infrastructure SLA receipt integration from cloud provider |
| Art. 13(3)(e) | Hardware telemetry not in-primitives | Low | MEASURE-08 resource profiler requires cloud telemetry hook |
| SR 11-7 | Domain-expert sign-off on conceptual soundness | Medium | Structured expert review workflow in EXPLAIN-05 |
| FDA SaMD | External clinical validation required | High | Partner with CRO/clinical site; Λ₁ receipt feeds clinical protocol |
| EAR ECCN 4E091 | BIS license determination requires legal counsel | High | Engage export counsel; Λ₆ receipt chain supports TCP |
| DORA | ISAC sector membership for threat sharing | Low | Enroll in FS-ISAC or sector ISAC; plug into AUDIT-04 |

---

## Appendix B: Citation Index

- NIST AI RMF 1.0 (NIST AI 100-1): https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf
- NIST AI 600-1 Generative AI Profile: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- NIST AI RMF landing page: https://www.nist.gov/itl/ai-risk-management-framework
- NIST AIRC Core: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
- NIST Cyber AI Profile (Dec 2025 draft): https://csrc.nist.gov/News/2025/nist-releases-prelim-draft-cyber-ai-profile
- NIST AI Agent Security RFI (NIST-2025-0035): https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems
- NIST Critical Infrastructure AI RMF Profile (April 2026): https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure
- NIST SP 800-53 Rev. 5: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- EU AI Act (Regulation 2024/1689): https://artificialintelligenceact.eu
- EU AI Act Article 9: https://artificialintelligenceact.eu/article/9/
- EU AI Act Article 12: https://artificialintelligenceact.eu/article/12/
- EU AI Act Article 13: https://artificialintelligenceact.eu/article/13/
- EU AI Act Article 14: https://artificialintelligenceact.eu/article/14/
- EU AI Act timeline: https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act
- DoD RAI Strategy 2024: https://media.defense.gov/2024/Oct/26/2003571790/-1/-1/0/2024-06-RAI-STRATEGY-IMPLEMENTATION-PATHWAY.PDF
- CDAO Responsible AI: https://www.ai.mil/Initiatives/Responsible-AI/
- FDA PCCP Guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence
- DORA (EU 2022/2554): https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en
- SEC 2026 AI Exam Priorities: https://www.wealthmanagement.com/regulation-compliance/sec-2026-examination-priorities-what-financial-services-firms-need-to-know
- ISO/IEC 42001:2023: https://www.iso.org/standard/42001
- GDPR Article 22: https://gdpr-text.com/read/article-22/
- CCPA CPPA Regulations (July 2025): https://cppa.ca.gov/regulations/ccpa_updates.html
- Colorado SB 24-205: https://leg.colorado.gov/bills/sb24-205
- EAR AI Diffusion Framework (ECCN 4E091): https://www.federalregister.gov/documents/2025/01/15/2025-00636/framework-for-artificial-intelligence-diffusion
- BIS AI Policy Statement (May 2025): https://www.bis.gov/media/documents/ai-policy-statement-training-ai-models-may-13-2025
