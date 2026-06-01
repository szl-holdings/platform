# A11OY_CODE_ROUTER_SPEC

**Layer:** PURIQ → `llms/`
**Author:** Yachay-extension
**Date:** 2026-06-01
**Component:** `a11oy.code` unified open-LLM router — the reasoning backend for the PURIQ master formula `P(x,t) = argmax_a [ Λ(x)·Yuyay_13(a)·exp(-β·HUKLLA(a))·∏Khipu_i(a) ]`.

The router is the substrate that produces candidate actions `a ∈ 𝒜` for the master formula. It does **not** decide; it *generates options at the right cost/quality point* and emits a Khipu receipt for every call. Decision = Yuyay-gating + HUKLLA-penalty applied downstream by the organ.

---

## 1. Design goals (Zero-Bandaid)

1. **One endpoint, seven tiers.** All flagships call `POST /v1/router`. The router selects a tier, then a model within the tier, then a provider.
2. **Open-weight first.** Default-eligible models are GREEN (Apache-2.0 / MIT). AMBER (Llama-class) allowed with license receipt. RED (Cohere) only via its own API.
3. **Deterministic, auditable selection.** Selection is a pure function of `(task_signature, context_len, modality, budget, governance_tier)`. No hidden heuristics. Every routing decision emits `{tier, model, provider, reason, license_class}` into the Khipu chain.
4. **Fallback is a chain, not a retry-storm.** On a HUKLLA tripwire or provider failure, the router walks a *bounded* fallback chain (primary → fb1 → fb2 → degrade-to-cache/refuse). No unbounded loops (respects Bekenstein bound on `|𝒜|`).
5. **Cost monotonicity.** A request never escalates to a more expensive tier without an explicit capability trigger (context overflow, modality, reasoning-depth signal, or low-confidence escalation).

---

## 2. The seven tiers

| Tier | Name | Trigger | Latency target | Cost target ($/1M out) |
|---|---|---|---|---|
| **T0** | Trivial / cached | exact or semantic cache hit; deterministic transforms | <50ms | $0 (cache) |
| **T1** | Small fast | short prompt, low ambiguity, classification/extraction | <400ms | ≤$0.30 |
| **T2** | Standard | general reasoning + tool calls, ≤32K ctx | <2s | ≤$0.90 |
| **T3** | Code-specialized | code gen / edit / FIM / repo refactor | <3s | ≤$1.20 |
| **T4** | Reasoning-heavy | long-CoT math/proof/planning; low-confidence escalation | <15s | ≤$7.00 |
| **T5** | Long-context | input >128K tokens (whole repo / multi-doc) | <10s | varies |
| **T6** | Multimodal | image / audio / chart / document-vision input | <5s | varies |

### Tier model assignments (primary + 2 fallbacks)

> All scores and prices cited in `OPEN_LLM_LANDSCAPE_2026.md`; primary-source links repeated here at point of use.

