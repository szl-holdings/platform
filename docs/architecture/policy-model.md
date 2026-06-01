# Policy Model — SZL Holdings Platform (Canonical)

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical — supersedes `PROOF_AND_POLICY_MODEL.md`

> **Navigation:** [architecture.md](architecture.md) · [ontology.md](ontology.md) · [telemetry-model.md](telemetry-model.md) · [app-moats.md](app-moats.md)

---

## Overview

The SZL policy model governs what agents, users, and services can do — and enforces human-in-the-loop at the platform layer, not the UI layer. It has two complementary components:

1. **Covenant Policy** (`lib/covenant-policy`, `packages/policy-engine`) — permission evaluation, approval gates, and governance rule enforcement.
2. **Proof Chain** (`lib/proof-chain`) — immutable, cryptographically verifiable audit trail for every consequential action and every AI output.

The two components form a trust envelope around every decision: policy controls what is allowed, proof records what happened.

---

## Covenant Policy

### Evaluation Contract

Every request for a consequential action — whether initiated by a user, an agent, or a service — passes through `checkPermission()`. The result is one of three outcomes:

```ts
type PolicyEffect = "permit" | "deny" | "escalate";
```

- **`permit`** — action proceeds immediately; a proof entry is recorded.
- **`deny`** — action is blocked; a denial entry is logged; the caller receives a clear reason.
- **`escalate`** — action is held; an `ApprovalRequest` is created; the designated approver(s) are notified.

No code path bypasses this evaluation. The API middleware enforces it on every authenticated route that mutates governed state.

### Policy Structure

A policy is a named set of rules that match requests to effects:

```
Policy: "AI Agent Execution Controls"
  Rule 1: PERMIT  — agents MAY generate recommendations
  Rule 2: ESCALATE — agents requesting financial mutations → manager approval
  Rule 3: ESCALATE — agents modifying legal matter status → analyst + manager
  Rule 4: DENY    — agents deleting audit records → always blocked
```

Policies reference: subject (user role or agent identity), resource type, action class, and conditions (e.g. amount thresholds, domain, org tier).

### Policy Templates

Pre-built templates shipped with the platform:

| Template | Domain | Governs |
|----------|--------|---------|
| `ai_advisory_standard` | All | Agents recommend, never execute autonomously |
| `financial_approval_chain` | Lyte | Financial mutations require dual approval |
| `legal_matter_governance` | Counsel | Matter status changes require review |
| `vessel_sanctions_response` | Vessels | Sanctions alerts require immediate compliance review |
| `security_incident_response` | Security | Incident escalation and response approval |
| `client_communication_review` | Carlota | Client-facing content requires approval before delivery |

### Approval Flow

```
Action requested
    │
    ▼
checkPermission(request)
    ├── PERMIT ──────────► Execute → Proof Chain entry
    │
    ├── ESCALATE ─────────► ApprovalRequest created
    │                            │
    │                       Notify approver(s)
    │                            │
    │                    ┌───────┴────────┐
    │                 Approved         Denied
    │                    │                │
    │               Execute          Block + log
    │                    │
    │               Proof Chain entry
    │
    └── DENY ─────────────► Block → Denial log entry
```

The approval decision itself is recorded in the Proof Chain. An approval record is never mutable after it is written.

### Autonomy Modes

The platform supports graduated autonomy, selectable per org and per domain:

| Mode | Description |
|------|-------------|
| `suggest` | Agent proposes only; human initiates every action |
| `supervised` | Agent proposes and can queue actions; human approves before execution |
| `conditional` | Agent executes low-risk actions automatically; high-risk requires approval |
| `full_auto` | Agent executes within policy limits; policy engine is the sole gate |

Current platform default: `supervised` (TIER-2 Supervised Autonomy). `full_auto` requires explicit founder approval to activate per org.

---

## Proof Chain

### What Is Recorded

Every consequential event in the platform produces a Proof Chain entry. An entry is append-only — it can never be modified or deleted.

```ts
interface ProofEntry {
  id: string;
  contentId: string;
  sourceClass: SourceClass;
  modelId?: string;        // if AI-generated
  promptHash?: string;     // reproducibility reference
  parentProofId?: string;  // derivation chain
  inputSources: EvidenceRef[];
  reviewState: ReviewState;
  exportSafetyState: ExportSafetyState;
  actorId: string;
  actorType: "human" | "agent" | "system";
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

type SourceClass =
  | "llm_generated"
  | "human_authored"
  | "system_computed"
  | "external_ingested"
  | "hybrid";

type ReviewState = "unreviewed" | "approved" | "flagged" | "retracted";

type ExportSafetyState = "safe" | "restricted" | "pending_review" | "blocked";
```

### Export Safety

Before any AI-generated content can leave the platform (client report, exported document, API response to an external consumer), it must pass `assertExportSafe()`:

```
Content ready for export
    │
    ▼
isExportSafe(proofId)
    ├── safe ─────────────► Proceed
    ├── restricted ───────► Internal only — block external export
    ├── pending_review ───► Require human review first
    └── blocked ──────────► Cannot export — flagged or retracted
```

This check is a platform primitive, not an opt-in feature. Bypassing it is a policy violation that is logged.

---

## Trust Guarantees

These guarantees are structural — enforced by the library layer, not by convention:

| Guarantee | Enforcement |
|-----------|------------|
| AI cannot execute consequential actions autonomously | Covenant Policy gates all AI-triggered mutations |
| Every AI output has provenance | `tagAIContent()` is called for all AI-generated content |
| Content cannot be exported without review | `assertExportSafe()` guards all export paths |
| Every approval is attributed | `reviewApproval()` records reviewer identity, timestamp, rationale |
| The audit trail is immutable | Proof Chain entries are append-only |
| Policies are version-controlled | Policy changes are themselves recorded in the Proof Chain |
| Evidence and freshness are never stripped | Types enforce presence; see [ontology.md](ontology.md) |

---

## Package Map

| Concept | Package |
|---------|---------|
| Policy evaluation (platform) | `lib/covenant-policy` |
| Policy evaluation (agentic) | `packages/policy-engine` |
| Guardrail enforcement | `packages/policy-engine/guardrails` |
| Proof chain recording | `lib/proof-chain` |
| Approval gate enforcement | `packages/guardian` |
| Approval UI surfaces | `lib/shared-ui` (PolicyVerdictBadge, AutonomyDial) |
| Policy state type | `packages/ontology` (`PolicyState`) |

---

## Operational Policy Surfaces

| Surface | Path | Who Uses It |
|---------|------|-------------|
| Decision Center | `/decision-center` (szl-holdings, vessels, terra, carlota-jo) | Operators |
| Approval queue | `/decisions` (command, pulse) | Ops managers |
| Policy verdict badge | Inline on all recommendations | All users |
| Autonomy dial | Sidebar in all command surfaces | Operators |
| Cognitive Command Center | `/cognitive` (command) | Platform admins |
| Trust & Provenance Center | `/trust-provenance` (aegis, terra, vessels) | Compliance |

---

*Supersedes: [PROOF_AND_POLICY_MODEL.md](proof-and-policy-model.md). See also: [PLATFORM_PRIMITIVES.md](platform-primitives.md) · [ontology.md](ontology.md)*
