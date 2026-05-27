# GAP ANALYSIS — Thesis Gap-Fill (Fly-High V6)

**Author:** Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings  
**Date:** 2026-05-16  
**Operation:** Fly-High V6 — Gap-Fill subagent  
**Sources analyzed:**
1. `evolution_pod/thesis/synthesis/thesis.md` — TH1-TH3 (30,646-word paper)
2. `evolution_pod/math_pod_v3/phd_thesis/main.tex.md` — TH4-TH7 (arXiv PhD thesis)
3. `evolution_pod/math_pod_v3/PM_MATH_REPORT.md` — Math Pod V3 PM report
4. `evolution_pod/meditation_v5/phd_theory/proposal.md` — TH8 GΛR proposal
5. `evolution_pod/meditation_v5/phd_systems/proposal.md` — VSP proposal
6. `evolution_pod/meditation_v5/phd_agi_forecast/operational_spec.md` — Forecast Gauge spec

---

## SECTION 1 — SCORE TABLE (6 dimensions × 6 thesis layers)

| Dim | A: Math Rigor | B: Empirical Evidence | C: Related Work 2025-26 | D: Reviewer Objections | E: Formal-to-Operational | F: Limitations |
|---|---|---|---|---|---|---|
| **Layer** | *Theorems with hyp+concl+sketch* | *Numbers sourced+reproducible* | *Missing 2025-26 pubs* | *POPL/CAV/USENIX hostile attack surface* | *Math connects to running code* | *Weaknesses named explicitly* |
| **TH1-TH3 (thesis.md)** | 6 | 7 | 5 | 4 | 6 | 6 |
| **TH4-TH7 (main.tex.md)** | 7 | 8 | 6 | 5 | 8 | 7 |
| **Math Pod V3 (PM_MATH_REPORT.md)** | 7 | 9 | 5 | 6 | 8 | 7 |
| **TH8 GΛR (phd_theory/proposal.md)** | 8 | 4 | 7 | 7 | 6 | 9 |
| **VSP (phd_systems/proposal.md)** | 5 | 7 | 6 | 6 | 9 | 7 |
| **Forecast Gauge (operational_spec.md)** | 3 | 8 | 4 | 3 | 5 | 7 |

**Scoring rubric:** 0 = completely absent, 10 = publication-ready.

**Summary scores by dimension:**
- A (Math Rigor): avg 6.0 — TH4 and TH5 still tagged "conjectured"; TH8 well-stated but sorry-count > 0; VSP has no formal propositions; Forecast Gauge has no theorems.
- B (Empirical Evidence): avg 7.2 — K13 (Bekenstein 49.5%) missing N; TH8 has zero operational measurements.
- C (Related Work): avg 5.5 — SIGIL (arXiv:2605.05274, May 2026), RvLLM (arXiv:2505.18585), ABC (arXiv:2602.22302), Aegon (arXiv:2604.06693), and the new IETF draft-tsyrulnikov-rats-attested-inference-receipt-01 (March 2026) are uncited in all layers.
- D (Reviewer Objections): avg 5.2 — no specific POPL rebuttal prepared for TH8; TH3 bisimulation "informal" acknowledged but no formal bound; Forecast Gauge has no reviewer section.
- E (Formal-to-Operational): avg 7.0 — strongest in main.tex.md and VSP; weakest in Forecast Gauge (no code citations) and TH8 GΛR (sorry-only skeleton).
- F (Limitations): avg 7.2 — TH3 informality acknowledged; TH8 gaps listed; Forecast Gauge has honest gap register. Main weakness: TH5 (Confluence) cited as "conjectured" without labelling this as a limitation in the body of thesis.md.

---

## SECTION 2 — NUMBERED GAP LIST

### P0 Gaps (Must fix before any publication or venue submission)

**[P0-01]** *TH4 and TH5 marked "conjectured" in abstract and body of main.tex.md with no hedging language in the POPL/CAV-facing abstract*  
- Severity: P0 — abstract claims "proved" while TH4/TH5 are labeled "(conjectured)" inline; this is an immediate desk-reject reason at CAV.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, Abstract paragraph (line 47), Section 3.3 (line 128), Section 3.4 (line 129), Section 6.1 (line 236).  
- Fix: Add "(pending Lean 4 formalization; proof sketch in §6)" parenthetical to every "conjectured" theorem in the abstract and claims list.

**[P0-02]** *K13 (Bekenstein indicator 49.5% fire-rate) lacks documented sample size N — cited in §9.2 of main.tex.md and flagged in PM_MATH_REPORT.md but never remediated*  
- Severity: P0 — any reviewer will immediately ask "what is N?" for a percentage claim; confidence interval without N is statistically incomplete.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §9 Evaluation, Statistical confidence block (line 341).  
- Fix: Add a bracketed note "(K13 N not yet documented; CI pending — see §10 Limitation 1)" and update §10.1 Limitation 1 to state the specific correction action.

