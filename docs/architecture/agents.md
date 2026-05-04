# AGENTS — SZL Holdings Platform

**Scope:** Root rules — apply to every package, artifact, and agent in this monorepo.  
**Date:** April 18, 2026 (updated: launch-readiness audit complete)  
**Audience:** AI coding agents (Codex, Claude, Cursor, Copilot), human engineers, automated CI systems.

> **Entry point:** Read [architecture.md](architecture.md) first, then [ontology.md](ontology.md), then this file. Subdirectory AGENTS.md files layer on top of these root rules — they narrow or extend, never contradict.

---

## Non-negotiable Rules

These rules apply everywhere. Violating any of them is grounds to stop and ask for clarification rather than proceeding.

### 1. Clean-Room Discipline

- Every module has explicit, strict TypeScript types. `any` is forbidden unless wrapping a third-party boundary that cannot be typed, and must be annotated with `// safe: <reason>`.
- Evidence, freshness, confidence, and policy metadata must never be stripped from entity objects, signals, or recommendations when passing between packages or serializing to the API. If a consumer does not need these fields, it must still preserve them for downstream consumers.
- No silent fallbacks. If a required piece of context is missing, throw explicitly or return a typed error — never substitute a default that obscures the failure.

### 2. Traceable Autonomy

- No agent action is opaque. Every consequential agent action must produce a Proof Chain entry before the action is considered committed.
- No agent executes consequential actions without a policy check. All mutations to governed state must pass `checkPermission()` from `lib/covenant-policy` or `packages/policy-engine` before execution.
- Correlation IDs propagate. The `correlationId` from an originating signal must be forwarded through every downstream artifact (recommendation, simulation, proof entry, outcome record). Never generate a new `correlationId` mid-loop.

### 3. Brand Registry Truth

- All product copy must use the canonical brand vocabulary from `packages/brand-registry`.
- Banned phrases: "sentient", "AI magic", "automagically", "black box AI", "fully autonomous", "thinks for itself". If the lint guard in `scripts/lint-copy.sh` would fail, the copy is wrong.
- Approved vocabulary: "governed intelligence", "evidence-backed", "traceable autonomy", "human-confirmed", "policy-gated", "calibrated confidence".

### 4. Ontology Consistency

- Entity types, domain names, signal types, freshness levels, policy states, and confidence conventions are defined in `packages/ontology`. All new code that introduces or consumes these concepts must import from `@workspace/ontology`.
- Do not introduce a new entity type, domain, or signal type without updating `packages/ontology/src/entities.ts` and `ontology.md` at the same time.

### 5. Strict Types — No `noImplicitAny` Exceptions

- All packages must compile with `noImplicitAny: true`, `strictNullChecks: true`, `alwaysStrict: true`. These are set in `tsconfig.base.json`. Do not weaken them in per-package tsconfigs.

### 6. Test Before Claiming Done

- New packages and new API routes must have at minimum: (a) a TypeScript compile check (`pnpm typecheck`), and (b) a description of what manual test confirms the feature works.
- New ontology types must have at least one example instantiation in the package's `src/examples.ts` (or equivalent).

### 7. No Opaque Automation

- Scripts that run as part of seed, migration, or post-merge must be idempotent and must log every meaningful action they take.
- No automation that touches the database without first checking whether the target row already exists.

---

## Architecture Decisions (Do Not Override Without Discussion)

| Decision | Rationale |
|----------|-----------|
| One API server for all surfaces | Simplifies auth, session, and RBAC enforcement |
| Shared PostgreSQL — no per-domain databases | Cross-domain correlation requires shared FK references |
| pnpm workspaces — no npm or yarn | Enforced by the lockfile; violating breaks CI |
| Proof Chain is append-only | Immutability is the trust guarantee; modifying entries destroys it |
| Policy check before every governed mutation | Structural compliance, not UI-layer convention |
| `correlationId` never regenerated mid-loop | End-to-end traceability breaks without this |
| `packages/ontology` as the type source of truth | Single canonical vocabulary; divergence creates drift |
| Freshness always surfaced, never assumed | Stale data must be visible; users cannot assume currency |

---

## Package Authoring Rules

When creating or modifying a package in `packages/` or `lib/`:

1. **Use the workspace naming convention:**
   - `packages/` → `@workspace/<name>` for runtime packages; `@szl-holdings/<name>` for published packages.
   - `lib/` → `@szl-holdings/<name>`.
