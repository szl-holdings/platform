# Agent Attribution Model

**Status:** Canonical
**Source of truth:** `lib/db/src/schema/alloy.ts` (alloyAuditLog, alloyOwners), `lib/db/src/schema/approvals.ts` (approvalRequests, approvalAuditTrail), `artifacts/api-server/src/lib/alloy-orchestration.ts`
**Companion:** `human-vs-agent-action-taxonomy.md`, `operating-loop-spec.md`, `action-and-decision-receipts.md`

---

## 0. Implementation status

This document defines the actor model the platform commits to. Statements are tagged:

- **[Implemented]** — backed by current schema columns or runtime code.
- **[Target contract]** — a stated commitment currently expressed in convention or application-layer code, with schema-level enforcement as the hardening target.

The three actor categories (`user`, `system`, `agent`) and the audit-row attribution fields are implemented today. The richer `delegatedBy` / `originator` payload structures described below are the contract between agent runtime and audit log; some are emitted as JSON `metadata` rather than as first-class columns and are targets for promotion to typed fields.

---

## 1. Purpose

This spec defines the actor model — how the platform records **who** caused any state transition, **on whose behalf** they acted, and **with what authority**. It governs every audit row, decision receipt, and action receipt.

The attribution model is the precondition for accountability. Without it, "AI did it" is an excuse rather than a fact. With it, every action resolves to a chain of named, role-bound actors with documented authority and revocable delegation.

---

## 2. Actor categories

The platform recognizes three actor categories, persisted in `alloyAuditLog.actorType` and propagated through the receipt chain:

### 2.1 `user` — a named human

A human operator authenticated via the platform's auth layer. Identified by:
- `actorUserId: integer` — foreign key to `users.id`
- `actorLabel: string` — display name snapshot at action time (so the audit row remains readable even if the user is later renamed or deactivated)
- `actorRole: string` — the role under which the user acted (e.g. `ops`, `analyst`, `compliance`, `admin`)

A user action carries the user's session, IP address, and user agent (`alloyAuditLog.ipAddress`, `userAgent`). User actions are non-repudiable — the user is presumed to have intended the action.

### 2.2 `agent` — a named AI agent acting on behalf of an authority

An AI system invoked under a specific configuration to perform a specific class of task. Identified at the audit row by `actorType = "agent"`. The agent's identity and delegation context are captured in:
- `agentId: string` — stable agent identifier (e.g. `agent:vessels-screening:v3`), recorded in audit `metadata` and in `alloy_ai_decisions.modelRoute`
- `modelRoute: string` — the underlying model and provider (e.g. `claude-sonnet-4.5/anthropic`), persisted as a column on `alloy_ai_decisions`
- `delegatedBy: { userId, role } | { policy: string }` — [Target contract] the authority under which the agent acted, captured today in audit `metadata` and decision `rawInput`/`rawOutput`; promotion to first-class columns is a hardening target

An agent action is **always** delegated. There is no such thing as an autonomous agent action without a documented delegating authority. The delegation is one of:

- **User delegation** — a specific user invoked or scheduled the agent. `delegatedBy.userId` and `delegatedBy.role` are populated. The user is co-attributed and is the policy carrier for any approval the agent's output requires.
- **Policy delegation** — a covenant policy authorizes the agent to act under defined conditions (e.g. `auto_run_low_risk_low_confidence_blocked`). `delegatedBy.policy` references the policy ID. The policy is the policy carrier; the policy must itself have been approved by a named user (recorded in `approvalRequests`).

### 2.3 `system` — platform infrastructure

The platform itself acting under no human or AI direction — scheduled jobs, retry orchestration, expiry sweeps, hash chain writes, durable queue mechanics. Identified by:
- `actorLabel: "system"` (or a more specific label like `"system:retry-scheduler"`)
- `actorUserId: null`

System actions are deterministic and non-creative. They cannot generate decisions, approve actions, or move money. They can only schedule, retry, expire, escalate, or audit.

---

## 3. Attribution at every loop stage

Each stage of the operating loop records actor attribution. The recording mechanism is consistent across stages:

| Loop stage | Object                       | Attribution fields                                           |
|------------|------------------------------|--------------------------------------------------------------|
| OBSERVE    | `alloySignals`               | `source`, `sourceType` (system); `ownerUserId` (assigned user)|
| EVALUATE   | `alloyWorkflows`             | `ownerUserId`, `assignedUserId`; audit row records actorType  |
| DECIDE     | `alloy_ai_decisions`         | `modelRoute`; for human decisions, `modelRoute = "human"` and approval audit captures user |
| APPROVE    | `approvalRequests`           | `requestedById`, `requestedByRole`, `approvedById`, `rejectedById`, `escalatedToId`, `serviceAttribution` |
| APPROVE    | `approvalAuditTrail`         | `actorId`, `actorRole`, `correlationId`, `serviceAttribution` |
| ACT        | `alloyActions`               | `assignedUserId`; receipt's `result.actorAttribution` carries full chain |
| PROVE      | `auditChainEvents`           | `actorUserId`, `actorLabel`; immutable                        |
| PROVE      | `alloyAuditLog`              | `actorType`, `actorUserId`, `correlationId`                   |

---

## 4. Delegation and acted-on-behalf-of semantics

Delegation is the mechanism by which one actor authorizes another to act with their authority. The platform supports four delegation patterns:

### 4.1 User-to-agent delegation (the most common)

A user invokes or schedules an agent to perform a task. The agent acts; the user is co-attributed. Example:

```jsonc
{
  "actorType": "agent",
  "agentId": "agent:vessels-screening:v3",
  "modelRoute": "claude-sonnet-4.5/anthropic",
  "delegatedBy": {
    "userId": 42,
    "role": "ops",
    "delegatedAt": "2026-04-16T13:05:00Z",
    "scope": "screen_inbound_signals_for_vessel_domain"
  }
}
```

**Rules:**
- The agent's authority is bounded by `delegatedBy.scope`. Actions outside scope are rejected at the policy layer.
- The user is the policy carrier — if the agent's output requires approval, the approval is sought from a different user (separation of duties).
- The user can revoke the delegation at any time. Revocation is recorded as an audit event; in-flight actions complete but no new actions are dispatched.

### 4.2 Policy-to-agent delegation (autonomous low-risk operation)

A covenant policy authorizes an agent to act without per-invocation user direction, under defined conditions. Example:

```jsonc
{
  "actorType": "agent",
  "agentId": "agent:terra-distress-classifier:v2",
  "modelRoute": "gpt-5/openai",
  "delegatedBy": {
    "policy": "policy:auto_classify_distress_signals_p4_only",
    "policyApprovedBy": 7,
    "policyApprovedAt": "2026-03-01T09:00:00Z",
    "scope": "classify_distress_signals_riskLevel_le_P4"
  }
}
```

**Rules:**
- The policy must itself have been approved by a named user (recorded in `approvalRequests` with `actionClass = "policy_change"`).
- The policy's `scope` is the agent's authority bound. Actions outside the bound are rejected.
- Policy delegations have a mandatory expiry; long-lived policies must be re-approved on a defined cadence (default: 90 days). Expired policies fall back to user-delegation requirement.

### 4.3 User-to-user delegation (acting-as)

A user with sufficient role acts on behalf of another user (e.g. an admin completing a task for an absent operator). Recorded as:

```jsonc
{
  "actorType": "user",
  "actorUserId": 7,
  "actorRole": "admin",
  "delegatedBy": {
    "userId": 42,
    "role": "ops",
    "reason": "operator on PTO; authorized via offline channel",
    "delegatedAt": "2026-04-16T13:05:00Z"
  }
}
```

**Rules:**
- The acting user's role must dominate the delegating user's role (admin > ops; ops cannot act-as admin).
- The delegation reason is required and is captured in the audit log `notes` field.
- The acting user is fully attributed. The delegating user is co-attributed for context but is not held responsible for the action.

### 4.4 System-on-behalf-of (retry, expiry, escalation)

When the system performs an automated action that completes work originally initiated by a user or agent, the system is the actor and the originator is recorded as the work's owner:

```jsonc
{
  "actorType": "system",
  "actorLabel": "system:retry-scheduler",
  "delegatedBy": null,
  "originator": {
    "type": "user" | "agent",
    "userId": 42,
    "agentId": "agent:vessels-screening:v3",
    "originalActionId": 8732
  }
}
```

The system actor cannot generate new decisions or approve actions. It can only continue, retry, expire, or escalate work originated by a user or agent.

---

## 5. Approval semantics under delegation