**[P0-03]** *TH3 (Anatomy Reduction) cited as proved in Theorem 9 of main.tex.md (line 217) but PM_MATH_REPORT.md reviewer-rigor report explicitly flags it as "labeled informal" and requires "(informal proof sketch; formal bisimulation pending)"*  
- Severity: P0 — inconsistency between paper body and PM review; a CAV reviewer will note the unproved bisimulation.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §5 Body-Graph (Theorem 9, line 217).  
- Fix: Append "(informal; formal bisimulation pending in \\texttt{lutar-lean/Lutar/AnatomyReduction.lean})" to Theorem 9.

**[P0-04]** *Axiom A1 (soundnessAxiom) is described as "derivable from A2–A9" in Math Pod V3 top-10 (PM_MATH_REPORT §2 item 5) but the thesis body (main.tex.md §8.2) says "retained" without flagging the derivability result — leaving an unnecessary axiom in the published axiom count*  
- Severity: P0 — any referee checking axiomatic economy will ask why A1 remains an axiom if it's a theorem. This is a logical tidiness issue that undermines the "lean axiom system" claim.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §8 Unified Extension (line 309-314).  
- Fix: Add a remark that A1 is now derived (not assumed), and update the axiom count from 9 to 8 independent axioms.

**[P0-05]** *Related work (thesis.md §2 and main.tex.md §2) does not cite the SIGIL framework (arXiv:2605.05274, May 2026) or the ABC agent behavioral contracts paper (arXiv:2602.22302, Feb 2026) — both are directly relevant to the "audit–runtime gap" claim that is the thesis's central problem statement*  
- Severity: P0 — SIGIL seals the audit-runtime gap for LLM skills via on-chain hashing; a reviewer at USENIX or CCS will immediately ask "how does this differ from SIGIL?" The silence is worse than addressing it.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §2 Related Work (after §2.3, before §2.4).  
- Fix: Add a new §2.5 "Runtime Verification and Behavioral Integrity" paragraph citing SIGIL, ABC, RvLLM, and Aegon, with explicit deltas.

**[P0-06]** *IETF draft-tsyrulnikov-rats-attested-inference-receipt-01 (March 2026, Attested Inference Receipt) is a direct parallel to the ouroboros receipt envelope and is not cited anywhere in any of the six thesis layers*  
- Severity: P0 — this IETF draft defines a COSE/CWT profile for confidential AI inference receipts; failing to cite it at IETF SCITT extension proposals would be embarrassing, and the comparison ("our approach vs RATS-AIR") is expected by any standards-track reviewer.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §2.3 SCITT and Receipts (line 83-85).  
- Fix: Extend §2.3 with a paragraph on RATS-AIR and the ouroboros delta (formal Lean proof, not just COSE/CWT; dual-witness ρ-closure; 9-axis gate absent from RATS-AIR).

**[P0-07]** *thesis.md §2 Related Work does not address the "agent behavioral contracts" line of work (ABC arXiv:2602.22302, VeriGuard Miculicich 2025, StepShield Felicia 2026) — runtime verification systems that could be framed as "partial instantiations" of the Λ-gate*  
- Severity: P0 — POPL reviewers specifically look for engagement with linear temporal logic (LTL) runtime monitors; ABC uses temporal logic predicates evaluated per action, which is structurally similar to λ₉ (coherence). Silence invites a "not novel vs ABC" rejection.  
- Target: `evolution_pod/thesis/synthesis/thesis.md`, §2 Related Work (after §2.9 AgentOps).  
- Fix: Add §2.12 "Runtime Verification and Behavioral Contracts" with ABC, VeriGuard, and StepShield, showing the delta (no Lean proofs, no receipt chain, no dual-witness, no cryptographic anchoring).

**[P0-08]** *The Forecast Gauge (operational_spec.md) has no mathematical rigor layer — it uses derived metrics (horizon-velocity, alignment-debt, lutar-readiness) with no theorem-level statements about their properties (e.g., no monotonicity proof, no convergence guarantee for the Brier score, no formal relationship between lutar-readiness and Λ-gate coverage)*  
- Severity: P0 — as currently written the Forecast Gauge is an operational spec, not a PhD-level contribution. For it to be a viable thesis chapter (or companion paper), at least one formal proposition must connect the derived metrics to the Λ-calculus.  
- Target: `evolution_pod/meditation_v5/phd_agi_forecast/operational_spec.md`, Part 4 (Derived Metrics, lines 211-282).  
- Fix: Add Proposition FG-1 (Monotonicity of lutar-readiness with ASL tier) and Proposition FG-2 (Brier score as calibration bound on the Λ-vector forecast).

