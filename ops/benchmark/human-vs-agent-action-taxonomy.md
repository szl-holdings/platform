# Human vs Agent Action Taxonomy

**Status:** Canonical
**Companion:** `agent-attribution-model.md`, `operating-loop-spec.md`, `action-and-decision-receipts.md`

---

## 0. Implementation status

This taxonomy describes the actor categories and subtypes the platform commits to. Categorization at the audit row level (`actorType ∈ {user, system, agent}`) is implemented today. Subtype distinctions (e.g. USER:DIRECT vs USER:OVERRIDE, AGENT:PROPOSE vs AGENT:EXECUTE) are derived from the combination of `actorType`, the touched object, and the action verb — they are not first-class columns. Promotion of subtype to a first-class field is a target for the next attribution-model hardening pass.

---

## 1. Purpose

This taxonomy answers a single question for every action on the platform: **what kind of actor performed it, and what is the platform's commitment about that action's reviewability and reversibility?**

This matters because:
- Operators need to know, at a glance, whether they are looking at a human's judgment, an AI's recommendation, or a system's housekeeping.
- Compliance reviewers need to filter audit trails by actor category to assess governance posture.
- The platform makes different commitments about accountability, reversibility, and approval gates for each category.

The taxonomy aligns with the three actor categories in `agent-attribution-model.md` (user, agent, system) and refines them into action subtypes with explicit commitments.

---

## 2. The taxonomy at a glance

```
                                ACTION
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
          USER                  AGENT                 SYSTEM
        (human)             (AI, delegated)       (infrastructure)
            │                     │                     │
   ┌────────┼────────┐    ┌──────┼──────┐      ┌──────┼──────┐
   │        │        │    │      │      │      │      │      │
 DIRECT  REVIEW  OVERRIDE PROPOSE EXECUTE OBSERVE SCHEDULE RETRY EXPIRE
                          (under  (under  (read-
                           gate)  policy) only)
```

| Category | Subtype  | Can mutate state? | Requires approval? | Reversible? |
|----------|----------|-------------------|-------------------|-------------|
| USER     | DIRECT   | ✅                 | Per policy        | Per action  |
| USER     | REVIEW   | ✅ (approval state)| (is the approval) | ❌          |
| USER     | OVERRIDE | ✅                 | ✅ + audit reason | ❌          |
| AGENT    | PROPOSE  | ❌ (decision only) | N/A               | ✅ (reject) |
| AGENT    | EXECUTE  | ✅                 | ✅ if `approvalRequired` | Per action |
| AGENT    | OBSERVE  | ❌                 | N/A               | N/A         |
| SYSTEM   | SCHEDULE | ✅ (queue only)    | ❌                | Pre-execute |
| SYSTEM   | RETRY    | ✅ (re-attempt)    | ❌                | Pre-execute |
| SYSTEM   | EXPIRE   | ✅ (state→expired) | ❌                | ❌          |

---

## 3. USER actions

### 3.1 USER:DIRECT

A human operator performs an action directly via the operator UX or the API.

- **Examples:** Create a workflow, assign an action to a teammate, write a comment, upload a document, mark a signal as a duplicate.
- **Approval:** Required iff covenant policy specifies. Most low-impact direct actions are not gated.
- **Audit:** `actorType = "user"`, `actorUserId` set, `ipAddress` and `userAgent` captured.
- **Reversibility:** Per action — soft-delete and undo where the action supports it; otherwise irreversible.
- **Operator UX commitment:** Display "by <name>" with a click-through to the user profile and the originating session.

### 3.2 USER:REVIEW

A human operator reviews an approval request — approves, rejects, revises, or escalates it.

- **Examples:** Approve a sanctions notification before it sends, reject an AI-recommended escalation, escalate a high-risk action to a senior approver.
- **Approval:** This **is** the approval — meta-approval is not required.
- **Audit:** `approvalAuditTrail` row with `actorId`, `actorRole`, `fromStatus`, `toStatus`, `note`, `correlationId`.
- **Reversibility:** Irreversible. Once approved, the action proceeds. Once rejected, the workflow terminates. Re-opening requires a new approval request.
- **Operator UX commitment:** Display the reviewer's name, role, decision, and rationale. Display the time-to-review. Display the upstream decision and its evidence.
- **[Target contract]:** Reviewer SHOULD NOT equal requester (separation of duties). Currently enforced by operator workflow and audit review; route- and DB-level enforcement is a hardening target — see `agent-attribution-model.md` §7.

### 3.3 USER:OVERRIDE

A human operator with elevated authority performs an action that bypasses a normal gate — e.g. forcing a workflow to run without approval, manually editing an audit field, or canceling an in-flight action.

