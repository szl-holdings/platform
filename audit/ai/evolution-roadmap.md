# Agent Platform Evolution Roadmap
**Date:** 2026-04-20  
**Phase:** Series-A Reset — Phase 10  
**Horizon:** 12 months post-review

---

## Strategic Intent

The AEEP agentic platform is architecturally sound and ready for controlled production use. The evolution roadmap prioritizes making the platform auditable, observable, and trustworthy before expanding its autonomy surface. No new end-user features are added in this roadmap — the work is entirely in the platform layers that make existing features safe, measurable, and governable. The guiding principle: **earn autonomy incrementally by demonstrating governance**.

---

## Current State Summary

Drawn from the four companion audit reports (agent-architecture, tool-contracts, guardrails, observability):

**Strengths:**
- Seven-layer architecture fully implemented across typed TypeScript packages.
- Canonical event chain (INGEST → DELIVER) expressed end-to-end through cognitive phases.
- Approval gates at every high-risk boundary; no silent irreversible automation.
- 15 well-defined metrics; OTel-format exporters already built.
- Zod-typed schemas throughout with runtime validation at package boundaries.
- PII redaction, role-based capability gating, and dual-layer policy enforcement (policy-engine + guardian).

**Critical Gaps:**
- Metric export pipeline not started; metrics accumulate in-memory and are lost on restart.
- Evidence ledger is in-memory only; not durable across process restarts.
- Split policy evaluation paths; no single mandatory choke-point.
- Tool output schemas declared but not validated at runtime.
- No operator-readable run summary at completion.
- 12 of 15 defined metrics have no active emitter.

---

## Roadmap Phases

---

### Phase 1: Harden (Months 1–2)
**Theme: Make existing capabilities production-safe**

**Milestone 1.1 — Wire the observability pipeline**
- Call `BatchingExporter.start()` in the API server startup path with configurable `OTEL_EXPORTER_ENDPOINT`.
- Remove high-cardinality labels (`runId`, `stepId`, `spanId`) from metric data points; push them to trace span attributes only.
- Add `approval_bottleneck_ms` emission inside `requestApproval()`.
- Target: zero metric data lost on process restart; all 3 currently-emitted metrics flowing to OTEL Collector.
- *Packages:* `artifacts/api-server`, `packages/cognitive-observability`, `packages/agents-core`

**Milestone 1.2 — Persist the evidence ledger**
- Implement `PostgresEvidenceLedgerStore` following the same pattern as `PostgresRunLedgerStore`.
- Make `defaultEvidenceLedger` use a `MutableEvidenceLedgerStore` (same swappable-backend pattern as `MutableRunLedgerStore`).
- Activate Postgres backend in the API server startup path.
- Target: all evidence ledger entries survive process restart; accessible via `GET /audit/evidence/:traceId`.
- *Packages:* `packages/evidence-ledger`, `packages/run-ledger`

**Milestone 1.3 — Unify the policy evaluation path**
- Introduce a single `evaluateFull(request)` facade in `packages/policy-engine` that chains: PII scan → policy evaluation → guardian check.
- Deprecate direct calls to `piiRedactor.redact()` in isolation.
- Instrument the unified path to emit a `policy_evaluation_complete` event with PII-redacted request summary.
- Target: every action that reaches the execution layer has passed through all three guardrail layers; no bypass route exists.
- *Packages:* `packages/policy-engine`, `packages/ai-control-plane`, `packages/agents-core`

**Milestone 1.4 — Enforce tool output contracts**
- Add `outputSchema` to `ToolManifest` (required, not optional).
- After `executeWithTimeout` returns, run `validateSchema(result, manifest.outputSchema)`.
- Surface violations as `tool_output_schema_violation` events (warn, not block by default).
- Make `ToolManifest.timeoutMs` required; reject registration of manifests without it.
- Target: zero unvalidated outputs flowing downstream; all schema violations visible in metrics.
- *Packages:* `packages/tool-mesh`

**Milestone 1.5 — Auto-run quality gate**
- Call `evaluateQualityGate(ledgerEntry)` automatically at `AgentRun.complete()` and `CognitiveLoopRun` completion.
- Attach `QualityGateResult` to the run summary.
- Emit `quality_gate_passed` / `quality_gate_degraded` / `quality_gate_blocked` events.
- Target: every production run is quality-gated before its summary is surfaced to callers.
- *Packages:* `packages/agents-core`, `packages/run-ledger`, `packages/cognitive-runtime`

