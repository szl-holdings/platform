# SZL Holdings — Platform Contracts

## Overview

Platform contracts define the shared interfaces that every domain pack must implement to participate in the governed decision operating system. These contracts ensure that governance, observability, and interoperability work uniformly across all domains.

## Contract 1: Decision Lifecycle

Every domain pack must implement the nine-step decision lifecycle:

```typescript
interface DecisionLifecycle {
  signal(input: Signal): Promise<SignalAck>;
  analyze(signal: Signal, context: DomainContext): Promise<Analysis>;
  recommend(analysis: Analysis): Promise<Recommendation>;
  simulate(recommendation: Recommendation): Promise<SimulationResult>;
  evaluatePolicy(recommendation: Recommendation): Promise<PolicyResult>;
  requestApproval(recommendation: Recommendation, policy: PolicyResult): Promise<ApprovalRequest>;
  execute(approved: ApprovedAction): Promise<ExecutionResult>;
  verify(execution: ExecutionResult): Promise<VerificationResult>;
  recordOutcome(verification: VerificationResult): Promise<OutcomeRecord>;
}
```

## Contract 2: Proof Chain Entry

Every consequential action must produce a proof chain entry:

```typescript
interface ProofChainEntry {
  id: string;
  decision_id: string;
  timestamp: string;
  actor: ActorIdentity;
  action: string;
  evidence: EvidenceBundle;
  policy_refs: string[];
  confidence: number;
  previous_hash: string;
  hash: string;
  tenant_id: string;
  replay_handle: string;
}
```

## Contract 3: Event Envelope

All cross-domain events must use the shared event envelope:

```typescript
interface EventEnvelope {
  event_id: string;
  correlation_id: string;
  causation_id: string;
  timestamp: string;
  source_domain: string;
  target_domains: string[];
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  payload: unknown;
  actor: ActorIdentity;
  tenant_id: string;
}
```

## Contract 4: Health Endpoint

Every service must expose a health endpoint:

```typescript
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: Record<string, ServiceHealth>;
}
```

## Contract 5: Observability Span

Every model/tool call must produce an observability span:

```typescript
interface ObservabilitySpan {
  span_id: string;
  trace_id: string;
  parent_span_id?: string;
  operation: string;
  model_or_tool: string;
  input_summary: string;
  output_summary: string;
  duration_ms: number;
  token_count?: { input: number; output: number };
  confidence?: number;
  error?: string;
  tenant_id: string;
}
```

## Compliance

Domain packs that do not implement these contracts cannot:
- Participate in cross-domain signal cascading
- Record entries in the shared proof chain
- Be evaluated in Command Arena
- Be included in release trust packs
