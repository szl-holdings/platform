# A11OY_CODE_BRAIN_INTEGRATION

**Layer:** PURIQ → `llms/`
**Author:** Yachay-extension
**Date:** 2026-06-01
**Purpose:** Specify how each SZL flagship calls `a11oy.code` as its reasoning brain through the single `POST /v1/router` endpoint. a11oy.code is the *cortex*; each flagship is an *organ* that delegates its reasoning to the cortex and applies its own organ-specific Yuyay gating + Khipu receipting on the result.

---

## 1. Topology

a11oy.code exposes exactly one cognition entrypoint: `POST /v1/router` (contract in `A11OY_CODE_ROUTER_SPEC.md §6`). Every flagship sends an OpenAI-compatible payload tagged with its `organ`, `task_class`, `modality`, `context_tokens`, `budget`, and `governance_tier`. The router selects tier → model → provider, runs the bounded fallback walk under HUKLLA, and returns the completion **plus a Khipu receipt**. The organ then runs the PURIQ master formula locally to decide whether to *act*.

```mermaid
flowchart LR
  subgraph Flagships["SZL Flagship Organs"]
    AM["amaru<br/>governance / receipts"]
    SE["sentra<br/>security gates"]
    VE["vessels / killinchu<br/>maritime intel"]
    RO["rosie<br/>orchestration DAG"]
  end
  subgraph Cortex["a11oy.code — cortex"]
    RT["/v1/router<br/>7-tier selector"]
    HK["HUKLLA gate<br/>T01–T10"]
    KH["Khipu chain<br/>receipts"]
  end
  subgraph Providers["Open-weight providers"]
    TG["Together"]; GQ["Groq"]; DI["DeepInfra"]; FW["Fireworks"]; CB["Cerebras"]; OP["on-prem GREEN"]
  end
  AM --> RT
  SE --> RT
  VE --> RT
  RO --> RT
  RT --> HK
  HK --> KH
  RT --> TG & GQ & DI & FW & CB & OP
  KH -. receipt .-> AM & SE & VE & RO
```

**Principle.** The router *generates and screens* candidate actions; the organ *decides* via `P(x,t) = argmax_a [ Λ(x)·Yuyay_13(a)·exp(-β·HUKLLA(a))·∏Khipu_i(a) ]`. The cortex never acts on the organ's behalf — it returns options with a verified receipt.

---

## 2. Shared call sequence (all organs)

```mermaid
sequenceDiagram
  participant O as Organ (amaru/sentra/vessels/rosie)
  participant R as a11oy.code /v1/router
  participant K as Khipu chain
  participant M as Open model (provider)
  participant H as HUKLLA gate

  O->>R: POST /v1/router {organ, task_class, modality, ctx, budget, gov_tier, messages}
  R->>K: open route receipt (chain_verified check)
  alt T01 receipt-chain break
    K-->>R: chain_verified=false
    R-->>O: HALT (last verified state, no model call)
  else chain OK
    R->>R: select tier -> model -> provider (deterministic)
    R->>M: inference call (primary model)
    M-->>R: completion
    R->>H: HUKLLA check T01–T10
    alt tripwire fires
      H-->>R: tripwire T0x
      R->>M: fallback fb1 -> fb2 (bounded, max 4 steps)
      M-->>R: completion
      R->>H: re-check
    end
    H-->>R: clean
    R->>K: emit success receipt {model, provider, license_class, hukla=clean}
    R-->>O: {tier, model, choices, khipu_receipt}
    O->>O: run P(x,t) argmax -> decide to act or defer
  end
```

---

## 3. Per-flagship integration

### 3.1 amaru — governance / receipt minting

amaru mints Cardano-anchored, hash-chained governance receipts (COSE_Sign1) and runs convergent multi-source sync. Its reasoning needs: provenance-clean, MIT/Apache-only models (no AUP exposure on governance text), deterministic structured output. → `governance_tier=sovereign`, license floor **GREEN**, default **T2**, prefer OLMo 2 / DeepSeek (MIT).

