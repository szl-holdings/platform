# Guardrail Review
**Date:** 2026-04-20  
**Phase:** Series-A Reset — Phase 10  
**Scope:** Allow/deny lists, approval gates, sensitivity handling, audit metadata

---

## Executive Summary

The AEEP guardrail architecture is layered and defense-in-depth oriented: PII redaction, policy evaluation, agent-tier capability checking, risk-based approval gating, and a secondary Guardian decision engine all exist independently and can trigger independently. The primary operational gap is that these layers are not connected through a single, mandatory choke-point — a determined or misconfigured caller can bypass individual layers by invoking lower-level primitives directly. There is no silent irreversible automation; every high-risk action must pass an approval gate before execution. Audit metadata is emitted on every step, but the metadata is not always linked back to the specific guardrail rule that triggered it.

---

## Layer-by-Layer Guardrail Analysis

### 1. PII Redaction (`ai-control-plane/pii-redactor.ts`)

**What it does:** Scans prompt text for PII patterns (email, phone, SSN, credit card, IP address, date of birth, passport, API keys, JWT tokens, bank routing numbers) before submission to any model. Also scans for prompt injection signatures.

**Coverage:**

| Pattern | Detected | Redacted |
|---------|----------|----------|
| Email addresses | Yes | Yes → `[EMAIL]` |
| Phone numbers (US) | Yes | Yes → `[PHONE]` |
| SSN | Yes | Yes → `[SSN]` |
| Credit card numbers | Yes | Yes → `[CREDIT_CARD]` |
| IPv4 addresses | Yes | Yes → `[IP_ADDRESS]` |
| Dates of birth | Yes | Yes → `[DOB]` |
| Passport numbers | Yes | Yes → `[PASSPORT]` |
| API keys | Yes | Yes → `[API_KEY]` |
| JWT tokens | Yes | Yes → `[JWT]` |
| Bank routing (ABA) | Yes | Yes → `[ROUTING_NUMBER]` |
| Prompt injection | Yes (heuristic) | Yes → `[INJECTION_REMOVED]` |

**Gaps:**
- PII redaction is called by code that imports `piiRedactor` from `ai-control-plane`. The `policy-engine` package (used independently) does not call the redactor. A caller that evaluates policy via `@szl-holdings/policy-engine` without going through `ai-control-plane` will skip PII scanning.
- The `scanForInjection` heuristic matches on known injection phrases (`ignore previous instructions`, `you are now`, etc.) — novel injection variants are not detected.
- Redaction replaces patterns in-place in the string but does not emit a structured `PiiScanResult` to the observability pipeline. Operators cannot query "how many SSNs were redacted in the last 24 hours."
- No redaction for `restricted`-sensitivity memory entries that might be included in prompts — the memory layer declares sensitivity levels but the prompt builder has no guard preventing restricted entries from flowing into prompts sent to external models.

**Recommendation:**
- Emit `pii_redaction` metric events per redacted pattern type.
- Connect PII redaction to the memory layer: when building context for external models, filter out entries with `sensitivity: 'restricted'` or `'confidential'` and route only to local/self-hosted models where applicable.

---

### 2. Agent-Tier Capability Checking (`agent-core/capability-resolver.ts` + `ai-control-plane/agent-tiers.ts`)

**What it does:** Every agent role is associated with a capability contract (`AGENT_ROLE_CONTRACTS`). The `resolveCapability` function checks whether a tool call is permitted for the given role, and whether it requires approval.

**Agent tier definitions:**

| Tier | Tools Allowed | Can Approve Own Actions | Autonomous Execution |
|------|--------------|------------------------|---------------------|
| assistant | Read-only, summarization | No | No |
| analyst | Analysis + extraction | No | No |
| operator | Write + external APIs | No (requires human) | No |
| autonomous | All (with approval gate) | No | With gates |

**Strengths:**
- Wildcard deny rules prevent roles from accessing undeclared tools.
- `requiresApproval` flag per capability triggers the approval gate for specific tool+role combinations.
- `isToolAllowedForTier` and `isRouteClassAllowedForTier` provide deterministic boolean checks.

**Gaps:**
- `resolveCapability` is called by code that uses `agent-core`. Direct invocations of `ToolMeshGateway` do not call `resolveCapability` — the gateway does not enforce role-based access.
- There is no runtime enforcement that the `agentRole` in `AgentRunContext` matches the agent's actual identity. Any caller can claim any role.
- The `autonomous` tier has no additional restrictions beyond the approval gate — an `autonomous` agent with a preloaded approval (`preloadApproval()`) can execute any action without interactive human review. The `preloadApproval` API is intentional (for test/CI) but should require an explicit `allowPreloadedApprovals: true` flag in production contexts.

---

### 3. Policy Engine (`packages/policy-engine`)

