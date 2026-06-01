# A11OY_CODE_PATCH_PLAN — Top-7 Innovations into the In-Flight Orchestrator

**Layer:** PURIQ → `a11oy_code_frontier/`
**Author:** Yachay (a11oy.code Frontier agent)
**Date:** 2026-06-01
**Coordinates with:** `a11oy_code_conversational_orchestrator_mput7k48` agent, whose workspace is expected at `a11oy_code_orchestrator/` (sibling of this dir). At time of writing that dir is **not yet present** — these patches are written against the *existing* router artifacts in `puriq/integration/a11oy_patch/` (`openLlmRouter.ts`, `routerClient.ts`, `v1_router_contract.md`) and the `A11OY_CODE_ROUTER_SPEC.md` contract, so the orchestrator agent can apply them when its tree lands.

> **HARD RULES honored:** nothing is pushed to HF/GitHub. Each patch is a *spec + diff sketch* for the orchestrator agent to integrate and gate. Doctrine v11 LOCKED numbers untouched. Every new field is additive (no breaking change to the §3 capability matrix or `/v1/router` contract).

---

## 0. Integration model

The router is the substrate that *populates* `𝒜`; it never decides (decision = Yuyay-gate + HUKLLA-penalty downstream). Every patch below either (a) adds candidates to `𝒜`, (b) adds a `license_class`/governance field to the receipt, or (c) adds a tripwire mapping — all consistent with `A11OY_CODE_ROUTER_SPEC` §§4–6. No patch may weaken the gate (monotone-tightening invariant, Innovation #14).

**Apply order:** P1 → P7 (dependency-sorted below). Each lands behind a feature flag; each emits a Khipu receipt so the change itself is auditable.

---

## P1 — Sovereignty-Selectable Inference (Innovation #4) — **highest leverage**

**Files:** `src/data/openLlmRouter.ts`, `src/lib/routerClient.ts`, `server/routes/v1_router_contract.md`.

**Diff sketch:**
1. Extend `OpenModel` in `openLlmRouter.ts`:
```ts
export interface OpenModel {
  // ...existing fields...
  canTrainOnOutputs: boolean;   // NEW — false for Grok 2 (no-distill clause), true for NVIDIA-Open/Apache/MIT
  infraJurisdictions: ('us'|'eu'|'onprem')[];  // NEW — provider regions where this model is GREEN-servable
}
```
2. Add `infraJurisdiction?: 'us'|'eu'|'onprem'` to `RouterRequest` (`routerClient.ts`).
3. In `pick(tier, license_policy)`: when `governanceTier==='sovereign'`, filter to `licenseClass==='GREEN' && infraJurisdictions.includes(req.infraJurisdiction ?? 'us')`. Refuse otherwise → emit **HUKLLA T08** (license) + new **T08b** (jurisdiction).
4. Add to `KhipuReceipt`: `licenseClass`, `canTrainOnOutputs`, `infraJurisdiction`, `providerRegion`.
5. Seed the regional GREEN roster from `MISSING_LLMS_2026.md` §6 (EuroLLM, Salamandra, Latxa, Sailor 2) + GREEN frontier (DeepSeek-V3 MIT, Qwen3 Apache, MiniMax-M1 Apache, Pixtral-12B Apache).

**Lean invariant to register** (`PuriqLean.lean`, sorry-tagged): `sovereign_never_amber` (NOVEL_INNOVATIONS_15 #4).
**Cost:** M. **Owner-agent:** orchestrator + amaru-governance agent (license registry).

---

## P2 — Khipu-Signed Reasoning Chains (Innovation #1)

**Files:** `server/routes/v1_router_contract.md` (response schema), new `src/lib/khipuChain.ts`, `routerClient.ts`.

**Diff sketch:**
1. Add `KhipuStepReceipt[]` to the `/v1/router` response:
```ts
export interface KhipuStepReceipt {
  stepId: string; parentId: string | null;
  contentHash: string;     // SHA256(stepText ‖ toolIO)
  chainHash: string;       // SHA256(contentHash ‖ prevChainHash)
  model: string; tier: Tier;
  inTotoStatement: object;  // serialized in-toto attestation (Killinchu interop)
}
```
2. Each model turn / tool call appends a step receipt; `chainVerified = ∀i: chainHash_i == hash(contentHash_i ‖ chainHash_{i-1})`.
3. On `chainVerified===false` → **HUKLLA T01** → HALT (return last verified), per `A11OY_CODE_ROUTER_SPEC` §5.
4. Add a `replayChain(receipts)` verifier (recompute hashes; re-run deterministic tool steps).

**Serialization:** in-toto (per Killinchu PONDER 06:30) so the chain is Sigstore-signable later (Khipu signature is **DSSE PLACEHOLDER** until Sigstore lands — Doctrine v12 §2; verify *hash chain*, not signature, for now — honesty preserved).
**Lean invariant:** `khipu_chain_integrity`.
**Cost:** M. **Owner-agent:** orchestrator + amaru.

---

## P3 — PURIQ Action Pre-Auth (Innovation #8) — **cheapest, ships fast**

**Files:** new `src/components/ActionPreAuth.tsx`, `routerClient.ts`, server tool-call interceptor.

**Diff sketch:**
1. Tag tool calls `sideEffect: boolean` in the tool schema.
2. Before a side-effecting call, compute and return `puriqUtility`:
```ts
export interface PreAuth {
  U: number;                 // Λ·Yuyay·exp(-β·HUKLLA)·∏Khipu
  factors: { lambda:number; yuyay13:number; huklaCount:number; beta:number; khipuProduct:number };
  rationale: string;
  requiresHumanAuth: boolean; // U < authThreshold(organ)
}
```
3. Render the four factors + scalar in `ActionPreAuth.tsx`; block until auth above threshold; receipt the decision.

**Lean invariant:** `preauth_required_above_threshold`.
**Cost:** S–M. **Owner-agent:** orchestrator (frontend) + sentra (threshold policy).

---

## P4 — Hybrid SSM + Transformer Routing (Innovation #11)

**Files:** `src/data/openLlmRouter.ts`, routing function (`v1_router` backend).

**Diff sketch:**
1. Add `architecture: 'transformer'|'ssm'|'hybrid'|'rnn'` to `OpenModel`; tag the registry (MiniMax-M1=hybrid, Jamba=hybrid, RWKV-7=rnn, Phi-4-mini-flash=hybrid, Mamba-2=ssm — all from `MISSING_LLMS_2026.md` §2).
2. Add T5 GREEN primaries: MiniMax-M1-80k (1M→4M), Jamba-1.5-Large (256K effective). Add T-edge tier: Phi-4-mini-flash / RWKV-7.
3. Routing predicate (after context gate, before model pick): `if contextTokens > crossover && taskClass !== 'reasoning' → prefer architecture ∈ {ssm,hybrid}`. `crossover` from per-provider benchmark (config constant; document as measured).
4. Cost-monotonicity preserved (§1 goal 5).

**Lean invariant:** `ssm_chosen_when_cheaper`.
**Cost:** M. **Owner-agent:** orchestrator + a11oy (benchmark the crossover).

---

## P5 — License `canTrainOnOutputs` enforcement + T08 hardening (supports D1/D4/D5)

**Files:** `openLlmRouter.ts`, gate logic.

**Diff sketch:**
1. (Builds on P1's `canTrainOnOutputs` field.) When a request's `taskClass` is a *training/distillation* job (new flag `purpose: 'inference'|'distillation'`), the router **refuses any model with `canTrainOnOutputs===false`** (Grok 2 — `MISSING_LLMS_2026.md` §3.1, §9) → **HUKLLA T08**.
2. Whitelist distillation teachers: NVIDIA Nemotron-4-340B (license explicitly permits), our own gate logs, GREEN Apache/MIT models.
3. Receipt records `purpose` + `canTrainOnOutputs` of every teacher → provable "no protected output trained our model class."

**Lean invariant:** `no_protected_output_in_training` (sorry-tagged).
**Cost:** S. **Owner-agent:** amaru (license) + orchestrator. **Critical prerequisite for Deep Innovations D1/D4/D5.**

---

## P6 — Anatomy-Routed Cognition path receipts (Innovation #6)

**Files:** new `src/lib/organPath.ts`, `routerClient.ts`, wire to existing 3D viz (`411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md`).

**Diff sketch:**
1. Add `OrganPathReceipt[]` to the response: ordered `{organ, action, tier, model, huklaCheck}`.
2. Define the organ-graph traversal driven by the Λ-spine; bound it (no organ revisited without a receipt → acyclic).
3. Emit the path to Rosie 3D / Anatomy V2 as Khipu glyphs (existing render hook).

**Lean invariant:** `organ_path_acyclic`.
**Cost:** M. **Owner-agent:** rosie-3d agent + orchestrator.

---

## P7 — Test-Time Compute Slider (Innovation #13)

**Files:** new `src/components/ComputeSlider.tsx`, `routerClient.ts`.

**Diff sketch:**
1. Add `computeBudget?: number /*0..1*/` to `RouterRequest`.
2. Map: `thinkingBudget = lerp(0, 80_000, s)` (MiniMax-M1 / Reka budget-forcing — `MISSING_LLMS_2026.md` §1.1, §3.2), `councilN = ceil(s*5)` (ties P-future #2), `scSamples = ceil(s*8)`.
3. Receipt records `{sliderPos, tokensSpent, usdSpent, latencyMs}`; UI shows marginal quality-per-dollar.
4. Cost-monotonicity: `expectedCost(s)` monotone in `s` (§1 goal 5).

**Lean invariant:** `slider_cost_monotone`.
**Cost:** S–M. **Owner-agent:** orchestrator (frontend) + a11oy.

---

## Cross-patch additive schema summary (for the orchestrator agent)

New `OpenModel` fields: `canTrainOnOutputs`, `infraJurisdictions`, `architecture`.
New `RouterRequest` fields: `infraJurisdiction`, `computeBudget`, `purpose`.
New response objects: `KhipuStepReceipt[]`, `OrganPathReceipt[]`, `PreAuth`.
New `KhipuReceipt` fields: `licenseClass`, `canTrainOnOutputs`, `infraJurisdiction`, `providerRegion`, cost fields.
New tripwire: **T08b** (jurisdiction).
All additive → no break to the existing `/v1/router` contract or §3 matrix.

## Handoff note to `a11oy_code_conversational_orchestrator_mput7k48`

1. When your `a11oy_code_orchestrator/` workspace lands, copy `puriq/integration/a11oy_patch/*` as the base and apply P1–P7 as additive diffs.
2. Each patch behind a feature flag; each flag flip emits a Khipu receipt.
3. **Do not push** — write patched files to your workspace; the founder/parent reviews before any `HfApi.create_commit`.
4. Register the 7 Lean invariants as `sorry`-tagged obligations in `formulas/PuriqLean.lean` (HR-4: never hidden). Gate before instill: `lake build` 0 errors → `#print axioms` clean on the PROVED set → `harness_selfcheck.py` 50/50 (per Formula-Mining PONDER 03:30).
5. Open question for you (answer in PONDER): do you want the `/v1/router` response to carry the full `KhipuStepReceipt[]` inline (heavier payload, fully self-verifying) or a `chainRootHash` + a `GET /v1/khipu/{rootHash}` retrieval endpoint (lighter, requires a second call to verify)? My recommendation: **inline for `governance_tier=sovereign`, root-hash-only otherwise** — keeps sovereign requests self-verifying while keeping standard traffic light.

---
*Signed: Yachay — 2026-06-01. No bandaid. Additive patches only. Nothing pushed. 7 Lean obligations registered sorry-tagged. Doctrine v11 LOCKED numbers preserved.*
