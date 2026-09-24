# a11oy Token-State Frontier

> Status: **tooling landed, measurements pending.** This document describes a gate and a measurement harness, not a performance result. Every throughput number this repo publishes about ingress must come from a receipt emitted by [`tools/a11oy_frontier.py`](../tools/a11oy_frontier.py) and verified by [`frontier-chain-verify`](../.github/workflows/frontier-chain-verify.yml).

## Thesis

Tokenization is not preprocessing. It is the first kernel of cognition, and the state it produces — pretokens, prefixes, KV blocks, verifier traces — is the most reusable asset in the stack. The industry is optimising the throughput of that stage. Nobody is making the *reuse* accountable.

That gap is where SZL doctrine is already load-bearing. KV blocks are immutable and content-addressed: a block is never updated, only evicted. That property makes the block hash a usable receipt leaf, which means cache reuse can stop being an invisible optimisation and become auditable provenance.

The resulting capability is a sentence no competitor can currently write: *this response reused prefix `a3f9…`, admitted under kernel `c7c0ba17`.*

## Three-plane substrate

| Plane | Owns | Prior art studied | SZL delta |
|---|---|---|---|
| **Ingress** | tokenizer, normalisation, segmentation, modality adapters | [Gigatoken](https://github.com/marcelroed/gigatoken) — SIMD pretokenisation, pretoken caching, reduced Python crossings | every batch emits a signed ingress receipt carrying a typed evidence label |
| **State** | KV blocks, hidden states, embeddings, prefixes, verifier traces, adapters | [Mooncake](https://github.com/kvcache-ai/Mooncake) — KV-cache-centric disaggregation over pooled DRAM/SSD | admission control: no block is reusable *as proof* unless its provenance chain is locked |
| **Execution** | prefill, decode, verifier, code, memory, multimodal, adapter kernels | Moonshot AI's public model breadth (language, code, audio, multimodal, long-context) | branch scoring priced in reclaimed ingress latency |

[Hugging Face tokenizers](https://github.com/huggingface/tokenizers) remains the semantic oracle and [tiktoken](https://github.com/openai/tiktoken) a second BPE baseline. Neither is replaced — both are wrapped, so speed can never silently buy semantic drift.

## Enforced invariants

Prose invariants rot. These are executable, and each has a positive and a negative case in [`tools/test_a11oy_frontier.py`](../tools/test_a11oy_frontier.py).

| ID | Invariant | Enforcement point |
|---|---|---|
| **I1** | No receipt is `MEASURED` unless a real measurement produced it | `ReceiptLedger.emit()` silently downgrades to `DECLARED` |
| **I2** | No block is `ADMITTED` unless its full provenance chain is locked-proven | `StateBlock.gate()` |
| **I3** | No self-referential loop exceeds the kernel depth ceiling | `min(caller_depth, MAX_DEPTH)` — the kernel wins over the caller |
| **I4** | Every receipt is content-addressed and chained to its predecessor | sha256 over canonical JSON plus a `prev` commitment |
| **I5** | No engine is promoted over the oracle without token-id equality | `digest_ids()` comparison gates the audit verdict |
| **I6** | Private mesh addresses never enter published output | `scrub()` on every receipt body and on the report |

### Evidence labels

The tool speaks only the five labels the estate constitution already recognises: `DECLARED` (asserted, not measured), `MODELED` (derived, not from the wire), `MEASURED` (produced by a measurement here), `UNAVAILABLE` (could not be obtained — say so), `LIVE` (streaming from a live source).

Two consequences worth stating plainly:

- An absent engine or an absent energy meter yields `UNAVAILABLE`, never `0.0`. A zero is a measurement; an absence is not.
- Gigatoken's own CLI self-report is recorded as `MODELED`, not `MEASURED`, because that wall clock includes process startup. A speedup that has not been reproduced in-process is not evidence yet, and the audit marks it `PROVISIONAL` rather than promoting it.

## Admission control

Three verdicts, enforced at the gate against the locked formula set `{F1, F4, F7, F11, F12, F18, F19, F22}` at kernel `c7c0ba17`:

- `ADMITTED` — every formula in the provenance chain is in the locked set.
- `QUARANTINED` — the chain touches Λ (Conjecture 1, which stays open) or Khipu BFT (Conjecture 2). **Still reusable for speed. Never promotable to proof.**
- `REJECTED` — no provenance chain at all.

The quarantine tier is the load-bearing idea. It lets conjectural work stay operationally useful without ever being laundered into a proven claim.

## Bounded self-reference

The tokenizer consumes the verifier's trace; the trace becomes a prefix; the prefix accelerates the next verification. That is genuine self-reference, and it is safe only because it is kernel-gated by two independent guards:

1. a hard depth ceiling that the caller cannot raise, and
2. a fixed-point detector that halts the moment state becomes self-identical.

Bounded recursion is the difference between a compounding system and a runaway one. Both guards have negative tests.

## Distributed versus centralised state

This is a tiering decision, not a binary. The convergent design is a ladder — device memory, pinned host memory, local NVMe, remote RDMA-accessible pool, object store — with dedup by sequence hash at registration.

Lean distributed with many nodes, high prefix reuse, and an RDMA fabric. Lean centralised when single-rack or on plain TCP, where the round-trip tax erases the pooling win. For the own-metal mesh the distributed pool is the natural fit, but the commitment should follow a TTFT measurement under multi-turn replay, not precede it.

## Migration sequence

1. **Inventory** the estate by tokenizer family, normalisation path, special-token scheme, and monthly volume. Tier A (BPE, high volume) targets the native fast path; Tier B (mixed) the compatibility path; Tier C (SentencePiece, WordPiece) is held behind the Hugging Face fallback.
2. **Validate** against the oracle with token-id equality. Exact match, or no promotion.
3. **Migrate offline workloads first** — corpus preparation, retrieval indexing, batch prefill. Largest gain, smallest compatibility risk.
4. **Add the reuse ladder**: pretoken, tokenizer result, prompt prefix, retrieval chunk, verifier step, tool output, hidden state, KV block.
5. **Re-profile** and locate where the bottleneck *moved*. It should move to file I/O, Python orchestration, or prefill — that is success, not failure.
6. **Compound** token reuse into KV reuse through the state plane.
7. **Reinvest** the reclaimed latency budget in verifier passes and branch scoring rather than banking it.
8. **Interactive traffic last** — lowest relative gain, highest compatibility sensitivity.

### Known limits to plan around

Compatibility mode gives back part of the speedup; SentencePiece paths are less optimised than the common BPE families; WordPiece is unsupported on the fast path; Windows is less tested than Linux and WSL; Python ABI overhead still dominates in overhead-bound cases. These are constraints to design around, not surprises to discover in production.

## Usage

```bash
python tools/a11oy_frontier.py init                    # scaffold synthetic corpora
python tools/a11oy_frontier.py inventory               # tier the estate
python tools/a11oy_frontier.py bench                   # measure ingress engines
python tools/a11oy_frontier.py audit                   # bottleneck-shift analysis
python tools/a11oy_frontier.py ouroboros --depth 4     # bounded prefix-fold loop
python tools/a11oy_frontier.py verify                  # re-verify the receipt chain
python tools/a11oy_frontier.py all                     # full sweep, honest labels

python tools/test_a11oy_frontier.py                    # self-test the guard
```

Set `A11OY_ROOT` to place `datasets/` and `output/` outside the repo tree. Outputs: `frontier_report.md`, `receipts.jsonl` (chained), `benchmark_results.csv`, `audit_findings.csv`, `estate_inventory.csv`, `ouroboros_folds.csv`.

The tool has zero hard dependencies. Every ingress engine is optional; a missing engine produces an `UNAVAILABLE` receipt instead of a traceback.

## CI gate

[`frontier-chain-verify`](../.github/workflows/frontier-chain-verify.yml) runs four gates on any change to the tool, its test, this document, or the workflow:

1. **Self-test the guard** — the full invariant suite, offline, with no ingress engine installed.
2. **Real sweep** — run the tool with one real engine, then re-verify its own ledger and assert at least one `MEASURED` receipt exists under the expected kernel.
3. **Negative control** — inject an overclaim into a receipt body and require verification to fail. A verifier never observed failing is not a verifier; if tampering stops turning this red, the gate is inert even when everything else is green.
4. **Egress guard** — grep published output for private address space and internal hostnames.

## Next

- Land the Alloy Token Plane service surface: oracle-compatible endpoint, native bulk endpoint, benchmark endpoint, validation endpoint, capability registry, per-model routing.
- Attach the energy meter so ingress can report joules per gigabyte alongside decode joules per token, replacing the current `UNAVAILABLE` label with a measured one.
- Wire receipt emission into the unified receipt ledger so ingress receipts share one sink with the rest of the estate.
- Publish a first measured benchmark table here, sourced only from verified receipts.

## See also

- [`docs/A11OY_PROOF_DOCTRINE.md`](./A11OY_PROOF_DOCTRINE.md) — proof and evidence boundary
- [`docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`](./A11OY_PUBLIC_CLAIMS_DOCTRINE.md) — what may be claimed publicly
- [`tools/a11oy_frontier.py`](../tools/a11oy_frontier.py) — the payload
- [`tools/test_a11oy_frontier.py`](../tools/test_a11oy_frontier.py) — the self-test
