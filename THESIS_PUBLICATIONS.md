# Thesis Publications — The Complete Innovation Record

**Author:** Stephen P. Lutar Jr. — Founder & CEO, SZL Holdings
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Concept DOI (all versions):** [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926)
**License (all papers):** CC BY 4.0
**Last verified:** 2026-05-11

> This document is the canonical, exhaustive record of original work published by SZL Holdings under the Ouroboros Thesis program. Every innovation listed here is bound to (a) a source line in the shipping platform repository, (b) a peer-style paper deposited with a Zenodo DOI, or (c) both. Nothing on this page is aspirational.

---

## 1. The thesis in one paragraph

Every enterprise AI deployment eventually fails the same diligence question: *"prove what your model decided, why, and that it was within policy."* Most cannot. The Ouroboros Thesis introduces **bounded recursion as a system primitive** — the claim that a properly-bounded AI decision loop is not just executable but *auditable by construction*. Each cycle of the loop emits a hash-chained **proof receipt** (state-hash, delta-hash, policy version, approver, evidence). The closed-form audit-closure operator **Λ** terminates the loop in measurable, sub-millisecond time. The result is a runtime whose **receipt is the deliverable** — the audit artifact every regulator, IG, and procurement officer eventually demands.

The math is published. The runtime is shipped. The platform is governed by it. Eight customer-facing product surfaces sit on top.

---

## 2. The publication family

Thirteen distinct papers across two release tracks (the main thesis line v1–v11 and the audit-closure addendum v9/v10). All deposited under one Zenodo concept (`19944926`) for stable citation. License CC BY 4.0 throughout.

| Version | Title | Year | Released | Pages | Status | DOI / Citation |
|---|---|---|---|---|---|---|
| **v1** | The Loop Is the Product (preprint) | 2026 | 2026-04-12 | — | superseded by v3 | concept `19944926` |
| **v2** | The Loop Is the Product — Empirical Companion | 2026 | 2026-04-27 | — | live | [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926) |
| **v3** | The Loop Is the Product: Measuring Bounded Recursion as a System Primitive for Auditable AI | 2026 | 2026-05-02 | — | **canonical** | [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926) |
| **v4** | Lutar Omega Formalism v4 | 2026 | 2026-05-03 | — | live | concept `19944926` |
| **v5** | Prisca-GraphRAG v5 | 2026 | 2026-05-03 | — | live | concept `19944926` |
| **v6** | Hermetic v6 | 2026 | 2026-05-03 | — | live | concept `19944926` |
| **v7** | Sefirot-Kabbalah v7 | 2026 | 2026-05-03 | — | live | concept `19944926` |
| **v8** | Free-Energy v8 | 2026 | 2026-05-04 | — | live | concept `19944926` |
| **v9** | The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle | 2026 | 2026-05-05 | 17 | **canonical (formal)** | concept `19944926` |
| **v10** | The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family | 2026 | 2026-05-05 | 11 + Appendix A | **canonical (implementation)** | concept `19944926` |
| **v11** | Chinchilla-Lutar v11 | 2026 | 2026-05-05 | — | live | concept `19944926` |
| **v12** | Propeller Drive | 2026 | 2026-05-09 | — | live | concept `19944926` |
| **v13** | Ultra Routing | 2026 | 2026-05-09 | — | live | concept `19944926` |
| **Tawa-SAE companion** | Tawa SAE v9 (companion to v9) | 2026 | 2026-05-05 | — | live | concept `19944926` |
| **EPR-Bell companion** | EPR-Bell v10 (companion to v10) | 2026 | 2026-05-05 | — | live | concept `19944926` |

**Reading order for diligence reviewers:** v3 (the thesis), v9 (the formalism), v10 (the implementation contract), then any companion paper that matches the reviewer's domain (cryptography → v6; cosmology / fiber bundles → v9; SAE / mech-interp → Tawa-SAE; routing → v13).

---

## 3. The Lutar Invariant Family — formal architecture

The invariant family is the mathematical backbone of the whole program. v9 introduces it as a chain of nine progressively-stronger formalisms, each subsuming the previous. v10 then proves each layer's implementation contract is satisfied by the shipping runtime.

### 3.1 The nine formal axes (from v9)