**Definition of Done — Phase 1:**
- Zero metric data lost on restart.
- Evidence ledger durable to Postgres.
- Single unified policy evaluation path (no bypass).
- Tool output schema violations detectable.
- Quality gate runs automatically on every production run.
- 5 additional metrics emitting (from 3 currently active to 8).

---

### Phase 2: Instrument (Months 3–4)
**Theme: Fill metric gaps and build operator visibility**

**Milestone 2.1 — Complete metric emitter coverage**
- Emit `token_count` and `cost_usd` at model call sites in `ai-control-plane/router.ts` using cost-per-token from `ModelEndpoint`.
- Emit `tool_error_rate` as a rolling gauge computed from `ToolExecutionRecord` history in `ToolMeshExecutor.summary()`.
- Emit `citation_coverage` from `VerifierDecision` checks after each verification run.
- Emit `rollback_count` from the cognitive orchestrator when a rollback point is activated.
- Emit `override_rate` when an approval is granted after an initial policy block.
- Target: 10 of 15 defined metrics actively emitting.
- *Packages:* `packages/cognitive-observability`, `packages/ai-control-plane`, `packages/tool-mesh`, `packages/verifier`, `packages/cognitive-runtime`

**Milestone 2.2 — Operator run summary**
- At `AgentRun.complete()` / `CognitiveLoopRun` completion, generate a structured narrative summary (see `observability-review.md` for format).
- Emit summary as a `level: 'summary'` step log event.
- Store summary in `RunLedgerEntry.narrative` (new field on governance contracts).
- Expose via `GET /api/runs/:runId/summary`.
- Target: any operator can reconstruct the story of any run from a single API call in < 5 seconds.
- *Packages:* `packages/agents-core`, `packages/cognitive-runtime`, `packages/run-ledger`, `artifacts/api-server`

**Milestone 2.3 — Unify observability stacks**
- Connect `observability-core` correlation context to `cognitive-observability` span emission so that HTTP correlation IDs propagate into agent trace spans.
- Replace the two-package pattern with a single `@workspace/telemetry` facade that exposes `recordMetric`, `startSpan`, `endSpan`, and `correlate`.
- Target: a single import path for all instrumentation; no divergent stack.
- *Packages:* `packages/observability-core`, `packages/cognitive-observability`

**Milestone 2.4 — Circuit-breaker and rate-limit observability**
- Emit `circuit_breaker_opened` and `circuit_breaker_closed` events from `ModelRouter`.
- Add `rate_limited` and `circuit_open` to `RunErrorCategory`.
- Emit `rate_limited_count` metric from `tool-mesh/rate-limiter.ts`.
- Target: operators can detect model provider instability from metrics before it affects SLAs.
- *Packages:* `packages/ai-control-plane`, `packages/tool-mesh`, `packages/agents-core`

**Definition of Done — Phase 2:**
- 10/15 defined metrics actively emitting.
- Every run produces a human-readable summary accessible via API.
- Correlation IDs propagate from HTTP request → agent trace → metric labels.
- Circuit breaker and rate limit events visible in dashboards.

---

### Phase 3: Tighten (Months 5–6)
**Theme: Close security and contract gaps**

**Milestone 3.1 — Memory sensitivity enforcement**
- In context-building paths that feed prompts to external model endpoints, filter out `MemoryEntry` records with `sensitivity: 'restricted'` or `'confidential'`.
- Add a `minimumTier` field to `MemoryEntry` — agents below the required tier cannot read the entry.
- Add `domain` isolation to `MemoryStore` reads invoked from a cognitive loop: restrict reads to entries matching `context.domain`.
- Schedule `evictExpired()` on a 5-minute background timer in both `InMemoryStore` and `PostgresStore`.
- Target: no restricted memory flows to external models; cross-domain memory leakage eliminated.
- *Packages:* `packages/memory-fabric`, `packages/cognitive-runtime`

**Milestone 3.2 — Bind guardian to production environment**
- Raise an error if `CognitiveContext.guardianEnabled === false` when `NODE_ENV === 'production'`.
- Add `allowPreloadedApprovals` flag to `AgentRunOptions`; require it to be explicitly set for `preloadApproval()` to function.
- Target: no guardian bypass in production; test-only escape hatches require explicit opt-in.
- *Packages:* `packages/cognitive-runtime`, `packages/agents-core`