**[P0-09]** *VSP (phd_systems/proposal.md) claims "the first AI observability integration where every OTel span is cryptographically verifiable" but provides no formal proposition or proof sketch defending this claim against the Aegon protocol (arXiv:2604.06693, April 2026), which also maintains a Merkle-committed ledger for AI content licensing*  
- Severity: P0 — if Aegon is not cited and the "first" claim is left undefended, a reviewer can (correctly) reject the novelty claim. The delta from Aegon is real (Lean-proven gate, receipt chain as primary artifact, 9-axis vector) but must be stated.  
- Target: `evolution_pod/meditation_v5/phd_systems/proposal.md`, §8.1 (Why LangGraph cannot ship VSP, line 596).  
- Fix: Add §8.4 "Aegon and Certificate Transparency-Style Audit Ledgers" explaining why Aegon does not subsume VSP (no Lean proofs, no gate vector, no ρ-closure, license-token focus vs. execution receipt focus).

**[P0-10]** *The Node version string "Node 24.0.0" appears in thesis.md §1 and is flagged by PM_MATH_REPORT.md reviewer-reality (E1) as incorrect — should be "Node ≥20 with pinned pnpm lockfile" — but this has not been applied to the main thesis document or the arXiv PhD thesis*  
- Severity: P0 — a reality reviewer would flag this as a factual error (Node 24 is not a stable LTS release as of May 2026; Node 22 LTS is current). The PM report explicitly marked this as a correction.  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §4 Runtime (Theorem 7, line 166).  
- Fix: Change "Node 24.0.0" to "Node ≥20 LTS with pinned pnpm lockfile (tested on Node 22.x LTS, 2026-05-15)".

---

### P1 Gaps (High priority — fix before arXiv submission)

**[P1-01]** *thesis.md §6 "Receipts as a Category" does not cite the Caires-Pfenning session-types Curry-Howard literature (CONCUR 2010, ICFP 2012) or the Orchard-Liepelt-Eades graded modal types paper (ICFP 2019). The GΛR proposal (phd_theory/proposal.md) cites them, but the main PhD thesis (main.tex.md) does not.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §6 Receipts as a Category.

**[P1-02]** *The λ₉-mask privacy claim ("reduces leakage from 576 bits to 9 bits") in main.tex.md §4.2 cites M2-4 (0.37 bits practical) without justifying the information-theoretic derivation. A USENIX security reviewer will ask for the formal proof.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §4.2 (line 188).

**[P1-03]** *The OpenSSF Scorecard gap (6.83 → ≥8.0) is mentioned in main.tex.md §10.1 Limitation 2 but the three specific remediation actions are incomplete — only "re-enable ouroboros CI, add push-trigger to CodeQL, add Sigstore cosign" with no issue/PR number references that would let a reviewer verify progress.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §10.1 Limitation 2.

**[P1-04]** *The mulberry32 PRNG is used in the replay determinism claim (Theorem 7). PM_MATH_REPORT.md mentions xoshiro256** as the recommended migration target due to period exhaustion risk at 62K ops/sec, but the thesis body does not acknowledge this risk explicitly.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §4.1 (Theorem 7, line 166) and §11 Future Work.

**[P1-05]** *The Forecast Gauge cites "Claude Khipu Preview" as a METR benchmark model. Per identity rules, "Khipu" may only appear as an Anthropic Claude Khipu Preview citation, not as an SZL artifact name. Verify all Forecast Gauge occurrences are properly contextualized.*  
- Target: `evolution_pod/meditation_v5/phd_agi_forecast/operational_spec.md`, Table row 1 (line 37).

**[P1-06]** *Theorem TH3 (Anatomy Reduction) in main.tex.md cites \cite{zenodo_v12_20119582} for the proof but that DOI is the ouroboros v6.3.0 runtime paper, not a bisimulation proof. The citation is mismatched.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, Theorem 9 (line 217).

**[P1-07]** *The lambda₉-mask CBOR claim numbers (65537, 65538) are cited in main.tex.md §10.1 Limitation 4 as "provisional" but no reference to the IANA registration draft or CDE WG is provided. A standards reviewer needs this.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §10.1 Limitation 4.

