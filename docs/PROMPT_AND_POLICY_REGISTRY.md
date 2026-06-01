# SZL Holdings — Prompt and Policy Registry

**Date:** April 28, 2026
**Status:** Specification — runtime implementation in `lib/prompt-registry` and `lib/policy-engine`

---

## Purpose

This document specifies the governed lifecycle for all prompts, system instructions, and AI policy rules used in the SZL platform. It closes the gap between model governance (what models are permitted) and inference governance (what those models are instructed to do and under what constraints).

Together with `docs/POLICY_REGISTRY_SPEC.md` and `docs/MODEL_POLICY_REGISTRY.md`, this forms the complete AI governance documentation set.

---

## Why Prompt Governance Matters

A well-governed model using a rogue prompt can produce ungoverned output. Prompt governance ensures:

1. **Reproducibility** — The same prompt version always produces the same class of output.
2. **Auditability** — Every inference call records which prompt version was used.
3. **Safety** — Prohibited data scopes and injection defenses are enforced at the prompt layer.
4. **Rollback** — A prompt in production can be rolled back in under 5 minutes without a code deploy.
5. **Evaluation** — Every prompt has an eval suite before it reaches production.

---

## Prompt Registry Entry Schema

```typescript
interface PromptRegistryEntry {
  id: string;
  name: string;
  version: string; // semver — e.g. "3.1.0"
  domain: "global" | "maritime" | "security" | "real-estate" | "legal" | "advisory" | "portfolio";
  category: "signal-analysis" | "recommendation" | "summarization" | "classification" | "evaluation" | "routing";
  status: "draft" | "eval" | "staging" | "active" | "deprecated" | "rollback-candidate";
  model_binding: string; // Which model this prompt is designed for
  allowed_data_scopes: string[]; // What data this prompt is permitted to see
  prohibited_data_scopes: string[]; // What data this prompt must never see
  injection_defense_level: "basic" | "standard" | "hardened";
  max_tokens: number;
  temperature: number;
  evaluation_suite: string; // Reference to Command Arena eval suite
  last_evaluation_score: number; // 0.0–1.0
  last_evaluated: string; // ISO 8601
  promoted_by: string; // Role that approved promotion to active
  promoted_at: string; // ISO 8601
  rollback_procedure: string; // Documented rollback steps
  audit_requirement: "log" | "proof-chain";
  content_hash: string; // SHA-256 of prompt content for integrity
}
```

---

## Prompt Lifecycle

```
DRAFT
  ↓ (author submits for evaluation)
EVAL
  ↓ (eval suite passes threshold)
STAGING
  ↓ (staging validation passes, approver sign-off)
ACTIVE ←─────────────────────────────────────┐
  ↓ (regression detected or incident)         │
ROLLBACK-CANDIDATE                            │
  ↓ (rollback confirmed)                      │
DEPRECATED ──── (prior version restored) ─────┘
```

### Promotion Gates

| Transition | Requirement |
|-----------|-------------|
| DRAFT → EVAL | Eval suite assigned and first run completed |
| EVAL → STAGING | Eval score ≥ 0.85; no policy violation in any scenario |
| STAGING → ACTIVE | Staging validation passes; designated approver sign-off; proof chain entry created |
| ACTIVE → ROLLBACK-CANDIDATE | Regression detected (automated or manual); incident logged |
| ROLLBACK-CANDIDATE → DEPRECATED | Rollback confirmed; prior version re-activated |

---

## Current Prompt Inventory

| Prompt | Domain | Version | Status | Eval Score |
|--------|--------|---------|--------|-----------|
| `signal-fusion` | Global | 3.0.0 | Active | 0.94 |
| `maritime-anomaly-detector` | Maritime | 2.1.0 | Active | 0.91 |
| `security-triage` | Security | 4.0.0 | Active | 0.96 |
| `legal-exposure-classifier` | Legal | 1.2.0 | Active | 0.88 |
| `property-distress-scorer` | Real Estate | 2.0.0 | Active | 0.90 |
| `executive-briefing-synthesizer` | Global | 1.5.0 | Active | 0.92 |
| `recommendation-evidence-builder` | Global | 2.2.0 | Active | 0.93 |
| `hallucination-detector` | Global | 0.9.0 | Rollback-candidate | 0.71 |
| `cross-domain-cascade-router` | Global | 1.0.0 | Staging | 0.87 |
| `policy-compliance-checker` | Global | 1.1.0 | Eval | 0.82 |

*Scores from Command Arena evaluation runs in `generated/arena-results/`.*

---

## Policy Rules Registry

