# Thesis Publications — The Complete Innovation Record

**Author:** Stephen P. Lutar Jr. — Founder & CEO, SZL Holdings
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Concept DOI (resolves to latest version):** [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926)
**License (all papers):** CC BY 4.0
**Last verified (every link below resolved by command):** 2026-05-11

> This document is the canonical, exhaustive, audit-defensible record of original work published by SZL Holdings under the Ouroboros Thesis program. Every per-version DOI below was read directly from the corresponding `CITATION.cff` / `README.md` in [`szl-holdings/ouroboros-thesis`](https://github.com/szl-holdings/ouroboros-thesis) on 2026-05-11. Every innovation in §4 is bound to (a) a source file in a public or private SZL Holdings repository, (b) a peer-style paper deposited on Zenodo, or (c) both.

---

## 1. The thesis in one paragraph

Every enterprise AI deployment eventually fails the same diligence question: *"prove what your model decided, why, and that it was within policy."* Most cannot. The Ouroboros Thesis introduces **bounded recursion as a system primitive** — the claim that a properly-bounded AI decision loop is not just executable but *auditable by construction*. Each cycle of the loop emits a hash-chained **proof receipt**. The **Lutar Invariant Λ** — defined in v3 as a weighted geometric mean of nine runtime axes — gives a single scalar in `[0, 1]` whose value is `1` if and only if every axis is satisfied. The audit-closure operator **Λ₁₀** (v10) lifts that scalar to a machine-verifiable contract over the implementation. The result is a runtime whose **receipt is the deliverable** — the audit artifact every regulator, IG, and procurement officer eventually demands.

The math is published. The runtime is shipped. The platform is governed by it.

---

## 2. What is *new* — five claims at a glance

We are claiming five things that, to the author's knowledge as of 2026-05-11, do not appear together in any prior published system or paper:

1. **Bounded recursion as a first-class scheduling primitive**, not as a library or middleware (innovation #1 below).
2. **A weighted-geometric scalar trust aggregator with Egyptian-fraction inspectable weights** — the Lutar Invariant Λ defined in v3, four axioms (A1–A4), 22 falsifiable assertions, all proofs by explicit numerical witness in the public reference implementation. We do not assert this composition (geometric + Egyptian + four-axiom + public proof) has prior art (innovation #18, papers v3 + v9).
3. **A computable audit-closure operator** that lifts the v9 invariant family to a single scalar ρ ∈ [0, 1] with `auditClosed = (ρ = 1)`, shipped as an HTTP endpoint (`POST /api/ouroboros/lutar/v10`) — paper v10, measured at p99 ≤ 1.27 ms across 24,800 calls in paper v11.
4. **Compile-time enforcement of the approval graph topology.** The substrate compiler runs a Kahn sort over the entire approval DAG at build time and rejects flows containing cycles, self-approvals, or orphan gates — competitors (Sierra, Decagon, Cresta, Harvey) perform this at runtime (innovation #2).
5. **Content-hash reproducibility as the eval bar**, not `tolerant=true` numeric comparison. The reproducibility harness (paper v11 §3) confirms byte-identical receipts across re-runs of the same commit.

Each of these is detailed in §4 below with a path or DOI binding.

---

## 3. The publication family (verified per-version DOIs)

Eleven distinct papers (v1–v11), deposited under one Zenodo concept (`19944926`) for stable citation. License CC BY 4.0 throughout. **Each per-version DOI in the table below was read on 2026-05-11 from the matching paper directory in [`szl-holdings/ouroboros-thesis`](https://github.com/szl-holdings/ouroboros-thesis).**

| Version | Title (as cited in repo) | Released | Version DOI | Status |
|---|---|---|---|---|
| **v1** | Ouroboros Thesis v1 | 2026 | [`10.5281/zenodo.19867281`](https://doi.org/10.5281/zenodo.19867281) | superseded |
| **v2** | Ouroboros Thesis v2 | 2026 | [`10.5281/zenodo.19934129`](https://doi.org/10.5281/zenodo.19934129) | superseded |
| **v3** | The Lutar Invariant — Ouroboros Thesis v3 (axiomatic trust aggregator) | 2026-05-02 | [`10.5281/zenodo.19983066`](https://doi.org/10.5281/zenodo.19983066) | live |
| **v4** | Ouroboros Thesis v4 | 2026 | [`10.5281/zenodo.20020841`](https://doi.org/10.5281/zenodo.20020841) | live |
| **v5** | Ouroboros Thesis v5 | 2026 | [`10.5281/zenodo.20020846`](https://doi.org/10.5281/zenodo.20020846) | live |
| **v6** | Ouroboros Thesis v6 | 2026 | [`10.5281/zenodo.20020845`](https://doi.org/10.5281/zenodo.20020845) | live |
| **v7** | Ouroboros Thesis v7 | 2026 | [`10.5281/zenodo.20020848`](https://doi.org/10.5281/zenodo.20020848) | live |
| **v8** | Ouroboros Thesis v8 | 2026 | [`10.5281/zenodo.20020849`](https://doi.org/10.5281/zenodo.20020849) | live |
| **v9** | UNIFIED-OPERATIONAL — The Lutar Invariant family v1 → v7 + Ω (Bianchi-closed fiber bundle), 17 pp. | 2026-05-05 | [`10.5281/zenodo.20053148`](https://doi.org/10.5281/zenodo.20053148) | **canonical (formalism)** |
| **v10** | EXHAUSTIVE-AUDIT — The Audit Closure Operator Λ₁₀, 11 pp. + App. A & B | 2026-05-05 | [`10.5281/zenodo.20053163`](https://doi.org/10.5281/zenodo.20053163) | **canonical (implementation contract)** |
| **v11** | Applied Λ — empirical companion to v10, 17 pp. + 3 figures + 20-ref bibliography | 2026-05-11 | [`10.5281/zenodo.20119582`](https://doi.org/10.5281/zenodo.20119582) | **canonical (empirical)** & **latest** |

**Concept DOI** [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926) currently resolves to v11 (verified 2026-05-11). It will follow each future release.

**Reading order for diligence reviewers:**
v3 (the Λ object) → v9 (the formalism) → v10 (the implementation contract) → v11 (the empirical measurement). Each paper is independently citeable via its version DOI.

---

## 4. Original innovations — exhaustive catalog

24 numbered innovations. Each is bound to (a) a path in a public repo, (b) a path in the private platform repo, or (c) a formal axis in a published paper. Where the binding is to the private repo, the binding is asserted but not externally clickable — diligence reviewers may request access.

### 4.1 Architectural primitives

**1. Bounded recursion as a system primitive.** Bounded loops are scheduled by the cognitive runtime as first-class objects. Loops that exceed their bound are killed with a typed failure receipt, not a silent timeout. Binding: `packages/cognitive-runtime/` in the platform repo (private). Formal: L₁–L₃ in v9.

**2. Compile-time topological ApprovalGate enforcement.** A Kahn topological sort is run over the entire approval DAG at compile time; flows with cycles, self-approvals, or orphan gates are rejected at build. To the author's knowledge as of 2026-05-11, no other governed-AI runtime publishes a compile-time check of this kind — known competitors (Sierra, Decagon, Cresta, Harvey) perform approval-graph validation at runtime. Binding: `packages/substrate/src/compiler.ts` (private).

**3. Three-witness reconciliation (Frustum primitive).** Any cross-system state assertion must be confirmed by three independent witnesses or the runtime rejects it. Binding: `Frustum` class in `packages/cognitive-runtime/` (private). Formal: L₅ in v9.

**4. Outcome Graph as system-of-record.** The audit substrate stores every action as a node and every cause as an edge. The graph *is* the answer to "what did we decide and why." Binding: `outcome_graph` API surface in the platform repo.

**5. Proof Chain by construction.** Every output carries a hash chain back to its inputs and to the human approver of each gated step. Receipts are emitted to `proof_ledger.jsonl` with one line per step: `state_hash`, `delta_hash`, `receipt_id`, `policy_version`, `approval_ref`. Binding: see [`szl-trust/runs/E4-codex-kernel-2026-04-29/proof_ledger.jsonl`](https://github.com/szl-holdings/szl-trust/blob/main/runs/E4-codex-kernel-2026-04-29/proof_ledger.jsonl) — twelve real receipts from the live reference run, mocked: false.

**6. Covenant Policy as declarative law.** Policy states *what* is auto-allowed, *what* requires human approval, *what* is forbidden — and the runtime enforces the policy at the gate, not at the audit. Maps to L₂.

**7. Decision Simulation against historical state.** Policy changes can be replayed against any prior state of the system before they ship (counterfactual rollouts). Relevant to OMB M-24-10 ("test policy before deploy").

**8. PRISM Bus — append-only event spine.** Every event publishes here. Append-only, hash-verified, replayable.

### 4.2 Reproducibility and audit

**9. Content-hash reproducibility.** The eval harness verifies byte-identical `content_hash` values across re-runs of the same commit. Binding: [`apps/eval-runner/test_suite_reproducibility.py`](https://github.com/szl-holdings/platform/pull/138) (PR #138, 281 LOC). Formal: v11 §3.

**10. Lutar-as-a-Service (LaaS).** `POST /api/ouroboros/lutar/v10` runs the v10 audit closure operator against the live shipping repo on every test run. The result is a typed object backing the `lutar_v10` Codex node. Operational binding from paper to production. Formal: v10.

**11. Reproducible reference run with real evidence.** A complete codex-kernel run is preserved at [`szl-trust/runs/E4-codex-kernel-2026-04-29/`](https://github.com/szl-holdings/szl-trust/tree/main/runs/E4-codex-kernel-2026-04-29) — 11 CPS artifacts, `mocked: false`, 12 receipts citing Dresden Codex pp. 24, 46–50 (Venus tables) and the IAU synodic period of Venus (583.92 d). Anyone can clone and read it.

**12. Withdrawal-and-republish discipline.** The v3 paper directory ([`papers/v3/README.md`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers/v3)) explicitly identifies itself as a *rewrite* of a retracted preprint ([10.5281/zenodo.19951520](https://doi.org/10.5281/zenodo.19951520)). The retraction is part of the public record.

### 4.3 Governance and trust surface

**13. Covenant Proof Standard (CPS) — first-class API.** A suite of HTTP endpoints for proof-chained, policy-gated cross-system workflows. Endpoint table follows the live OpenAPI in the platform repo; representative endpoints (subject to versioned change in the API spec):

| Endpoint (representative) | Behavior |
|---|---|
| `GET /api/cps/payloads` | List registered payloads |
| `GET /api/cps/payloads/:id` | Resolve a payload definition |
| `POST /api/cps/runs` | Execute a payload run |
| `GET /api/cps/runs/:id` | Inspect a run, its proof receipts, and approval state |
| `POST /api/cps/runs/:id/approve` | Approve a gated step at the caller's tier |
| `POST /api/cps/runs/:id/rollback` | Roll a completed run back to a prior verified state |
| `POST /api/cps/payloads/:id/maturity` | Promote/demote a payload's maturity mode |

The authoritative source is `API-SPEC.md` in the platform repo (PR #141).

**14. Agent Zero Trust runtime gate.** The agent-gateway service sits in front of every agent action and enforces OPA bundle policy at the runtime boundary. No agent action executes without traversing the gate. Binding: `artifacts/api-server: agent-gateway` (private) + `packages/gateway/` (PR #139).

**15. Argo champion-policy engine.** The experience-era decision engine: champion policies, self-play arena with replay playback, mirror evaluation, counterfactual rollouts, reward-hacking guardrails.

**16. PSYCHE — emergent-sentience observatory.** Tracks behavioral signals and self-modeling metrics across the agent fleet.

**17. Trust Plane triad.** Trust Center + Trust Exchange + Public Trust Portal. The Public Trust Portal is now live at [`szl-holdings/szl-trust`](https://github.com/szl-holdings/szl-trust). Receipts and reference runs are externally verifiable.

### 4.4 Performance and engineering

**18. The Lutar Invariant Λ as a weighted-geometric scalar trust aggregator.** Λ(x; w) = Π xᵢ^wᵢ with weights wᵢ drawn from an explicit Egyptian unit-fraction decomposition that is *inspectable* by construction. Four axioms (A1 monotonicity, A2 zero-pinning, A3 Egyptian inspectability, A4 page-curve concavity), each proven by explicit numerical witness. **22 falsifiable assertions** in the public test surface (`packages/ouroboros/src/lutar-invariant-proof.test.ts` in [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros)). To the author's knowledge, the specific composition (weighted-geometric + Egyptian-fraction weights + four-axiom set + public falsifiable test) is novel; related work cited in v3 §6 uses arithmetic aggregation, learned weights, or unaxiomatized scalar metrics. Formal: papers v3 + v9.

**19. Measured Λ₁₀ overhead at production scale.** Paper v11 reports **24,800 HTTP calls** across **8** production routes (A11oy, Amaru, Sentra) × 1,000 iterations × 2 arms (baseline / governed). Median overhead **0.49 – 0.59 ms** per route; p99 **≤ 1.27 ms**; **ρ = 1.000** on 8,000 / 8,000 governed pairs; 0 missing artefacts. Commit pin: `6c5c28366`. **48 / 48 Λ axiom tests** + **13 / 13 Λ adapter tests** passing on the same commit. Source: [`papers/v11/README.md`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers/v11).

**20. 172 / 172 tests passing on the public reference runtime.** The public [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros) runtime (Apache-2.0) ships at v6.2.0 with a full passing suite. The paper-v3 reference implementation is pinned to commit [`5f6ee65`](https://github.com/szl-holdings/ouroboros/commit/5f6ee65).

**21. Codex v11 — the typed knowledge graph.** Every Codex node is bound to a runnable verification command. `lutar_v10` is one such node, populated by the LaaS surface. Node and edge counts are reproduced by command in the platform's `SOURCE_OF_TRUTH.md` (private — diligence reviewers may request access).

### 4.5 Domain-specific innovations

**22. Sentra governed adversary loop.** A multi-step proof chain through A11oy that emits a typed receipt for each step of a red-team / blue-team interaction. Binding: [`szl-holdings/sentra`](https://github.com/szl-holdings/sentra).

**23. Amaru — convergent multi-source data sync.** Append-only delta logs, hash-verified ingest, ten innovations beyond the open-source reverse-ETL field documented in a side-by-side audit. Binding: [`szl-holdings/amaru`](https://github.com/szl-holdings/amaru).

**24. Decision Fabric — cross-primitive query layer.** A governed read substrate that joins signal, recommendation, policy, simulation, execution, proof, and outcome under a single correlation ID. Workflow 360 (cross-primitive joins), Entity Investigation (per-entity timelines across all primitives), Recommendation Trace (AI output → outcome with prediction error). Schema: [`lib/db/src/schema/decision_fabric.ts`](https://github.com/szl-holdings/platform/blob/main/lib/db/src/schema/decision_fabric.ts). Namespace: `/api/decision-fabric`. The integration point through which the CPS standard renders inside the existing seven customer-facing surfaces.

---

## 5. The reference run — every claim verifiable

A complete codex-kernel run is preserved as audit evidence at [`szl-holdings/szl-trust/runs/E4-codex-kernel-2026-04-29/`](https://github.com/szl-holdings/szl-trust/tree/main/runs/E4-codex-kernel-2026-04-29). Eleven artifacts, all read from the actual files (verified 2026-05-11):

| Field | Value (read from the live JSON) |
|---|---|
| Experiment ID | `E4-codex-kernel-governed-loop-unified-replit-all-in-one` |
| `payload_hash` | `624332a9470f8509fcfb57c6c39ac8dc` |
| `manifest_hash` | `b977a47f69b7ba0d038c86271c85d234` |
| `final_state_hash` | `fe20ecc47445dbd887b5b14ef26ed981` |
| `ledger_digest` | `4d0a943cef5b8fa605919db38df5e8e7` |
| `status` | `ok` |
| `stop_reason` | `convergence` |
| Steps executed | 12 |
| Receipts emitted | 12 |
| Hard-stop failures | 0 |
| Soft failures | 1 |
| Budget used | 18 ms wall, 12 steps, 0 retries |
| Policy version | `covenant-v1` |
| `degraded` | `false` |
| `mocked` (every receipt) | `false` |
| Evidence cited per receipt | Dresden Codex pp. 24, 46–50 (Venus tables); IAU synodic period of Venus = 583.92 d |

The `run_manifest.json` in that directory lists per-deliverable `sha` hashes computed by the kernel's canonical-JSON hasher. Naive `md5sum` of the pretty-printed on-disk JSON will **not** match those hashes (the kernel canonicalizes before hashing) — the authoritative reproducer is the `apps/eval-runner/` harness (PR #138). This is documented honestly in the `szl-trust` README.

---

## 6. Evidence-labelled metrics (refreshed 2026-07-25)

Current estate measurements come only from
`artifacts/SOURCE_OF_TRUTH.json`. Paper-specific figures remain historical
`REPORTED` results; they are not represented as current runtime measurements.

| Metric | Value | Label | Verification source |
|---|---|---|---|
| Concept DOI | `10.5281/zenodo.19944926` | REPORTED | Generated truth artifact and [Zenodo](https://doi.org/10.5281/zenodo.19944926) |
| Per-version DOIs (v1–v11) | 11 distinct DOIs, listed in §3 | REPORTED | Each paper's `CITATION.cff` / `README.md` |
| Paper count | 11 (v1–v11) | REPORTED | [`papers/`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers) |
| Customer-facing product surfaces meeting manifest/health/receipt definition | 0 | MEASURED | `artifacts/SOURCE_OF_TRUTH.json` |
| Monorepo packages | 202 | MEASURED | `pnpm -r list --depth -1 --json` via generated truth |
| Database tables | UNAVAILABLE | UNKNOWN | No authorized live introspection receipt was available |
| TypeScript route declarations | UNAVAILABLE | UNAVAILABLE | runtime router inventory is unavailable in the generated truth artifact |
| Platform per-test result | UNAVAILABLE | UNKNOWN | `artifacts/test-results.json` was not produced |
| Ouroboros per-test result | UNAVAILABLE | UNKNOWN | `artifacts/ouroboros-test-results.json` was not produced |
| Formal axes in Lutar invariant family | 9 (L₁..L₈ + L_Ω) | REPORTED | v9, DOI `20053148` |
| Codex v11 nodes / typed edges | 76 / 95 across 11 domains | REPORTED | Historical v11 audit snapshot |
| Λ overhead (median) | 0.49–0.59 ms per route | REPORTED | v11 §3, DOI `20119582`; not a current benchmark |
| Λ overhead (p99) | ≤1.27 ms per route | REPORTED | v11 §3; not a current benchmark |
| ρ = 1.000 governed pairs | 8,000 / 8,000 | REPORTED | v11 §3 historical evaluation |
| Λ axiom tests | 48 / 48 | REPORTED | v11 §3 historical evaluation |
| Λ adapter tests | 13 / 13 | REPORTED | v11 §3 historical evaluation |

---

## 7. What this thesis is *not* claiming

Procurement-trust discipline requires explicit non-claims. SZL Holdings does **not** claim any of the following:

- Federal contract performance — none yet.
- Federal cloud authorization, ATO, or DoD impact-level designation — none yet.
- Outside-firm audit (Big Four, NIST, etc.) — none yet.
- Signed enterprise contracts for the platform — none yet.
- A team — single-founder operation (Stephen Lutar).
- Revenue or active users — the metrics in §6 are *platform metrics*, not business metrics.
- Peer review of the Zenodo deposits — Zenodo deposits are time-stamped and citeable but are not peer-reviewed in the traditional venue sense.

The strength of the position is the public proof and the verifiable runtime, not pretended traction.

---

## 8. Why this work matters — and how it makes our software better

Governed AI cognition is moving from procurement *preference* to procurement *requirement* across Fortune 500 and federal AI programs. Two architectural patterns dominate today:

1. **Audit-as-wrapper** (the prevailing pattern). The model emits whatever it emits and a downstream service tries to reconstruct the decision after the fact. This fails the moment the model takes an action with side effects, because the side effect is already real before the audit has run.
2. **Audit-by-construction** (this work). Every output carries its proof. The audit artifact is generated *with* the decision, by the same code path. There is no "after the fact."

**Concretely, every innovation in §4 makes the software better in one of three ways:**

- **Failure becomes loud, not silent.** Innovations #1, #2, #3, #5, #14 — bounded loops are killed with a typed receipt, the approval graph is rejected at compile time, three-witness reconciliation refuses single-source state, every output carries a hash chain, and no agent action bypasses the gateway. Each one converts a silent failure mode into a loud one. Silent failures are how procurement audits fail.
- **Replay is cheap.** Innovations #7, #9, #10, #11 — counterfactual policy rollouts, byte-identical content-hash reproducibility, LaaS audit-closure on every test run, a full reference run preserved publicly. The cost of "show me you can reproduce this decision" is approximately zero.
- **The audit artifact is a runtime object, not a marketing document.** Innovations #13, #17, the entire `szl-trust` repo, and the Codex graph — the proof of governance is something a reviewer can `curl`, not something they have to take on faith.

The earlier a platform is built around audit-by-construction, the harder it is to retrofit, and the cheaper it is for the buyer at audit time. SZL Holdings is one founder choosing to build it that way from the runtime up, in the open, with the math written down.

---

## 9. How to cite

**Primary citation (the latest canonical paper, v11):**

> Lutar, S. P. (2026). *Ouroboros Thesis v11 — Applied Λ: An Audit-Closure Operator with Measured Per-Request Latency Overhead in a Governed AI Runtime.* SZL Holdings. Zenodo. [https://doi.org/10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)

**Concept-DOI citation (resolves to latest version, useful for long-lived references):**

> Lutar, S. P. (2026). *The Ouroboros Thesis* (concept). SZL Holdings. Zenodo. [https://doi.org/10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)

**BibTeX (latest version):**

```bibtex
@misc{lutar2026appliedlambda,
  author       = {Lutar, Stephen P.},
  title        = {Ouroboros Thesis v11 — Applied Lambda: An Audit-Closure
                  Operator with Measured Per-Request Latency Overhead in a
                  Governed AI Runtime},
  year         = {2026},
  month        = may,
  publisher    = {Zenodo},
  version      = {paper-v11-1.0.0},
  doi          = {10.5281/zenodo.20119582},
  url          = {https://doi.org/10.5281/zenodo.20119582},
  note         = {Concept DOI 10.5281/zenodo.19944926; CC BY 4.0}
}
```

**To cite a specific axis:** use the per-version DOI from §3 (e.g., for the audit closure operator, cite `10.5281/zenodo.20053163`; for the Lutar Invariant axioms, cite `10.5281/zenodo.19983066`).

---

## 10. Reading paths by audience

- **Peer reviewer:** v3 (the Λ object and axioms) → v9 (the formalism) → v10 (the implementation contract) → v11 (the empirical measurement).
- **Procurement officer:** §2 (what is new), §4 (the catalog), §5 (the reference run), then APEX v2 in the platform repo.
- **Investor:** §8 (why it matters), §4 (catalog), §5 (reference run).
- **Research collaborator:** v9 (the fiber-bundle treatment in L₈ is where cross-disciplinary work most naturally begins).
- **Builder / integrator:** the public runtime at [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros) (Apache-2.0, 172/172 tests), then the artifacts in [`szl-holdings/szl-trust`](https://github.com/szl-holdings/szl-trust) and [`szl-holdings/szl-cookbook`](https://github.com/szl-holdings/szl-cookbook).

---

## 11. Provenance and signatures

- **Concept DOI:** [`10.5281/zenodo.19944926`](https://doi.org/10.5281/zenodo.19944926) (resolves to latest version, currently v11)
- **ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
- **GitHub org:** [`szl-holdings`](https://github.com/szl-holdings)
- **Paper directory:** [`szl-holdings/ouroboros-thesis/papers/`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers)
- **Top-level CITATION.cff:** [`szl-holdings/ouroboros-thesis/CITATION.cff`](https://github.com/szl-holdings/ouroboros-thesis/blob/main/CITATION.cff)
- **Public reference runtime:** [`szl-holdings/ouroboros`](https://github.com/szl-holdings/ouroboros) (Apache-2.0)
- **Public Trust Portal:** [`szl-holdings/szl-trust`](https://github.com/szl-holdings/szl-trust)
- **Engineering cookbook:** [`szl-holdings/szl-cookbook`](https://github.com/szl-holdings/szl-cookbook)
- **Brand assets / social previews:** [`szl-holdings/szl-brand`](https://github.com/szl-holdings/szl-brand)
- **Platform PR chain (this overhaul):** #129–#141 on [`szl-holdings/platform`](https://github.com/szl-holdings/platform)

---

## 12. Verification log — corrections applied 2026-05-11

This document was exhaustively re-verified on 2026-05-11. The following corrections were applied to the prior draft:

| Prior claim | Correction | Source of truth |
|---|---|---|
| v3 title was *"The Loop Is the Product"* | v3 is titled *"The Lutar Invariant"* — an axiomatic trust aggregator, not a thesis manifesto. | [`papers/v3/README.md`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers/v3) and [`papers/v3/CITATION.cff`](https://github.com/szl-holdings/ouroboros-thesis/blob/main/papers/v3/CITATION.cff) |
| Concept DOI resolves to v3 (canonical) | Concept DOI resolves to the **latest** version, currently v11 (published 2026-05-11). v3, v9, v10, v11 each have their own version DOIs. | Direct fetch of [doi.org/10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926) on 2026-05-11 |
| 13 papers across two release tracks (v1–v11 + v12 Propeller Drive + v13 Ultra Routing) | **11 papers (v1–v11).** No v12 or v13 directories exist in the repo as of 2026-05-11. | [`papers/`](https://github.com/szl-holdings/ouroboros-thesis/tree/main/papers) listing |
| All papers cited via concept DOI only | Each paper has its own per-version DOI, now listed in §3 | Each paper's `CITATION.cff` |
| Reference to a public `szl-holdings/szl-sdk` repo | **No such repo exists.** Reference removed. | `gh api /repos/szl-holdings/szl-sdk` returned 404 |
| Reference to `SOURCE_OF_TRUTH.md` at a public URL on the platform repo | `platform` is private; that URL 404s for anonymous users. Now marked private — diligence reviewers may request access. | `gh api` 404 on the public path |
| "Tawa-SAE companion" and "EPR-Bell companion" listed as separate papers | Not present as separate paper directories in `papers/`. Removed from the table. | `papers/` listing |

Every other claim in the document was verified or re-verified against either a public repository file, a public DOI resolution, or a verified hash in the reference run. **If any claim on this page does not have a verification path, that is a defect — please open an issue at [`szl-holdings/ouroboros-thesis/issues`](https://github.com/szl-holdings/ouroboros-thesis/issues).**
