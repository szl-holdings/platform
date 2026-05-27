# NVIDIA Ising — Synthesis & SZL Absorption (2026)

Sixth synthesis-ledger entry after AGI / perception-bio / electrodynamics /
sparse-attention / MeMo. Re-expresses the **NVIDIA Ising** family
(launched World Quantum Day, April 14 2026) against the SZL ontology.

> No upstream source vendored. Every shape re-expressed in our own kit.
> Three non-negotiable additions on top of the paper, gated at the type
> system AND at runtime.

---

## 1. What NVIDIA Ising actually is

Two-part open AI model family for quantum-GPU supercomputing:

### 1a. Ising Decoding — pre-decoder for surface codes
- **Repo:** https://github.com/NVIDIA/Ising-Decoding (Apache 2.0, Python 3.11/3.12/3.13)
- **Models on HF:**
  - `nvidia/Ising-Decoder-SurfaceCode-1-Fast` (~9.1×10⁵ params, convolutional)
  - `nvidia/Ising-Decoder-SurfaceCode-1-Accurate`
- **Paper:** *Fast and Accurate AI-Based Pre-Decoders for Surface Codes*,
  arXiv:2604.12841 (Chamberland, Olle, Muyuan Li, Thornton, Baratta — all
  NVIDIA, Apr 14 2026)
- **Stack:** Stim + PyTorch + PyMatching + CUDA-Q QEC, ONNX export path
- **Core claim:** O(1 μs) end-to-end decoding latency on NVIDIA GB300 at
  large code distances; outperforms correlated PyMatching up to d=13
- **Architecture:** scalable AI pre-decoder runs *block-wise parallel
  across space AND time*, performs local low-latency error correction,
  passes residual syndromes to a downstream global decoder

### 1b. Quantum Calibration Agent Blueprint
- **Repo:** https://github.com/NVIDIA/Quantum-Calibration-Agent-Blueprint (Apache 2.0, Python 3.11+, ~61% TS / ~31% Python)
- **Stars/Forks:** 49 / 15 (May 2026)
- **Lead:** ShuxiangCao; key collaborator: tlubowe; 7 contributors total
- **Stack:** Hydra workflow + HDF5 + SQLite + VLM (vision-language model)
  analysis, supports NVIDIA / Anthropic / OpenAI LLM providers
- **Surface:** intelligent experiment discovery, AI-driven execution,
  visual plot inspection, workflow automation with state tracking, web UI
  (`qca serve` + `cd ui && npm run dev`) and CLI (`qca`, `qca experiments
  list`, etc.)

### 1c. Authors & collaborators worth tracking
| Person | Affiliation | Role |
| --- | --- | --- |
| Christopher Chamberland | NVIDIA | First author, pre-decoder paper |
| Jan Olle | NVIDIA | Pre-decoder paper |
| Muyuan Li | NVIDIA | Pre-decoder paper |
| Scott Thornton | NVIDIA | Pre-decoder paper |
| Igor Baratta | NVIDIA | Pre-decoder paper |
| Shuxiang Cao (@ShuxiangCao) | NVIDIA | Calibration Agent lead |
| Trevor Lubowe (@tlubowe) | NVIDIA | Calibration Agent + Decoding docs |
| Brad Howe (@bmhowe23) | NVIDIA | Pre-decoder cookbook + ONNX path |

We do not "absorb" people — we credit them. The lineage of every
abstraction below is recorded so a reader of our kit can always trace
back to the source.

---

## 2. The three primitives we extract

### Primitive A — Pre-decoder cascade (cheap-local → escalate-to-global)

The pre-decoder is not a faster global decoder. It is a **separate, much
cheaper stage** that strips the obvious local errors first, so the
expensive global decoder only ever sees *residual* syndromes.

