# /v1/router — endpoint contract

**Target path in a11oy Space:** `server/routes/v1_router_contract.md`
**Author:** Yachay-extension — 2026-06-01
**Spec:** `puriq/llms/A11OY_CODE_ROUTER_SPEC.md`

The single cognition entrypoint for all SZL flagship organs. Selects tier → model → provider deterministically, runs the bounded HUKLLA fallback walk, and returns the completion with a chain-verified Khipu receipt.

## Request

```json
{
  "organ": "amaru | sentra | vessels | rosie | a11oy",
  "taskClass": "classify | extract | short_qa | general | code | reasoning",
  "modality": "text | image | audio | chart | document_vision",
  "contextTokens": 18000,
  "budget": { "maxCostUsdPerCall": 0.05, "maxLatencyMs": 2000 },
  "governanceTier": "standard | elevated | sovereign",
  "confidenceHint": "low | normal",
  "dataProvenance": "simulated | live",
  "messages": [ { "role": "system|user|assistant|tool", "content": "..." } ]
}
```

## Response

```json
{
  "tier": "T0..T6",
  "model": "<hf_repo_id>",
  "provider": "together | groq | deepinfra | fireworks | cerebras | cohere | onprem",
  "licenseClass": "GREEN | AMBER | RED",
  "choices": [ { "index": 0, "message": { "role": "assistant", "content": "..." }, "finishReason": "stop" } ],
  "khipuReceipt": {
    "receiptId": "uuid",
    "chainVerified": true,
    "routeReason": "modality=text, taskClass=reasoning, ctx<128k, gov=sovereign -> T2 GREEN-only -> DeepSeek V3",
    "huklaCheck": { "tripwire": null, "passed": ["T01","T02","T03","T04","T05","T06","T07","T08","T09","T10"] }
  }
}
```

## Selection rules (deterministic, in order)

1. **Cache** — semantic hit → T0, no model call.
2. **Modality gate (hard)** — image/audio/chart/document_vision → T6.
3. **Context gate (hard)** — `contextTokens > 128000` → T5.
4. **Task-class gate** — code → T3; reasoning or `confidenceHint=low` → T4; classify/extract/short_qa → T1; else T2.
5. **Budget downshift** — clamp to budget; never silently upshift (cost monotonicity).
6. **License floor** — `governanceTier=sovereign` forces GREEN-only models; AMBER calls emit a license receipt; RED (Cohere) only via `provider=cohere`.

## HUKLLA fallback walk (bounded, max 4 steps)

`[primary, fallback1, fallback2, DEGRADE]`. On each step run the T01–T10 check:

- **T01** receipt-chain break → **HALT**, return last verified state (no further calls).
- **T02–T10** → take the mapped action (see router spec §5 / `HUKLLA_ACTIONS` in `openLlmRouter.ts`) and advance the chain.
- Clean → emit success receipt, return.
- All steps fail → DEGRADE: cached answer or explicit refuse + receipt.

No exponential backoff, no unbounded retry (respects Bekenstein bound on |𝒜|).

## Governance behaviors

| governanceTier | License floor | Extra |
|---|---|---|
| standard | AMBER | route receipt only |
| elevated | AMBER | + CoT monitor + PII filter |
| sovereign | GREEN | + Proof-Chain log + Shadow-Council adversarial second pass |

## Caller obligation

If `khipuReceipt.chainVerified === false` **or** `huklaCheck.tripwire === "T01"`, the calling organ MUST treat the response as a **HALT** and not act on `choices`. (Helper: `isHalt()` in `routerClient.ts`.)