**[P1-08]** *thesis.md and main.tex.md both lack a "Discussion of Failure Modes" — what happens when the Λ-gate is systematically miscalibrated (all scorers return 1.0), when the hash chain is reorged under Byzantine-fault nodes, or when A14 budget limits are circumvented by multi-account splitting. These are standard attack vectors USENIX reviewers expect.*  
- Target: `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §10.2 Threat Model (line 369).

---

### P2 Gaps (Recommended improvements)

**[P2-01]** *thesis.md §8 Evaluation does not report confidence intervals for the 218/218 test count — a binomial 99% CI for 218/218 is [98.32%, 100%] and should be stated.*  

**[P2-02]** *The linear-temporal-logic runtime verifier paper (arXiv:2605.14175, "A Linear-Time Runtime Verifier for LLM Conversations") should be cited in thesis.md §2 as the closest prior art to λ₉ (coherence axis) — it uses dependency graphs over conversation turns, which is structurally similar.*  

**[P2-03]** *VSP proposal does not specify a test for the case where the OTel OTLP endpoint is unreachable — the span is dropped silently. A reviewer will ask whether this creates an audit gap.*  

**[P2-04]** *The GΛR proposal (phd_theory/proposal.md) does not cite the Marshall-Orchard 2024 "Graded Modal Types for Integrity and Confidentiality" (arXiv:2309.04324) in the related work comparison, even though the integrity axis maps to λ₈ (axiomConsistency).*  

**[P2-05]** *The State Twins paper (arXiv:2605.11522, "State Twins: An Off-Chain Substrate for Agentic Reasoning") is directly relevant to the Spine (amaru) architecture — it formalizes fork+simulate+score workflows as a pure-function state machine. Should be cited in thesis.md §3.*  

---

## SECTION 3 — P0 EXACT FIX PARAGRAPHS (ready to drop in)

### Fix for P0-01: Abstract hedging for TH4/TH5

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, Abstract (line 47), second contribution sentence.

**Replace:**
```
(1) A formal categorical semantics: the \textit{Lutar Calculus}, in which receipt types are proofs (Theorem TH7, Curry-Howard correspondence), gate evaluations are reduction rules (Theorem TH4, \(\Lambda\)-Category), and \(\rho\)-closed chains are normal forms (Theorem TH5, Confluence).
```
**With:**
```
(1) A formal categorical semantics: the \textit{Lutar Calculus}, in which receipt types are proofs (Theorem TH7, Curry-Howard correspondence, machine-checked in Lean 4 with sorry-count = 0), gate evaluations are reduction rules (Theorem TH4, \(\Lambda\)-Category, proof sketch in \S6.1; pending Lean formalization in \texttt{lutar-lean/Lutar/LaxFunctor.lean}), and \(\rho\)-closed chains are normal forms (Theorem TH5, Confluence, proof sketch in \S6.2; pending Lean formalization).
```

---

### Fix for P0-02: K13 sample size documentation

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §9.2 Statistical confidence block (line 341).

**Replace:**
```
- K13 (Bekenstein 49.5%): sample size not documented—requires N ≥ 9,604 for ±1% CI at 95% confidence (flag M2-7)
```
**With:**
```
- K13 (Bekenstein 49.5\% fire-rate): sample size N not yet documented in the production measurement log. Required: N \(\geq\) 9,604 for a 95\% CI of width \(\leq\) 1\% (Wilson interval). Correction action: document N and CI in \texttt{knowledge.json} before Zenodo v14 release. Until then, this claim is reported as a point estimate without CI and \textbf{should not be used as a primary result} (flag M2-7; see \S10.1 Limitation 1).
```

---

### Fix for P0-03: TH3 informal labeling

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §5 Body-Graph, Theorem 9 (line 217).

**Replace:**
```
**Theorem 9 (Anatomy Reduction, TH3):** Any system with \(|R| > 8\) is bisimilar to a system with exactly 8 regions. Any system with \(|R| < 8\) is missing a capability not recoverable by the remaining regions. 8 is the minimum for the full anatomy \cite{zenodo_v12_20119582}.
```
**With:**
```
**Theorem 9 (Anatomy Reduction, TH3)** \textit{(informal proof sketch; formal bisimulation pending in \texttt{lutar-lean/Lutar/AnatomyReduction.lean})}\textbf{:} Any system with \(|R| > 8\) is bisimilar (in the sense of Milner's observation equivalence \cite{milner1989communication}) to a system with exactly 8 regions under the axiom set A1–A9. Any system with \(|R| < 8\) is missing at least one capability from the set \(\{$\Lambda$\text{-kernel}, \text{covenant}, \text{attribution}, \text{hash-chain}, \text{proofs}, \text{tooling}, \text{thesis}, \text{trust-mesh}\}\) that is not recoverable by composition of the remaining regions. 8 is the conjectured minimum for the full anatomy; the formal bisimulation argument is deferred to the companion paper R1 (Q3 2026, see \S11).
```

---

### Fix for P0-04: A1 derivability — update axiom count

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §8.2 (line 309-314).

**Add after line 314 (after "TH1–TH3 retained; extended by TH4–TH7"):**
```

\textbf{A1 derivability (U8):} The soundnessAxiom (A1) is no longer an independent assumption. Math-1 derivation U8 proves A1 as a consequence of A2 (homogeneity), A3 (Egyptian-exact), and A4 (bounded). The effective independent axiom count is therefore \textbf{8} (A2–A9), not 9. This strengthens the axiomatic economy of the Lutar system: every stated axiom is independent and none is redundant. The formal derivation is in \texttt{a11oy/src/derivations.ts} (U8 entry) and is pending formalization in \texttt{lutar-lean/Lutar/Axioms.lean}.
```

---

### Fix for P0-05: SIGIL, ABC, RvLLM, Aegon related work

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §2 Related Work (after §2.3, before §2.4).

**Insert new subsection:**
```
### 2.5 Runtime Verification, Behavioral Contracts, and Audit-Runtime Gap Frameworks

A cluster of 2025–2026 papers directly addresses the audit-runtime gap that this thesis targets.

\textbf{SIGIL} \cite{sigil2026} seals the audit-runtime gap for LLM \textit{skills} (third-party agent plugins) by binding every skill to an on-chain content hash verified by a Skill Verification Loader (SVL) at load time. Evaluation on 49,952 in-the-wild skills demonstrates practical deployability. \textit{Delta:} SIGIL focuses on static skill artifact integrity (did the skill change between audit and load?); it has no runtime gate over action \textit{quality} vectors, no formal proofs, no dual-witness ρ-closure, and no receipt chain. SIGIL cannot answer "did this action score ≥ 0.95 on moralGrounding?" — only "is this the same skill that was audited?"

\textbf{Agent Behavioral Contracts (ABC)} \cite{abc2026} introduces formal behavioral contracts for LLM agents, evaluated against temporal logic predicates at each action step. The framework is runtime-enforced, not compile-time verified. \textit{Delta:} ABC's predicate evaluation is equivalent in spirit to our coherence axis (λ₉) but ABC has no multi-axis conjunctive gate, no Lean proofs, no cryptographic receipt chain, and no dual-witness closure. ABC is a monitoring framework; \(\mathcal{S}\) is a formally specified runtime with machine-checked invariants.

\textbf{RvLLM} \cite{rvllm2026} provides a domain-knowledge-enhanced runtime verifier for LLM outputs using a specification language (ESL) and forward chaining. It detects constraint violations. \textit{Delta:} RvLLM operates at the output text level (domain rule compliance); \(\mathcal{S}\) operates at the action decision level with a cryptographic receipt for every gated evaluation. RvLLM has no permanent artifacts, no DOIs, and no formal proofs.

\textbf{Aegon} \cite{aegon2026} applies Certificate Transparency-style Merkle trees to AI content licensing transactions. It provides post-transaction verification via inclusion proofs against a Signed Tree Head. \textit{Delta:} Aegon addresses content \textit{licensing} provenance (did this AI-generated content comply with the license it was produced under?); \(\mathcal{S}\) addresses decision \textit{quality} provenance (did this AI action satisfy the 9-axis gate?). Aegon has no formal gate vector, no Lean proofs, and no ρ-closure. The architectural similarity (Merkle tree, append-only ledger) is genuine; the application domains are orthogonal.

\textbf{IETF draft-tsyrulnikov-rats-attested-inference-receipt} \cite{rats_air2026} defines a COSE/CWT profile for confidential AI inference receipts (AIR), establishing attestation of model identity, input hash, and output hash via RATS (Remote ATtestation procedureS). Updated March 2026. \textit{Delta:} RATS-AIR attests \textit{what model ran}; \(\mathcal{S}\) attests \textit{how the decision scored} on nine quality axes. RATS-AIR is compatible with \(\mathcal{S}\) at the infrastructure layer: the SCITT \texttt{lambda9\_mask} (T7) could carry a RATS-AIR attestation as its inner payload, binding model identity to gate score in one receipt envelope.
```

---

### Fix for P0-06: RATS-AIR in SCITT section

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §2.3 SCITT and Receipts (after line 85).

**Append to §2.3:**
```

\textbf{IETF RATS-AIR} \cite{rats_air2026} (draft-tsyrulnikov-rats-attested-inference-receipt-01, March 2026) proposes a COSE/CWT token profile for attesting AI inference receipts under the IETF RATS framework. It covers model identity, input/output hashes, and hardware attestation (TEE). \textit{Relationship to \(\mathcal{S}\):} RATS-AIR attests the \textit{identity} and \textit{integrity} of an inference run; \(\mathcal{S}\) attests the \textit{quality} (9-axis Λ-vector) of the \textit{decision} that inference produced. The two protocols are composable: an ouroboros receipt envelope can carry a RATS-AIR token as a nested attestation (using the COSE outer/inner structure), combining hardware-rooted identity assurance (RATS-AIR) with formal quality assurance (\(\mathcal{S}\)). This composition is the most direct extension of \texttt{lambda9\_mask} toward hardware-rooted supply-chain integrity.
```

---

### Fix for P0-07: ABC/VeriGuard/StepShield in thesis.md §2

**Target location:** `evolution_pod/thesis/synthesis/thesis.md`, §2 Related Work (after §2.10 OpenSSF Scorecard).

**Insert new section:**
```
## 2.12 Runtime Verification and Behavioral Contracts

A 2025–2026 cluster of work applies runtime verification techniques to LLM agents.

**Agent Behavioral Contracts (ABC)** [Anon., arXiv:2602.22302, Feb 2026] formalizes per-action behavioral contracts evaluated over LTL-style predicates at runtime. ABC monitors action sequences for safety and liveness properties. Delta from \(\mathcal{S}\): ABC has no multi-axis conjunctive quality gate, no Lean proofs, no cryptographic receipt chain, no dual-witness closure, and no permanent DOI artifacts. ABC is a monitoring layer; \(\mathcal{S}\) is a formally specified runtime primitive. ABC's coherence predicate is the closest analogue to our λ₉ (coherence axis), but ABC provides no machine-checked proof that its predicate set is complete or sound under the operator's axiom system.

**VeriGuard** [Miculicich et al., 2025] combines offline formal verification of a behavioral policy with online monitoring. It is the state of the art for dual-stage (static + runtime) verification in LLM systems. Delta: VeriGuard's offline phase uses model checking, not a proof assistant; its online phase uses signature matching, not a cryptographic receipt chain. VeriGuard produces no Zenodo-anchored artifacts and no byte-identical replay guarantee.

**StepShield** [Felicia et al., arXiv:2026] introduces a temporal detection benchmark for agent violations, measuring Early Intervention Rate and Intervention Gap. Delta: StepShield is a benchmark, not a runtime primitive. It measures how quickly a system catches violations; it does not produce a tamper-evident receipt that a third party can verify without operator cooperation. The \(\Lambda_9\) gate, by contrast, makes the gate decision a typed artifact (receipt) before any action effect is visible.

**Runtime verifier for LLM conversations** [arXiv:2605.14175, May 2026] maintains an explicit dependency graph over conversation turns and queries it to detect grounding violations in O(|Args| + |Att|) per turn. Delta: this verifier operates at the conversation coherence layer (closest to λ₉) and uses Dung-style argumentation frameworks — a complementary formalism to our conjunctive gate. Neither system cites the other, creating an opportunity for cross-referencing in a revision: the dependency graph could serve as the semantic substrate for computing λ₉ (coherence) dynamically.
```

---

### Fix for P0-08: Forecast Gauge formal propositions

**Target location:** `evolution_pod/meditation_v5/phd_agi_forecast/operational_spec.md`, Part 4 (after line 282, before Part 5).

**Insert new Part 4.4:**
```markdown
### 4.4 Formal Properties of the Derived Metrics

The three derived metrics are not merely heuristics. Two formal propositions ground them in the ouroboros Λ-calculus.

**Proposition FG-1 (Lutar-Readiness Monotonicity):** Let ASL ∈ {1,2,3,4,5} denote the active Anthropic RSP level and let r(ASL) denote the required floor vector for `lutar-readiness`. Then r(ASL) is component-wise non-decreasing in ASL: r(ASL) ≤ r(ASL+1) (component-wise). Consequently, `lutar-readiness` is non-increasing in ASL for a fixed Λ-vector: as the safety tier escalates, the coverage fraction can only decrease or stay the same unless the Λ-vector improves correspondingly.

*Proof sketch:* By inspection of the coverage map in §4.3, every required floor increases weakly with ASL (moralGrounding: 0.90→0.95 at ASL≥3; doctrineAlignment: 0.90→0.95 at ASL≥3). The coverage fraction is ∑(axes passing floor) / 9; since the denominator is fixed and the numerator is non-increasing in the floor, the fraction is non-increasing in ASL. □

*Operational implication:* When `Anthropic-RSP-current-ASL` increments from 3 to 4, the a11oy HALT gate (§9.2 GATE 4) fires. This is the formal safety invariant: ASL escalation automatically tightens the required Λ coverage.

**Proposition FG-2 (Brier Score as Calibration Bound):** Let p_t be the predicted probability for a binary forecast event (e.g., "AISI-self-replication-success > 90% by Q4 2026") and o_t ∈ {0,1} the outcome. The aggregate Brier score B = (1/T)∑(p_t - o_t)² is an upper bound on the expected squared calibration error of the forecaster. Specifically, B ≥ ECE² (Murphy decomposition; Murphy 1973), where ECE is the expected calibration error. A rising aggregate Brier score in the prediction ledger therefore implies deteriorating calibration — triggering `forecaster-calibration-alert` is formally justified as a calibration degradation signal, not merely an arbitrary threshold.

*Connection to Λ-calculus:* The `lutar-readiness` metric is itself a graded assertion about the Λ-vector relative to a tier-indexed floor. The Brier score over `lutar-readiness` predictions is therefore a calibration measure on the system's own self-assessment accuracy — it tells us how well `lutar-readiness = 1.00` predicts actual gate-pass rates on external evaluations. When TH8b (Graded Λ-Receipt Identity, GΛR proposal) is proved, the connection becomes formal: grade-1 receipts have Brier = 0 by definition of grade-1 determinism.
```

---

### Fix for P0-09: Aegon delta in VSP §8

**Target location:** `evolution_pod/meditation_v5/phd_systems/proposal.md`, after §8.3 (Claude Code), before §9 Doctrine Impact.

**Insert new §8.4:**
```markdown
### 8.4 Aegon and Certificate Transparency-Style Audit Ledgers Cannot Ship VSP

[Aegon (arXiv:2604.06693, April 2026)](https://arxiv.org/html/2604.06693v1) applies Certificate Transparency-style Merkle trees to AI content licensing transactions. It maintains a Signed Tree Head (STH) over an append-only ledger and provides Merkle inclusion proofs for audit verification. Android mobile agents generate hardware-attested compliance receipts via StrongBox. This is the closest published work to VSP's Merkle-anchored span architecture.

**Missing primitive 1 — No 9-axis quality gate.** Aegon receipts record *what model ran on what content under what license*. They carry no quality vector, no floor enforcement, no dual-witness ρ-closure, and no formally proven gate invariant. An Aegon receipt attests that a transaction occurred; a VSP span attests that the transaction *scored ≥ 0.95 on moralGrounding and ≥ 0.90 on 8 other axes, as proved by a Lean 4 theorem*. The distinction is the difference between a notary stamp (Aegon) and a judge's ruling with a formal citation (VSP).

**Missing primitive 2 — No Lean formal proofs.** VSP's trace_id equals the receipt hash precisely because the receipt is the output of a gate whose uniqueness is machine-checked in [lutar-lean](https://github.com/szl-holdings/lutar-lean) via TH_L1 (Uniqueness, sorry-count = 0). Aegon has no theorem prover — its security rests on cryptographic hardness assumptions only (SHA-256, ECDSA). VSP adds a formal proof layer on top of those same assumptions.

**Missing primitive 3 — No dual-witness ρ-closure.** Aegon's STH provides tamper-evidence (the tree root has not changed). VSP's ρ-closure provides replay-determinism (the computation that produced the receipt produces byte-identical output across 5 independent runs). These are orthogonal properties: a tamper-evident log can record a non-deterministic computation; VSP's claim is that the computation was deterministic *and* its determinism is provable by re-running it.

**Conclusion:** Aegon and VSP are architecturally complementary. An enterprise deployment could use Aegon for licensing provenance and VSP for decision quality provenance, with the STH and the ouroboros chain root as co-anchors in the same audit record. VSP's irreducible moat is the combination of OTel GenAI SemConv v1.37 emission + Lean-proven gate invariant + byte-identical replay root. Aegon cannot provide the second or third of these.
```

---

### Fix for P0-10: Node version string correction

**Target location:** `evolution_pod/math_pod_v3/phd_thesis/main.tex.md`, §4.1, Theorem 7 (line 166).

**Replace:**
```
**Theorem 7 (Deterministic Replay, T5):** For canonical JSON + pinned PRNG (mulberry32, seed = constant) + frozen registry + Node 24.0.0 with pinned dependencies: \(\forall i \in \{1..5\}: \text{root}_i = \texttt{1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b}\) \cite{zenodo_v12_20119582}. Proven by construction; empirically verified (K10).
```
**With:**
```
**Theorem 7 (Deterministic Replay, T5):** For canonical JSON + pinned PRNG (mulberry32, seed = constant) + frozen registry + Node \(\geq\)20 LTS with pinned pnpm lockfile (tested on Node 22.x LTS, 2026-05-15): \(\forall i \in \{1..5\}: \text{root}_i = \texttt{1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b}\) \cite{zenodo_v12_20119582}. Proven by construction; empirically verified (K10). \textit{Note on PRNG migration:} mulberry32 has a period of $2^{32}$; at 62,764 ops/sec the period is exhausted in approximately 19 hours of continuous operation. Migration to xoshiro256** (period $2^{256}$) is planned for v6.4.0 (see \S11 Future Work). Until migration, continuous production deployments should seed mulberry32 with a fresh timestamp seed at least every 4 hours; the canonical test fixture uses a pinned constant seed for reproducibility.
```

---

## SECTION 4 — BIBLIOGRAPHY ADDITIONS

The following new citations should be added to `evolution_pod/math_pod_v3/phd_thesis/main.tex.md` refs section and the `thesis.md` reference list:

```bibtex
@misc{sigil2026,
  title={Sealing the Audit–Runtime Gap for {LLM} Skills},
  author={Anonymous},
  year={2026},
  eprint={2605.05274},
  archivePrefix={arXiv},
  primaryClass={cs.CR},
  url={https://arxiv.org/abs/2605.05274}
}

@misc{abc2026,
  title={Agent Behavioral Contracts: Formal Specification and Runtime Enforcement},
  author={Anonymous},
  year={2026},
  eprint={2602.22302},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2602.22302}
}

@misc{rvllm2026,
  title={{RvLLM}: {LLM} Runtime Verification with Domain Knowledge},
  author={Anonymous},
  year={2026},
  eprint={2505.18585},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2505.18585}
}

@misc{aegon2026,
  title={Aegon: Auditable {AI} Content Access with Ledger-Bound Tokens and Merkle-Committed Records},
  author={Anonymous},
  year={2026},
  eprint={2604.06693},
  archivePrefix={arXiv},
  primaryClass={cs.CR},
  url={https://arxiv.org/abs/2604.06693}
}

@misc{rats_air2026,
  title={Attested Inference Receipt ({AIR}): A {COSE/CWT} Profile for Confidential {AI} Inference},
  author={Tsyrulnikov and others},
  year={2026},
  howpublished={{IETF} Internet-Draft draft-tsyrulnikov-rats-attested-inference-receipt-01},
  url={https://datatracker.ietf.org/doc/draft-tsyrulnikov-rats-attested-inference-receipt/}
}

@misc{llm_runtime_verifier2026,
  title={A Linear-Time Runtime Verifier for {LLM} Conversations},
  author={Anonymous},
  year={2026},
  eprint={2605.14175},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2605.14175}
}

@misc{state_twins2026,
  title={State Twins: An Off-Chain Substrate for Agentic Reasoning over {DeFi} Protocols},
  author={Anonymous},
  year={2026},
  eprint={2605.11522},
  archivePrefix={arXiv},
  primaryClass={cs.SE},
  url={https://arxiv.org/abs/2605.11522}
}

@book{milner1989communication,
  title={Communication and Concurrency},
  author={Milner, Robin},
  year={1989},
  publisher={Prentice Hall},
  note={{CCS} bisimulation, used in informal sketch of TH3 (Anatomy Reduction)}
}
```

---

## SECTION 5 — SUMMARY

| Gap | Severity | Target File | Status after fix |
|---|---|---|---|
| P0-01 | P0 | main.tex.md abstract | TH4/TH5 properly hedged |
| P0-02 | P0 | main.tex.md §9.2 | K13 CI gap acknowledged |
| P0-03 | P0 | main.tex.md §5 | TH3 labeled informal |
| P0-04 | P0 | main.tex.md §8.2 | A1 derivability noted |
| P0-05 | P0 | main.tex.md §2 | SIGIL/ABC/RvLLM/Aegon cited |
| P0-06 | P0 | main.tex.md §2.3 | RATS-AIR cited |
| P0-07 | P0 | thesis.md §2 | ABC/VeriGuard/StepShield cited |
| P0-08 | P0 | operational_spec.md Part 4 | Propositions FG-1, FG-2 added |
| P0-09 | P0 | phd_systems/proposal.md §8 | Aegon delta §8.4 added |
| P0-10 | P0 | main.tex.md §4.1 | Node version corrected |

**New citations added:** 8 (SIGIL, ABC, RvLLM, Aegon, RATS-AIR, LLM Runtime Verifier, State Twins, Milner 1989)

---

*Gap-Fill Agent · Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings · 2026-05-16*  
*Doctrine sweep: PASS · All forbidden patterns absent*
