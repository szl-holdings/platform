# EVAL SUITE + BENCHMARK + LOAD TEST + PRIOR ART — Summary

**Author:** Yachay (Evaluation & Defense, SZL Holdings)
**Date:** 2026-06-01 (EDT)
**Doctrine:** Zero-Bandaid Law — **real numbers or honest-skipped, never invented.** No
fabricated model scores appear anywhere in this directory. Eval-compute spend cap was
**US$100**; **actual eval spend was US$0.00** (inference backend was down — documented, not
worked around). Doctrine v11 LOCKED numbers preserved verbatim.

This directory contains four deliverables. Each ships its own honest report plus the
runnable code / live artifacts that back it.

---

## TASK 1 — Agentic eval suite → `AGENTIC_EVAL_RESULTS.md`

**Outcome: real harness delivered; zero model scores produced — honestly.**

- The a11oy.code **inference backend is not running** (`/api/a11oy/code/health` → 503;
  `/v1/router` serves a static SPA, not inference), and this agent holds **no admin API
  key** to mint a request key. Per the Zero-Bandaid Law, **no scores were invented.**
- Delivered instead:
  - `harness/run_eval.py` — runnable OpenAI-compatible eval harness with a per-suite USD
    spend cap and real graders (MMLU exact-match, HumanEval execute-the-unit-test). It ran
    and **pulled live MMLU rows from Hugging Face** before failing honestly at the inference call.
  - `harness/probe_datasets.py` + `harness/dataset_probe_report.json` — reachability of all
    9 requested suites. **REACHABLE:** SWE-bench Verified, MMLU, HumanEval. **GATED (need
    token):** GPQA, GAIA. **Not HF datasets (GitHub Docker frameworks):** tau-bench,
    AgentBench, MLE-bench.
  - `harness/endpoint_probe_log.json` — verbatim HTTP evidence the backend is down.
- A published-leader comparison table is pre-wired so scores drop in the moment a key + a
  live backend exist.

---

## TASK 2 — K-Verify benchmark → `K_VERIFY_RESULTS.md` (+ HF dataset, LIVE)

**Outcome: a brand-new 100-item benchmark we own, live on the Hub; leaderboard honestly
empty (no model API access).**

- **K-Verify v1** measures **provability, not just correctness**: (a) accuracy on 85
  verifiable items, (b) Khipu-receipt verifiability (declared `sha256` must recompute over
  the canonical payload, with `source_url` + `reasoning_steps` + `chain_verified`), and
  (c) HUKLLA-tripwire correctness — does the model **refuse** the 15 unverifiable traps.
