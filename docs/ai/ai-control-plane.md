# AI Control Plane Architecture

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Platform Engineering — AI Infrastructure

---

## Overview

The SZL Holdings AI Control Plane is a provider-agnostic routing layer that sits between every application-level AI call and the underlying model providers. It ensures that AI inference is governed, cost-controlled, observable, and resilient — regardless of which model or provider is active.

The control plane does **not** pick models arbitrarily. It routes based on a combination of: task classification (route class), eval scores, cost budgets, agent tier policy, and circuit breaker state. Fallback rules ensure that a failure from one provider never silently degrades the platform — it either routes to a known fallback or fails explicitly.

---

## Package: `@szl-holdings/ai-control-plane`

```
packages/ai-control-plane/
├── src/
│   ├── router.ts          Model routing layer — provider selection, circuit breakers
│   ├── eval-selector.ts   Eval-aware model selection using registered eval scores
│   ├── fallback.ts        Fallback rules engine — condition-based provider switching
│   ├── cost-controller.ts Cost tracking, budget policies, hard stops
│   ├── pii-redactor.ts    PII detection/redaction + prompt injection scanning
│   ├── agent-tiers.ts     Agent tier definitions (assistant/analyst/operator/autonomous)
│   ├── policy-engine.ts   Policy enforcement — tier validation, tool gating, approval routing
│   └── index.ts
```

---

## Model Routing Layer

### Supported Provider Types

| Provider Type | Description | Auth |
|---------------|-------------|------|
| `openai` | OpenAI API (or any OpenAI-compatible endpoint) | `OPENAI_API_KEY` |
| `anthropic` | Anthropic Claude API | `ANTHROPIC_API_KEY` |
| `local` | Local model server (Ollama, LM Studio, llama.cpp) | Optional key |
| `self-hosted` | Self-hosted OpenAI-compatible server (vLLM, TGI) | Configurable |
| `nim` | NVIDIA NIM managed endpoints | `NVIDIA_API_KEY` |

All providers expose a unified `ModelEndpoint` interface. Route selection is provider-agnostic — the caller specifies a `RouteClass`, not a model name.

### Route Classes

Route classes map task semantics to model capability tiers:

| Route Class | Typical Task | Default Model Tier |
|-------------|-------------|-------------------|
| `reasoning` | Complex multi-step analysis, strategy | GPT-4o class or Claude Opus |
| `planning` | Multi-step action planning | GPT-4o class |
| `extraction` | Structured entity extraction | GPT-4o-mini or Claude Haiku |
| `triage` | Priority and routing classification | Lightweight model |
| `summarization` | Text condensation | Lightweight model |
| `generation` | Content and draft generation | Mid-tier model |
| `classification` | Zero-shot or few-shot classification | Lightweight model |
| `embedding` | Vector embedding generation | Embedding model |

### Routing Algorithm

1. Filter endpoints by `RouteClass` tag match and `enabled` status
2. Remove endpoints with open circuit breakers (5-failure threshold, 30s recovery)
3. If `evalThreshold` specified: prefer endpoints with eval score ≥ threshold
4. If `maxBudgetUsd` specified: prefer endpoints whose estimated cost fits
5. If `preferredProvider` specified: honor if available
6. Fall back to `priority` order

### Circuit Breaker

Each endpoint has an independent circuit breaker:
- **Closed** → normal operation
- **Open** (after 5 failures) → excluded from routing for 30 seconds
- **Half-open** (after 30s) → one test request; success closes, failure re-opens

---

## Eval-Aware Model Selection

The `EvalRegistry` stores per-model, per-route-class evaluation results. Results are accumulated from eval runs (e.g., via the prompt registry evaluator or NeMo hooks) and used at routing time.

```typescript
import { recordEvalResult, selectEvalAwareEndpoint } from "@szl-holdings/ai-control-plane/eval-selector";

recordEvalResult({
  endpointKey: "openai:gpt-4o:reasoning",
  provider: "openai",
  model: "gpt-4o",
  routeClass: "reasoning",
  score: 0.91,
  passRate: 0.88,
  avgLatencyMs: 1240,
  sampleCount: 100,
  evaluatedAt: new Date().toISOString(),
  tags: ["legal", "multi-step"],
});

// At routing time:
const bestEndpoint = selectEvalAwareEndpoint(
  endpoints,
  "reasoning",
  { minScore: 0.85, maxLatencyMs: 3000 }
);
```

---

## Fallback Rules

Fallback rules are condition-based and ordered by priority. Built-in rules handle the most common scenarios:

| Rule ID | Trigger | Fallback |
|---------|---------|---------|
| `openai-to-anthropic` | OpenAI circuit open | Claude Haiku |
| `anthropic-to-openai` | Anthropic circuit open | GPT-4o-mini |
| `cloud-to-local` | Any cloud circuit open | Local Llama 3.3 70B |
| `budget-exceeded-to-mini` | Budget exceeded | GPT-4o-mini |
| `eval-fail-to-mini` | Eval score below threshold | Claude Opus |

Custom rules can be registered at startup via `fallbackEngine.addRule()`.