**Milestone 3.3 — Regex guardrail safety**
- Add a regex complexity budget in `policy-engine/evaluator.ts`: reject `matches` conditions with patterns longer than 200 characters or containing nested quantifiers.
- Run Zod schema validation on all LLM-compiled policies before persisting.
- Add an `audit_only` violation rate metric; alert when rate exceeds 10 violations/hour per domain.
- Target: no ReDoS risk from policy conditions; LLM-compiled policies validated at the same standard as hand-authored ones.
- *Packages:* `packages/policy-engine`

**Milestone 3.4 — Implement durable tool registry**
- Implement `packages/tool-registry` as a Postgres-backed store that persists `ToolManifest` records on registration.
- Enable cross-instance tool discovery via the registry API.
- Version tool manifests — callers can pin a specific version.
- Target: tool manifests survive process restart; zero re-registration required on startup.
- *Packages:* `packages/tool-registry`

**Milestone 3.5 — Add jitter to retry policy**
- Add `jitterMs = Math.random() * delay * 0.25` before each retry sleep in `withRetry`.
- Add `maxRetries` to `ToolManifest` for per-tool retry budget control.
- Target: thundering herd eliminated; tool authors control their own retry budget.
- *Packages:* `packages/agents-core`, `packages/tool-mesh`

**Definition of Done — Phase 3:**
- No restricted memory reaches external models.
- Guardian enabled by default in production; guardian bypass requires explicit build-time opt-in.
- No ReDoS risk from policy conditions.
- Tool manifests persist across restarts.
- Retry jitter active.

---

### Phase 4: Verify (Months 7–8)
**Theme: Close the intended-vs-observed loop**

**Milestone 4.1 — Pre-execution step contracts**
- Add `expectedOutput: JsonSchema` and `expectedSideEffects: string[]` to `PlanStep`.
- After each step completes, run `VerifierEngine.verify()` with `expectedOutput` as a domain rule.
- Include `expectedOutput` violation in `VerifierDecision`; route to `request_more_evidence` or `block` accordingly.
- Target: every plan step has a declared contract; the verifier closes the intended-vs-observed loop.
- *Packages:* `packages/planner`, `packages/verifier`, `packages/cognitive-runtime`

**Milestone 4.2 — Link verifier decisions to plan steps**
- Add `planStepId` and `planId` to `VerifierDecision` (currently optional in the schema, not populated).
- Persist verifier decisions into `RunLedgerEntry.verifierDecisions` (new array field).
- Target: every run audit record includes the verifier decision for each plan step.
- *Packages:* `packages/verifier`, `packages/run-ledger`, `packages/contracts`

**Milestone 4.3 — Multi-party approval support**
- Add `requiredApprovers: number` to `ApprovalGateRequest` (default 1).
- Update `approvals-inbox` to collect M verdicts before resolving a gate.
- For steps with `blastRadius: 'global'`, default `requiredApprovers` to 2.
- Target: global-blast-radius actions require two independent human approvers.
- *Packages:* `packages/agents-core`, `packages/approvals-inbox`

**Milestone 4.4 — Approval-to-rollback linkage**
- Link `approvalId` from the gate response back to `PlanStep.rollbackPoints[].approvalRef`.
- When a rollback is triggered, surface the approvalId so operators know which human approved the action that is being rolled back.
- Target: complete chain of custody from approval decision to rollback event.
- *Packages:* `packages/planner`, `packages/agents-core`, `packages/cognitive-runtime`

**Definition of Done — Phase 4:**
- Every plan step has a declared expected output contract.
- Verifier decisions are linked to plan steps in the ledger.
- Global-blast-radius actions require two approvers.
- Approval-to-rollback chain of custody complete.

---

### Phase 5: Scale (Months 9–12)
**Theme: Enable safe autonomy expansion**

**Milestone 5.1 — Parallel step execution**
- Support fan-out execution for steps whose `dependsOn` sets are simultaneously satisfied.
- Implement a step executor that uses `Promise.all` for independent steps.
- Ensure per-step observability (spans, metrics) works correctly under concurrent execution.
- Target: plan execution time for N independent steps = max(step_i_latency) rather than sum.
- *Packages:* `packages/cognitive-runtime`, `packages/agents-core`

