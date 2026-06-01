# SZL Holdings — Model Policy Registry

## Overview

The Model Policy Registry is a governed catalog of every AI model, tool, prompt, and workflow policy used in the platform. It ensures that AI usage is tracked, risk-tiered, and policy-compliant.

## Registry Structure

### Model/Tool Entry

```typescript
interface ModelRegistryEntry {
  id: string;
  type: "llm" | "embedding" | "tool" | "prompt" | "workflow";
  name: string;
  version: string;
  owner: string;
  risk_tier: "low" | "medium" | "high" | "critical";
  allowed_use_cases: string[];
  prohibited_data_scopes: string[];
  required_approvals: string[];
  fallback_policy: string;
  cost_tier: "free" | "low" | "medium" | "high";
  latency_class: "realtime" | "near-realtime" | "batch";
  observability_requirements: string[];
  evaluation_requirements: string[];
  last_evaluated: string;
  evaluation_score: number;
}
```

### Current Inventory

| Model/Tool | Type | Risk Tier | Use Cases |
|-----------|------|-----------|-----------|
| OpenAI GPT-4o | LLM | Medium | Analysis, recommendation generation, document summarization |
| Anthropic Claude | LLM | Medium | Complex reasoning, policy evaluation |
| Alloy Embedding | Embedding | Low | Semantic search, entity matching, similarity |
| Covenant Policy Engine | Tool | Critical | Policy enforcement, approval gate evaluation |
| Monte Carlo Simulator | Tool | High | Risk modeling, scenario simulation |
| Signal Mesh Router | Tool | Medium | Cross-domain event routing |

## Policy Framework

### Risk Tiers

| Tier | Definition | Requirements |
|------|-----------|-------------|
| Low | No business impact, informational only | Logging, basic monitoring |
| Medium | Influences decisions but not autonomous | Confidence scoring, audit logging, evidence attachment |
| High | Directly affects business outcomes | Human approval gate, full proof chain, decision replay |
| Critical | Regulatory or financial impact | Multi-approver gate, legal review, enhanced monitoring |

### Prompt Governance

All prompts are:
- Versioned and stored in the registry
- Tagged with allowed data scopes
- Subject to injection defense evaluation
- Logged with input/output pairs for audit
- Evaluated in Command Arena for regression

### Fallback Policies

Every model entry has a defined fallback:
- **LLM unavailable** → Queue for manual processing, notify operator
- **Confidence below threshold** → Escalate to human analyst with raw evidence
- **Rate limit exceeded** → Degrade gracefully, serve cached recommendation with staleness indicator
- **Policy violation** → Block action, log violation, alert security

## Evaluation Requirements

Models are evaluated against Command Arena scenarios:
- Correctness: Does the model produce accurate outputs?
- Evidence completeness: Does the model cite sources?
- Hallucination resistance: Does the model fabricate information?
- Policy adherence: Does the model respect governance rules?
- Latency: Does the model respond within SLA?

Evaluation runs are tracked in `generated/arena-results/` and linked to the registry entry.