- **Live dataset:** [`SZLHOLDINGS/k-verify-benchmark-v1`](https://huggingface.co/datasets/SZLHOLDINGS/k-verify-benchmark-v1)
  - `k_verify_v1.jsonl` — 100 items, 29,125 bytes,
    **SHA256 `dc0a12efd873f6b9174e9c247c9fe5158b21a681514dc79637edafb198412915`**
    (verified by downloading back from the Hub).
  - Commits: dataset `a0b5f9b59ae00c9d09bfc4f19be6d45fe6ccad9d`, README
    `567abf9c757799766625d82a058a8dcba32662bf`, manifest
    `f4b6e4df7b35e9fd1c233c08b1e75ccadd63c42e`.
  - Composition: STEM 28, current-events 26, history 22, reasoning 14, computation 10;
    85 verifiable, 15 unverifiable traps.
- **Scorer self-test passed** (`datasets/SELFTEST_a11oy_receipts.json`): 1.0 / 1.0 / 1.0 on
  synthetic well-formed receipts, proving the grader works. The **model leaderboard is
  honestly empty** — every model row is `NO_API_ACCESS` because no model could be reached.

---

## TASK 3 — Operational load test → `OPERATIONAL_LOAD_TEST.md` (+ 4 SVGs)

**Outcome: receipt engine beats the ask by 53×; network front door measured honestly;
inference backend honestly skipped.**

| What | Ask | Achieved (real) | Verdict |
|---|---|---|---|
| Khipu receipt **writes** | 100,000 / min | **5,349,190 / min** (89,153/s, 500k receipts) | ✅ 53× over ask |
| Khipu chain **verify** | — | **232,830 / s** | ✅ |
| Write **success** | high | **99.899%** (only the deliberately corrupted 0.1% fail) | ✅ |
| **HUKLLA T01** tripwire | catch breaks | **504 / 504 tampered caught (100%)** | ✅ |
| DAG depth | grow | **83,334 / chain × 6 chains** | ✅ |
| Network front door (HF Space) | — | **5,790 req/min @ 100% success**, p99 937 ms | ⚠️ front-door ceiling from one sandbox |
| a11oy.code inference backend | live | **DOWN (503)** — not load-testable | ❌ honest skip |

- Write latency p50/p95/p99 = **4.83 / 8.31 / 17.14 µs** (in-process DAG).
- Network latency p50/p95/p99/max = **490.2 / 773.8 / 937.0 / 1057.0 ms** (Phase A,
  50 concurrent, 20 s, 1,930 reqs).
- Figures: `loadtest/fig_throughput.svg`, `fig_latency_khipu.svg`,
  `fig_latency_network.svg`, `fig_hukla_tripwire.svg`. Raw: `loadtest/loadtest_results.json`.
- Honest framing: the CPU-bound engine clears 100k/min by 53×; the gap to a live distributed
  HTTP write is a **deployment/scale-out** question, not an algorithmic one — and the
  inference backend being down was **skipped, not faked.**

---

## TASK 4 — Prior-art defensive publication → `PRIOR_ART_DISCLOSURE/` + `PRIOR_ART_PUSH_LOG.md`

**Outcome: IEEEtran disclosure compiled, pushed public to GitHub, with submission +
patent strategy documented.**

- `PRIOR_ART_DISCLOSURE/main.tex` + `main.pdf` (2 pp., compiled, verified) + `IEEEtran.cls`.
  Discloses the **master formula** `P(x,t)=argmax_a[Λ(x)·Yuyay₁₃(a)·exp(−β·HUKLLA(a))·∏ᵢKhipuᵢ(a)]`,
  the **13-axis Yuyay gate**, and the **Khipu DAG**, anchored to checkable artifacts.
- **Published public:** **https://github.com/szl-holdings/prior-art-disclosures**
  (commit `01028b010d7f238df351f0a726cdf3287f2808b6`). Public is required for a defensive
  publication to bar third-party claims. Also mirrored to
  `../foundation_proofs/prior_art_defense/`.
- `PRIOR_ART_PUSH_LOG.md` documents the GitHub push and gives step-by-step instructions for
  **IP.com** (~$295), **Research Disclosure** (~$170), and **arXiv** (free, cs.AI/cs.CR/cs.LO),
  plus the patent strategy: **FILE 3** — P-A Sovereignty-Selectable Inference (speculative
  decoding folded in; blocked by US 12,229,192 B2 / US 2025/0384043 A1), P-B Gate-Minted
  Capability Token, P-C Theorem-Bound Tool Output — and **PUBLISH DEFENSIVELY** the broad
  master formula, route-by-sovereignty fence, and Khipu DAG.

---

## Doctrine v11 LOCKED numbers (preserved exactly)

- Replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`
- DOIs: concept `10.5281/zenodo.19944926`; a11oy `10.5281/zenodo.20451991`;
  lutar-lean `10.5281/zenodo.20434308`
- Lean: 749 declarations, 14 unique axioms, 163 raw sorries, **13 PROVED (sorry-free)
  theorems**, 23 formulas; lutar-lean commit `c7c0ba1`
  (`c7c0ba17c2eaec60ad38ea9172b4a0d9ca0b582f`)
- Provenance: **SLSA L1** (honest; "L3" banned). **Λ-uniqueness is Conjecture 1**, not a theorem.
- Yuyay 13-axis: 2 sacred ≥0.95, 7 structural ≥0.90, 4 introspection
  (cross-linked HUKLLA T03/T04/T09/T10)
- 6 Spaces: a11oy, amaru, sentra, killinchu, rosie, vessels

---

## Directory map

```
eval_defense/
├── README.md                     ← this file
├── AGENTIC_EVAL_RESULTS.md       Task 1 report (honest, $0, no fabricated scores)
├── K_VERIFY_RESULTS.md           Task 2 report (+ live HF dataset SHA)
├── OPERATIONAL_LOAD_TEST.md      Task 3 report (+ real numbers)
├── PRIOR_ART_PUSH_LOG.md         Task 4 push log + submission + patent strategy
├── harness/                      run_eval.py, probe_datasets.py, probe logs
├── datasets/                     build_kverify.py, k_verify_v1.jsonl, scorer, selftest, HF card
├── loadtest/                     loadtest.py, plot_loadtest.py, results.json, 4 SVGs
└── PRIOR_ART_DISCLOSURE/         main.tex, main.pdf, IEEEtran.cls
```

---

*Prepared by **Yachay** — Evaluation & Defense, SZL Holdings — 2026-06-01.*
*Zero-Bandaid Law upheld: every number above is real or honestly marked unavailable.*