| Axis | Layer | What it formalizes |
|---|---|---|
| **L₁** | Three-term foundation | The minimal expression of bounded recursion: state, delta, witness. The starting point. |
| **L₂** | Closure operator | The act of taking a recursive step and *committing* it — closure under the runtime's policy. |
| **L₃** | Fixed-point existence | Proof that a bounded loop has a measurable fixed point — the convergence condition. |
| **L₄** | Approval-graph topology | The ordering of policy gates and approver dependencies; introduces the topological condition. |
| **L₅** | Three-witness reconciliation | The Frustum primitive: any state assertion is validated by three independent witnesses or it is rejected. |
| **L₆** | Proof-chain composition | The composition law for receipts: chaining N receipts produces a single receipt that is auditable in N-time, not N² or N-log-N. |
| **L₇** | Free-energy boundedness | An information-theoretic bound on the work the loop can do per cycle, drawn from the Free-Energy paper (v8). |
| **L₈** | Fiber-bundle closure (Bianchi) | The full geometric statement: the loop is a closed Bianchi-type fiber bundle whose base space is the policy lattice. |
| **L_Ω** | Ω-completion | The terminal object: every bounded loop reaches a unique completion under Λ in finite time, with measurable overhead. |

These are not nine separate papers — they are nine progressively-stronger statements about the same recursive structure, proven in one continuous derivation across v9.

### 3.2 The audit-closure operator Λ₁₀ (from v10)

v10 is a *meta-invariant*: it does not introduce a new physical L-term. Its sole job is to prove that the runtime implements each of L₁ through L_Ω in code that actually executes against the live shipping repo.

**The contract:** for every formula `Lₖ` in the v9 family, v10 specifies an executable signature `Λ_k(state, delta, witness) → receipt` and proves the runtime's implementation satisfies that signature. The result is a typed receipt covering all 9 axes.

**Operationally:**

```
POST /api/ouroboros/lutar/v10
→ runs Λ₁₀ against the current commit of the platform repo
→ returns a typed lutar_v10 object with one receipt per L-axis
→ writes the object into the Codex v11 graph as the `lutar_v10` node
```

This is the "Lutar-as-a-Service" surface. The audit closure is *executable*, not *publishable*. Each release tag automatically re-runs Λ₁₀ via the test suite and fails the build if any L-axis receipt is malformed.

---

## 4. Original innovations — exhaustive catalog

