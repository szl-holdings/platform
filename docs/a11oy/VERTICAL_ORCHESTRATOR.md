# A11oy Vertical Orchestrator

**Task #4368 · Status: Active · Feature flag: `A11OY_ORCHESTRATOR_ENABLED`**

---

## Purpose

The Vertical Orchestrator is the self-serve flow inside A11oy that lets operators onboard new governed verticals without writing code. When a vertical is onboarded, it inherits A11oy's full governance stack automatically:

| Primitive | What it provides |
|---|---|
| **Constitution** | The nine articles the pack must obey at runtime |
| **Approval Queue** | Risk-tier gating for every material decision |
| **Proof Ledger** | Immutable hash-chained proof for every governed action |
| **MirrorEval** | 14-dimension evaluation including reasoning verification |
| **ConnectorFirewall** | mTLS-gated data source scope declaration |
| **SelfOptimization** | Reward signals and human-lockable parameter registry |
| **LearningLoop** | Calibration metric and drift detection thresholds |

---

## Feature Flag

Two separate env vars control the flag — one per tier:

| Var | Tier | Set on |
|---|---|---|
| `A11OY_ORCHESTRATOR_ENABLED` | **API server** | Server env / secrets |
| `VITE_A11OY_ORCHESTRATOR_ENABLED` | **A11oy frontend** | Vite build env |

Both must be set when enabling in production. In development both default to **on**.

```
# Production enable (both required)
A11OY_ORCHESTRATOR_ENABLED=true
VITE_A11OY_ORCHESTRATOR_ENABLED=true

# Kill-switch (either one is sufficient to disable that tier)
A11OY_ORCHESTRATOR_ENABLED=false
VITE_A11OY_ORCHESTRATOR_ENABLED=false
```

| Environment | Default | Override |
|---|---|---|
| Development / staging | **On** (enabled unless set to `false`) | Set `=false` to disable |
| Production | **Off** (disabled unless set to `true`) | Set `=true` to enable |

**Flag scope per tier:**

- **API server** — only mutating endpoints (`POST`, `DELETE`) check the flag. Read endpoints (`GET`) always serve seeded reference packs regardless of flag state, so catalog data remains visible to tooling and dashboards even when writes are disabled. Mutations return `404 FLAG_DISABLED` when the flag is off.
- **A11oy frontend** — the Compose wizard entry point and Orchestrator sidebar links are hidden when the flag is off. The Catalog and Health pages remain reachable (they call read-only GET endpoints).

Disabling the flag does **not** delete data — packs are preserved in the DB.

---

## Database Schema

Migration `0163_domain_packs.sql` creates three tables:

### `domain_packs`
| Column | Type | Notes |
|---|---|---|
| `slug` | TEXT UNIQUE | Primary identifier (e.g. `counsel`, `vessels`) |
| `name` | TEXT | Human-readable name |
| `lifecycle` | TEXT | `draft` → `pending_activation` → `active` / `rejected` / `archived` |
| `pack_json` | JSONB | Full `DomainPack` structure — synced with DB columns on every mutation |
| `activation_decision_id` | TEXT | correlationId filed in the Approval Queue |
| `activated_at` | TIMESTAMPTZ | Populated on successful activation |
| `rejection_reason` | TEXT | Populated on rejection |

### `domain_pack_revisions`
Immutable append-only table. One row per pack mutation. Never updated or deleted.

### `domain_pack_audit_events`
Immutable audit log. Every activation transition, validation run, and lifecycle change produces a row here.

---

## Six Reference Packs (Seeded by Migration)

These packs are inserted by `0163_domain_packs.sql` using `ON CONFLICT DO NOTHING` (idempotent on re-run). They represent the six existing SZL verticals expressed as governed DomainPacks.

| Slug | Vertical | Industry | UI Shell |
|---|---|---|---|
| `counsel` | Counsel — Legal Matter Command | legal | `legal` |
| `vessels` | Vessels — Maritime Intelligence | maritime | `maritime` |
| `terra` | Terra — Real Estate Intelligence | real-estate | `real-estate` |
| `sentra` | Sentra — Cyber Resilience Command | cybersecurity | `standard` |
| `aegis` | Aegis — Defense & Intelligence | defense | `defense` |
| `command` | Command — Unified Command Center | enterprise | `standard` |

