# INSPIRATION — Agentic DAG (KHIPU-OS) + Agentic Formulas (FORMULA-OS)

**Author:** Yachay (Perplexity Computer Agent, Agentic-DAG + Agentic-Formulas builder, under CTO authority).
**Date:** 2026-06-01. **Phase 0 deliverable.** Read-only survey; every claim sourced inline.
**Scope:** sibling [`puriq_os/INSPIRATION.md`](../puriq_os/INSPIRATION.md) surveys *organ-level* agency (the OrganAgent loop). This document surveys the two layers *below* the organs — the **data structure** (the Khipu DAG) and the **math objects** (the 23 PURIQ formulas) — and identifies the published primitives that turn each from a passive store/definition into a self-driving agent. We take the math, strip non-math language, prove it Lean-stateable, and instill it under PURIQ Doctrine (13-axis Yuyay gate + HUKLLA tripwires + a Khipu receipt on every autonomous tick).

**De-mystification rule (founder directive, restated):** *no mysticism — only published algorithms, control theory, information theory, Merkle/Bayesian/storage-proof math.*

---

## PART A — Self-driving DATA STRUCTURES (→ KHIPU-OS)

The Khipu DAG is today an append-only, Merkle-signed receipt graph. "Make it agentic" = give it the six autonomous behaviours every production self-managing store already runs. Each behaviour below is taken verbatim from a leader and mapped to a KHIPU-OS loop.