**Milestone 5.2 — Per-tenant model routing**
- Support per-tenant `ModelRouter` instances with tenant-specific endpoint overrides (e.g. force local models for tenants with `restricted`-sensitivity data requirements).
- Derive routing context from `AgentRunContext.tenantId`.
- Target: tenant isolation at the model routing layer without manual caller configuration.
- *Packages:* `packages/ai-control-plane`

**Milestone 5.3 — Distributed rate-limit coordination**
- Replace process-local `RateLimiter` with a Redis-backed sliding window rate limiter.
- Coordinate rate limits across instances.
- Target: per-tool rate limits enforced consistently in horizontally-scaled deployments.
- *Packages:* `packages/tool-mesh`

**Milestone 5.4 — Drift detection and behavioral baselines**
- Emit `drift_score` metric by comparing per-run verifier scores against a rolling baseline.
- Alert when drift score exceeds 0.3 standard deviations from the 7-day baseline.
- Store baseline in `memory-fabric` using `tier: 'semantic'` and `retention: { policy: 'archival' }`.
- Target: behavioral drift detected automatically within 24 hours of onset.
- *Packages:* `packages/cognitive-observability`, `packages/verifier`, `packages/memory-fabric`

**Milestone 5.5 — Seed catalog and domain profiles**
- Build a domain-specific seed catalog: a library of pre-validated `PlanContext.seeds` for common objectives per domain (sentra, terra, vessels, lyte, counsel).
- Reduce reliance on heuristic `decomposeObjective` for known objectives.
- Version seeds in the plan store; enable A/B testing of seed variants via eval framework.
- Target: p95 plan quality score ≥ 0.85 for catalogued objectives.
- *Packages:* `packages/planner`, `packages/agents-evals`

**Definition of Done — Phase 5:**
- Parallel step execution reducing plan latency by ≥ 30% for parallelizable objectives.
- Per-tenant model routing active.
- Distributed rate limiting coordinated across instances.
- Drift detection alerting within 24 hours.
- Domain seed catalog covering top-10 objectives per domain.

---

## Success Metrics by Phase

| Phase | Key Metric | Target |
|-------|-----------|--------|
| 1 — Harden | Metric data loss rate | 0% |
| 1 — Harden | Policy evaluation bypass incidents | 0 |
| 2 — Instrument | Active metric emitters / defined metrics | ≥ 10/15 |
| 2 — Instrument | Mean time to operator insight per run | < 5 min |
| 3 — Tighten | Restricted data → external model incidents | 0 |
| 3 — Tighten | Guardian bypass in production | 0 |
| 4 — Verify | Steps with declared output contracts | 100% |
| 4 — Verify | Global-blast-radius actions requiring 2+ approvers | 100% |
| 5 — Scale | Parallelizable plan latency improvement | ≥ 30% |
| 5 — Scale | Drift detection window | ≤ 24h |

---

## Dependency Map

```
Phase 1 (Harden) — prerequisite for all downstream phases
    │
    ├─ Phase 2 (Instrument) — depends on 1.1 (export pipeline)
    │       │
    │       └─ Phase 5 (Scale) — depends on 2.x metrics infrastructure
    │
    ├─ Phase 3 (Tighten) — depends on 1.3 (unified policy path)
    │
    └─ Phase 4 (Verify) — depends on 1.4 (output contracts) and 1.5 (quality gate)
            │
            └─ Phase 5 (Scale) — depends on 4.1 (step contracts) for drift baseline
```

---

## Out of Scope (Per Task Definition)

The following are explicitly excluded from this roadmap:

- Adding new end-user agent features (new tools, new domains).
- Swapping foundation-model providers (current OpenAI/Anthropic/local mix is retained).
- Building net-new evaluation datasets (existing `packages/agents-evals` packages are referenced for seed catalog validation in Phase 5).

---

## Conclusion

The AEEP platform is well-positioned for Series-A deployment with a focused 2-month hardening sprint. The architecture is sound; the gaps are operational rather than structural. The five-phase roadmap closes every identified critical gap by month 8 and expands safe autonomy in months 9–12. The guiding principle throughout: auditability and governance gate autonomy expansion — the platform earns each increment of autonomy by demonstrating it can be observed, controlled, and rolled back.