**What it does:** Evaluates `EvaluationRequest` objects against registered `Policy` definitions using a priority-ordered rule match. Returns a `PolicyEvaluationResult` with effect (`allow`, `require_approval`, `escalate`, `block`, `audit_only`).

**Built-in guardrail policies:**

| Policy | Trigger | Effect |
|--------|---------|--------|
| High-Cost Autonomous Execution Guard | `estimatedCostUsd > 10,000 AND executionMode == 'autonomous'` | `require_approval` (admin) |
| Regulatory Exposure Escalation Guard | `regulatoryExposure == true` | `require_approval` (compliance) |
| Data Privacy Sensitivity Guard | `dataSensitivity in ['restricted', 'confidential']` | `require_approval` (privacy) |
| Irreversible Action Confirmation Guard | `isIrreversible == true` | `require_approval` (admin) |

**Strengths:**
- All built-in guardrails use `require_approval` — none silently `block` (which would be harder to audit). Blocking is available for domain-specific policies.
- `PolicyEvaluation` captures the full evaluation context (subject roles, entity sensitivity, confidence, freshness, evidence chain, environment) in a self-contained record.
- PRISM Counsel has domain-specific policy profiles enforcing legal ethics rules (`prism-counsel-policies.ts`).

**Gaps:**
- The `allow` effect is modeled but no `allow`-list policies are registered. This means an explicit "always permitted without evaluation" fast path does not exist — every action goes through full evaluation. While conservative, it means low-risk/high-frequency actions (e.g. read-only document retrieval) incur the same policy evaluation cost as high-risk writes.
- `audit_only` effect records violations but does not send alerts. A slow-burn compliance drift (e.g. 100 `audit_only` violations per day) would not surface until an operator manually queries the violation log.
- Policy conditions use the `matches` operator with client-provided regex strings. No regex complexity limit is enforced — a malicious or buggy policy can include a catastrophic backtracking pattern.
- The `compiler.ts` and `compiler-llm.ts` files suggest LLM-assisted policy compilation (natural language → policy rule). The LLM compiler path bypasses the Zod schema validation that the hand-authored rule path enforces. An LLM-compiled rule with a malformed condition could crash the evaluator.

**Recommendation:**
- Register explicit allow-list policies for read-only tool classes to fast-path low-risk calls.
- Add a regex complexity budget check (e.g. reject patterns with more than 100 characters or nested quantifiers) before storing a policy with a `matches` condition.
- Emit `audit_only_violation_rate` metric; alert when rate exceeds threshold.
- Run Zod schema validation on LLM-compiled policies before persisting.

---

### 4. Guardian Decision Engine (`packages/guardian`)

**What it does:** A second, independent policy decision engine (`GuardianDecisionEngine`) that gates actions through configurable `PolicyTier` checks. Acts as a secondary firewall beyond `policy-engine`.

**Strengths:**
- Fully independent of `policy-engine` — uses a different code path, preventing a single bug from bypassing both layers.
- `GuardianDecisionEngine` is referenced in `agents-core` exports and integrated into `cognitive-runtime` via the `guardianEnabled` flag.
- `GuardianBlockError` carries the action and reason, making the block auditable.

**Gaps:**
- Guardian block events are caught by the cognitive orchestrator and recorded as `guardian_blocked` phase outcomes, but the `BlockedAction` details are not automatically appended to the `EvidenceLedger` — only the phase status changes.
- Guardian bypass is possible by setting `guardianEnabled: false` in `CognitiveContext`. There is no policy-level prohibition on disabling the guardian in production environments.

**Recommendation:** Bind `guardianEnabled: false` to development/staging environments only via an environment variable check. Raise an error if `guardianEnabled: false` is used with `environment: 'production'`.

---

### 5. Approval Gate (`packages/agents-core/approval-gate.ts`)

**What it does:** Submits a pending approval request to `@workspace/approvals-inbox`, then polls for a verdict (`approved` / `rejected`). Timeout behavior raises `AgentRunError(category: 'approval_timeout')`.

**Approval Gate Data Model:**

```typescript
interface ApprovalGateRequest {
  runId: string;
  stepId: string;
  stepName: string;
  toolId?: string;
  action: string;
  justification: string;
  projectedImpact: string;
  projectedRisk: string;
  domain?: string;
  surface?: string;
}
```

**Strengths:**
- Approval timeout is a hard stop — the run does not continue without a verdict.
- `preloadApproval` provides a testing/CI escape hatch with named `actor` and `note` for auditability.
- `ApprovalVerdict` is stored in the approvals-inbox for audit retrieval.
- Run status transitions to `pending_approval` and back to `running` are emitted to the observability pipeline.