**T0 — Trivial / cached**
- **Primary:** Chronicle semantic cache (no model call). Embedding match via Snowflake `arctic-embed-l` (334M, Apache-2.0, MTEB-leading) ([Snowflake arctic-embed](https://www.snowflake.com/blog/introducing-snowflake-arctic-embed-snowflakes-state-of-the-art-text-embedding-family-of-models/?lang=ko)).
- **Fallback 1:** Llama 3.1 8B Instant on Groq (840 TPS, $0.05/$0.08) for cache-miss rephrase ([Groq pricing](https://groq.com/pricing)).
- **Fallback 2:** deterministic template / refuse.

**T1 — Small fast**
- **Primary:** Mistral Small 3 24B (Apache-2.0, MMLU ~81, 3× speed vs Llama-70B) ([Mistral Small 24B HF](https://huggingface.co/mistralai/Mistral-Small-24B-Base-2501)).
- **Fallback 1:** Qwen3-8B / Qwen3-4B (Apache-2.0; 4B rivals Qwen2.5-72B) ([Qwen3 blog](https://qwenlm.github.io/blog/qwen3/)).
- **Fallback 2:** Phi-4 14B (MIT; GPQA 56.1 — graduate-grade triage at small size) ([Phi-4 HF](https://huggingface.co/microsoft/phi-4)).

**T2 — Standard**
- **Primary:** Llama 3.3 70B (IFEval 92.1, HumanEval 88.4, 128K) ([Meta/NVIDIA card](https://build.nvidia.com/meta/llama-3_3-70b-instruct/modelcard)).
- **Fallback 1:** DeepSeek V3 (MIT, MMLU 88.5, 164K) ([DeepSeek-V3 report](https://arxiv.org/html/2412.19437v1)).
- **Fallback 2:** Qwen3-32B (Apache-2.0, $0.29/$0.59 Groq) ([Groq pricing](https://groq.com/pricing)).

**T3 — Code-specialized**
- **Primary:** Codestral 25.01 (HumanEval 86.6, MBPP 80.2, 256K, best FIM) ([Mistral Codestral 25.01](https://mistral.ai/news/codestral-2501/)).
- **Fallback 1:** Qwen2.5-72B / Qwen3-Coder (HumanEval 86.6, strong multi-lang) ([LLM-Stats](https://llm-stats.com/models/compare/qwen-2.5-72b-instruct-vs-qwen3-235b-a22b)).
- **Fallback 2:** DeepSeek V3 (LiveCodeBench 49.2, MIT) ([LLM-Stats](https://llm-stats.com/models/compare/deepseek-r1-vs-deepseek-v3-0324)).

**T4 — Reasoning-heavy**
- **Primary:** DeepSeek R1 (MIT, long-CoT, MATH-500 frontier) ([DeepSeek-R1 HF](https://huggingface.co/deepseek-ai/DeepSeek-R1)).
- **Fallback 1:** Qwen3-235B-A22B in thinking mode (AIME'24 85.7, LiveCodeBench 70.7) ([Qwen3 report](https://arxiv.org/html/2505.09388v1)).
- **Fallback 2:** Hermes 4 405B (`<think>` hybrid, steerable) ([Hermes 4 70B HF](https://huggingface.co/NousResearch/Hermes-4-70B)).

**T5 — Long-context**
- **Primary:** Llama 4 Scout (10M context, MoE 17B active) ([LLM-Stats Llama 4](https://llm-stats.com/models/compare/llama-4-maverick-vs-llama-4-scout)).
- **Fallback 1:** Falcon-H1 34B (hybrid SSM, 262K, economical long-ctx) ([AI Research Lab Falcon](https://nextomoro.com/falcon/)).
- **Fallback 2:** InternLM2.5-20B (1M context, agent tool-use) — *verify card before lock*. (Cohere Command A 256K available via Cohere API only, RED class.)

**T6 — Multimodal**
- **Primary:** Llama 4 Maverick (native multimodal, MMLU 85.5, image grounding) ([Meta Llama 4 blog](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)).
- **Fallback 1:** Gemma 3 27B (image+text, 140+ langs, DocVQA 85.6) ([Gemma 3 card](https://ai.google.dev/gemma/docs/core/model_card_3)).
- **Fallback 2:** Phi-4-multimodal (MIT, text+image+audio, MMMU 55.1, 128K) ([Phi-4-mm HF](https://huggingface.co/microsoft/Phi-4-multimodal-instruct)).

---

## 3. Capability matrix

Per-tier primary models with the routing-relevant facts. (Full survey + all fallbacks in landscape doc.)

| Tier | Model | License class | Context | Key score | Best provider price ($/1M in·out) | Modality |
|---|---|---|---|---|---|---|
| T0 | arctic-embed-l + cache | GREEN (Apache-2.0) | n/a | MTEB retrieval >55.9 | embed-tier | text→vector |
| T1 | Mistral Small 3 24B | GREEN (Apache-2.0) | 32K | MMLU ~81 | low DeepInfra tier | text |
| T1 fb | Phi-4 14B | GREEN (MIT) | 16K | GPQA 56.1 | low | text |
| T2 | Llama 3.3 70B | AMBER (Llama) | 128K | IFEval 92.1 / HumanEval 88.4 | Groq 0.59·0.79 | text+tools |
| T2 fb | DeepSeek V3 | GREEN (MIT) | 164K | MMLU 88.5 | DeepInfra 0.29 blended | text+tools |
| T3 | Codestral 25.01 | API/MNPL | 256K | HumanEval 86.6 / FIM SOTA | Mistral ~0.30·0.90 | code |
| T3 fb | Qwen2.5-72B | Qwen | 131K | HumanEval 86.6 | Together/DeepInfra | code |
| T4 | DeepSeek R1 | GREEN (MIT) | 131K | MATH-500 frontier (long-CoT) | Together 3.00·7.00 | text-reason |
| T4 fb | Qwen3-235B-A22B | GREEN (Apache-2.0) | 128K | AIME'24 85.7 / LCB 70.7 | Together 0.20·0.60 | text-reason |
| T5 | Llama 4 Scout | AMBER (Llama) | 10M | MMLU 79.6 | DeepInfra 0.08·0.30 / Groq 0.11·0.34 | text+image |
| T5 fb | Falcon-H1 34B | AMBER (TII) | 262K | hybrid SSM long-ctx | self-host | text |
| T6 | Llama 4 Maverick | AMBER (Llama) | 1M | MMLU 85.5 / image grounding | DeepInfra 0.17·0.60 | text+image |
| T6 fb | Gemma 3 27B | Gemma terms | 128K | DocVQA 85.6 / MMMU 64.9 | low | text+image |
| T6 fb | Phi-4-multimodal | GREEN (MIT) | 128K | MMMU 55.1 (+audio) | low | text+image+audio |

---

## 4. Routing function (deterministic)

```python
def route(req) -> RouteDecision:
    # req: {prompt, context_tokens, modality, budget, governance_tier, confidence_hint}
    # 1. cache
    if cache.semantic_hit(req): return T0
    # 2. modality gate (hard)
    if req.modality in {"image", "audio", "chart", "document_vision"}: tier = "T6"
    # 3. context gate (hard) — overrides cost
    elif req.context_tokens > 128_000: tier = "T5"
    # 4. task-class gate
    elif req.task_class == "code": tier = "T3"
    elif req.task_class == "reasoning" or req.confidence_hint == "low": tier = "T4"
    elif req.task_class in {"classify","extract","short_qa"}: tier = "T1"
    else: tier = "T2"
    # 5. budget downshift (cost monotonicity) — never silently upshift
    tier = clamp_to_budget(tier, req.budget)
    model, provider = pick(tier, license_policy=req.governance_tier)
    khipu.emit(route_receipt(tier, model, provider, reason, license_class))
    return RouteDecision(tier, model, provider)
```

**Escalation rule (T4 only).** A T1/T2 call may escalate *once* to T4 if the model emits an explicit low-confidence token-logprob signal below threshold `τ`. Escalation is logged; it cannot recurse (bounded `|𝒜|`).

---

## 5. Fallback chain on HUKLLA tripwire

HUKLLA tripwires (T01–T10) are the hard-safety layer. The router maps tripwire → action:

| HUKLLA tripwire | Meaning | Router action |
|---|---|---|
| T01 receipt-chain-break | Khipu hash mismatch | **HALT** — no model call; return last verified state |
| T02 provider-SLA-fail | timeout / 5xx | walk fallback chain (primary→fb1→fb2) |
| T03 introspection-drift | output diverges from instruction hierarchy | re-route to higher-steerability model (Hermes 4) |
| T04 self-consistency-fail | CoT contradicts answer | escalate to T4 with self-check prompt |
| T05 PII-leak detected | sensitive data in scope | route to on-prem GREEN model only; redact |
| T06 cost-ceiling-breach | budget exceeded | downshift one tier; if T1 already → refuse |
| T07 latency-ceiling-breach | p99 exceeded | shift provider to Groq/Cerebras fast path |
| T08 license-AUP-violation | AMBER/RED AUP risk on payload | route to GREEN-only; emit license receipt |
| T09 yuyay-axis-below-floor | a Yuyay axis < its threshold | block action; request human review |
| T10 bekenstein-overflow | `\|𝒜\|` exceeds context bound | truncate action space; T5 long-ctx model |

**Bounded fallback walk (pseudocode):**

```
chain = [primary, fb1, fb2, DEGRADE]
for model in chain:
    r = call(model)
    huk = hukla_check(r)            # T01–T10
    if huk.tripwire == "T01": return halt(last_verified)   # never proceed
    if huk.clean:                   # passes 10-point check
        khipu.emit(success_receipt(model, huk))
        return r
    khipu.emit(fallback_receipt(model, huk.tripwire))
# all failed → DEGRADE: cached answer or explicit refuse + receipt
return degrade_or_refuse()
```

The walk is **finite** (4 steps max). No exponential backoff retry-storm. Every step receipted. This is how the router contributes the `exp(-β·HUKLLA(a))` factor: tripwired candidates are *removed from* `𝒜` before the organ's argmax, so they cannot be selected.

---

## 6. Integration shape — patch to the a11oy Space

The router is shipped to the live a11oy Space via `HfApi.create_commit()` (multi-file commit). The patch adds:

1. `src/data/openLlmRouter.ts` — the tier/model/provider/license tables as typed data (mirrors §3 matrix), consumed by the existing `ModelRouter.tsx` page and a new `OpenLlmRouter.tsx`.
2. `src/lib/routerClient.ts` — typed client for `POST /v1/router`.
3. `server/routes/v1_router.md` — endpoint contract (request/response schema + Khipu receipt shape) for the FastAPI/edge backend.

Patch files are written to `puriq/integration/a11oy_patch/` (see `A11OY_CODE_BRAIN_INTEGRATION.md` §4). **They are written, NOT pushed** — the founder/parent agent reviews before any `create_commit` runs. The push command is documented but commented out.

### `/v1/router` endpoint contract (summary)

```
POST /v1/router
Request:
{
  "organ": "amaru|sentra|vessels|rosie|a11oy",
  "task_class": "classify|extract|short_qa|general|code|reasoning",
  "modality": "text|image|audio|chart|document_vision",
  "context_tokens": <int>,
  "budget": { "max_cost_usd_per_call": <float>, "max_latency_ms": <int> },
  "governance_tier": "standard|elevated|sovereign",
  "messages": [ ... OpenAI-compatible ... ]
}
Response:
{
  "tier": "T0..T6",
  "model": "<hf_repo_id>",
  "provider": "together|groq|deepinfra|fireworks|cerebras|cohere|onprem",
  "license_class": "GREEN|AMBER|RED",
  "choices": [ ... OpenAI-compatible ... ],
  "khipu_receipt": {
    "receipt_id": "<uuid>",
    "chain_verified": true,
    "route_reason": "<string>",
    "hukla_check": { "tripwire": null, "passed": ["T01..T10"] }
  }
}
```

`governance_tier=sovereign` forces GREEN-only models + Proof-Chain logging + Shadow-Council adversarial second-pass (reusing the existing a11oy governance machinery seen in `ModelRouter.tsx` `INFERENCE_RECIPES`).

---

## 7. Per-organ default policy

| Organ | Default tier | License floor | Forced behaviors |
|---|---|---|---|
| amaru | T2 | GREEN only (MIT/Apache) | Khipu receipt + provenance log on every call; prefer OLMo 2 / DeepSeek (MIT) |
| sentra | T1 | GREEN | CoT-monitor + PII-filter mandatory; Phi-4 / Qwen3-8B |
| vessels/killinchu | T6 / T2 | AMBER ok | image+chart VQA via Llama4 Maverick / Gemma 3; sanctions screening gate |
| rosie | T2 | AMBER ok | schema-bound output via Hermes 4; instruction-hierarchy enforced |
| a11oy (self) | T3 | mixed | code via Codestral; reasoning via R1; full Proof-Chain |

---
*Signed: Yachay-extension — 2026-06-01. Seven tiers, deterministic selection, bounded fallback, every route receipted. No bandaid.*
