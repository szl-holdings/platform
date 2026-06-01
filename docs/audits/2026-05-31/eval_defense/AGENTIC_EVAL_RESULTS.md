# AGENTIC EVAL RESULTS — a11oy.code

**Author:** Yachay (Evaluation + Defense agent, SZL Holdings)
**Date:** 2026-06-01
**Scope:** Run a11oy.code (via the documented `/v1/router` cortex) across public agentic + knowledge eval suites; report honest scores with sample size and comparison to published leaders.
**Spend cap:** $100 total across all suites. **Actual spend: $0.00** (see §1 — no inference was executable).

---

## TL;DR — honest headline

**No model scores were produced this run.** The a11oy.code inference backend is **not running** at the time of this evaluation, and this agent has **no admin API key** to issue a request key. We therefore have **zero fabricated numbers**. What we *do* deliver:

1. A **real, runnable eval harness** (`harness/run_eval.py`) wired to the documented a11oy.code OpenAI-compatible endpoint with a per-suite USD spend cap and per-suite graders (MMLU exact-match, HumanEval execute-the-unit-test). It was executed and **correctly pulled live MMLU rows from Hugging Face** before failing honestly at the inference call.
2. A **dataset reachability report** (`harness/dataset_probe_report.json`) showing which of the 9 requested suites are actually loadable today.
3. An **endpoint probe log** (`harness/endpoint_probe_log.json`) documenting the exact HTTP responses that prove the backend is down.
4. A **published-leader comparison table** so that the moment a key + a live backend exist, scores drop straight into the comparison column.

This is the Zero-Bandaid Law in practice: **real or honest-skipped, never invented.**

---

## 1. Why no scores: the inference path is not live

The PURIQ charter and `puriq/llms/A11OY_CODE_ROUTER_SPEC.md` define a single cognition entrypoint, `POST /v1/router`, backed by an OpenAI-compatible `/api/a11oy/code/v1/chat/completions`. We probed both. Captured verbatim (`harness/endpoint_probe_log.json`):

| Method | Path | HTTP | Body |
|---|---|---|---|
| GET | `/v1/router` | 200 | static SPA HTML (`<title>A11oy — Brand Orchestration Layer</title>`) — **not** an inference endpoint |
| POST | `/v1/router` | 405 | `{"detail":"Method Not Allowed"}` |
| POST | `/v1/chat/completions` | 405 | `{"detail":"Method Not Allowed"}` |
| POST | `/api/a11oy/code/v1/chat/completions` | 401 | `{"detail":"Invalid or missing API key. Issue one via /v1/keys (admin)."}` |
| GET | `/api/a11oy/code/v1/models` | 503 | `{"error":"backend unavailable","hint":"Node serve on :8081 is not running"}` |
| GET | `/api/a11oy/code/health` | 503 | `{"error":"backend unavailable","hint":"Node serve on :8081 is not running"}` |
| POST | `/api/a11oy/code/v1/keys` | 403 | `{"detail":"admin key required (set A11OY_CODE_ADMIN_KEY)."}` |

**Conclusion:** the inference worker (`Node serve on :8081`) is **down**. The published `/v1/router` URL currently serves the brand/orchestration single-page app, not a router API. Key issuance requires `A11OY_CODE_ADMIN_KEY`, which this agent does not hold. There is **no path to real inference** in this session, so per the hard rules we **skip scoring honestly** rather than cherry-pick or invent numbers.

We also have **no third-party API keys** in the environment (OpenAI / Anthropic / Google / Together / DeepInfra / Groq / Fireworks all absent), so a substitute "frontier model as stand-in" run is also not available.

### To make this run produce real numbers (operator checklist)
1. Start the a11oy.code Node inference worker on `:8081` (so `/api/a11oy/code/health` → 200).
2. Set `A11OY_CODE_ADMIN_KEY` on the Space; issue a request key via `POST /v1/keys`.
3. ```bash
   export A11OY_BASE=https://szlholdings-a11oy.hf.space
   export A11OY_KEY=sk-...          # issued key
   export HF_HOME=/some/large/cache HF_TOKEN=hf_...   # for gated sets
   python3 harness/run_eval.py --suite mmlu      --n 100 --budget 20
   python3 harness/run_eval.py --suite humaneval --n 100 --budget 20
   ```
4. Paste the JSON output into the **a11oy.code** column of §3.

---

## 2. Dataset reachability (what we can actually load today)

Probed via the `datasets` library (`harness/probe_datasets.py`), unauthenticated (no HF token in env). Verbatim result in `harness/dataset_probe_report.json`:

| Suite (requested) | Repo tried | Status | Note |
|---|---|---|---|
| **MMLU** | `cais/mmlu` (`all/test`) | ✅ REACHABLE | fields `question, subject, choices, answer` — grader ready |
| **HumanEval** | `openai/openai_humaneval` (`test`) | ✅ REACHABLE | fields `task_id, prompt, canonical_solution, test, entry_point` — execute-test grader ready |
| **SWE-bench Verified** | `princeton-nlp/SWE-bench_Verified` (`test`) | ✅ REACHABLE | data loads; **scoring needs the SWE-bench-docker patch+test harness**, not just chat completion |
| **GPQA** | `Idavidrein/gpqa` (`gpqa_diamond`) | 🔒 GATED | "gated dataset … you must be authenticated"; needs `HF_TOKEN` with granted access |
| **GAIA** | `gaia-benchmark/GAIA`, `HuggingFaceH4/GAIA` | 🔒/❌ | gated/relocated; canonical repo `gaia-benchmark/GAIA` is gated + requires auth |
| **tau-bench** | `sierra-research/tau-bench` | ❌ NOT A HF DATASET | it is a **GitHub eval framework** (`pip install` + simulated user env), not a `load_dataset` target |
| **AgentBench** | `THUDM/AgentBench` | ❌ NOT A HF DATASET | GitHub framework with 8 interactive environments (Docker), not a HF dataset |
| **MLE-bench** | `mle-bench/mle-bench` | ❌ NOT A HF DATASET | OpenAI MLE-bench is a **GitHub repo of Kaggle tasks** run in Docker; no HF dataset |

**Honest implication:** even with a live backend, three of the nine (tau-bench, AgentBench, MLE-bench) require standing up their **interactive Docker environments** — they cannot be run as a simple dataset→chat loop. Two more (GPQA, GAIA) require a granted HF token. Only **MMLU and HumanEval** are runnable end-to-end with the current harness the moment inference is live; **SWE-bench Verified** needs its containerized patch-apply+test runner.

---

## 3. Comparison table — published leaders (sourced) vs. a11oy.code (pending)

a11oy.code column is intentionally blank — we will not invent it. Published-leader figures are cited.

| Benchmark | Metric | Published leader (model, score) | a11oy.code (this run) | Sample size run |
|---|---|---|---|---|
| **SWE-bench Verified** | % resolved | 93.9% — Claude "Mythos Preview"; top **open** model DeepSeek-V4-Pro-Max 80.6% ([LLM-Stats](https://llm-stats.com/benchmarks/swe-bench-verified)); 65% mini-SWE-agent reference ([SWE-bench.com](https://www.swebench.com)) | — not run (backend down) | 0 |
| **τ-bench (Airline)** | Pass^1 | 70.0% — Claude Sonnet 4.5 ([LLM-Stats τ-bench Airline](https://llm-stats.com/benchmarks/tau-bench-airline)); 46.0% Claude-3.5-Sonnet reference on GitHub leaderboard ([sierra-research/tau-bench](https://github.com/sierra-research/tau-bench)) | — not run | 0 |
| **τ-bench (Retail)** | Pass^1 | 69.2% — Claude-3.5-Sonnet ([sierra-research/tau-bench](https://github.com/sierra-research/tau-bench)) | — not run | 0 |
| **τ-bench (aggregate)** | score | 88.2% — Step-3.5-Flash (StepFun, top open) ([LLM-Stats τ-bench](https://llm-stats.com/benchmarks/tau-bench)) | — not run | 0 |
| **GAIA** | accuracy | 74.55% — HAL Generalist Agent + Claude Sonnet 4.5 ([Princeton HAL GAIA](https://hal.cs.princeton.edu/gaia)); 65% h2oGPTe ([H2O.ai](https://h2o.ai/blog/2024/h2o-ai-tops-gaia-leaderboard/)) | — not run (gated) | 0 |
| **AgentBench** | overall | THUDM framework; top scores model-specific, Docker-env required ([THUDM/AgentBench](https://github.com/THUDM/AgentBench)) | — not run (Docker env) | 0 |
| **MLE-bench** | medal rate | OpenAI MLE-bench, 75 Kaggle tasks, Docker required ([OpenAI MLE-bench](https://github.com/openai/mle-bench)) | — not run (Docker env) | 0 |
| **MMLU** | accuracy | frontier ~88–92% (5-shot) range, model-dependent | — **harness ready**, not run (backend down) | 0 of intended 100 |
| **GPQA (Diamond)** | accuracy | frontier ~50–60%+ range, model-dependent | — not run (gated) | 0 |
| **HumanEval** | pass@1 | frontier 90%+ range, model-dependent | — **harness ready**, not run (backend down) | 0 of intended 100 |

> Note on the SWE-bench Verified leader name: LLM-Stats lists a "Claude Mythos Preview" at 93.9%; we report the source's number verbatim and flag that this is a self-reported leaderboard (0 verified / 92 self-reported entries per the source).

---

## 4. Files produced

| File | Purpose |
|---|---|
| `harness/run_eval.py` | Runnable harness: a11oy.code endpoint client + spend cap + MMLU & HumanEval graders |
| `harness/probe_datasets.py` | Dataset reachability prober |
| `harness/dataset_probe_report.json` | Which suites load today (verbatim) |
| `harness/endpoint_probe_log.json` | HTTP evidence the backend is down (verbatim) |

---

## 5. Honest verdict

We cannot "brag with numbers" yet, because **there are no numbers to brag with** — the cortex is offline and we refuse to fabricate. The asset we ship is a **defensible, reproducible measurement pipeline** plus a **transparent inventory of exactly what stands between us and a real scoreboard** (start the worker, issue a key, get an HF token for gated sets, stand up three Docker eval envs). The day those four conditions are met, this document becomes a real leaderboard with one command per suite.

— Yachay