- **Examples:** `overrideApproval = true` on `startWorkflowRun`, manual cancellation of a queued action, force-completing a stuck workflow.
- **Approval:** Required for the override itself. Captured in `approvalRequests` with `actionClass = "override"` and `priority = "high"` minimum.
- **Audit:** Both the override request and the override action are audited. The override audit row carries `notes` containing the operator's stated reason (required field).
- **Reversibility:** Irreversible. Overrides are recorded as overrides — they do not retroactively become normal actions.
- **Operator UX commitment:** Visually distinguished from normal user actions (warning color, "OVERRIDE" badge). Reason text always displayed.

---

## 4. AGENT actions

### 4.1 AGENT:PROPOSE

An AI agent generates a recommendation. The proposal does not mutate operational state — it only creates a row in `alloy_ai_decisions` with `status = "proposed"`.

- **Examples:** "Recommend escalating vessel IMO 9876543 to sanctions team", "Recommend opening remediation workflow for signal 8732".
- **Approval:** Not applicable — proposals are not actions.
- **Audit:** `alloy_ai_audit_log` row with `endpoint`, `model`, `routeClass`, `confidence`, `latencyMs`. The decision row carries full provenance (evidence, confidence, model route).
- **Reversibility:** Fully reversible — a proposal can be rejected, expired, or revised. Until approved and executed, no state has changed.
- **Operator UX commitment:** Display "Proposed by <agent name>" with the model route, confidence, evidence list, and rationale. Display the human review buttons (approve, reject, revise) prominently.

### 4.2 AGENT:EXECUTE

An AI agent performs an operational action under a delegating authority (user delegation or policy delegation).

- **Examples:** Send a notification, update a record in an integrated system, attach a tag, post a comment.
- **Approval:** Required iff the originating decision had `approvalRequired = true`. For decisions that did not require approval (low risk, high confidence, within policy scope), execution proceeds directly.
- **Audit:** `alloyActions` row with the receipt structure including `actorAttribution` (carrying both the agent ID and the delegating authority). `auditChainEvents` row for the execution.
- **Reversibility:** Per action — depends on what the action did. Notifications are irreversible (you cannot un-send). External record updates may be reversible if the integrated system supports compensating writes.
- **Operator UX commitment:** Display "Executed by <agent name> on behalf of <user/policy>" with link to delegating authority. Display the action's side effects and external references explicitly.

### 4.3 AGENT:OBSERVE

An AI agent performs read-only inspection — fetching, summarizing, classifying — without producing a decision or mutating state.

