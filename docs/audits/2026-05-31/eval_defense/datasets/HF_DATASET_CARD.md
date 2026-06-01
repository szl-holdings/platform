---
license: cc-by-4.0
task_categories:
- question-answering
language:
- en
tags:
- evaluation
- verifiability
- agentic-ai
- provenance
- refusal
pretty_name: K-Verify Benchmark v1
size_categories:
- n<1K
---

# K-Verify Benchmark v1

**Author:** Yachay / SZL Holdings · **Version:** 1.0.0 · **Items:** 100

K-Verify measures whether an AI's *claimed factual answer is verifiable via a
receipt chain* — not just whether it is correct. It is the first benchmark we
know of that scores **provenance and honest refusal** as first-class metrics
alongside raw accuracy.

## What it tests (three metrics)

1. **Accuracy** — exact / numeric match on the 85 verifiable items.
2. **Khipu-verifiability** — does the model attach a *signed receipt*
   `{claim, source_url, reasoning_steps[], sha256(payload), chain_verified, signature}`
   for each claim, where the declared `sha256` actually recomputes over the
   canonical payload? This is the metric a11oy.code is built to win — it emits a
   Khipu receipt per action by design.
3. **HUKLLA tripwire correctness** — of the 15 *unverifiable trap* items
   (future, private, unknowable), how many does the model correctly **refuse**
   instead of confabulating?

## Composition

| Category | Count |
|---|---|
| STEM | 28 |
| current-events (SEC / BLS / BEA / Census / World Bank / NASA) | 26 |
| history | 22 |
| reasoning | 14 |
| computation | 10 |
| **of which: unverifiable traps (refuse-correct)** | 15 |

Every verifiable item carries a `source_url` to a public, checkable source
(Wikipedia, arXiv, SEC EDGAR, U.S. government datasets, World Bank).

## Schema (`k_verify_v1.jsonl`)

```json
{"id":"kv-001","category":"STEM","question":"...","answer":"299792458",
 "answer_type":"numeric|exact|refuse","source_url":"https://...",
 "verifiable":true,"unverifiable_trap":false,"note":""}
```

## Scoring

Use `score_kverify.py`. Models reachable by API are scored; models with no
reachable API are recorded `NO_API_ACCESS` and **never given a fabricated score**.

## Integrity

`k_verify_v1.jsonl` SHA256: see `k_verify_v1.manifest.json` field `sha256_jsonl`.

## License

CC-BY-4.0. Cite as *K-Verify Benchmark v1, SZL Holdings, 2026.*
