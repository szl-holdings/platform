# A11OY_WORKCELL_DOCTRINE.md — Workcell Definition and Governance

A Workcell is the fundamental unit of governed agentic work in A11oy. Every task executed by an agent, operator, or human contributor should be structured as a Workcell.

---

## Workcell Definition

A Workcell is a self-contained, governed unit of agentic work with:

- A defined **vertical** (the domain it operates in)
- A declared set of **tools and permissions** (what it may do)
- A **Covenant Policy** evaluation (what policies govern it)
- A **ProofCarryingExecution (PCE)** contract (proof obligations on every run)
- A **MirrorEval** assessment (quality and alignment evaluation of outputs)
- A defined **approval tier** (who must authorize execution)

Workcells are not tasks. They are governed execution units with policy and proof lifecycle built in.

---

## Required Workcell Fields

Every Workcell definition must include:

| Field | Description |
|-------|-------------|
| `id` | Unique Workcell identifier (e.g., `WC-2026-001`) |
| `title` | Human-readable name for the Workcell |
| `vertical` | The domain vertical (see vertical registry in `AGENTS.md`) |
| `agent` | The primary named agent responsible for execution |
| `objective` | A single, specific, measurable objective |
| `scope_in` | What the Workcell is authorized to read, modify, or create |
| `scope_out` | What the Workcell is explicitly NOT authorized to touch |
| `tools` | List of tools and permissions declared for this Workcell |
| `risk_class` | One of: Low, Medium, High, Critical (see Risk Classes below) |
| `approval_tier` | One of: Auto, Operator, Executive, Board |
| `covenant_policies` | Applicable Covenant Policy IDs |
| `proof_level` | Required proof level (1–5, see `docs/A11OY_PROOF_DOCTRINE.md`) |
| `status` | Current Workcell status (see Workcell Statuses below) |
| `created_at` | ISO 8601 timestamp of Workcell creation |
| `completed_at` | ISO 8601 timestamp of completion (null if not complete) |

---

## Workcell Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Workcell is being defined; not yet submitted for approval |
| `pending_approval` | Workcell is awaiting operator or executive authorization |
| `approved` | Workcell is authorized to execute |
| `running` | Workcell is actively executing |
| `paused` | Workcell execution is paused pending additional information |
| `awaiting_human` | Workcell has halted and is waiting for human input |
| `proof_review` | Execution complete; Proof Packet is under review |
| `complete` | Workcell finished; Proof Packet accepted and recorded |
| `failed` | Workcell encountered an unrecoverable error |
| `cancelled` | Workcell was cancelled before completion |
| `archived` | Workcell is complete and archived in the Proof Ledger |

---

## Risk Classes

| Class | Description | Examples |
|-------|-------------|---------|
| **Low** | Read-only, documentation, or non-destructive changes | Screenshot capture, README update, audit report generation |
| **Medium** | Code changes to non-critical paths, configuration updates | Doctrine file creation, skill pack installation, .gitignore update |
| **High** | Schema changes, route additions, auth modifications, data migrations | New database schema, new API routes, auth flow changes |
| **Critical** | Production database operations, secret rotation, multi-artifact refactor, public release | Production deployment, secret key rotation, public-facing copy release |

---

## Approval Rule

| Risk Class | Approval Tier | Approval Required From |
|------------|--------------|----------------------|
| Low | Auto | Approved automatically if policy passes |
| Medium | Operator | At least one operator confirmation |
| High | Executive | Executive authorization required |
| Critical | Board | Board-level authorization or explicit executive override with documented reason |

Workcells must not execute above their approved tier. A Workcell that discovers mid-execution that it needs to take a higher-risk action must halt, update the risk class, and re-route for the appropriate approval.

---

## Workcell Lifecycle

```
Draft → Pending Approval → Approved → Running → [Awaiting Human?] → Proof Review → Complete
                                                ↓
                                             Failed / Cancelled → Archived
```

A Workcell that completes the Proof Review step is committed to the Proof Ledger and archived. It cannot be modified after archival.

---

## Workcell Proof Obligation

Every completed Workcell must produce a Proof Packet at the required proof level before transitioning to `complete`. See `docs/A11OY_PROOF_DOCTRINE.md` for Proof Packet structure and proof level definitions.

No Workcell may be marked `complete` without a recorded Proof Packet.