Each seeded pack starts in `lifecycle = 'active'` to reflect that these verticals are already live. Operators can inspect them in the Catalog and use them as templates when composing new packs via the Compose wizard.

---

## TypeScript Type Contract

Defined in `packages/domain-profiles/src/domain-pack.ts`, exported from `@szl-holdings/domain-profiles`.

```typescript
interface DomainPack {
  slug: string;                     // kebab-case, alphanumeric + hyphens
  name: string;
  description: string;
  industry: string;
  uiShellTemplate: 'standard' | 'defense' | 'legal' | 'maritime' | 'real-estate' | 'custom';
  constitution: ConstitutionRef[];  // at least one required
  dataSources: DataSourceRef[];
  evaluators: EvaluatorRef[];       // at least one required
  approvalRules: ApprovalRule[];
  selfOptimization: SelfOptimizationConfig;
  learningLoop: LearningLoopConfig;
  lifecycle: DomainPackLifecycle;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  rejectionReason?: string;
  activationDecisionId?: string;
}

type DomainPackLifecycle = 'draft' | 'pending_activation' | 'active' | 'rejected' | 'archived';
```

---

## API Mount Point

All orchestrator routes are mounted at:

```
/api/a11oy/orchestrator
```

Full path example: `GET https://<host>/a11oy/api/a11oy/orchestrator/packs`

---

## Endpoints

### Reads (always available — no flag check)

```
GET /api/a11oy/orchestrator/packs                            List all packs
GET /api/a11oy/orchestrator/packs/:slug                      Single pack detail
GET /api/a11oy/orchestrator/packs/:slug/health               Per-pack governance KPIs
GET /api/a11oy/orchestrator/packs/:slug/audit                Audit trail (last 50 events)
GET /api/a11oy/orchestrator/status                           Orchestrator readiness probe
GET /api/a11oy/orchestrator/available-connectors             Live connector registry for Compose
GET /api/a11oy/orchestrator/available-evaluators             Eval harness configurations for Compose
GET /api/a11oy/orchestrator/available-constitution-articles  Canonical Constitution articles for Compose
```

### Mutations (feature flag + adminGuard)

```
POST   /api/a11oy/orchestrator/packs                              Draft a new pack
POST   /api/a11oy/orchestrator/packs/:slug/validate               Validate pack body
POST   /api/a11oy/orchestrator/packs/:slug/request-activation     Submit for Approval Queue
POST   /api/a11oy/orchestrator/packs/:slug/activate               Approve activation (human)
POST   /api/a11oy/orchestrator/packs/:slug/reject                 Reject pending pack
DELETE /api/a11oy/orchestrator/packs/:slug                        Delete draft/rejected pack
```

---

## Auth Posture

| Scenario | HTTP Status | Error Code |
|---|---|---|
| Flag disabled on a mutation route (POST/DELETE) | `404` | `FLAG_DISABLED` |
| Unauthenticated request to guarded route | `401` | `UNAUTHORIZED` |
| Authenticated user without admin role | `403` | `FORBIDDEN` |
| Admin roles: `super_admin`, `ops`, `exec` | ✓ allowed | — |
| Internal token with `internal:write` scope | ✓ allowed | — |

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `FLAG_DISABLED` | 404 | Feature flag is off — all endpoints blocked |
| `PACK_NOT_FOUND` | 404 | No pack with that slug |
| `PACK_VALIDATION_FAILED` | 400 | Required fields missing or invalid |
| `PACK_ALREADY_ACTIVE` | 409 | Pack is already active |
| `PACK_ALREADY_EXISTS` | 409 | Slug conflict on draft creation |
| `PACK_ALREADY_PENDING` | 409 | Activation already in flight |
| `PACK_INVALID_STATE` | 400 | Transition not allowed from current lifecycle state |
| `ACTIVATION_REJECTED` | 409 | Pack was rejected — delete and re-draft to start fresh |
| `APPROVAL_QUEUE_FAILED` | 503 | `approval_requests` INSERT failed — pack stays in draft |
| `NOT_READY` | 503 | Orchestrator registry not queryable |

---

## Lifecycle State Machine

```
draft → pending_activation → active
                ↓
            rejected  (→ delete → re-draft for new activation flow)
```

- A pack can only be activated from `pending_activation`
- Active packs cannot be deleted (must be archived via a separate flow)
- `draft` and `rejected` packs can be deleted
- Every transition produces a `domain_pack_revisions` row and a `domain_pack_audit_events` row
- `pack_json.lifecycle` is always synced to the DB `lifecycle` column on every mutation