This is the same structural pattern as:
- our sparse-attention kit's contradiction-probe (`Stage 1 cheap → Stage
  2 only on disagreement`)
- our MeMo kit's `composeExecutiveRun` gate (`probe.violated ⇒ MUST
  escalate, refuses to seal otherwise`)

Generalised in SZL: **any high-value compute stage MUST have a cheap
deterministic pre-stage that emits a residual receipt; the expensive
stage only ever consumes residuals; sealing a result that bypassed the
cheap stage is a runtime error, not a warning.**

### Primitive B — Calibration agent loop (discover → execute → analyse → drift → correct → rollback)

The Calibration Agent Blueprint encodes a closed-loop ritual:

1. **Discover** available experiments from a typed registry
2. **Execute** by natural language + structured workflow
3. **Analyse** outputs with a VLM that reads plots, not just numbers
4. **Detect drift** by comparing fresh measurements against declared
   model
5. **Correct** by re-fitting calibration weights
6. **Rollback** to last-known-good calibration on failure (state tracked
   in SQLite + HDF5)

Generalised in SZL: every operational subsystem (sentra Ising allocator,
A11oy orchestrator, ROSIE governed decisions, vessels voyage receipts)
exposes a *calibration surface* — experiment list, measurement schema,
drift threshold, rollback target — and every recalibration emits a
typed receipt chain that another operator can replay.

### Primitive C — Noise-learning without an explicit prior

The whitepaper's most quietly important contribution: **a noise-learning
architecture that infers decoding weights directly from experimentally
accessible syndrome statistics, without requiring an explicit
circuit-level noise model.**

Generalised in SZL: any governance / scoring / allocation kit that
depends on a "declared noise model" (priors, weights, decay constants)
must ALSO maintain a *learned* shadow estimated from the live receipt
stream. When the two diverge beyond a fixed Jensen-Shannon-divergence
threshold (in nats, bounded [0, ln 2]), we emit a
`ising.noise.divergence.v1` receipt and **refuse to act on the stale
declared model** until a calibration receipt re-aligns them.

This is the antidote to "model rot" — the slow-burn failure mode where
declared weights drift away from reality and nobody notices.

---

## 3. What we add ON TOP (non-negotiable, type-system enforced)

Mirror of the pattern set by `@szl-holdings/sparse-attention-kit` and
`@szl-holdings/memo-reflection-kit`. Each addition is gated *both* at
the TypeScript type level *and* at runtime — bypassing either is a
hard error, not a soft warning.

1. **Content-addressed receipts.** Every receipt body is hashed via
   `sha256(canonicalJson(body)).slice(0,16)` and the ref is
   `<receiptClass>:<digest>`. `canonicalJson` throws on NaN/Infinity.
   Identical to the discipline established by the Putnam and MeMo kits.

2. **Mandatory escalation gate (forgery-resistant).**
   `composePredecoderResult()` throws if asked to seal a pre-decoder
   result whose residual rate exceeds the declared
   `escalateAboveResidualRate` AND any of: no `globalDecoderRef`
   supplied, no `globalDecoderBody` supplied, ref does not parse as a
   well-formed `ising.global.decoded.v1:<16-hex>`, ref does not
   content-address its body (`verifyRef` fails), body's
   `consumesResidualDigest` does not equal the cascade's just-computed
   residual digest. The first four conditions catch malformed or
   replayed receipts; the last binds the global receipt to *this*
   cascade and nothing else. There is no `force` flag — bypassing this
   gate requires forging sha256, which is the security guarantee.

3. **Noise-model divergence witness — Jensen-Shannon (not KL).**
   `assertNoiseModelAligned(learned, declared, tolerance)` throws when
   JSD(learned ‖ declared) exceeds `tolerance`. JSD is symmetric (a
   caller cannot hide drift by picking the favourable direction),
   bounded in [0, ln 2] (so a `0.05` threshold has stable semantics
   even with disjoint supports), and zero-safe (never produces NaN
   when one distribution has mass at a key the other does not — raw
   KL would). The earlier `symmetricKL` export is preserved as an
   alias that dispatches to JSD.

These are **runtime gates**, not docstrings. Callers cannot satisfy the
type system without going through them.

---

## 4. Where this maps in our ecosystem

| Existing SZL surface | Ising primitive applied |
| --- | --- |
| `artifacts/sentra/src/brain/lib/isingOptimizer.ts` (simulated annealing for governance allocation) | Wrap with pre-decoder cascade: cheap greedy assignment first; only if guardrails fail does the expensive SA run. Emits `ising.predecode.residual.v1` if the greedy pass left hard-violations. |
| A11oy orchestration kernel | Calibration loop applied to LLM admission policy. Every admission emits a measurement; weekly the policy is re-fit. Divergence above threshold opens a calibration receipt chain. |
| ROSIE governed-decision fabric | Pre-decoder cascade for policy admission: cheap rule check first, full contradiction probe only on residual ambiguity. |
| `@szl-holdings/sparse-attention-kit` | Already uses the cheap→escalate pattern; we now share a common `escalation.required.v1` receipt class shape across both. |
| `@szl-holdings/memo-reflection-kit` | The MeMo executive-run gate is structurally the same as the predecoder escalation gate; both go through `composeExecutiveRun` / `composePredecoderResult` to seal. |
| Mesh api-server | New public read at `/api/ising/receipts/classes` + `/api/ising/cascade/policy`; auth-required `POST /api/ising/predecode/admit` and `POST /api/ising/noise/divergence`, mirroring the shape of `/api/memo/executive/admit`. |

We deliberately do NOT package model weights, GPU kernels, Stim, or
PyMatching. Those are NVIDIA's. We package the **discipline** their
architecture demands.

---

## 5. The thirteen receipt classes (`ising.*.v1`)

| Class | What it stamps |
| --- | --- |
| `ising.predecode.input.v1` | Admitted candidate work item (syndrome batch, allocation request, etc.) |
| `ising.predecode.local.v1` | Cheap-local-pass output: corrections applied, residual fraction |
| `ising.predecode.residual.v1` | What local could not resolve — sealed for the global stage |
| `ising.global.decoded.v1` | Global-stage output consuming a residual receipt |
| `ising.escalation.required.v1` | Local-residual exceeded threshold; escalation is now mandatory |
| `ising.calibration.experiment.v1` | A named, parameterised experiment to run against the system |
| `ising.calibration.measurement.v1` | Result of one experiment execution |
| `ising.calibration.drift.v1` | Drift of measurement vs declared model, above noise floor |
| `ising.calibration.correction.v1` | New weights produced by re-fit |
| `ising.calibration.rollback.v1` | Reverted to last-known-good when a correction failed validation |
| `ising.noise.learned.v1` | Snapshot of weights inferred from live stream |
| `ising.noise.declared.v1` | The model the system says it is using |
| `ising.noise.divergence.v1` | JSD(learned ‖ declared) > threshold — system refuses to act |

---

## 6. Doctrine V6 contract

- **Honesty:** every gate is real code, not a docstring. Tests prove the
  gates throw.
- **No invented refs:** content-addressed refs only; no synthesis from
  parents.
- **Fail-closed:** unmapped check kinds throw, do not silently pass.
- **Provenance:** the synthesis is dated, the upstream paper is cited
  with arXiv DOI and author list, the upstream repos are cited with
  exact commit-dated facts.
- **No vendor lock:** dependency-free, pure ESM, no NVIDIA SDK
  dependency — the ABSTRACTIONS are absorbed, not the binaries.

---

## 6.5 Honest boundaries of the escalation gate

The gate is **forgery-resistant** (sha256 binds the ref to the body,
the body binds itself to *this* cascade's residual digest), not
**authenticity-attested**. A caller with no actual global decoder can
still mint a self-consistent body + ref pair locally and pass the gate;
what it CANNOT do is replay an unrelated cascade's receipt, present a
prefix-only stub, or mutate a real body without invalidating the ref.

Closing the remaining gap — "a real global decoder actually ran" —
requires a signer / trusted-issuer attestation on
`ising.global.decoded.v1` bodies. That belongs in the
`@szl-holdings/audit` cosign-backed signing layer, not in this kit;
it is logged as a separate follow-up and called out here so the doc
does not overclaim.

---

## 7. Appendix — the 7-layer agent memory stack (Rakesh Gohel)

The user attached the *AI Agent Memory Stack* diagram by Rakesh Gohel
(@rakeshgohel01) showing seven memory types: **Working, Episodic,
Semantic, Procedural, Hierarchical, Prospective, Shared.**

Our current coverage:

| Layer | Coverage in SZL today |
| --- | --- |
| Working | LLM context window — implicit, no explicit kit |
| Episodic | `@szl-holdings/memo-reflection-kit` (executive runs, contradiction probes, escalations) |
| Semantic | `@szl-holdings/perception-loop` partial — feature-vector summaries; entity-fact stream not yet packaged |
| Procedural | `@szl-holdings/procedural-kit` — skill library shape exists |
| Hierarchical | NOT YET — no hot/warm/cold paging layer |
| Prospective | NOT YET — no scheduler/trigger-engine receipt class |
| Shared | `/api/uds/registry` + content-addressed receipt refs are the substrate, but no `agent.shared.v1` class yet |

**Proposed follow-up:** a `packages/agent-memory-stack-kit` that closes
the Hierarchical, Prospective, and Shared gaps as three new receipt
families and a single `composeMemoryStackSnapshot` that throws if any
required layer is missing. Captured as `agent-memory-stack-gap-2026.md`
follow-up — out of scope for the Ising absorption itself.

---

## 8. Attribution & licensing

- NVIDIA Ising-Decoding and Quantum-Calibration-Agent-Blueprint are
  **Apache 2.0**. Our re-expression is in TypeScript, dependency-free,
  ships no model weights, and reuses no NVIDIA source code; it borrows
  the *architectural pattern*, which is not copyrightable. The
  attribution section in this doc and in each receipt class JSDoc names
  the lineage.
- The pre-decoder paper is arXiv:2604.12841,
  doi:10.48550/arXiv.2604.12841. Cite it if you publish work that uses
  our kit's pre-decoder cascade.
- The 7-layer agent memory stack image is by Rakesh Gohel
  (@rakeshgohel01); we do not redistribute the image, only reference
  the taxonomy.
