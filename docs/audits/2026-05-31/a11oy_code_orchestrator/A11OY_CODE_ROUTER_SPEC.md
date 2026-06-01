# A11OY_CODE_ROUTER_SPEC — Unified open-LLM router

The router maps each request to a model **tier**, then walks `[primary, *fallbacks]`
until one succeeds. OpenAI-compatible in and out. Every completion emits a Khipu receipt.

---

## 1. Tiers (live-probed 2026-06-01 against `https://router.huggingface.co/v1`)

| Tier | Name | Primary | Fallbacks | License | cost_out ($/M) | latency_ms |
|---|---|---|---|---|---|---|
| T0 | Trivial / cached | `meta-llama/Llama-3.1-8B-Instruct` | `Qwen/Qwen2.5-7B-Instruct` | AMBER | 0.08 | 400 |
| T1 | Small fast | `Qwen/Qwen2.5-7B-Instruct` | `meta-llama/Llama-3.1-8B-Instruct` | AMBER | 0.30 | 600 |
| T2 | Standard | `meta-llama/Llama-3.3-70B-Instruct` | `deepseek-ai/DeepSeek-V3-0324`, `Qwen/Qwen2.5-72B-Instruct` | AMBER | 0.79 | 2000 |
| T3 | Code | `Qwen/Qwen2.5-Coder-32B-Instruct` | `Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-V3-0324` | AMBER | 0.90 | 3000 |
| T4 | Reasoning | `deepseek-ai/DeepSeek-R1` | `deepseek-ai/DeepSeek-V3-0324`, `Qwen/Qwen2.5-72B-Instruct` | GREEN | 7.00 | 15000 |
| T5 | Long-context | `deepseek-ai/DeepSeek-V3-0324` | `Qwen/Qwen2.5-72B-Instruct`, `meta-llama/Llama-3.1-70B-Instruct` | GREEN | 0.30 | 10000 |
| T6 | Multimodal | `Qwen/Qwen2.5-VL-72B-Instruct` | `meta-llama/Llama-3.3-70B-Instruct` | AMBER | 0.60 | 5000 |

License classes: **GREEN** = Apache/MIT, **AMBER** = Llama/Qwen community terms,
**RED** = API-only/closed (none used today). `governance_tier=sovereign` forces GREEN.

---

## 2. Live probe log (HF Router, 2026-06-01)

| Model | HTTP | Verdict |
|---|---|---|
| `meta-llama/Llama-3.3-70B-Instruct` | 200 | ✅ kept (T2) |
| `deepseek-ai/DeepSeek-V3-0324` | 200 | ✅ kept (T2/T4/T5) |
| `Qwen/Qwen2.5-72B-Instruct` | 200 | ✅ kept (fallback) |
| `Qwen/Qwen2.5-Coder-32B-Instruct` | 200 | ✅ kept (T3) |
| `deepseek-ai/DeepSeek-R1` | 200 | ✅ kept (T4) |
| `Qwen/Qwen2.5-7B-Instruct` | 200 | ✅ kept (T0/T1) |
| `meta-llama/Llama-3.1-8B-Instruct` | 200 | ✅ kept (T0) |
| `meta-llama/Llama-3.1-70B-Instruct` | 200 | ✅ kept (T5 fallback) |
| `Qwen/Qwen2.5-VL-72B-Instruct` | 200 | ✅ kept (T6) |
| `mistralai/Mistral-Small-24B-Instruct-2501` | 400 | ❌ "not a chat model" — removed |
| `meta-llama/Llama-3.2-3B-Instruct` | 400 | ❌ "not supported by any provider" — removed |
| `mistralai/Mistral-7B-Instruct-v0.3` | 400 | ❌ "not a chat model" — removed |
| `google/gemma-2-9b-it` | 400 | ❌ "not supported by any provider" — removed |

**Rule applied (Zero-Bandaid):** any model that did not return a live 200 chat completion
was removed from the tier table rather than left as dead config.

---

## 3. Routing decision (`route()`)

Deterministic, explainable. Inputs: `messages`, optional explicit `model`,
`governance_tier`, optional `budget`.

1. **Explicit model wins.** If the caller names a catalog model, use its tier directly.
2. **Task classification** from the last user turn + context length:
   - has image parts → **T6**
   - short Q&A (≤ ~40 tokens, ends in `?`) → **T1** (`short_qa`)
   - code-ish (``` fences, "function", "def ", "compile", language names) → **T3**
   - reasoning-heavy ("prove", "derive", "step by step", "why") → **T4**
   - very long context → **T5**
   - else → **T2** (`general`)
3. **Governance:** `sovereign` → if the chosen tier's primary isn't GREEN, swap to the
   first GREEN fallback, else hard-fall to GREEN T2 DeepSeek-V3 (MIT).
4. Returns `{tier, model, license_class, reason, fallbacks}`. `reason` is surfaced to the
   UI as `task=… ctx=… gov=…`.

---

## 4. Fallback walk (`_call_model_resilient`)

```
for m in [primary, *fallbacks]:
    try: return _call_model(m), m
    except provider-error / rate-limit / unavailable:
        metrics.router_fallbacks_total += 1
        khipu_emit("router.fallback", {model: m, error})
        continue
raise  # all exhausted → honest failure, never a fake completion
```

Used by `/chat/stream`. `/v1/router` uses an equivalent `[primary, *fallbacks, DEGRADE]`
chain. No silent success: if every candidate fails the caller gets a real error.

---

## 5. Inference transport

- Endpoint: `POST https://router.huggingface.co/v1/chat/completions`
- Auth: `Authorization: Bearer <HF_TOKEN>` (env). If absent → **HTTP 503** with the
  Zero-Bandaid message (no placeholder key).
- Provider keys (Together/Groq/Fireworks/DeepInfra/Cerebras) are read from env **if
  present**; none are set today (see GAP CHECK B.4).
- Streaming and non-streaming both supported (`_call_model_stream` / `_call_model`).

---

## 6. Cost & latency accounting

Per completion the router records `latency_ms` (measured), `cost_usd` (estimated from
output token count × tier `cost_out`), and a Yuyay-13 response score, all surfaced on the
`done` SSE event and persisted to memory + the Khipu receipt.