**Key invariant:** A pack reaches `pending_activation` **only** after a successful INSERT into `approval_requests`. If that INSERT fails, the pack stays in `draft` and `APPROVAL_QUEUE_FAILED` is returned.

**`ACTIVATION_REJECTED` contract:** Returned (HTTP 409) when a caller attempts to activate or re-request activation for a pack in `rejected` state. The pack must be deleted and re-drafted.

---

## Per-Pack Health KPIs

| Field | Source | Scope |
|---|---|---|
| `mirrorEvalPassRate` | `ai_traces WHERE domain = slug` (last 7d) | Per-pack domain |
| `approvalQueueMedianTtrMs` | `approval_requests WHERE resource_id = slug` | Per-pack resource |
| `connectorFirewallBlocks24h` | `connector_logs JOIN connectors WHERE name IN pack.dataSources[].connectorId` | Per-pack connectors |
| `proofLedgerIntegrity` | `proof_chain WHERE id IN (SELECT proof_chain_id FROM ai_traces WHERE domain = slug)` | Per-pack domain |
| `decisions24h` | `decisions_runtime WHERE domain = slug AND generated_at > 24h_ago` | Per-pack governed decisions |

`connectorId` in `dataSources` must match `connectors.name` (as returned by `/available-connectors`) for firewall scoping to work correctly.

---

## Observability

- **OTel spans:** Router-level middleware applies to all routes. The orchestrator adds child spans per-operation using tracer `szl-a11oy-orchestrator`. All code paths call `span.end()` — including early-return paths.
- **Structured logs:** Every route emits `logger.info({ requestId, actor, slug, action })` at entry and `logger.info({ ..., outcome })` at exit.
- **Span names:** `orchestrator.packs.list`, `orchestrator.packs.get`, `orchestrator.packs.draft`, `orchestrator.packs.validate`, `orchestrator.packs.request-activation`, `orchestrator.packs.activate`, `orchestrator.packs.reject`, `orchestrator.packs.delete`, `orchestrator.packs.health`, `orchestrator.packs.audit`, `orchestrator.status`, `orchestrator.available-connectors`, `orchestrator.available-evaluators`, `orchestrator.available-constitution-articles`

---

## Rollout / Rollback Runbook

### Enable (production)
1. Apply migration: `pnpm db:migrate` (run `0163_domain_packs.sql`)
2. Set secret: `A11OY_ORCHESTRATOR_ENABLED=true`
3. Restart API server
4. Verify: `curl https://<host>/a11oy/api/a11oy/orchestrator/status` returns `{ ok: true, data: { ready: true, featureEnabled: true } }`

### Disable (kill-switch)
1. Set secrets: `A11OY_ORCHESTRATOR_ENABLED=false` and `VITE_A11OY_ORCHESTRATOR_ENABLED=false`
2. Restart API server (and rebuild frontend if changing the Vite var)
3. Mutation endpoints (`POST`, `DELETE`) return `404 FLAG_DISABLED` immediately. Read endpoints continue serving existing packs.
4. Data in `domain_packs`, `domain_pack_revisions`, `domain_pack_audit_events` is **not** deleted

### Rollback migration (destructive — use only if disabling is insufficient)
```sql
-- WARNING: This is destructive. Only proceed after confirming kill-switch is insufficient.
DROP TABLE IF EXISTS domain_pack_audit_events;
DROP TABLE IF EXISTS domain_pack_revisions;
DROP TABLE IF EXISTS domain_packs;
```
Run inside a transaction and confirm before committing. `approval_requests` rows are preserved (resource_type='domain_pack') for audit continuity.

---

## Worked Example: Insurance Claims Triage

This example walks through onboarding a new "Insurance Claims Triage" vertical from scratch using the Compose wizard and the API.

### Step 1 — Draft the pack