2. **Export via `package.json` `exports` map** — no implicit barrel imports across packages.
3. **Do not add circular dependencies.** `packages/ontology` has no internal dependencies. `packages/atlas-core` may import `packages/ontology`. Neither may import `packages/alloy` or `packages/action-engine`.
4. **Add new packages to `tsconfig.base.json` references** if they participate in a build chain.
5. **Every package needs:** `package.json`, `tsconfig.json` (extends root base), `src/index.ts`.

---

## API Route Rules

When adding or modifying routes in `artifacts/api-server/src/routes/`:

1. All routes that mutate governed state must call `checkPermission()` or `assertPermission()` before the mutation.
2. All AI-generated content returned by an API route must have a proof ID in the response envelope.
3. Routes must extract `orgId` from the authenticated session — never from query params or request bodies that could be spoofed.
4. All routes carry a `correlationId` (injected by `correlationMiddleware`).

---

## UI Component Rules

When building or modifying React components:

1. Evidence metadata (`confidence`, `freshness`, `policyState`) must be visibly surfaced on all AI-generated recommendation cards. Use primitives from `packages/design-system` (`EvidenceBadge`, `FreshnessChip`, `ConfidenceMeter`, `PolicyStateChip`).
2. Stale (`FreshnessLevel = "stale"`) and expired data must show a degradation indicator — never render silently as if current.
3. Demo mode must be explicitly labeled. Never present seeded demo data without a visible "DEMO" badge.

---

## Subdirectory AGENTS.md Files

Each major app and package directory should have its own AGENTS.md that:
- States which root rules are most critical for that context.
- Adds any domain-specific rules (e.g. maritime terminology, legal matter conventions).
- Lists the key files an agent should read before making changes.
- Does NOT contradict root rules — only narrows or extends them.

Files to maintain:
- `artifacts/api-server/AGENTS.md` — API server rules
- `artifacts/szl-holdings/AGENTS.md` — Corporate dashboard rules
- `artifacts/vessels/AGENTS.md` — Maritime domain rules
- `artifacts/terra/AGENTS.md` — Real estate domain rules
- `artifacts/carlota-jo/AGENTS.md` — Advisory domain rules
- `artifacts/command/AGENTS.md` — Command hub rules
- `packages/ontology/AGENTS.md` — Ontology package rules
- `packages/alloy/AGENTS.md` — Cognitive runtime rules
- `lib/db/AGENTS.md` — Database schema rules

---

## Audit Documentation (Launch-Readiness — April 18, 2026)

The following canonical audit documents are maintained in `docs/audit/`:

| Document | Purpose |
|----------|---------|
| `CAPABILITY_INVENTORY.md` + `capability-inventory.json` | 100 capabilities with status, coverage, and demo-blocker flags |
| `SURFACE_MAP.md` | Route-by-route visibility audit (✅/⚠️/❌ per surface) |
| `MOCK_AND_STUB_REGISTER.md` | Severity-tagged mock/stub register (`ship-blocker`/`demo-blocker`/`polish`/`acceptable`) |
| `GAP_MATRIX.md` + `gap-matrix.json` | 20 open gaps with owners, targets, and waiver status |
| `ENV_AND_SECRETS_REGISTER.md` | 156 env vars with tier, current state, and silent-fallback analysis |
| `DB_SCHEMA_AND_MIGRATION_AUDIT.md` | 569-table schema review, seed scripts, data integrity |
| `TEST_MATRIX.md` | Test pyramid, CI gates, coverage by layer |
| `RELEASE_READINESS.md` | 5-gate release checklist (demo/growth capital/pilot/revenue/GCA) |
| `DEMO_SCRIPT.md` | Investor demo click-path with pre-demo checklist and avoidance guide |
| `KNOWN_LIMITATIONS.md` | 19 documented limitations with remediation paths |
| `EXECUTIVE_SUMMARY.md` | Top-level audit summary and recommended next actions |

**Before any investor demo:** Configure `MAPBOX_ACCESS_TOKEN` in Replit Secrets (map views are blank without it).

---

*See also: [CODEX_HANDOFF.md](../operations/codex-handoff.md) · [architecture.md](architecture.md) · [ontology.md](ontology.md) · [policy-model.md](policy-model.md)*