When an action requires approval (`approvalRequired = true` on the decision), the approval flow respects delegation as follows:

| Originator         | Approver requirement                                              |
|--------------------|-------------------------------------------------------------------|
| User A directly    | A different user with `requiredApproverRole` (no self-approval)   |
| Agent delegated by user A | A different user with `requiredApproverRole` (A cannot self-approve their delegated agent) |
| Agent under policy P (approved by user B) | A different user with `requiredApproverRole` (B cannot self-approve their policy's outputs) |
| System (retry/expiry) | Cannot generate approval-required actions; rejected at policy layer |

**[Target contract] Separation of duties:** The approver MUST NOT be the originator, the originator's delegating user, or the policy's approving user. The route layer requires reviewer roles via `requireRole(...)` but does not currently reject self-approval at the route or DB level — this is the most important hardening target in the attribution model and is tracked as a P0 platform-hardening item.

---

## 6. Identity context preservation across async boundaries

When a workflow crosses an async boundary — durable job queue, scheduled review, retry — the actor identity context is preserved via:

- `correlationId` — propagated from the originating request through every job and audit row
- `originator` — captured in the job payload at enqueue time
- `delegatedBy` — captured in the job payload at enqueue time
- `serviceAttribution` — names the service that performed the transition (e.g. `api-server`, `forge-runtime`, `alloy-scheduler`)

A workflow that is queued by user A, executed by the durable runtime, paused for approval by user B, resumed by the system after approval, and finally completed by an agent on behalf of policy P will have an audit trail with **every one of those actors** named in their respective rows. No transition is anonymous.

---

## 7. The five attribution invariants

These are the observable commitments of the attribution model. Each is tagged with its current enforcement layer:

1. **No anonymous mutations.** [Implemented at application layer] Every row written by `writeAuditLog()` carries `actorType` (one of `user`, `system`, `agent`) and, for non-system actors, `actorUserId`. Schema does not yet enforce a CHECK constraint requiring `(actorType = 'system') OR (actorUserId IS NOT NULL)`; this is a hardening target.

2. **No self-approval.** [Target contract] No approval row should have `requestedById = approvedById` or `requestedById = rejectedById`. The route layer requires reviewer roles but does not reject self-approval; route- and DB-level enforcement (CHECK constraint) is a hardening target. This is the highest-priority attribution gap.

3. **No agent without delegation.** [Target contract] No `alloy_ai_decisions` row with `modelRoute != "human"` should exist without a documented `delegatedBy` (user-id or policy-id) recorded in the originating request payload or audit metadata. Today this is a convention enforced by the agent runtime; schema-level enforcement is a hardening target.

4. **No execution without provenance.** [Target contract] No `alloyActions.status = "completed"` row should exist without `result.decisionId` or `result.approvalId` populated. Today this is enforced by the action-completion handlers; schema-level enforcement is a hardening target.

5. **No silent revocation.** [Target contract] Delegation revocations should be first-class audit events with their own `auditChainEvents` row (`actionType = "delegation_revoked"`). In-flight delegated actions complete; new actions are rejected. Today the platform supports the revocation event type but does not yet automatically reject in-flight new actions purely on revocation; this is a hardening target.

---

## 8. What this enables (and what it doesn't)

**Enables:**
- A regulator can ask "who decided this?" and the platform answers with a named user, agent, and policy.
- An incident review can reconstruct the full attribution chain for any action without privileged access to logs.
- An organization can revoke an agent's authority and trust that no further actions occur in that scope.
- A diligence review can verify, on its own, that no AI action escaped human approval where required.

**Does not enable (out of scope):**
- Identity proofing (whether user 42 is really Alice). That is the auth layer's responsibility.
- Intent inference (whether user 42 *meant* to do what they did). That is a governance question, not an attribution question.
- Consent management for the data the agent processed. That is a data governance question handled in `lib/data-connectors`.

---

## 9. Compatibility

All actor types in this spec (`user`, `system`, `agent`) correspond to existing schema columns. Delegation fields (`delegatedBy`, `originator`) are captured today in audit `metadata` and decision `rawInput`/`rawOutput`; promotion to first-class typed columns is a hardening target. The five attribution invariants in §7 are partially enforced today (per their individual tags) and represent the platform's commitment, with route- and DB-level enforcement of the [Target contract] items as the hardening roadmap.