```bash
POST /api/a11oy/orchestrator/packs
Content-Type: application/json
X-Session-Token: <admin-token>

{
  "slug": "claims-triage",
  "name": "Insurance Claims Triage",
  "description": "AI-assisted triage of P&C insurance claims with human authority on material payouts.",
  "industry": "insurance",
  "uiShellTemplate": "standard",
  "constitution": [
    { "articleId": "I",  "title": "Attribution is Non-Optional",          "version": "v4.2.0" },
    { "articleId": "II", "title": "Human Authority on Material Decisions", "version": "v4.2.0" },
    { "articleId": "V",  "title": "Right to Audit",                       "version": "v4.2.0" }
  ],
  "dataSources": [
    { "connectorId": "claims-db-connector", "displayName": "Claims Database", "riskLevel": "high", "allowedTools": ["read"], "blockedTools": ["delete"] },
    { "connectorId": "policy-api-connector", "displayName": "Policy API",     "riskLevel": "medium", "allowedTools": ["read"], "blockedTools": [] }
  ],
  "evaluators": [
    { "evaluatorId": "mirroreval-standard", "displayName": "MirrorEval Standard", "passThreshold": 0.85, "dimensions": ["groundedness", "policy_compliance", "hallucination_risk"] }
  ],
  "approvalRules": [
    { "riskTier": "critical", "requiresApprover": "claims_director" },
    { "riskTier": "high",     "requiresApprover": "senior_adjuster" },
    { "riskTier": "medium",   "requiresApprover": "adjuster" }
  ],
  "selfOptimization": {
    "rewardSignals": ["acceptance_rate", "settlement_accuracy"],
    "lockedParameters": ["payout_ceiling_usd"]
  },
  "learningLoop": {
    "calibrationMetric": "outcome_accuracy",
    "driftThresholdPct": 2.0,
    "recalibrationTrigger": "auto"
  }
}
```

**Response:** `201 Created` with `lifecycle: "draft"`.

### Step 2 — Validate

```bash
POST /api/a11oy/orchestrator/packs/claims-triage/validate
```

Expect `{ passed: true, errors: [] }`.

### Step 3 — Request activation

```bash
POST /api/a11oy/orchestrator/packs/claims-triage/request-activation
```

Expect `lifecycle: "pending_activation"` and `approvalRequestId: <id>`. The pack is now queued in the Approval Queue for human review.

### Step 4 — Human approval

An operator with `super_admin` or `ops` role reviews the pack in the Approval Queue UI, then calls:

```bash
POST /api/a11oy/orchestrator/packs/claims-triage/activate
{ "note": "Reviewed by Claims Director on 2026-05-01. Constitution articles verified." }
```

**Result:** `lifecycle: "active"`. The `claims-triage` vertical now governs agent decisions for insurance claims triage.

### Step 5 — Monitor health

```bash
GET /api/a11oy/orchestrator/packs/claims-triage/health
```

Monitor `mirrorEvalPassRate` (target ≥ 85%), `connectorFirewallBlocks24h` (target = 0), and `proofLedgerIntegrity` (target = `clean`).

---

## A11oy UI Pages

All pages live in `artifacts/a11oy/src/pages/orchestrator/`:

| Page | Path | Purpose |
|---|---|---|
| `OrchestratorCatalog` | `/orchestrator/catalog` | Browse all packs, filter by lifecycle, request activation |
| `OrchestratorCompose` | `/orchestrator/compose` | 7-step wizard — fetches connectors, evaluators, constitution from API |
| `OrchestratorWiring` | `/orchestrator/wiring/:slug` | Governance primitive cross-links per pack |
| `OrchestratorHealth` | `/orchestrator/health/:slug` | Live health KPIs per pack |

---

## Health Extension

`GET /api/a11oy/orchestrator/status` is the readiness probe. Orchestrator counters are reflected in `/api/healthz` and `/api/health/detailed` under the `orchestrator` key:

```json
{
  "orchestrator": {
    "featureEnabled": true,
    "migrationsApplied": true,
    "registryQueryable": true,
    "activePacks": 6,
    "draftPacks": 1,
    "pendingPacks": 0,
    "activations24h": 1,
    "lastActivationErrorDetail": null
  }
}
```

---

## Smoke Test

```bash
./scripts/smoke-test-orchestrator.sh https://your-api-host
```

---

## Architecture Notes

- The orchestrator is a pure governance orchestration layer — it declares *what* a vertical governs, not *how* the domain logic works.
- Every mutation journals to `domain_pack_revisions` (mutable snapshots) and `domain_pack_audit_events` (immutable ledger). Neither table is truncated or deleted from in normal operation.
- `pack_json.lifecycle` is kept in sync with the DB `lifecycle` column on every mutation. Response composition spreads `pack_json` first and overwrites with DB column values — stale JSON can never misreport lifecycle state.
- The feature flag gates **mutations only** (`POST`, `DELETE`). Read endpoints (`GET`) are always reachable so seeded reference packs remain visible in tooling and dashboards when writes are disabled. Setting `A11OY_ORCHESTRATOR_ENABLED=false` returns `404 FLAG_DISABLED` on mutating endpoints only.