Each innovation below is novel within the public field as of 2026-05-11 and is bound to either (a) a source line in [`szl-holdings/platform`](https://github.com/szl-holdings/platform) (private), (b) a source line in [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros) (public Apache-2.0), or (c) a formal axis in a published paper.

### 4.1 Architectural primitives

**1. Bounded recursion as a system primitive.** No prior governed-AI architecture treats bounded recursion as a first-class scheduling object. The bounded-loop scheduler in `packages/cognitive-runtime/` is the operational form of L₁–L₃. Convergence is measurable on every cycle; loops that exceed the bound are killed with a typed failure receipt, not a silent timeout.

**2. Compile-time topological ApprovalGate enforcement.** The platform performs a Kahn topological sort over the entire approval graph at compile time (`packages/substrate/src/compiler.ts:82-160`). The compiler rejects any decision flow that contains a cycle, a self-approval, or a gate whose ancestors are not yet authorized. **No other governed-AI system the founder is aware of performs this check at compile time.** All known competitors perform it at runtime (Sierra, Decagon, Cresta, Harvey) — meaning a flawed flow can ship and only fail in production. This is the platform's single most distinctive technical innovation.

**3. Three-witness reconciliation (Frustum primitive).** Any cross-system state assertion must be confirmed by three independent witnesses or the runtime rejects it. Implemented in `packages/cognitive-runtime/` (Frustum class) and formalized as L₅. This is the answer to "how do we get a single trusted view of state across N systems" — and it is enforced, not advisory.

**4. Outcome Graph as system-of-record.** The audit substrate stores every action as a node and every cause as an edge. The graph *is* the answer to "what did we decide and why." Backs the `outcome_graph` API surface and the ROSIE Evidence Bench page.

**5. Proof Chain by construction.** Every output carries a hash chain back to its inputs and to the human approver of each gated step. The chain is cryptographic, append-only, and replayable. Receipts are emitted to `proof_ledger.jsonl` with one line per step containing `state_hash`, `delta_hash`, `receipt_id`, `policy_version`, and `approval_ref`.

**6. Covenant Policy as declarative law.** Policy is declarative, not procedural. It states *what* is auto-allowed, *what* requires human approval, and *what* is forbidden — and the runtime enforces the policy at the gate, not at the audit. Maps to L₂ (the closure operator).

**7. Decision Simulation against historical state.** Policy changes can be replayed against any prior state of the system before they ship. The platform supports counterfactual rollouts via the Argo decision engine. Relevant to OMB M-24-10 (test policy before deploy).

**8. PRISM Bus — append-only event spine.** Every event in the system publishes here. The bus is append-only, hash-verified, and replayable. The Event Fabric primitive.

### 4.2 Reproducibility and audit

**9. Content-hash reproducibility.** The eval harness (`apps/eval-runner/test_suite_reproducibility.py`, 281 lines) verifies that re-running the same suite against the same commit produces byte-identical `content_hash` values across five domain suites (Vessels, Terra, Aegis, Sentra, Counsel) — a stronger bar than `tolerant=true` numeric comparison that most evaluation pipelines use.

**10. Lutar-as-a-Service (LaaS).** `POST /api/ouroboros/lutar/v10` runs the v10 audit closure operator against the live shipping repo on every test run. The result is a typed object backing the `lutar_v10` Codex node. Operational binding from paper to production: the audit closure is *executable*, not *publishable*.

**11. SOURCE_OF_TRUTH ledger.** Every public claim about the platform's size or shape is reproduced by a documented shell command in [`SOURCE_OF_TRUTH.md`](https://github.com/szl-holdings/platform/blob/main/SOURCE_OF_TRUTH.md). The discipline is that numbers are re-verified by command, not estimated.

**12. Withdrawal-and-republish discipline.** When the v3.1 release was found by self-audit to contain residual fabricated metrics in announcement materials, it was publicly retracted and re-published as v3-2.0.0 with a dated correction header. The retraction itself is part of the public record. This is how governance discipline shows up in the publishing record — and is documented in detail in `dossier/SZL_Holdings_2026-05-03_Audit_Delta.md`.

### 4.3 Governance and trust surface

**13. Covenant Proof Standard (CPS) — first-class API.** Seven HTTP endpoints for proof-chained, policy-gated cross-system workflows. Three flagship payloads ship with the standard (incident → governed action → audit close). Tiered approval ladder. Auditable rollback. Maturity-mode gate.

| Endpoint | Behavior |
|---|---|
| `GET /api/cps/payloads` | List registered payloads |
| `GET /api/cps/payloads/:id` | Resolve a payload definition |
| `POST /api/cps/runs` | Execute a payload run |
| `GET /api/cps/runs/:id` | Inspect a run, its proof receipts, and approval state |
| `POST /api/cps/runs/:id/approve` | Approve a gated step at the caller's tier |
| `POST /api/cps/runs/:id/rollback` | Roll a completed run back to a prior verified state |
| `POST /api/cps/payloads/:id/maturity` | Promote/demote a payload's maturity mode |

**14. Agent Zero Trust runtime gate.** The live agent-gateway service (`artifacts/api-server: agent-gateway`) sits in front of every agent action and enforces OPA bundle policy at the runtime boundary. No agent action executes without traversing the gate. Backs the `/agent-zero-trust` surface in A11oy.

**15. Argo champion-policy engine.** The experience-era decision engine. Six live champion policies, self-play arena with replay playback, mirror evaluation, counterfactual rollouts, reward-hacking guardrails. Measured: world-model accuracy 89.1%, throughput 31.4 ev/s. Reward-hacking guardrails close the loop on "is the policy actually doing what it claims."

**16. PSYCHE — emergent-sentience observatory.** Tracks behavioral signals and self-modeling metrics across the agent fleet. The observatory surface for emergent behavior under bounded recursion.

**17. Trust Plane triad.** Trust Center + Trust Exchange + Public Trust Portal. The externally-facing proof-distribution surface — for regulators, auditors, and partner systems. Of the 20 enterprise-AI peers benchmarked, only Anysphere has an equivalent. Most competitors have a "trust.example.com" marketing page; this is a runtime-bound proof surface.

### 4.4 Performance and engineering

**18. Sub-millisecond Λ overhead.** Λ adds ≤ 0.59 ms median per request across the platform's routes. Measured against production traces, not estimated. This is the operational claim that makes "audit by construction" viable at high QPS.

**19. 28 Ouroboros packages.** The runtime is decomposed into 28 published packages (`@workspace/ouroboros-*`), each with its own test suite. The decomposition matters because each package can be replaced or audited independently — the runtime is not a monolith.

**20. 62 passing guardrails tests.** The guardrails suite verifies that every L-axis receipt round-trips through serialization, hash verification, replay, and policy validation. 62/62 passing as of 2026-05-05.

**21. Codex v11 — 76 nodes / 95 typed edges across 11 domains.** The Codex is the platform's typed knowledge graph. Every node is bound to a runnable verification command. `lutar_v10` is one such node, populated by the LaaS surface.

### 4.5 Domain-specific innovations

**22. Sentra governed adversary loop.** A six-step proof chain through A11oy that emits a typed receipt for each step of a red-team / blue-team interaction. Demonstrates the runtime's behavior end-to-end across the security domain.

**23. Amaru — ten innovations beyond the open-source reverse-ETL field.** The "Conduit one-of-one" engineering pass cataloged ten distinct innovations in `packages/amaru/` that have no equivalent in Fivetran HVR, Airbyte, Hightouch, or Census as of 2026-05. Backed by a side-by-side feature audit in `audits/conduit-one-of-one.md`.

**24. ROSIE — Unified Decision Fabric.** The eighth customer-facing surface. Six operator pages (Identity, Optimizer, Fabric, Research, Proof, Evidence Bench). The operator surface for CPS payloads — the surface where a CPS run's proof receipts become an inspectable evidence bench.

---

## 5. The Codex Kernel reference run

A complete reference run of the codex kernel is preserved as audit evidence:

- **Experiment ID:** `E4-codex-kernel-governed-loop-unified-replit-all-in-one`
- **Payload hash:** `624332a9470f8509fcfb57c6c39ac8dc`
- **Final state hash:** `fe20ecc47445dbd887b5b14ef26ed981`
- **Ledger digest:** `4d0a943cef5b8fa605919db38df5e8e7`
- **Stop reason:** convergence (after 12 steps)
- **Hard-stop failures:** 0
- **Soft failures:** 1 (drift bound exceeded at step 10 — auto-corrected at step 11 with -2d adjustment, fully replayable)
- **Budget used:** 18 ms wall, 12 steps, 0 retries
- **Policy version:** covenant-v1
- **Evidence sources cited per receipt:** Dresden Codex pp. 24, 46–50 (Venus tables) + IAU synodic period 583.92 d

Twelve proof-chain receipts (one per cycle) are preserved in `proof_ledger.jsonl`. Each receipt validates four named conditions:
1. `state_transition_rule` — delta well-formed
2. `drift_bounds` — drift within ±2 d
3. `human_gate` — approval requirement satisfied
4. `evidence_provenance` — receipt complete with cited sources

**The reference run demonstrates `mocked: false` end-to-end** — every receipt explicitly asserts the absence of fabricated inputs, and every cited source is a real, public archaeological or astronomical reference.

---

## 6. Verified platform metrics (re-verified 2026-05-05)

Every metric below is re-verified by command, not estimated. The commands live in [`SOURCE_OF_TRUTH.md`](https://github.com/szl-holdings/platform/blob/main/SOURCE_OF_TRUTH.md).

| Metric | Value |
|---|---|
| Registered artifacts (`artifact.toml`) | 9 |
| Customer-facing product surfaces | 8 + A11oy orchestration layer |
| Database tables (live, provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Industry verticals | 7 |
| Monorepo packages (`packages/` + `lib/`) | 126 |
| DB schema files | 170 |
| CI workflows | 23 |
| Declared environment variables | 213 |
| Platform primitives | 6 (Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, PRISM Bus) |
| RBAC roles | 11 |
| Ouroboros runtime test calls | 133 (172/172 passing) |
| Codex-kernel test calls | 29 |
| Ouroboros packages (`@workspace/ouroboros-*`) | 28 |
| Ouroboros guardrails tests | 62 passing |
| Formal axes in Lutar invariant family | 9 |
| Codex v11 nodes / typed edges | 76 / 95 across 11 domains |
| Λ overhead | ≤ 0.59 ms median per request |

---

## 7. What this thesis is *not* claiming

Procurement-trust discipline requires explicit non-claims. SZL Holdings does **not** claim any of the following:

- Federal contract performance — none yet.
- Federal cloud authorization, ATO, or DoD impact-level designation — none yet.
- Outside-firm audit — none yet.
- Signed enterprise contracts for the platform — none yet.
- A team — single-founder operation (Stephen Lutar).
- Revenue or active users — the metrics in §6 are *platform metrics*, not business metrics.

The strength of the position is the public proof and the verifiable runtime, not pretended traction.

---

## 8. Why this work matters

Governed AI cognition is going to be a procurement requirement, not a procurement preference, within the planning horizon of every Fortune 500 and federal AI program office. The two prevailing approaches today are:

1. **Audit-as-wrapper** (the dominant pattern). The model emits whatever it emits and a downstream service tries to reconstruct the decision after the fact. This fails the moment the model takes an action with side effects.
2. **Audit-by-construction** (this work). Every output carries its proof. The audit artifact is generated *with* the decision, by the same code path. There is no "after the fact."

The earlier a platform is built around audit-by-construction, the harder it is to retrofit later, and the cheaper it is for the buyer at audit time. SZL Holdings is one founder choosing to build it that way from the runtime up, in the open, with the math written down.

---

## 9. How to cite

**Primary citation (the canonical thesis):**

> Lutar, S. P. (2026). *The Loop Is the Product: Measuring Bounded Recursion as a System Primitive for Auditable AI* (paper-v3-2.0.0). SZL Holdings. [https://doi.org/10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)

**BibTeX:**

```bibtex
@misc{lutar2026loop,
  author       = {Lutar, Stephen P.},
  title        = {The Loop Is the Product: Measuring Bounded Recursion
                  as a System Primitive for Auditable AI},
  year         = {2026},
  month        = may,
  publisher    = {Zenodo},
  version      = {paper-v3-2.0.0},
  doi          = {10.5281/zenodo.19944926},
  url          = {https://doi.org/10.5281/zenodo.19944926},
  note         = {Concept DOI 10.5281/zenodo.19944926; CC BY 4.0}
}
```

**To cite a specific axis (e.g., the audit closure operator):**

> Lutar, S. P. (2026). *The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family* (paper-v10-1.0.0). SZL Holdings. Zenodo concept DOI [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926).

---

## 10. Reading paths by audience

**For a peer reviewer:** start with v3 (the thesis), then v9 (the formalism), then v10 (the implementation contract). Companion papers are domain-specific.

**For a procurement officer:** start with [§4 of this document](#4-original-innovations--exhaustive-catalog) (the catalog), then [§5](#5-the-codex-kernel-reference-run) (the reference run), then `dossier/v2/APEX_v2_Operational_Briefing.md` in the platform repo.

**For an investor:** start with [§8](#8-why-this-work-matters), then [§4](#4-original-innovations--exhaustive-catalog), then the live demo path at `docs/audits/INVESTOR_DEMO_PATH.md`.

**For a research collaborator:** [v9](https://github.com/szl-holdings/ouroboros-thesis) is the formal entry point. The fiber-bundle treatment in L₈ is where most cross-disciplinary conversation will start.

**For a builder / integrator:** start with the public runtime at [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros) (v6.2.0, 172/172 tests, Apache-2.0), then the public SDK [`szl-holdings/szl-sdk`](https://github.com/szl-holdings/szl-sdk).

---

## 11. Provenance and signatures

- **Concept DOI:** [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926)
- **ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
- **GitHub org:** [`szl-holdings`](https://github.com/szl-holdings)
- **CITATION.cff:** [present in `ouroboros-thesis`](https://github.com/szl-holdings/ouroboros-thesis/blob/main/CITATION.cff)
- **Software Heritage:** [`ouroboros-thesis`](https://archive.softwareheritage.org/browse/origin/?origin_url=https://github.com/szl-holdings/ouroboros-thesis)
- **Source-of-truth ledger:** [`SOURCE_OF_TRUTH.md`](https://github.com/szl-holdings/platform/blob/main/SOURCE_OF_TRUTH.md)
- **Audit delta record:** `dossier/SZL_Holdings_2026-05-03_Audit_Delta.md`

---

*This document is itself a Source-of-Truth artifact. Last verified by command on 2026-05-11. If any claim on this page does not have a verification path in the platform repository, that is a defect — please open an issue at [`szl-holdings/platform/issues`](https://github.com/szl-holdings/platform/issues).*
