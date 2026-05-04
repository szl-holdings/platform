# Model Passport (`.mpf.json`) — Architecture & Spec

## Overview

A **Model Passport** is a signed, portable JSON artifact that binds the identity, capability surface, cost/latency/accuracy profile, quantization tier, policy envelope, approval chain, and provenance hash of a **single `(model × quantization tier × policy envelope × tenant scope)` tuple**.

The router uses passports instead of a hardcoded lane→model map. Every AI call is governed by an active, cryptographically-verified passport.

---

## File Format (`.mpf.json`)

```json
{
  "passport": {
    "schemaVersion": "1.0",
    "identity": {
      "id": "mpf_4a7b9c2d1e3f",
      "displayName": "GPT-4o — Standard Hosted",
      "version": "1.0.0",
      "provider": "openai",
      "providerModelId": "gpt-4o",
      "createdAt": "2026-05-01T10:00:00Z"
    },
    "quantProfile": {
      "tier": "hosted",
      "contextWindow": 128000,
      "modality": ["text", "vision"]
    },
    "capabilitySurface": {
      "lanes": ["reasoning", "planning", "tool_calling", "extraction", "summarization"],
      "skills": ["function-calling", "structured-output", "code-analysis"],
      "supportedTools": ["web_search", "code_interpreter"]
    },
    "costProfile": {
      "costPer1kTokensUsd": 0.005,
      "p50LatencyMs": 800,
      "p95LatencyMs": 2500,
      "evalPassRate": 0.92
    },
    "policyEnvelope": {
      "autonomyTier": "supervised",
      "allowedDomains": ["*"],
      "piiHandling": "redacted",
      "escalationRules": ["require_approval_for_external_transfer"],
      "jurisdictions": ["US", "EU"]
    },
    "approvals": {
      "signers": [],
      "requiredSigners": 1
    },
    "provenance": {
      "sourceRegistryHash": "sha256:...",
      "promptRegistryPins": []
    },
    "downgradeTo": [
      {
        "passportId": "mpf_8e1f2a3b4c5d",
        "displayName": "GPT-4o Mini — Economy",
        "reason": "budget_exceeded"
      }
    ],
    "state": "active"
  },
  "signature": "<base64url-Ed25519-signature>",
  "signerPublicKey": "<PEM-encoded-Ed25519-public-key>",
  "provenanceHash": "<sha256-hex-of-canonical-passport-body>",
  "signedAt": "2026-05-01T10:00:00Z"
}
```

---

## Key Concepts

### Passport ID

The passport ID is a deterministic, short hash computed from `provider:providerModelId:quantTier[:tenantId]`:

```
mpf_<sha256(provider:modelId:tier[:tenantId]).slice(0,12)>
```

### Quantization Tiers

| Tier | Description |
|------|-------------|
| `hosted` | Provider-managed inference (OpenAI, Anthropic, HuggingFace) |
| `fp32` | Full precision local |
| `fp16` / `bf16` | Half precision local |
| `int8` / `int4` | Quantized local (bitsandbytes) |
| `gguf-q4` / `gguf-q5` / `gguf-q8` | GGUF quantized (llama.cpp) |

### Autonomy Tiers

| Tier | Behavior |
|------|----------|
| `read_only` | May only read data, never write or trigger external actions |
| `advisory` | Suggests actions for human approval |
| `supervised` | Acts within pre-approved scope, logs all decisions |
| `autonomous` | Acts without per-decision approval (high governance bar) |

### Route Classes (Lanes)

`classification` | `triage` | `reasoning` | `planning` | `tool_calling` | `vision_understanding` | `background_batch` | `extraction` | `summarization`

---

## Lifecycle States

```
draft → proposed → approved → active → deprecated → revoked
                ↓
              draft (retract)
```

- **draft** → **proposed**: operator/admin
- **proposed** → **approved**: approver/admin (requires multi-sig)
- **approved** → **active**: operator/admin (high-risk, requires approver)
- **active** → **deprecated**: operator/admin
- **active** → **revoked**: approver/admin (high-risk)
- **deprecated** → **revoked**: approver/admin

---

## Cryptographic Signing

Passports are signed with **Ed25519** (Node.js `crypto` module, `ieee-p1363` encoding):

1. The passport body is JSON-canonicalized (keys sorted alphabetically).
2. A SHA-256 hash of the canonical body is the **provenance hash**.
3. The hash is signed with the signer's Ed25519 private key.
4. The signature is stored as `base64url`.

Verification:
1. Re-compute SHA-256 of the canonical body → compare to `provenanceHash`.
2. Verify the Ed25519 signature over `provenanceHash` using `signerPublicKey`.

---

## Resolver Algorithm

The router calls `resolvePassport(query, store)` which:

1. Fetches all `active` passports for the requested tenant (or global).
2. Filters to passports whose `lanes` include the requested `lane`.
3. Scores each passport:
   - +`evalPassRate × 100` (accuracy)
   - −`(costPer1kTokensUsd / 0.01) × 5` (cost penalty)
   - −20 if `p95LatencyMs > slaP95Ms`
   - +5 per matching `requiredCapability`
   - +tier weight (hosted/fp32/fp16 = 5, int8 = 3, int4/gguf-q4 = 1–2)
4. Returns the highest-scoring passport plus its downgrade ladder.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/model-passports` | Any | List passports (filter: lane, tier, state, tenant) |
| `GET` | `/model-passports/:id` | Any | Fetch one passport |
| `POST` | `/model-passports` | ops/admin | Register a new passport |
| `POST` | `/model-passports/resolve` | Any | Resolve best passport for lane + budget + SLA |
| `POST` | `/model-passports/:id/verify` | Any | Re-verify signature + hash live |
| `PATCH` | `/model-passports/:id/state` | ops/admin | Lifecycle transition |
| `POST` | `/model-passports/seed` | admin | Seed current allow-listed models |

---

## Packages

| Package | Location | Purpose |
|---------|----------|---------|
| `@szl-holdings/model-passport` | `packages/model-passport/` | Types, Zod schemas, crypto helpers, resolver, seed passports |
| `@szl-holdings/db` (table) | `lib/db/src/schema/model_passports.ts` | Drizzle table — persistent passport registry |
| API routes | `artifacts/api-server/src/routes/model-passports.ts` | REST API for passport CRUD + resolve + verify |
| Resolver runtime | `artifacts/api-server/src/lib/passport-resolver-runtime.ts` | Wires live DB into the ai-engine passport resolver |
| AI engine bridge | `lib/ai-engine/src/passport-resolver.ts` | Resolver interface + registration (installed at boot) |
| NEXUS UI | `artifacts/mockup-sandbox/src/pages/PassportRegistry.tsx` | Passport Registry page in NEXUS Command |

---

## Telemetry

Every AI call governed by a passport emits these additional OpenTelemetry attributes:

| Attribute | Key | Description |
|-----------|-----|-------------|
| Passport ID | `gen_ai.passport.id` | `mpf_...` id of the governing passport |
| Signature Digest | `gen_ai.passport.signature_digest` | First 32 hex chars of SHA-256(signature) |
| Quant Tier | `gen_ai.passport.quant_tier` | e.g. `hosted`, `int8` |
| Autonomy Tier | `gen_ai.passport.autonomy_tier` | e.g. `supervised` |

These are surfaced in `ModelRouterTelemetry`, `GenAIModelCallContract`, and `GenAIModelCallSpan`.

---

## Downgrade Ladder

Each passport declares an ordered list of fallback passports via `downgradeTo`. The router walks the ladder automatically when:
- The primary passport's model is unavailable (circuit breaker open)
- Budget ceiling is exceeded
- SLA cannot be met

Example ladder: `gpt-4o → gpt-4o-mini → Qwen3-0.6B`

---

## Seed Passports

Six seed passports are pre-registered for the current allow-listed models:

1. **GPT-4o — Standard Hosted** (`openai`) — reasoning, planning, tool_calling
2. **GPT-4o Mini — Economy** (`openai`) — classification, triage, background_batch
3. **Claude Sonnet 4.6 — Standard** (`anthropic`) — reasoning, planning
4. **Qwen3-8B — HuggingFace Hosted** — triage, classification
5. **Qwen3-0.6B — Local Fallback** — classification, background_batch (terminal fallback)
6. **Qwen2.5-VL-7B-Instruct — Vision** — vision_understanding

Run `POST /model-passports/seed` (admin role) to populate the registry on first boot.