---

## Evolve Features (Task #5230)

Five new capabilities extend the orchestrator. All are gated by the
`A11OY_ORCHESTRATOR_EVOLVE_ENABLED` environment variable (default: off in prod,
on in dev). Read endpoints are always callable; mutations 404 with
`EVOLVE_DISABLED` when the flag is off. `GET /status` exposes `evolveEnabled`
so the UI can grey out controls honestly.

### 1. Pack Library
Archived-vertical blueprints live in `domain_pack_templates` (migration
0166_domain_pack_templates.sql) — Counsel, Terra, Command, Lyte, Pulse,
Carlota Jo. Operators instantiate one into a fresh **draft** in `domain_packs`;
the original template is unaffected. The draft still goes through the standard
approval flow.

- `GET  /api/a11oy/orchestrator/templates`
- `GET  /api/a11oy/orchestrator/templates/:slug`
- `POST /api/a11oy/orchestrator/templates/:slug/instantiate`  (adminGuard + evolveGuard)

### 2. AI-Assisted Composer
Takes a `{brief, industry?, name?}` body and returns a *draft* `DomainPack`
object. **Never auto-creates the pack** — the operator still POSTs it
explicitly. If `AI_INTEGRATIONS_OPENAI_BASE_URL` + `_API_KEY` are set, the
endpoint calls the AI Integrations proxy (model: `gpt-5-mini` by default);
otherwise it returns a deterministic stub built from the brief and marks
`source: 'stub'`. Cost (when available) records via
`@szl-holdings/ai-control-plane`. Defensive merge — lifecycle is forced
client-side to `draft`.

- `POST /api/a11oy/orchestrator/ai-draft`  (adminGuard + evolveGuard)

### 3. Revisions Diff + Governed Rollback
- `GET  /api/a11oy/orchestrator/packs/:slug/revisions`
- `GET  /api/a11oy/orchestrator/packs/:slug/revisions/:revA/diff/:revB`  
  (revB may be `current` to diff a revision against the live pack)
- `POST /api/a11oy/orchestrator/packs/:slug/rollback/:revisionId`  (adminGuard + evolveGuard)

Rollback **never swaps `pack_json` directly.** It files an
`approval_requests` row (`action_class: domain_pack_rollback`) and a new
revision in pending state. The pack only changes when an approver resolves the
queue item — same human-gated path as activation.

### 4. Cross-Pack Capability Proposals
Reuses the #4385 frontier pipeline rather than inventing a parallel queue.
Writes a synthetic `frontier_artifacts` row (`provider: 'a11oy-orchestrator'`,
`kind: 'capability-proposal'`) and a `frontier_inbox` row in pending state.
The proposal is then reviewed via the existing frontier inbox UI. A bridge
row in `capability_proposal_log` lets the orchestrator UI show its own
audit trail without joining across worlds.

- `POST /api/a11oy/orchestrator/packs/:slug/emit-capability-proposal`  (adminGuard + evolveGuard)
- `GET  /api/a11oy/orchestrator/capability-proposals`

### 5. Live Readiness Score
A composite 0–100 score with letter grade (A–F) and per-component breakdown.
Always available (no evolve gate) so the catalog can render it for every
pack. Components are computed from real data — no synthetic numbers; missing
data scores neutral (50).

| Component | Weight | Source |
|---|---:|---|
| Validation | 40 | `validatePack(pack_json)` |
| Evaluators | 10 | `pack.evaluators.length > 0` |
| Approval rules | 15 | `min(1, rules / 3)` |
| MirrorEval pass-rate | 20 | `ai_traces` last 7d for this domain |
| Proof-ledger health | 15 | `proof_chain` flagged/retracted ratio last 30d |

- `GET /api/a11oy/orchestrator/packs/:slug/readiness`

### Frontend
- `/orchestrator/library` — pack library, instantiate to draft.
- `/orchestrator/revisions/:slug` — revision list, diff viewer, rollback button.
- Readiness badge on the catalog, computed live per pack.
- Sidebar adds **Pack Library** and **Revisions & Rollback** entries.