- **Examples:** Summarize a document, classify a signal severity (where the classification feeds another agent's decision), enrich a signal with external context.
- **Approval:** Not applicable.
- **Audit:** Lightweight — read events are logged in `alloy_ai_audit_log` for billing and rate-limit purposes but do not enter the immutable hash chain.
- **Reversibility:** N/A — no state change.
- **Operator UX commitment:** Generally invisible to operators; surfaces only in cost/observability dashboards and in upstream decision provenance ("classified by …").

---

## 5. SYSTEM actions

### 5.1 SYSTEM:SCHEDULE

The platform queues a future task — a workflow run, an approval expiry check, a retry attempt.

- **Examples:** Enqueue `RUN_WORKFLOW` after approval, schedule `SCHEDULED_REVIEW` for approval expiry.
- **Approval:** Not required. Scheduling does not execute; it only queues.
- **Audit:** Audit row with `actorType = "system"`, `actorLabel = "system:scheduler"`. The originator (user or agent) is captured in the queued payload.
- **Reversibility:** Pre-execution — queued tasks can be cancelled before they run.
- **Operator UX commitment:** Visible in the scheduled-jobs view. Cancellation requires user authority.

### 5.2 SYSTEM:RETRY

The platform re-attempts a failed action under the standard retry policy.

- **Examples:** Re-enqueue a failed workflow with `retryCount += 1`, retry an external API call after transient failure.
- **Approval:** Not required for retries within the standard policy. Retries that exceed `MAX_RETRIES` do not occur — the workflow becomes terminal-failed.
- **Audit:** `auditChainEvents` row with `actionType = "retry_scheduled"` and the retry count. The original action's audit chain remains intact.
- **Reversibility:** Pre-execution.
- **Operator UX commitment:** Display retry count and next-attempt time on the workflow card. Display the original failure reason.

### 5.3 SYSTEM:EXPIRE

The platform expires a pending state — an unreviewed approval, an unused decision, a stale signal.

- **Examples:** `approval_expired` after `expiresAt` passes, `decision_expired` after TTL.
- **Approval:** Not required. Expiry is a deterministic policy operation.
- **Audit:** `auditChainEvents` row with `actionType = "approval_expired" | "decision_expired" | "signal_archived"` and the originator captured.
- **Reversibility:** Irreversible. Expiry is terminal; re-opening requires a new request from a user.
- **Operator UX commitment:** Notify the originator and the assigned approver. Display the expiry on the workflow card with the suggestion to re-request.

---

## 6. What an operator should see

The operator UX uses this taxonomy to provide consistent visual treatment for every action card, audit row, and timeline entry:

| Category   | Color cue            | Icon         | Default verbosity |
|------------|----------------------|--------------|-------------------|
| USER       | neutral (text color) | person       | full              |
| USER:OVERRIDE | warning (amber)   | shield-alert | full + reason     |
| AGENT      | accent (cyan)        | sparkles     | full + provenance |
| SYSTEM     | muted (low contrast) | gear         | collapsed by default |

**Hard rules for any UI rendering an action:**
- Never display an agent action without naming the agent and the delegating authority.
- Never display a system action without distinguishing it visually from user and agent actions.
- Never collapse override actions — they must always show the reason text.

---

## 7. Filtering and querying by category

The hash-chained audit trail (`auditChainEvents`) currently supports filtering on `domain`, `actionType`, `riskLevel`, `search`, and `since`:

```
GET /audit-chain/events?domain=vessels
GET /audit-chain/events?actionType=approval_expired
GET /audit-chain/events?riskLevel=high
GET /audit-chain/events?since=2026-04-01T00:00:00Z
GET /audit-chain/events?search=imo+9876543
```

Note that `auditChainEvents.riskLevel` is a free-text descriptor (typical values: `low`, `medium`, `high`, `critical`) and is distinct from `AlloyDecision.riskLevel` which uses the P0..P4 enum. The two surfaces serve different purposes — the audit chain is the cross-domain compliance ledger; the decision risk level is the per-decision risk classification.

The per-entity audit log (`alloyAuditLog`) is queryable via the database directly and supports filtering by `entityType`, `entityId`, `action`, `actorType`, `actorUserId`, and `correlationId`.

[Target contract] First-class API filtering on `actorType`, `agentId`, and `delegatedBy` for the hash-chained ledger is a planned enhancement.

This is the primary mechanism by which a compliance reviewer or analyst answers questions like:
- "How many actions in the last 30 days were autonomous agent executions under policy delegation?"
- "What proportion of approvals were reviewed by the same person who requested them?" (Should be zero — separation of duties.)
- "Which agents have the highest rejection rate on their proposals?" (Calibration signal.)

---

## 8. Edge cases and how they map

| Scenario                                                   | Mapping                                                              |
|------------------------------------------------------------|----------------------------------------------------------------------|
| Operator approves their own AI agent's proposal            | USER:REVIEW. [Target contract] Should be rejected by separation-of-duties; today the operator workflow flags this and audit review surfaces it, with route enforcement as the hardening target. |
| Agent acts on behalf of a deactivated user                 | AGENT:EXECUTE under expired delegation. [Target contract] Should be rejected at the policy layer; auth middleware blocks the underlying call today via session expiry. |
| System retries an action that the user has cancelled       | SYSTEM:RETRY. [Implemented] `RETRY_WORKFLOW` checks `workflow.status === "pending"` before re-enqueuing; cancelled workflows are skipped. |
| Agent observes data the user is not authorized to read     | AGENT:OBSERVE. Authority check inherits from delegating user; rejected at data-connector layer where row-level authority is enforced. |
| Operator manually edits an audit field                     | [Implemented] No UPDATE/DELETE routes exist on audit tables. [Target contract] DB-role separation enforces INSERT-only at the schema layer. |
| Expired approval is re-approved later                      | [Implemented] Once `status = "expired"`, the row is terminal; reviewing it is rejected. A new `approvalRequest` is required. |

---

## 9. Compatibility

The three top-level categories (`user`, `system`, `agent`) map directly to the `actorType` column in `alloyAuditLog` and are recorded on every transition. The subtypes defined in this taxonomy (USER:DIRECT, USER:REVIEW, USER:OVERRIDE, AGENT:PROPOSE, AGENT:EXECUTE, AGENT:OBSERVE, SYSTEM:SCHEDULE, SYSTEM:RETRY, SYSTEM:EXPIRE) are derivable from the combination of `actorType`, the touched object, and the action verb but are not first-class columns; promotion to a typed `actionSubtype` column is a hardening target. Specific commitments (notably the separation-of-duties rule in USER:REVIEW) are flagged inline as [Target contract] where route- or DB-level enforcement is still pending.
