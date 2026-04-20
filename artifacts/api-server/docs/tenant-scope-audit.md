# API Server `tenantScope` Audit

Task #2635. Snapshot of every router under
`artifacts/api-server/src/routes/` showing whether it is gated by
`tenantScope({ required: true })` (org membership required) and where
the gate is wired.

## Methodology

1. Listed every route group in `routes/groups/*.ts` and every leaf
   router file in `routes/`.
2. For each group, recorded every `router.use("/<prefix>", tenantScope(...))`
   call.
3. For each leaf router file, recorded every `router.use(tenantScope(...))`
   or `tenantScope(...)` middleware applied per-route.
4. Cross-referenced with the route security matrix
   (`scripts/route-security-matrix.ts`).

## Group-level gates (`routes/groups/*.ts`)

All registered group prefixes apply `tenantScope({ required: true })`
unless explicitly noted as intentional public/pre-membership surfaces.

| Group file | Prefixes gated `required: true` | Intentionally `required: false` / ungated |
| --- | --- | --- |
| `ai.ts` | /ai, /copilot, /mcp, /nuro-mesh, /control-tower, /domain-agents, /agent-os, /agent-training, /agent-autonomy, /federation, /fine-tuning, /ml, /ontology, /digital-twins, /fusion, /knowledge, /ai-safety, /forge, /rag, /stream, /connector-hub, /a2a, /jobs, /atlas/spatial | — |
| `alloy.ts` | /alloy, /governance | — |
| `alloy-runtime-group.ts` | /memory, /workflows, /workflow-runs, /agents, /models, /prompts, /signals, /actions, /recommendations | — |
| `billing.ts` | /billing, /metering, /usage, /notifications, /projects, /connectors, /feature-flags, /partner, /services | — |
| `data-services.ts` | /documents, /exports, /comments, /cms, /reports, /atlas, /telemetry, /doctrine, /analytics, /analytics-engine, /genai-telemetry, /outcome-graph, /pulse-evals, /receipt-graph, /revenue-intelligence | — |
| `decisions.ts` | /decisioning, /decision-fabric, /decisions | — |
| `domain-atlas.ts` | (gated) | — |
| `graph.ts` | (gated except `/graph-stream` — public-by-design SSE feed) | `/graph-stream` (public; see route-security-matrix exception) |
| `guardian.ts` | (gated) | — |
| `lyte.ts` | (gated) | — |
| `misc.ts` | (gated) | — |
| `operations.ts` | (gated) | — |
| `prism-counsel.ts` | (gated) | — |
| `security.ts` | (gated) | — |
| `self-model.ts` | (gated) | — |
| `skill-library.ts` | (gated) | — |
| `terra.ts` | (gated) | — |
| `vessels.ts` | (gated) | — |
| `verifier.ts` | (gated) | — |
| `platform.ts` | /audit, /tenant-health, /settings, /changelog, /aegis/sync, /vessels/sync, /alloy/sync, /compliance, /approvals, /proof-chain, /audit-chain, /worldline, /dataverse | **/orgs, /user, /onboarding** — intentional `required: false` for pre-membership UX (sign-up, org creation, profile bootstrap). |
| `core.ts` | n/a (auth, /healthz, /webhooks, /storage, /files, /contact, /demo-requests, /feedback, /config, /apm, /public, /core, /admin/backup) — public-by-design or admin-gated; not org-scoped surfaces. | n/a |
| `cross-platform.ts` | n/a (`/cross-platform` is per-user; rate-limited; not org-scoped). | n/a |

`required: true` group prefixes counted: **148** (`grep -c "router\.use.*tenantScope" groups/*.ts`).

## Leaf-router gates (`routes/*.ts`)

Inner `router.use(tenantScope(...))` calls applied within individual
router files (defense-in-depth on top of the group-level gate):

| File | `tenantScope` setting before #2635 | Setting after #2635 | Notes |
| --- | --- | --- | --- |
| `consciousness.ts` | `required: true` (path-scoped) | unchanged | Existing regression coverage in `org-gated-routers.test.ts`. |
| `agent-os.ts` | `required: true` (path-scoped) | unchanged | Existing regression coverage in `org-gated-routers.test.ts`. |
| `alloy-digest.ts` | `required: true` (path-scoped) | unchanged | Existing regression coverage in `org-gated-routers.test.ts`. |
| `copilot.ts` | `required: true` (router-wide) | unchanged | Existing regression coverage in `org-gated-routers.test.ts`. |
| `nuro-mesh-advanced.ts` | `required: true` (router-wide) | unchanged | Already correct. |
| `prism-counsel-pilot.ts`, `prism-counsel-pilot-one.ts` | `required: true` (router-wide) | unchanged | Already correct. |
| `decisions-runtime.ts` | gated at group prefix | unchanged | No inner gate needed; documented in file header. |
| `terra-property-intel.ts` | unauthenticated by design (registered before authn) | unchanged | Public preview surface; documented in file header. |
| `vessels.ts`, `vessels-platform.ts`, `vessels-extended.ts` | `tenantScope()` per-route (defaults to `required: true`) | unchanged | Per-route guards on every authenticated handler. |
| `prism-counsel-s31.ts`, `prism-counsel-review.ts` | `tenantScope()` per-route | unchanged | Per-route guards. |
| `terra-property-intel.ts` (other handlers) | `tenantScope()` per-route on auth'd handlers | unchanged | Per-route guards. |
| **`nuro-mesh.ts`** | **`required: false`** (router-wide) | **`required: true`** (router-wide) | **Tightened by #2635.** Outer `/nuro-mesh` group already enforces `required: true`; inner gate restored for defense-in-depth. |
| **`alloy-skills.ts`** | **`required: false`** (router-wide) | **`required: true`** (router-wide) | **Tightened by #2635.** Outer `/alloy` group already enforces `required: true`; inner gate restored for defense-in-depth. |
| **`alloy-governance.ts`** | **`required: false`** (router-wide) | **`required: true`** (router-wide) | **Tightened by #2635.** Outer `/alloy` and `/governance` groups already enforce `required: true`; inner gate restored for defense-in-depth. |

## Routers intentionally not org-gated

Per `scripts/route-security-matrix.ts` (98% auth coverage, 5
unclassified-but-explainable surfaces):

- `admin/*` — admin role-gated, not org-gated.
- `graph-stream` — public-by-design SSE feed.
- `mcp-gateway` — global singleton (`orgId: null`); does not need tenant
  scope.
- `groups/platform.ts` `/orgs`, `/user`, `/onboarding` — pre-membership
  UX (must be reachable before the caller has joined an org).
- `groups/core.ts` surfaces (auth, health, storage, files, webhooks,
  contact, demo-requests, feedback, config, apm, public, backup).

## Regression coverage

- `routes/__tests__/org-gated-routers.test.ts` — 4 routers
  (consciousness, agent-os, alloy-digest, copilot) × 4 callers
  (no-org → 403; super_admin / admin / org-member → 200).
- `routes/__tests__/alloy-nuro-org-gated.test.ts` — **NEW** in #2635 —
  3 routers (nuro-mesh, alloy-skills, alloy-governance) × 4 callers
  (no-org → 403; super_admin / admin / org-member → 200).
- `routes/__tests__/group-protected-attestation.test.ts`,
  `group-gate-coverage.test.ts`, `group-tenant-gate.test.ts` — existing
  group-level coverage.