**Gaps:**
- `projectedImpact` and `projectedRisk` are free-form strings — approvers see human-readable descriptions but there is no structured risk score that an approval workflow could use for automated escalation routing.
- No timeout is declared at the `ApprovalGateRequest` level — the poll interval and maximum wait are hard-coded in `requestApproval`. Callers cannot specify a custom approval deadline per action.
- Approval verdicts are not propagated back to the `PlanStep.rollbackPoints` — if an approved action later fails, the rollback point exists but the approved state is not linked to it, making rollback authorization ambiguous.
- There is no support for multi-party approval (M-of-N approvers). High-blast-radius actions (`blastRadius: 'global'`) should require multiple approvers.

**Recommendation:**
- Add `structuredRisk: { score: number; category: RiskLevel; blastRadius: BlastRadius }` to `ApprovalGateRequest`.
- Support `requiredApprovers: number` (minimum M-of-N) in the gate request.
- Link `approvalId` from the gate response back to `PlanStep.rollbackPoints[].approvalRef`.

---

### 6. Sensitivity-Aware Data Handling

**What is declared:**

- `SensitivityLevel`: `public | internal | confidential | restricted` on `MemoryEntry`.
- `entitySensitivity` on `PolicyEvaluation` — triggers `Data Privacy Sensitivity Guard`.
- `DataClassification` on shared contracts.

**What is enforced:**

- Policy evaluation blocks/gates actions on `restricted` and `confidential` data — ✓
- PII redaction runs on prompt text — ✓
- Memory entries are tagged with sensitivity — ✓

**What is NOT enforced:**

- No guard preventing `restricted` memory entries from being included in prompts sent to external (non-local) model endpoints.
- No guard preventing `confidential` step outputs from being written back to `session`-scoped memory accessible by lower-privileged agents in the same session.
- No cross-domain sensitivity isolation: memory from the `sentra` domain (security findings) can be queried by agents operating in the `terra` domain if they share a session.

**Recommendation:**
- In the memory context builder (wherever `MemoryStore.list()` feeds prompt context), filter out entries with `sensitivity ≥ confidential` when the target model endpoint is `provider !== 'local'`.
- Add a `scopedTo` field to `MemoryEntry` representing the minimum agent tier required to read it.
- Domain isolation: add a `domain` filter to `MemoryStore` operations invoked from a cognitive loop — restrict reads to entries matching the loop's `context.domain`.

---

## Audit Metadata Review

Every action in the execution path emits:

| Metadata Field | Source | Completeness |
|----------------|--------|--------------|
| `traceId` | `AgentRunContext`, `AgentRun` | Always present |
| `runId` | `AgentRun` | Always present |
| `stepId` | `StepDefinition` | Always present |
| `agentId` | `AgentRunOptions` | Optional |
| `domain` | `AgentRunOptions` | Optional |
| `approvalId` | Approval gate | Present when approval required |
| `policyEvaluationId` | `PolicyEvaluation` | Present when policy evaluated |
| `toolId` | `StepDefinition` | Optional |
| `guardian_outcome` | `ExecuteStepResult.guardianOutcome` | Present when guardian active |
| `actor` | Approval verdict | Present on approval events |

**Gap:** `agentId`, `domain`, and `toolId` are optional throughout. If a step is constructed without these, the audit record is incomplete. Recommendation: make `agentId` and `domain` required in `AgentRunOptions` for production contexts.

---

## Guardrail Coverage Summary

| Risk Scenario | Guardrail(s) Active | Outcome |
|---------------|---------------------|---------|
| High-cost autonomous action | Policy engine (cost guard) | Requires admin approval |
| Regulatory-exposed action | Policy engine (regulatory guard) | Requires compliance approval |
| Restricted/confidential data | Policy engine (privacy guard) | Requires privacy approval |
| Irreversible action | Policy engine (irreversible guard) | Requires admin approval |
| PII in prompt | PII redactor | Redacted before model call |
| Unauthorized tool for role | Capability resolver | Blocked with reason |
| Injection in prompt | PII redactor (heuristic) | Removed |
| Guardian policy violation | Guardian engine | Phase blocked |
| Approval timeout | Approval gate | Run fails with `approval_timeout` |
| Tool rate limit exceeded | Rate limiter | Throws (not categorized) |
| `restricted` memory in external prompt | **No guardrail** | **Gap — data exposure risk** |
| Cross-domain memory access | **No guardrail** | **Gap** |
| `guardianEnabled: false` in prod | **No guardrail** | **Gap** |

---

## Conclusion

The approval gate architecture is robust — no high-risk action can execute without a verdict from the `approvals-inbox`. The most significant gaps are: (1) no single mandatory choke-point that guarantees all guardrail layers run in sequence; (2) `restricted` memory entries can flow into external model prompts; (3) cross-domain memory isolation is not enforced at the store level. Addressing these three gaps would substantially close the remaining attack surface.