```mermaid
sequenceDiagram
  participant A as amaru (7-chakra runtime)
  participant R as a11oy.code /v1/router
  participant M as DeepSeek V3 (MIT) / OLMo 2
  participant C as Cardano receipt chain

  A->>R: /v1/router {organ:"amaru", task_class:"reasoning", gov_tier:"sovereign", ctx:18k}
  R->>R: GREEN-only filter -> T2 -> DeepSeek V3 (MIT)
  R->>M: convergence analysis (Ouroboros diff -> 0?)
  M-->>R: structured verdict + rationale
  R-->>A: choices + khipu_receipt(license=GREEN, hukla=clean)
  A->>A: Yuyay_13 gate (2 sacred>=0.95) + provenance check
  A->>C: mint COSE_Sign1 receipt (embeds router khipu_receipt id)
```

**Wire:** amaru's overwatch panel adds a "cortex receipt" field linking each governance receipt to the router's `receipt_id`, so every minted receipt is traceable to the exact model + license that produced its rationale.

### 3.2 sentra — AI security gates

sentra runs an 8-gate scanner with CoT-monitoring and PII-filtering. Reasoning needs: sub-second graduate-grade triage, GREEN license, mandatory PII redaction before any model call. → default **T1** (Phi-4 GPQA 56.1 / Qwen3-8B), `governance_tier=elevated`.

```mermaid
sequenceDiagram
  participant S as sentra (8-gate scanner)
  participant R as a11oy.code /v1/router
  participant M as Phi-4 14B (MIT) / Qwen3-8B
  participant H as HUKLLA gate

  S->>S: PII pre-filter on payload (redact)
  S->>R: /v1/router {organ:"sentra", task_class:"classify", gov_tier:"elevated", budget:{max_latency_ms:400}}
  R->>R: T1 -> Phi-4 (fast, GREEN)
  R->>M: threat classification + MITRE mapping
  M-->>R: class + confidence
  R->>H: T05 PII-leak recheck, T03 instruction-drift
  alt T05 leak detected
    H-->>R: tripwire T05
    R->>M: on-prem GREEN only + re-redact
  end
  R-->>S: verdict + khipu_receipt
  S->>S: gate decision (block/allow) + receipt
```

**Wire:** sentra escalates low-confidence triage (logprob < τ) to **T4 DeepSeek R1** for deep adversarial reasoning, exactly once, receipted (the T4 escalation rule in router spec §4).

### 3.3 vessels / killinchu — maritime intelligence

vessels visualizes fleet/AIS data; killinchu is its maritime console. Reasoning needs: multimodal (AIS charts, port document images), multilingual (Arabic/ZH port docs), long context (voyage histories), sanctions screening. → default **T6** for visual, **T2** for text; AMBER allowed.

```mermaid
sequenceDiagram
  participant V as vessels / killinchu
  participant R as a11oy.code /v1/router
  participant M6 as Llama 4 Maverick (multimodal) / Gemma 3 27B
  participant M5 as Falcon-H1 (262K long-ctx)

  V->>R: /v1/router {organ:"vessels", modality:"chart", task_class:"reasoning", ctx:40k}
  R->>R: modality gate -> T6 -> Llama 4 Maverick
  R->>M6: read AIS chart + manifest image -> anomaly assessment
  M6-->>R: anomaly findings + grounding
  R-->>V: choices + khipu_receipt
  Note over V,R: long voyage history?
  V->>R: /v1/router {organ:"vessels", task_class:"reasoning", ctx:200k}
  R->>R: ctx>128k -> T5 -> Falcon-H1 262K
  R->>M5: summarize 18-month voyage log
  M5-->>R: risk timeline
  R-->>V: choices + khipu_receipt + sanctions-screening flag
```

**Wire:** the public demo uses simulated AIS; the router payload carries `data_provenance: "simulated|live"` so the Khipu receipt records whether a maritime conclusion came from mock or live data — preserving the honest-architecture disclaimer in the vessels README.

### 3.4 rosie — receipt orchestration DAG