### A1 · Self-pruning — Iceberg `expireSnapshots` / Delta `OPTIMIZE+VACUUM` / IPFS gc + pinning
- **Apache Iceberg**: every write creates a *snapshot*; snapshots accumulate until `expireSnapshots` removes metadata entries older than a retention threshold, then `deleteOrphanFiles` physically removes data no longer referenced by any retained snapshot ([Iceberg Maintenance docs](https://iceberg.apache.org/docs/latest/maintenance/); [Expire Snapshots in Iceberg, Merced](https://iceberglakehouse.com/iceberg/iceberg-expire-snapshots/)). Crucially: `retain_last` *always keeps at least N most-recent snapshots* even if older than the cutoff ([same](https://iceberglakehouse.com/iceberg/iceberg-expire-snapshots/)).
- **Delta Lake**: `delta.autoOptimize.autoCompact` triggers compaction only once a partition has ≥ a minimum number of small files; `VACUUM` then reclaims tombstoned files ([Delta Lake Optimize](https://delta.io/blog/delta-lake-optimize/); [Small File Compaction](https://delta.io/blog/2023-01-25-delta-lake-small-file-compaction-optimize/)).
- **IPFS**: content is garbage-collected unless **pinned**; pinning marks a CID ineligible for gc — direct, recursive, or indirect pins ([IPFS Persistence & Pinning](https://docs.ipfs.tech/concepts/persistence/); [pin-files](https://github.com/ipfs/ipfs-docs/blob/master/docs/how-to/pin-files.md)).

**Made ours →** `pruner.py`: a branch is **archive-eligible** iff (unreferenced > 30 days) ∧ (no descendants) ∧ (Yuyay score < floor). It is *never deleted* — it is archived to the HF dataset `szlholdings/khipu-snapshots` (our cold store, = Iceberg orphan-file deletion that only moves data already captured in a snapshot), and a `retain_last` floor pins the most-recent receipts regardless of age. **Append-only invariant is preserved:** pruning is a *projection* of the hot set, not a mutation of history — the archived branch is recoverable bit-for-bit from cold store. The pin set = IPFS pins.

### A2 · Self-Merkle-checkpoint — Iceberg snapshots + Filecoin Proof-of-Spacetime
- Every Iceberg write is a new immutable snapshot enabling time-travel/rollback ([Iceberg Maintenance](https://iceberg.apache.org/docs/latest/maintenance/)).
- **Filecoin Proof-of-Spacetime (PoSt)**: instead of re-sending all data, a verifier challenges a *random part* of stored data at intervals chosen so it is irrational to discard-and-refetch; `WindowPoSt` continuously audits every sector every proving period ([Filecoin PoS spec](https://spec.filecoin.io/algorithms/pos/); [Filecoin Proofs docs](https://docs.filecoin.io/basics/the-blockchain/proofs)).

**Made ours →** `checkpointer.py`: every 12 h (Bible-mod-12 cadence — pure residue structure, NO prophecy, cf. F12 CRT-Hukulla) compute a Merkle root over all hot receipts, sign DSSE+Cosign, publish to `szlholdings/khipu-snapshots`. Each checkpoint is an immutable Iceberg-style snapshot = a *Proof-of-Spacetime that the DAG still holds exactly the receipts it committed to*.

### A3 · Self-verify — Filecoin WindowPoSt random-sample challenge
- PoSt deliberately **targets a random part of the data** at an interval too short to discard-and-refetch ([Filecoin Proofs](https://docs.filecoin.io/basics/the-blockchain/proofs)).

**Made ours →** `verifier.py`: every 5 min sample 100 random receipts, recompute SHA3-256 hash, verify DSSE signature; mismatch ⇒ alarm. This is WindowPoSt's random-partition challenge applied to the receipt store. Sampling (not full re-hash) keeps the loop O(1) in DAG size — exactly why Filecoin samples.

### A4 · Self-link-suggest — Bayesian parent inference (LeanDojo premise selection analogue)
- LeanDojo's ReProver shows that **retrieval/premise selection by embedding similarity** is the key bottleneck-solver in a large graph of mathematical objects ([LeanDojo, arXiv:2306.15626](https://arxiv.org/abs/2306.15626)). We reuse the pattern for *parent* selection in a receipt graph.

**Made ours →** `linker.py`: on new receipt R, posterior over candidate parents ∝ content-embedding similarity × temporal-proximity prior × organ-correlation prior (a Naïve-Bayes product of three likelihoods). Suggest top-k parents to the writer — never auto-link (writer keeps authority; suggestion only).

### A5 · Self-publish — delta-streaming (Hypercore/CRDT append log)
- Append-only logs replicate by streaming **only the new blocks** (deltas), the model behind Hypercore/Dat and CRDT sync.

**Made ours →** `publisher.py`: each tick emits a JSON **delta** (added receipts, new Merkle root, pruned branch ids) to the `khipu-constellation` 3D viz — never a full snapshot, so the viz updates in O(Δ).

### A6 · Self-prosecute — tamper response as a tripwire (STRIDE Tampering + Byzantine fault)
- A signature mismatch is the STRIDE **T**ampering threat realised. The disciplined response is an automatic, receipted, broadcast halt — not a silent retry.

**Made ours →** `tamper_prosecutor.py`: on verify failure, fire **HUKLLA T22 (new — DAG tamper)**, write a tamper-receipt (itself signed → the DAG signs its own alarm, recursively), and notify all subscribers via Wire B. HUKLLA is the *sole halt-authority* (preserves the 10-tripwire core T01–T10; T22 is an additive DAG-layer extension, namespaced so it never renumbers the locked core).

---

## PART B — Self-driving MATH OBJECTS (→ FORMULA-OS)

Each of the 23 PURIQ formulas becomes a FormulaAgent. The behaviours come from the agentic-theorem-proving and self-improving-model literature.

### B1 · Self-prove (Lean auto-tactic) — AlphaProof / LeanDojo ReProver / Lean Copilot
- **AlphaProof** (DeepMind, Nature 2025): an AlphaZero-style agent that learns formal proofs in Lean via RL on millions of auto-formalised problems, with Test-Time RL on problem variants for the hardest cases ([Nature: Olympiad-level formal reasoning with AlphaProof](https://www.nature.com/articles/s41586-025-09833-y)).
- **AlphaProof Nexus** (2026): a framework where **subagents independently search for proofs with feedback from the Lean compiler**, coordinated by an evolutionary algorithm; the agent takes a Lean file with `sorry` + dependencies (a "proof sketch") and runs a formal tree search; it autonomously resolved open Erdős/OEIS problems ([arXiv:2605.22763](https://arxiv.org/html/2605.22763v1)).
- **LeanDojo / ReProver**: programmatic interaction with the Lean proof environment + retrieval-augmented premise selection; open toolkit, MIT/Apache licensed ([arXiv:2306.15626](https://arxiv.org/abs/2306.15626)).
- **Lean Copilot**: `suggest_tactics`, `search_proof` (LLM tactics + `aesop`), `select_premises` — native in-Lean LLM tactic generation, bring-your-own-model ([lean-dojo/LeanCopilot](https://github.com/lean-dojo/LeanCopilot); [leandojo.org/leancopilot](https://leandojo.org/leancopilot.html)).

**Made ours →** `prover.py`: when a `sorry`-tagged F_i's dependencies are all PROVED, run the **generate→verify→iterate** loop (exactly AlphaProof Nexus's "subagent + Lean-compiler feedback"): generate ≤5 tactic candidates via the a11oy.code router (Llemma / DeepSeek-Math / Qwen2.5-Math), submit each to `lean-kernel /lean-verify`, accept the first that closes the goal. On success: replace `sorry` → proof, **emit Khipu receipt + open a GitHub PR (never direct-to-main)** — the 2-person Yuyay-gate for any doctrine-boundary self-modification.

### B2 · Model backends — Llemma / DeepSeek-Math / Qwen2.5-Math / Mathstral (the a11oy.code router)
- **Llemma** 7B/34B: Code-Llama continued on Proof-Pile-II (55B tokens); first open base model to do in-context Lean theorem proving, beating GPT-4 approaches on miniF2F ([arXiv:2310.10631](https://arxiv.org/abs/2310.10631); [EleutherAI blog](https://blog.eleuther.ai/llemma/)).
- **DeepSeekMath** 7B: 51.7% on MATH without tools (GRPO RL); **DeepSeekMath-V2** is *self-verifiable* (generator + verifier), gold-level IMO/Putnam ([arXiv:2402.03300](https://arxiv.org/abs/2402.03300); [DeepSeekMath-V2](https://www.reddit.com/r/DeepSeek/comments/1p7zmkq/deepseekmathv2_towards_selfverifiable/)).
- **Qwen2.5-Math**: iterative **self-improvement** pipeline (reward-model-guided fine-tuning + tool-integrated reasoning) ([arXiv:2409.12122](https://arxiv.org/abs/2409.12122); [Qwen2.5-Math-1.5B](https://www.emergentmind.com/topics/qwen2-5-math-1-5b)).
- **DeepSeek-R1**: RL alone lifts AIME pass@1 15.6→77.9% — RL incentivises reasoning without supervised traces ([Nature](https://www.nature.com/articles/s41586-025-09422-z)).

**Made ours →** `prover.py` routes to whichever backend a11oy.code exposes; the **self-verifier** pattern (DeepSeekMath-V2) is mirrored: a candidate proof is only accepted after the *independent* Lean kernel verifies it — generation and verification are separated, never trusting the generator.

### B3 · Benchmarks / proof sketches — miniF2F / ProofNet / Open Bookshelf
- **miniF2F**: 488 Olympiad-level statements, cross-system (Lean/Metamath/Isabelle/HOL-Light), valid/test split, version-frozen ([openai/miniF2F](https://github.com/openai/miniF2F); [arXiv:2109.00110](https://arxiv.org/abs/2109.00110)). We treat each `sorry`-tagged F_i exactly like a miniF2F statement: a frozen goal with an example-proof slot.

**Made ours →** the 23 formulas + `SORRY_PURIQ_OPEN[n]` obligations *are* our private miniF2F; `prover.py` reports per-formula pass@1 like a benchmark run.

### B4 · Self-evaluate / self-test / self-stabilize — Wiener feedback + monotonicity guard
- A formula with live inputs is a controller whose output must track a reference within a band (Wiener cybernetics, the same primitive the sibling uses for organs). Drift beyond the Yuyay band ⇒ dampen/reset.

**Made ours →** `evaluator.py` recomputes each formula's numeric value on live state every 5 min and emits a Khipu receipt; `lake_runner.py` runs the Lake numeric harness; `stabilizer.py` watches for monotonicity violation / out-of-band drift and rolls back to last-known-good, firing **HUKLLA T-formula-divergence** (additive tripwire).

### B5 · Self-extend (formula synthesis) — STOP / Voyager / Recursively-Self-Improving Code
- **STOP — Self-Taught Optimizer** (Microsoft): a *seed improver* program recursively improves itself, scaffolding a fixed LLM ([arXiv:2310.02304](https://arxiv.org/abs/2310.02304); [microsoft/stop](https://github.com/microsoft/stop)).
- **Recursively Self-Improving Code Generation** ([OpenReview](https://openreview.net/forum?id=46Zgqo4QIU)) and **Voyager**'s ever-growing skill library (sibling §2) show how to *propose* new executable units and keep only the ones that pass self-verification.

**Made ours →** `synthesizer.py`: when WAYRA ingests a new mathematical primitive, propose `[new primitive] × [existing organ structure] = candidate formula` (exactly the PURIQ construction rule), score by **Yuyay-13** (novelty + math-grounding + provability), and queue only high-scorers for *formal* addition. Bounded recursion (STOP's key safety property): a synthesised formula can only be promoted after Lean-statability + Lake-buildability + the 2-person Yuyay PR gate. **No self-modification crosses a doctrine boundary without a PR.**

### B6 · Self-cite — citation graph (premise-dependency tracking, LeanDojo)
- LeanDojo annotates *which premises each proof uses* — a citation/dependency graph over math objects ([arXiv:2306.15626](https://arxiv.org/abs/2306.15626)).

**Made ours →** `citation_tracker.py`: track which downstream organs invoke each formula; emit a 24-h graph diff. This is the dependency graph that tells `prover.py` *when* a `sorry`'s deps just turned PROVED (the trigger for B1).

---

## PART C — The single unifying primitive

Both layers reduce to the same fact the sibling found for organs: **a closed feedback loop whose reference is the Doctrine** (Wiener cybernetics). For the DAG the sensor is the Merkle root + random-sample challenge (Filecoin PoSt) and the actuator is prune/checkpoint/link/publish/prosecute. For the formulas the sensor is the Lean kernel + Lake harness and the actuator is evaluate/prove/synthesise/stabilise. In both, **HUKLLA is the sole halt-authority** and **every tick emits a signed Khipu receipt** — so the DAG and the math literally sign their own autonomous behaviour, recursively, exactly as the directive demands. Recursion is **bounded** (STOP-style): every doctrine-crossing self-edit is PR-gated and Yuyay-gated; no unbounded self-rewrite is possible.

### Bibliography (primary)
- Iceberg Maintenance — https://iceberg.apache.org/docs/latest/maintenance/
- Delta Lake Optimize — https://delta.io/blog/delta-lake-optimize/
- IPFS Persistence & Pinning — https://docs.ipfs.tech/concepts/persistence/
- Filecoin Proof-of-Spacetime — https://spec.filecoin.io/algorithms/pos/ ; https://docs.filecoin.io/basics/the-blockchain/proofs
- AlphaProof (Nature 2025) — https://www.nature.com/articles/s41586-025-09833-y
- AlphaProof Nexus (2026) — https://arxiv.org/html/2605.22763v1
- LeanDojo / ReProver — https://arxiv.org/abs/2306.15626
- Lean Copilot — https://github.com/lean-dojo/LeanCopilot
- Llemma — https://arxiv.org/abs/2310.10631
- DeepSeekMath — https://arxiv.org/abs/2402.03300
- Qwen2.5-Math — https://arxiv.org/abs/2409.12122
- DeepSeek-R1 (Nature 2025) — https://www.nature.com/articles/s41586-025-09422-z
- miniF2F — https://github.com/openai/miniF2F ; https://arxiv.org/abs/2109.00110
- STOP Self-Taught Optimizer — https://arxiv.org/abs/2310.02304
- Recursively Self-Improving Code Generation — https://openreview.net/forum?id=46Zgqo4QIU
- Wiener, Cybernetics (1948) — https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine
