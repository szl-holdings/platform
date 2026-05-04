# Model Passport (`.mpf.json`) — Architecture & Spec

## Overview

A **Model Passport** is a signed, portable JSON artifact that binds the identity, capability surface, cost/latency/accuracy profile, quantization tier, policy envelope, approval chain, and provenance hash of a **single `(model × quantization tier × policy envelope × tenant scope)` tuple**.

The router uses passports instead of a hardcoded lane→model map. Every AI call is governed by an active, cryptographically-verified passport. The system is a **self-policing, cryptographically-receipted contract** — not just a static card — through six one-of-one capabilities:

1. **Proof Bundles** — SBOM for AI decisions
2. **Live SLO Drift Detection** — contracts that police themselves
3. **Provenance Graph** — full traceability to data, prompts, and eval runs
4. **Tenant Policy Lenses** — zero-fork per-tenant tightening
5. **Policy-Aware Passport Diff** — structured regression flagging in the Approval Queue
6. **Self-Attesting Eval Gates** — activation gated on real eval run results

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
    "evalGates": {
      "minGoldenSetPassRate": 0.85,
      "maxP95LatencyMs": 5000,
      "maxCostPerCallUsd": 0.50
    },
    "approvals": {
      "signers": [],
      "requiredSigners": 1
    },
    "provenance": {
      "sourceRegistryHash": "sha256:...",
      "promptRegistryPins": ["prompt_registry:triage-v3"],
      "datasetHashes": ["sha256:data_golden_set_v2"],
      "evalRunId": "eval_run_20260501_001",
      "parentPassportId": "mpf_legacy_gpt4"
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
- **approved** → **active**: operator/admin (high-risk; **eval gates must pass first**)
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

## One-of-One Layer

### 1 — Proof Bundles

A **Proof Bundle** is a signed, offline-verifiable receipt proving which passport governed an AI decision and that the inputs/outputs/policy trace were not tampered with.

**Bundle format:**
```json
{
  "manifest": {
    "bundleVersion": "1.0",
    "bundleId": "pb_1a2b3c...",
    "runId": "run_20260501_001",
    "passportId": "mpf_4a7b9c2d1e3f",
    "passportSignatureDigest": "a1b2c3d4...",
    "createdAt": "2026-05-01T10:15:00Z",
    "ioHashAlgorithm": "sha256",
    "integrityRoot": "sha256:..."
  },
  "passport": { /* full SignedModelPassport */ },
  "policyTrace": { /* Covenant Policy decision */ },
  "ioHashes": {
    "requestHash": "sha256:...",
    "responseHash": "sha256:...",
    "algorithm": "sha256"
  },
  "telemetrySlice": [ /* GenAI spans */ ],
  "bundleSignature": "<base64url-Ed25519-signature>",
  "signerPublicKey": "<PEM>"
}
```

**What it proves:** The exact passport governed the decision; the request and response were not modified; the policy trace was not altered.

**What it does not prove:** That the underlying model weights are unmodified; that the model's response is factually correct.

**Verification procedure:**
1. Verify `bundleSignature` over `canonical-JSON(manifest + ioHashes + passport.signature)` using `signerPublicKey`.
2. Recompute `integrityRoot` and compare to `manifest.integrityRoot`.
3. Re-verify the passport's Ed25519 signature and provenance hash.
4. Check passport state is `active` or `deprecated` (not `revoked`).

**CLI helper:** `verifyProofBundle(deserializeBundle(fs.readFileSync('bundle.json', 'utf8')))` — works offline with no platform connectivity.

---

### 2 — Live SLO Drift Detection

The drift detector subscribes to GenAI telemetry, maintains rolling windows (default: 5 minutes, minimum 10 samples) of cost/latency/accuracy per active passport, and emits a `DriftSignal` when sustained deviation crosses configurable thresholds.

**Default thresholds:**

| Dimension | Threshold |
|-----------|-----------|
| Cost | >1.5× declared `costPer1kTokensUsd` per 2K-token call |
| P95 Latency | >1.5× declared `p95LatencyMs` |
| Eval/Accuracy | Drop >10pp below declared `evalPassRate` |

**On drift signal:**
- A `Drift` badge appears on the passport in the Registry list and detail views.
- The system automatically files a `proposed` successor passport in the Approval Queue with deltas pre-filled.
- Humans must approve — drift never auto-applies a revision.
- A 60-second cooldown prevents duplicate signals per passport.

**Signal handler registration:**
```typescript
import { driftDetector } from '@szl-holdings/model-passport';
driftDetector.onDrift(async (signal) => {
  // file approval request with signal.deltas pre-filled
});
```

---

### 3 — Provenance Graph

Passports link to their lineage via the extended `provenance` section:

| Field | Description |
|-------|-------------|
| `parentPassportId` | The passport this was forked from |
| `evalRunId` | The eval lab run that cleared the gates |
| `promptRegistryPins` | Prompt registry slugs pinned at creation |
| `datasetHashes` | SHA-256 hashes of training/eval datasets |

The **Provenance Graph** tab in the Passport Registry renders these edges as a navigable graph. Node types: `passport`, `eval`, `prompt`, `dataset`. Clicking a node opens the corresponding passport, eval run, prompt, or dataset detail.

---

### 4 — Tenant Policy Lenses

A **Policy Lens** is a partial policy envelope override a tenant stacks on an active passport without creating a new passport.

**Merge semantics (deterministic, always tightens):**

| Field | Rule |
|-------|------|
| `autonomyTier` | Lower rank wins (`read_only < advisory < supervised < autonomous`) |
| `piiHandling` | Stricter wins (`blocked < redacted < allowed`) |
| `allowedDomains` | Intersection — lens reduces scope |
| `jurisdictions` | Intersection — lens restricts jurisdictions |
| `maxBudgetUsdPerCall` | `min(passport, lens)` — lower is stricter |
| `escalationRules` | Union — more rules = tighter |

**Conflict handling:** When a lens attempts to loosen a restriction (e.g. raise autonomy tier), the conflict is logged, the passport's tighter value is kept, and the conflict is surfaced on the resolve response and in the audit trail.

**Resolver integration:** `POST /model-passports/resolve` returns `effectiveEnvelope = merge(passport, activeLensesForTenant)`. Both the router and Covenant Policy enforce the merged envelope. Lens application is logged in the audit trail.

---

### 5 — Policy-Aware Passport Diff

When a passport in the Approval Queue is a successor to an existing passport (has `parentPassportId`), reviewers see a structured **Policy-Aware Diff** card.

**Classification rules:**

| Change | Classification |
|--------|---------------|
| Autonomy tier raised | `regression` |
| PII handling loosened | `regression` |
| Domains added (scope expansion) | `regression` |
| Lanes removed (capability loss) | `regression` |
| Cost ceiling raised or removed | `regression` |
| Autonomy tier lowered | `improvement` |
| PII handling tightened | `improvement` |
| Lanes added | `improvement` |
| Cost reduced >5% | `improvement` |
| Cosmetic / metadata | `neutral` |

**Approval gate:** Regressions must be individually acknowledged (checkbox per item) before the approval button is enabled. The number of unacknowledged regressions is shown as a blocker.

**Delta display:** `costDeltaPct`, `latencyP95DeltaPct`, `evalPassRateDelta` are shown numerically alongside classification colors (red / green / grey).

---

### 6 — Self-Attesting Eval Gates

Passports declare the eval thresholds they must clear before `draft → active`:

```json
{
  "evalGates": {
    "minGoldenSetPassRate": 0.85,
    "maxP95LatencyMs": 5000,
    "maxCostPerCallUsd": 0.50
  }
}
```

**Activation gate flow:**
1. Operator calls `POST /model-passports/:id/eval-gates/check` with `{ evalRunId, report }`.
2. The gate checks all declared thresholds against the eval report.
3. If all pass, the response includes `canTransitionToActive: true`; the `evalRunId` is pinned to `provenance.evalRunId`.
4. Attempting `PATCH /model-passports/:id/state → active` without a pinned passing run returns HTTP 422 with specific threshold values that failed.
5. If no `evalGates` are declared, platform defaults apply (pass rate ≥ 70%, P95 ≤ 10,000ms, cost ≤ $1.00).

**Failure message format:** `"Golden-set pass rate 78.2% below required 85.0% (delta: -6.8pp); P95 latency 5847ms exceeds limit 5000ms (delta: 847ms). Run ID: eval_run_..."`

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
5. **Merges active Policy Lenses** for the requesting tenant before returning the effective envelope.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/model-passports` | Any | List passports (filter: lane, tier, state, tenant); includes `isDrifting` |
| `GET` | `/model-passports/:id` | Any | Fetch one passport + drift metrics |
| `POST` | `/model-passports` | ops/admin | Register a new passport |
| `POST` | `/model-passports/resolve` | Any | Resolve best passport; returns `effectiveEnvelope` with lenses merged |
| `POST` | `/model-passports/:id/verify` | Any | Re-verify signature + hash live |
| `PATCH` | `/model-passports/:id/state` | ops/admin | Lifecycle transition (eval gates checked for `approved → active`) |
| `POST` | `/model-passports/seed` | admin | Seed current allow-listed models |
| `GET` | `/model-passports/drift` | Any | List passports currently flagged as drifting |
| `POST` | `/model-passports/:id/drift/record` | ops | Record a telemetry sample for drift evaluation |
| `POST` | `/model-passports/:id/proof-bundle` | Any | Export a signed Proof Bundle for a run id |
| `POST` | `/model-passports/proof-bundle/verify` | Any | Offline-verify a submitted bundle JSON |
| `GET` | `/model-passports/:id/lenses` | Any | List policy lenses for a passport + tenant |
| `POST` | `/model-passports/:id/lenses` | ops | Attach a new policy lens |
| `DELETE` | `/model-passports/:id/lenses/:lensId` | ops | Detach a lens |
| `POST` | `/model-passports/:id/lenses/resolve` | Any | Resolve effective envelope for tenant + lenses |
| `POST` | `/model-passports/diff` | Any | Structured policy-aware diff of two passports |
| `GET` | `/model-passports/:id/eval-gates` | Any | Get declared eval gates for passport |
| `POST` | `/model-passports/:id/eval-gates/check` | Any | Run eval gate check against a report |

---

## Packages

| Package | Location | Purpose |
|---------|----------|---------|
| `@szl-holdings/model-passport` | `packages/model-passport/` | Types, schemas, crypto, resolver, seed, proof-bundle, drift-detector, policy-lens, passport-diff, eval-gates |
| `@szl-holdings/db` (table) | `lib/db/src/schema/model_passports.ts` | Drizzle table — persistent passport registry |
| API routes | `artifacts/api-server/src/routes/model-passports.ts` | Full REST API including proof bundles, lenses, drift, diff, eval gates |
| Resolver runtime | `artifacts/api-server/src/lib/passport-resolver-runtime.ts` | Wires live DB into the ai-engine passport resolver |
| AI engine bridge | `lib/ai-engine/src/passport-resolver.ts` | Resolver interface + registration (installed at boot) |
| NEXUS UI | `artifacts/mockup-sandbox/src/pages/PassportRegistry.tsx` | Full Passport Registry with all six one-of-one capabilities |

---

## Telemetry

Every AI call governed by a passport emits these additional OpenTelemetry attributes:

| Attribute | Key | Description |
|-----------|-----|-------------|
| Passport ID | `gen_ai.passport.id` | `mpf_...` id of the governing passport |
| Signature Digest | `gen_ai.passport.signature_digest` | First 32 hex chars of SHA-256(signature) |
| Quant Tier | `gen_ai.passport.quant_tier` | e.g. `hosted`, `int8` |
| Autonomy Tier | `gen_ai.passport.autonomy_tier` | e.g. `supervised` |

These are surfaced in `ModelRouterTelemetry`, `GenAIModelCallContract`, and `GenAIModelCallSpan`. The drift detector subscribes to these spans to populate its rolling windows.

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

---

## Security Properties

### Proof Bundles
- Tamper evidence: SHA-256 of request/response content is included in `ioHashes`; any modification to input or output changes the hash and invalidates the bundle signature.
- Offline verification: requires only the signer's public key — no platform connectivity needed.
- Non-repudiation: the `bundleSignature` over `manifest + ioHashes + passport.signature` is Ed25519-signed by the platform's signer key.

### Policy Lenses
- Monotonic tightening: the merge function enforces that lenses can only reduce the effective policy surface, never expand it. Any attempt to loosen is logged as a conflict.
- Auditability: lens application is recorded in the audit trail per request, alongside which lenses were applied and any conflicts encountered.

### Eval Gates
- Activation gating: the state transition `approved → active` verifies that a passing eval run id is pinned before proceeding. This cannot be bypassed without modifying the server code.
- Run id binding: the eval run id is pinned into `provenance.evalRunId` on success, making the gate provable after the fact via the Provenance Graph.

### Drift Detection
- Conservative: drift only proposes revisions for human approval — it never auto-applies changes.
- Cooldown: a 60-second per-passport cooldown prevents alarm storms from a single spike.
- Configurable: thresholds are adjustable per deployment via `driftDetector.configure(thresholds)`.
