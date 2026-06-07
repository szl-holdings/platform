# SZL Holdings — Analyst Layer

## Overview

The Analyst Layer is a business-facing natural-language decision interface. It allows analysts and operators to ask business questions and receive evidence-backed, policy-aware, traceable answers.

This is not a chatbot. It is a governed query engine where every answer carries:
- Source entity references
- Confidence scoring
- Policy-aware recommendations
- Full replay trace

## Design Principles

1. **No opaque summaries** — Every answer must tie back to source entities or source artifacts
2. **No autonomous execution** — Recommendations require approval before action
3. **Explicit uncertainty** — If confidence is low, the uncertainty is surfaced, not hidden
4. **Traceable reasoning** — Every recommendation preserves the full reasoning chain for replay

## Query Flow

```
ANALYST QUESTION
       ↓
┌─────────────────────┐
│  Question Parser     │  Interpret intent, extract entities, identify domain
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Query Planner       │  Generate structured query plan (SQL, API calls, entity lookups)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Evidence Collector  │  Execute queries, collect source data, attach references
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Analysis Engine     │  Apply domain logic, run Monte Carlo if applicable
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Policy Evaluator    │  Check Covenant Policy Engine for applicable rules
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Response Builder    │  Assemble answer with evidence, confidence, recommendations
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Proof Chain Writer  │  Record the query, reasoning, and response in audit trail
└──────────┘──────────┘
           ↓
      GOVERNED ANSWER
```

## Answer Envelope

Every analyst query response includes:

```typescript
interface AnalystResponse {
  answer: string;
  confidence: number;                    // 0.0 – 1.0
  sources: EntityReference[];            // linked source entities
  evidence: EvidenceBundle;              // supporting data with provenance
  recommendation?: GovernedRecommendation;
  policy_evaluation: PolicyResult;       // which policies were evaluated
  replay_handle: string;                 // ID for full decision replay
  warnings: string[];                    // explicit uncertainty signals
}
```

## Governance

### Access Control
- Analyst role is first-class in the RBAC hierarchy
- Query access is scoped to the analyst's tenant and domain permissions
- Sensitive data is redacted based on role-level clearance

### Audit
- Every query is logged with full context
- Every response is captured in the proof chain
- Query-to-answer lineage is replayable from the Trace Graph

### Guardrails
- Queries that would require accessing data outside the analyst's tenant scope are rejected with an explicit message
- Recommendations that exceed the analyst's approval authority are escalated to the appropriate approval gate
- Low-confidence answers (< 0.6) carry explicit uncertainty warnings
