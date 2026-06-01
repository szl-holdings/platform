# SZL Holdings — Policy Registry Specification

**Date:** April 28, 2026
**Status:** Specification — implementation tracked in `lib/policy-engine` and `packages/guardian`

---

## Purpose

The Policy Registry is the authoritative catalog of every governance rule, approval policy, and risk-tier constraint enforced by the SZL platform. It defines what agents, users, and automated workflows are permitted to do — and under what conditions.

The registry is the runtime source of truth for the Covenant Policy engine. Every approval gate evaluation, risk tier determination, and policy violation event references an entry in this registry.

---

## Architecture

```
Policy Registry
    ↓
Covenant Policy Engine (lib/covenant-policy)
    ↓
Guardian Risk Evaluator (packages/guardian)
    ↓
Approval Gate (lib/approvals)
    ↓
Proof Chain Entry (lib/proof-chain)
```

Every policy evaluation produces an immutable proof chain entry recording: which policy was evaluated, what the result was, who was involved, and what action followed.

---

## Registry Entry Schema

```typescript
interface PolicyRegistryEntry {
  id: string;
  name: string;
  version: string;
  domain: "global" | "maritime" | "security" | "real-estate" | "legal" | "advisory" | "portfolio";
  category: "approval" | "data-access" | "agent-action" | "escalation" | "rate-limit" | "audit";
  risk_tier: "low" | "medium" | "high" | "critical";
  description: string;
  rules: PolicyRule[];
  required_approvers: ApproverSpec[];
  fallback_action: "block" | "escalate" | "queue" | "alert";
  audit_requirement: "none" | "log" | "proof-chain" | "proof-chain-multi-approver";
  effective_from: string; // ISO 8601
  effective_until?: string; // ISO 8601, omit for indefinite
  owner: string; // Role or team responsible
  last_reviewed: string;
  evaluation_count: number; // Runtime counter
  violation_count: number; // Runtime counter
}

interface PolicyRule {
  id: string;
  condition: string; // Expressed in policy DSL
  effect: "permit" | "deny" | "escalate" | "require-approval";
  priority: number;
  rationale: string;
}

interface ApproverSpec {
  role: string;
  min_count: number;
  timeout_hours: number;
  escalation_role?: string;
}
```

---

## Risk Tier Definitions

| Tier | Definition | Required Controls | Proof Chain |
|------|-----------|-------------------|-------------|
| **Low** | Informational only, no operational consequence | Logging | Optional |
| **Medium** | Influences decisions but not autonomous execution | Confidence scoring, audit log, evidence attachment | Required |
| **High** | Directly affects operational or financial outcomes | Human approval gate, full proof chain, decision replay | Required |
| **Critical** | Regulatory, financial, or legal impact | Multi-approver gate, legal review, enhanced monitoring | Required + multi-sig |

---

## Current Policy Catalog

### Global Policies

| Policy ID | Name | Risk Tier | Gate |
|-----------|------|-----------|------|
| `global.auth.deny-default` | Deny-by-default access control | Critical | System-enforced; no override |
| `global.audit.write-event` | Audit event on every write | Medium | Automated |
| `global.ai.no-unsupervised-action` | AI cannot execute without human confirmation | High | Approval required |
| `global.tenant.org-scope` | All data scoped to `org_id` | Critical | System-enforced |
| `global.rate.auth-endpoints` | Rate limiting on authentication routes | Medium | Automated |
| `global.csrf.state-mutation` | CSRF protection on state-mutating routes | High | System-enforced |

### Domain-Specific Policies

| Policy ID | Domain | Name | Risk Tier | Gate |
|-----------|--------|------|-----------|------|
| `maritime.ais.simulated-data` | Maritime | Flag simulated AIS data in UI | Low | Automated label |
| `maritime.alert.delay-cascade` | Maritime | Port delay → cross-domain cascade trigger | Medium | Auto-route with logging |
| `security.incident.legal-hold` | Security | Critical incident → legal hold initiation | High | Team lead approval |
| `security.cve.critical-escalate` | Security | CVSS 9.0+ → executive alert | High | Auto-alert + approval |
| `realestate.distress.pipeline` | Real Estate | Distressed property flagging | Medium | Audit log required |
| `legal.hold.preservation` | Legal | Evidence preservation on legal hold trigger | Critical | Multi-approver |
| `portfolio.risk.rebalance` | Portfolio | Portfolio risk rebalance recommendation | High | Department head approval |
| `advisory.engagement.create` | Advisory | New client engagement creation | Low | Standard workflow |

---

## Policy Evaluation Lifecycle

```
1. Action Intent
   └─ Agent or user requests a consequential action

2. Policy Lookup
   └─ Covenant Policy engine queries registry for matching policies
   └─ All matching policies evaluated in priority order

3. Risk Tier Determination
   └─ Highest applicable risk tier governs

4. Gate Evaluation
   └─ Low: auto-permit with logging
   └─ Medium: audit log + evidence attachment
   └─ High: require human approval
   └─ Critical: require multi-approver + legal review flag

5. Approval Workflow (if required)
   └─ Approval request sent to designated approver role
   └─ Timeout triggers escalation per policy spec
   └─ Approval or rejection recorded in Proof Chain

6. Execution (if approved)
   └─ Action executed with actor attribution
   └─ Proof Chain entry created: actor, timestamp, policy refs, evidence

7. Outcome Tracking
   └─ Outcome Graph records post-execution result
   └─ Calibration loop updates policy evaluation scores
```

---

## Policy Authoring Guidelines

1. **Every policy must have a risk tier.** No policy entry without `risk_tier` is valid.
2. **Every medium+ policy must produce a proof chain entry.** The `audit_requirement` field enforces this.
3. **Every critical policy must have a designated owner.** The `owner` field is mandatory.
4. **Policies are versioned.** Use semver for the `version` field. Breaking changes require major version bump.
5. **Annual review minimum.** `last_reviewed` must be within 12 months. Stale policies are flagged in CI.
6. **No policy override without documented rationale.** Any override is a proof chain event.

---

## Integration Points

| System | How Policy Registry Is Used |
|--------|---------------------------|
| `lib/covenant-policy` | Runtime policy evaluation engine |
| `packages/guardian` | Risk tier determination and escalation |
| `lib/approvals` | Approval workflow orchestration |
| `lib/proof-chain` | Records every policy evaluation decision |
| Command Arena | Evaluates policy adherence in scored scenarios |
| AI Ops Dashboard | Surfaces policy violation events |
| Trust Center | Publishes policy summary for compliance review |

---

## Operational vs. Roadmap

| Capability | Status |
|-----------|--------|
| Policy evaluation at approval gates | **Operational** — `lib/covenant-policy`, `packages/guardian` |
| Risk tier enforcement | **Operational** — enforced in every governed workflow |
| Proof chain on policy decisions | **Operational** — every approval gate creates chain entry |
| Policy registry UI (visual dashboard) | **Roadmap** — Phase 2, Days 30–60 |
| Policy conflict detection | **Roadmap** — Phase 2 |
| Automated policy expiry alerts | **Roadmap** — Phase 2 |
| REGO/OPA policy export | **Roadmap** — Phase 3 |

---

*Cross-reference: `docs/PROMPT_AND_POLICY_REGISTRY.md` for prompt governance. `docs/MODEL_POLICY_REGISTRY.md` for AI model governance. `docs/CORE_PLATFORM_PRIMITIVES.md` for implementation status.*