Policy rules govern what prompts, agents, and workflows are permitted to do at inference time. These are distinct from approval policies (which govern human action) — inference policies govern AI action.

```typescript
interface InferencePolicyRule {
  id: string;
  name: string;
  scope: "prompt" | "agent" | "model" | "workflow";
  applies_to: string[]; // Prompt IDs, agent IDs, or "*" for global
  rule_type: "data-scope" | "output-constraint" | "latency" | "cost" | "injection-defense";
  condition: string; // Policy DSL expression
  effect: "block" | "warn" | "log" | "require-human-review";
  enforcement: "hard" | "soft"; // Hard = block, Soft = log+alert
  last_tested: string;
  test_pass_rate: number;
}
```

### Active Inference Policies

| Rule ID | Name | Scope | Effect | Enforcement |
|---------|------|-------|--------|-------------|
| `inf.data.pii-block` | Block PII in prompt inputs | Global | Block | Hard |
| `inf.data.cross-tenant` | Prevent cross-tenant data in context | Global | Block | Hard |
| `inf.output.citation-required` | Require source citation in recommendations | Global | Warn + Log | Soft |
| `inf.output.confidence-required` | Require confidence score in outputs | Global | Warn + Log | Soft |
| `inf.cost.token-cap` | Enforce per-request token budget | Global | Block | Hard |
| `inf.security.injection-scan` | Scan inputs for prompt injection patterns | Global | Block | Hard |
| `inf.maritime.ais-label` | Label simulated AIS data in outputs | Maritime | Log | Soft |
| `inf.legal.privilege-guard` | Prevent attorney-client privileged content in AI context | Legal | Block | Hard |

---

## Injection Defense Levels

| Level | Protections Applied |
|-------|-------------------|
| **Basic** | Input length limits, output format validation |
| **Standard** | Basic + injection pattern scanning, role-boundary enforcement, output content filtering |
| **Hardened** | Standard + indirect injection detection, multi-turn context poisoning checks, adversarial input stress testing in eval |

All production prompts must use at minimum **Standard** injection defense. Prompts that handle external user input must use **Hardened**.

---

## Rollback Procedure

When a prompt is flagged as `rollback-candidate`:

1. **Identify the trigger** — Automated regression score drop below 0.80, or manual incident report.
2. **Set status** — `pnpm registry:prompt set-status <id> rollback-candidate` (Phase 8 CLI; currently: update registry entry manually).
3. **Re-activate prior version** — Set the previous version status to `active`.
4. **Restart inference workers** — Workers pick up the registry change on next health check (< 60 seconds).
5. **Log the rollback** — Create entry in `docs/FIX_LOG.md` with: prompt ID, versions involved, trigger, timestamp, approver.
6. **Proof chain entry** — Rollback action is recorded in the platform proof chain.

Total rollback time target: **< 5 minutes** from detection to prior version active.

---

## Audit and Observability

Every inference call in production records:

| Field | Description |
|-------|-------------|
| `prompt_id` | Registry entry ID |
| `prompt_version` | Semver version used |
| `model` | Provider + model name |
| `input_hash` | SHA-256 of sanitised input (not raw input) |
| `output_class` | Classification of output type |
| `confidence` | Model confidence score |
| `latency_ms` | End-to-end inference latency |
| `tokens_in` / `tokens_out` | Token consumption |
| `policy_rules_evaluated` | List of inference policy IDs checked |
| `policy_violations` | Any soft violations detected |
| `trace_id` | Correlation ID linking to proof chain |

This record is stored in `ai_traces` (see `packages/cognitive-observability`) and visible in the AI Ops Dashboard.

---

## Operational vs. Roadmap

| Capability | Status |
|-----------|--------|
| Prompt versioning in registry | **Operational** — `lib/prompt-registry` |
| Inference policy evaluation | **Operational** — enforced at agent/model call boundaries |
| Rollback procedure (manual) | **Operational** — documented 5-minute procedure |
| Eval suite per prompt | **Operational** — Command Arena integration |
| Prompt registry UI (visual) | **Roadmap** — Phase 2, Days 30–60 |
| Rollback CLI (`pnpm registry:prompt`) | **Roadmap** — Phase 8 |
| Automated regression alerts | **Roadmap** — Phase 2 |
| Indirect injection stress testing | **Roadmap** — Phase 3 |

---

*Cross-reference: `docs/POLICY_REGISTRY_SPEC.md` for approval policy governance. `docs/MODEL_POLICY_REGISTRY.md` for model-level governance. `docs/CORE_PLATFORM_PRIMITIVES.md` for implementation register.*