---

## Cost Controls

### Budget Policies

Budget policies can be scoped to an org, an agent, or globally. Three period types are supported: `hourly`, `daily`, `monthly`.

```typescript
import { costController } from "@szl-holdings/ai-control-plane/cost-controller";

costController.addPolicy({
  orgId: "org-123",
  periodType: "daily",
  limitUsd: 50.00,
  alertThresholdPct: 80,
  hardStop: true,
});

// Before making an inference call:
const { allowed, reason } = costController.isAllowed("org-123", undefined, estimatedCostUsd);
if (!allowed) throw new PolicyError(reason);
```

### Cost Tracking

Every inference call records: provider, model, route class, input tokens, output tokens, cost, org, agent. The summary API provides breakdowns by provider, model, and route class.

---

## PII Redaction and Injection Scanning

The `PiiRedactor` runs before every prompt is sent to an external model:

**PII patterns detected and redacted:**
- SSN (format `XXX-XX-XXXX`)
- Credit card numbers
- Email addresses
- US phone numbers
- API keys (sk-, pk_live_, Bearer tokens)
- Passwords in key=value form
- Generic secrets in key=value form
- IP addresses

**Prompt injection patterns detected:**
- "ignore previous instructions"
- "forget your system prompt"
- "you are now a different AI"
- "jailbreak", "DAN mode"
- 6 additional injection pattern families

Detection results are logged as observability events. Injection detection blocks the request. PII detection redacts in-place and continues (configurable by severity threshold).

---

## Agent Tiers

Four agent tiers define the operational boundary of any AI agent in the SZL ecosystem:

| Tier | Label | Write State | Execute Actions | Delegate | Max Steps | Approval Required |
|------|-------|-------------|----------------|----------|-----------|-------------------|
| `assistant` | Assistant | No | No | No | 1 | Never |
| `analyst` | Analyst | Yes (artifacts) | No | No | 5 | High-risk only |
| `operator` | Operator | Yes | Yes | Yes | 15 | High-risk only |
| `autonomous` | Autonomous | Yes | Yes | Yes | 100 | Never (pre-authorized) |

Each tier specifies:
- `allowedRouteClasses` — which route classes the tier can invoke
- `allowedTools` — which tools are accessible (`"*"` for autonomous)
- `maxCostPerRequestUsd` — per-request spend ceiling
- `evalThreshold` — minimum eval score for model selection
- `auditRequired` — whether every call must be logged to the audit trail

---

## Policy Engine

The `PolicyEngine` evaluates every agent action against built-in and custom rules before any model call or tool execution proceeds.

**Built-in policy rules:**

| Rule | Action |
|------|--------|
| Tool not permitted for tier | Block |
| Route class not permitted for tier | Block |
| Estimated cost > tier ceiling | Block |
| Assistant tier tries to execute an action | Block |
| Autonomous tier executes high-risk action | Warn (audit) |

**Policy decision output:**
```typescript
{
  allowed: boolean;
  requiresApproval: boolean;
  approvalLevel: "none" | "operator" | "manager" | "executive";
  violations: Array<{ code, message, severity }>;
  warnings: string[];
  effectiveTier: AgentTierName;
}
```

Custom rules can be added at runtime via `policyEngine.addRule()`.

---

## Integration Example

```typescript
import {
  modelRouter,
  piiRedactor,
  costController,
  policyEngine,
  evaluateFallback,
} from "@szl-holdings/ai-control-plane";

async function safeInference(req: InferenceRequest) {
  // 1. Policy check
  const policy = policyEngine.evaluate({ tier: req.agentTier, routeClass: req.routeClass });
  if (!policy.allowed) throw new PolicyError(policy.violations[0].message);

  // 2. PII scan
  const { injection, pii } = piiRedactor.scanAndRedact(req.prompt);
  if (injection.detected) throw new SafetyError("Prompt injection detected");
  const safePrompt = pii.redacted;

  // 3. Cost check
  const route = modelRouter.route({ routeClass: req.routeClass, orgId: req.orgId });
  const budget = costController.isAllowed(req.orgId, req.agentId, route.estimatedCostUsd);
  if (!budget.allowed) {
    // Try fallback
    const fallback = evaluateFallback({ routeClass: req.routeClass, failedProvider: route.endpoint.provider });
    if (!fallback.shouldFallback) throw new BudgetError(budget.reason);
  }

  // 4. Inference + record cost
  const result = await callProvider(route.endpoint, safePrompt);
  costController.record({ ...req, ...result.usage, provider: route.endpoint.provider });
  return result;
}
```

---

## Observability

All control plane decisions are logged via `pino` at appropriate levels:
- `debug` — routing decisions, PII detection
- `info` — cost records, policy evaluations, fallback activations
- `warn` — circuit breaker openings, budget alerts, injection detections
- `error` — inference failures, hard budget stops

---

*See also:*
- *[NVIDIA Optional Runtime Strategy](nvidia-optional-runtime.md)*
- *[Digital Twin and Simulation Strategy](../platform/digital-twin-and-simulation-strategy.md)*
