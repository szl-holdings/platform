# K-VERIFY RESULTS — SZL's own verifiability benchmark

**Author:** Yachay (Evaluation + Defense agent, SZL Holdings)
**Date:** 2026-06-01
**Benchmark:** K-Verify v1 — *measures whether an AI's claimed factual answer is verifiable via a Khipu receipt chain.*
**Dataset (LIVE on HF):** [`SZLHOLDINGS/k-verify-benchmark-v1`](https://huggingface.co/datasets/SZLHOLDINGS/k-verify-benchmark-v1)
**Dataset SHA256 (`k_verify_v1.jsonl`, 100 items, 29,125 bytes):** `dc0a12efd873f6b9174e9c247c9fe5158b21a681514dc79637edafb198412915` — **verified on the Hub** (downloaded back; hash matches).

---

## 1. What K-Verify is (and why we OWN it)

Existing benchmarks score *correctness*. K-Verify scores **provability**: can the model
back each claim with a *signed Khipu receipt* — `{claim, source_url, reasoning_steps[],
sha256(payload), chain_verified, signature}` — and does it **refuse** when no ground
truth exists? This is the axis a11oy.code is architecturally built to win, because the
PURIQ master formula requires `∏_i Khipu_i(a)` (every action emits a chain-verified
receipt) and HUKLLA T01 halts on receipt-chain breaks.

### Three metrics
| Metric | Definition |
|---|---|
| **(a) Accuracy** | exact / numeric match on the 85 verifiable items |
| **(b) Khipu-verifiability** | fraction of answers shipping a receipt whose declared `sha256` *actually recomputes* over the canonical payload AND carries a `source_url` + `reasoning_steps` + `chain_verified=true` |
| **(c) HUKLLA tripwire correctness** | fraction of the 15 *unverifiable trap* items the model correctly **refuses** instead of confabulating |

### Composition (100 items)
| Category | Count | Sources |
|---|---|---|
| STEM | 28 | Wikipedia, arXiv (1706.03762), Nature (AlphaFold) |
| current-events | 26 | SEC EDGAR (CIK-linked), BLS, BEA, Census, World Bank, NASA GISS, EIA, FRED |
| history | 22 | Wikipedia |
| reasoning | 14 | Wikipedia (CRT, logic) |
| computation | 10 | Wikipedia (arithmetic) |
| **— of which unverifiable traps** | **15** | "NO PUBLIC GROUND TRUTH" — refuse-correct |

Every verifiable item carries a public, checkable `source_url`. The 15 traps are
future/private/unknowable questions an honest agent must decline.

---

## 2. Harness self-test (proves the scorer works)

Before any model run, we validated the scorer (`datasets/score_kverify.py`) against a
**synthetic answer set that ships correct Khipu receipts** (`SELFTEST_a11oy_receipts.json`).
This is explicitly a *verifier unit test*, **not a model score**:

```json
{ "model": "SELFTEST_a11oy_receipts", "status": "RUN",
  "n_verifiable": 85, "n_traps": 15,
  "accuracy": 1.0, "khipu_verifiability": 1.0, "hukla_tripwire_correct": 1.0 }
```

This confirms: (1) numeric+exact matching works; (2) the receipt verifier recomputes
sha256 over the canonical payload and rejects receipts that don't hash-match; (3) trap
refusals are scored. The scorer **refuses to grade** any model with no reachable API,
recording `NO_API_ACCESS` instead of a number.

---

## 3. Model comparison — HONEST STATUS

The task asked to compare a11oy.code router, GPT-4o, Claude Sonnet 4.5, Gemini 2.5 Pro,
Llama 3.3 70B (Together), Qwen 3 32B (DeepInfra). **We have API access to none of them in
this environment**, and the a11oy.code inference backend is **down** (see
`AGENTIC_EVAL_RESULTS.md §1`: `/api/a11oy/code/health` → 503 "Node serve on :8081 is not
running"; key issuance requires an admin key we lack). Per the hard rules, **every model
is recorded honestly — no fabricated scores.**

| Model | Route | Accuracy | Khipu-verifiability | HUKLLA tripwire | Status |
|---|---|---|---|---|---|
| **a11oy.code (router, default)** | `/api/a11oy/code/v1/chat/completions` | — | — | — | **NO API ACCESS** — backend down (503), no admin key |
| GPT-4o | OpenAI API | — | — | — | **NO API ACCESS** — no `OPENAI_API_KEY` in env; comparison skipped |
| Claude Sonnet 4.5 | Anthropic API | — | — | — | **NO API ACCESS** — no `ANTHROPIC_API_KEY`; skipped |
| Gemini 2.5 Pro | Google API | — | — | — | **NO API ACCESS** — no Google key; skipped |
| Llama 3.3 70B | Together | — | — | — | **NO API ACCESS** — no `TOGETHER_API_KEY`; skipped |
| Qwen 3 32B | DeepInfra | — | — | — | **NO API ACCESS** — no `DEEPINFRA_API_KEY`; skipped |

> We will not invent a "win." The honest claim today is **architectural, not empirical**:
> a11oy.code is the only system in this list that *emits a signed Khipu receipt per action
> by construction*, so on metric (b) it is the only candidate that can structurally score
> > 0 without bolt-on prompting. GPT-4o / Claude / Gemini / Llama / Qwen can be *prompted*
> to emit a receipt JSON, but none verify the sha256 chain or halt on T01 break natively —
> that is the moat. **The empirical number proving it must wait for live inference.**

### Expected outcome statement (hypothesis, not a result)
On metric (b) Khipu-verifiability we expect a11oy.code to lead, because receipts are
native. On metric (a) raw accuracy we make **no claim** — open-weight routing may trail
frontier closed models on hard STEM/reasoning, and **if it does, we will report that
honestly** and frame the tradeoff: a11oy.code trades a few accuracy points for *provable,
signed, refusable* answers — which is the entire point of K-Verify.

---

## 4. To produce real K-Verify scores (operator checklist)

```bash
# 1. Bring a11oy.code inference up; issue a key (admin).
export A11OY_BASE=https://szlholdings-a11oy.hf.space A11OY_KEY=sk-...
# 2. For comparison models, set whichever keys exist:
export OPENAI_API_KEY=... ANTHROPIC_API_KEY=... GOOGLE_API_KEY=... \
       TOGETHER_API_KEY=... DEEPINFRA_API_KEY=...
# 3. Generate answers per model into model_answers/<model>.json (schema in score_kverify.py)
# 4. Score:
python3 datasets/score_kverify.py model_answers/*.json
```
Any model without a key is auto-recorded `NO_API_ACCESS`. Scores drop into §3.

---

## 5. Files

| File | What |
|---|---|
| `datasets/build_kverify.py` | Deterministic dataset builder (100 items, 15 traps) |
| `datasets/k_verify_v1.jsonl` | The benchmark (also on HF, SHA verified) |
| `datasets/k_verify_v1.manifest.json` | Counts + SHA256 |
| `datasets/score_kverify.py` | 3-metric scorer + sha256 receipt verifier + NO_API_ACCESS guard |
| `datasets/SELFTEST_a11oy_receipts.json` | Verifier unit-test input (not a model score) |
| `datasets/HF_DATASET_CARD.md` | HF dataset card |

**HF commits:**
- dataset: [`a0b5f9b`](https://huggingface.co/datasets/SZLHOLDINGS/k-verify-benchmark-v1/commit/a0b5f9b59ae00c9d09bfc4f19be6d45fe6ccad9d)
- card: [`567abf9`](https://huggingface.co/datasets/SZLHOLDINGS/k-verify-benchmark-v1/commit/567abf9c757799766625d82a058a8dcba32662bf)
- manifest: [`f4b6e4d`](https://huggingface.co/datasets/SZLHOLDINGS/k-verify-benchmark-v1/commit/f4b6e4df7b35e9fd1c233c08b1e75ccadd63c42e)

---

## 6. Honest verdict

**The benchmark is real, owned, and live** — 100 sourced questions, 15 honest-refusal
traps, a working sha256-receipt scorer, pushed to `SZLHOLDINGS/k-verify-benchmark-v1`
with a Hub-verified hash. **The model leaderboard is empty on purpose**: no inference is
reachable today, and we refuse to manufacture a victory. K-Verify is the asset; the
scoreboard fills the moment a key + a live backend exist.

— Yachay