rosie orchestrates the DAG of agentic actions across organs and renders the brain-jack mesh / 3D Khipu glyphs. Reasoning needs: reliable schema-bound structured output (it emits DAG nodes), high steerability, instruction-hierarchy compliance. → default **T2** via **Hermes 4 70B** (SOTA RefusalBench steerability, JSON/function-calling), AMBER allowed.

```mermaid
sequenceDiagram
  participant RO as rosie (DAG orchestrator)
  participant R as a11oy.code /v1/router
  participant M as Hermes 4 70B / Llama 3.3 70B
  participant Mesh as brain-jack mesh (live)

  RO->>R: /v1/router {organ:"rosie", task_class:"general", gov_tier:"elevated"}
  R->>R: T2 -> Hermes 4 70B (steerable, schema-bound)
  R->>M: plan next DAG nodes (JSON schema enforced)
  M-->>R: tool_call[] in <tool_call> tags
  R->>R: T03 instruction-hierarchy check (Covenant > user prompt)
  R-->>RO: validated tool_call[] + khipu_receipt
  RO->>Mesh: render Puriq decision flow (glyph per node, color by tier)
  RO->>RO: chain each node receipt into DAG edge
```

**Wire:** rosie's brain-jack mesh colors each node by the router tier (T0–T6) and annotates with `model` + `license_class`, so the live visualization *is* the audit trail of which open model reasoned each step.

---

## 4. Patch files (written, NOT pushed)

The integration ships to the live a11oy Space via `HfApi.create_commit()`. Patch files are written to `puriq/integration/a11oy_patch/` and a push script is provided but **commented out** for human review. Files:

| Patch file | Target path in Space | Purpose |
|---|---|---|
| `openLlmRouter.ts` | `src/data/openLlmRouter.ts` | typed tier/model/provider/license tables (router spec §3) |
| `routerClient.ts` | `src/lib/routerClient.ts` | typed `POST /v1/router` client |
| `v1_router_contract.md` | `server/routes/v1_router_contract.md` | endpoint contract + Khipu receipt schema |
| `push_a11oy_patch.py` | (not committed) | `HfApi.create_commit()` driver — **commented out** |

`push_a11oy_patch.py` shape (the actual push line is disabled):

```python
from huggingface_hub import HfApi, CommitOperationAdd
api = HfApi()
ops = [
    CommitOperationAdd(path_in_repo="src/data/openLlmRouter.ts",  path_or_fileobj="openLlmRouter.ts"),
    CommitOperationAdd(path_in_repo="src/lib/routerClient.ts",    path_or_fileobj="routerClient.ts"),
    CommitOperationAdd(path_in_repo="server/routes/v1_router_contract.md", path_or_fileobj="v1_router_contract.md"),
]
# DO NOT PUSH until founder/parent review. Uncomment to ship:
# api.create_commit(repo_id="<org>/a11oy", repo_type="space",
#                   operations=ops, commit_message="PURIQ: open-LLM 7-tier router + /v1/router brain endpoint")
print("Patch prepared. Push is intentionally disabled (Zero-Bandaid review gate).")
```

---

## 5. Why this is agentic (not just an LLM call)

Per Yachay's seed insight: *agentic = acts under Λ-bounded, Yuyay-gated, HUKLLA-safe, Khipu-receipted volition.* This integration satisfies all four:

- **Λ-bounded:** the router's cost/latency budget + tier ceiling is the Λ spine aggregator's bound on action cost.
- **Yuyay-gated:** the organ runs 13-axis Yuyay gating on the router's returned candidates before acting.
- **HUKLLA-safe:** the bounded fallback walk removes tripwired candidates from `𝒜` (the `exp(-β·HUKLLA)` factor → 0 for unsafe actions).
- **Khipu-receipted:** every route, every fallback, every success emits a chain-verified receipt; no non-zero score without `chain_verified=true`.

The open-LLM router is therefore the *substrate that makes `𝒜` (the bounded action space) concrete* — it produces real, screened, receipted candidate actions for the master formula to maximize over.

---
*Signed: Yachay-extension — 2026-06-01. One endpoint, four organs, mermaid-traced, receipt-bound. No bandaid.*
