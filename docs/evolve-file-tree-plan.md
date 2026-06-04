# AEEP File Tree Plan — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** Proposed AEEP monorepo file tree after full evolution

---

## 1. Principles

- **Refactor before sprawl:** Every new AEEP package corresponds to a renamed/refactored existing package with adapter layer. No duplicate placeholders.
- **Single source per concern:** One canonical package per capability domain.
- **Adapter shims:** Existing consumers get backward-compatible adapter shims during migration window.
- **Graduated deprecation:** Old packages are not deleted immediately. They re-export from new packages with `@deprecated` notices.

---

## 2. Proposed Top-Level Tree

```
/
├── apps/
│   ├── alloy-runtime-api/          # AEEP v1 API gateway (refactored from alloy-embedding-api)
│   ├── alloy-ops-console/          # NEW: Operator management console
│   └── alloy-ingest-control/       # Refactored from alloy-ingestion-orchestrator
│
├── workers/
│   ├── alloy-tool-executor/        # NEW: Tool execution worker
│   ├── alloy-retrieval-worker/     # NEW: Retrieval pipeline worker
│   ├── alloy-memory-worker/        # NEW: Memory operations worker
│   ├── alloy-eval-worker/          # NEW: Evaluation worker
│   ├── alloy-vector-worker/        # Renamed from alloy-embed-worker
│   └── alloy-rank-worker/          # Renamed from alloy-rerank-worker
│   # (substrate-python retained as-is)
│
├── packages/
│   ├── # ── AEEP Core (new / refactored) ─────────────────────────────
│   ├── shared-contracts/           # Refactored from aef-contracts + AEEP v1 types + role contracts
│   ├── agent-core/                 # Refactored from cognitive-runtime + agents-* + planner + action-engine
│   ├── workflow-runtime/           # Refactored from alloy + replay-core + approvals-inbox
│   ├── retrieval-core/             # Refactored from aef-retrieval-core
│   ├── memory-core/                # Refactored from memory-fabric
│   ├── evidence-ledger/            # Refactored from aef-evidence-ledger + evidence-graph
│   ├── policy-guard/               # Refactored from aef-policy-guard + guardian + policy-engine
│   ├── domain-profiles/            # NEW: Domain config for Lyte/Vessels/Terra/Aegis/PRISM/Carlota
│   ├── storage-adapters/           # NEW: local-fs, postgres, object-storage adapters
│   ├── evals/                      # Consolidated from eval-forge + eval-os + evals-core + agents-evals
│   ├── platform-metrics-registry/  # NEW: Single source of truth for platform facts
│   │
│   ├── # ── Design System ────────────────────────────────────────────
│   ├── design-system/              # EXPANDED: Full AEEP component set (see design-system tree)
│   │
│   ├── # ── Existing (kept as-is or minor refactor) ──────────────────
│   ├── config/                     # Platform config registry (extended)
│   ├── contracts/                  # Zod API contracts (extended for AEEP v1)
│   ├── schemas/                    # Schema definitions
│   ├── ontology/                   # Domain ontology
│   ├── tool-registry/              # Tool registry (enhanced)
│   ├── tool-mesh/                  # Tool routing (keep for now)
│   ├── cognitive-runtime/          # DEPRECATED → re-exports from agent-core
│   ├── alloy/                      # DEPRECATED → re-exports from workflow-runtime
│   ├── szl-alloy/                  # DEPRECATED → remove after migration
│   ├── aef-contracts/              # DEPRECATED → re-exports from shared-contracts
│   ├── aef-retrieval-core/         # DEPRECATED → re-exports from retrieval-core
│   ├── aef-evidence-ledger/        # DEPRECATED → re-exports from evidence-ledger
│   ├── aef-policy-guard/           # DEPRECATED → re-exports from policy-guard
│   ├── memory-fabric/              # DEPRECATED → re-exports from memory-core
│   ├── guardian/                   # DEPRECATED → re-exports from policy-guard
│   ├── ui-command/                 # DEPRECATED → re-exports from design-system
│   ├── agents-core/                # DEPRECATED → re-exports from agent-core
│   ├── agents-evals/               # DEPRECATED → re-exports from evals
│   ├── agents-prompts/             # Keep → rename to prompt-registry (already exists)
│   ├── agents-tools/               # DEPRECATED → re-exports from agent-core
│   ├── eval-forge/                 # DEPRECATED → re-exports from evals
│   ├── eval-os/                    # DEPRECATED → re-exports from evals
│   ├── evals-core/                 # DEPRECATED → re-exports from evals
│   ├── approvals-inbox/            # DEPRECATED → re-exports from workflow-runtime
│   ├── replay-core/                # DEPRECATED → re-exports from workflow-runtime
│   ├── evidence-graph/             # DEPRECATED → re-exports from evidence-ledger
│   ├── planner/                    # DEPRECATED → re-exports from agent-core
│   ├── action-engine/              # DEPRECATED → re-exports from agent-core
│   ├── reflection-engine/          # Keep → wire to evals Evaluator role
│   │
│   ├── # ── Infrastructure (unchanged) ───────────────────────────────
│   ├── db/ db-migrations/ db-repository/ db-schema/
│   ├── env/
│   ├── otel/
│   ├── observability-core/
│   ├── telemetry-standards/
│   ├── trace-graph/
│   ├── brand-registry/
│   ├── marketing/
│   ├── atlas-core/ atlas-events/ atlas-types/
│   ├── business-events/
│   ├── constellation/
│   ├── demo-seed/
│   ├── executive-briefing/
│   ├── nvidia-adapters/
│   ├── openusd-export/
│   ├── prompt-registry/
│   ├── run-ledger/
│   ├── signal-mesh/
│   ├── simulation/
│   ├── skill-library/
│   ├── substrate/ substrate-client/
│   ├── self-model/
│   ├── verifier/
│   ├── connectors/
│   ├── cognitive-observability/
│   ├── ai-control-plane/
│   ├── atlassian-connect/
│   ├── domain-claims/
│   └── proxy-routes.ts/
│
├── lib/                            # Largely unchanged; key additions noted
│   ├── # All existing 41 packages retained
│   └── # (No new lib packages needed under AEEP; new capabilities go into packages/)
│
├── artifacts/                      # Unchanged structure; UI updates per Phase 4
│
├── services/                       # Unchanged
│
├── scripts/
│   ├── generate-platform-metrics.ts  # NEW
│   ├── validate-platform-facts.ts    # NEW
│   ├── aef-smoke.ts                  # Existing
│   └── # All other existing scripts retained
│
└── docs/
    ├── evolve-repo-audit.md          # NEW (this series)
    ├── evolve-ui-audit.md            # NEW
    ├── evolve-runtime-audit.md       # NEW
    ├── evolve-metrics-audit.md       # NEW
    ├── evolve-file-tree-plan.md      # NEW (this document)
    ├── evolve-refactor-plan.md       # NEW
    ├── evolve-style-principles.md    # NEW (Phase 8)
    ├── evolve-component-inventory.md # NEW (Phase 8)
    ├── evolve-screen-mapping.md      # NEW (Phase 8)
    ├── evolve-runtime-architecture.md # NEW (Phase 8)
    ├── evolve-evidence-model.md      # NEW (Phase 8)
    ├── evolve-policy-model.md        # NEW (Phase 8)
    ├── evolve-domain-profiles.md     # NEW (Phase 8)
    ├── evolve-deployment.md          # NEW (Phase 8)
    ├── evolve-integration-summary.md # NEW (Phase 8)
    ├── evolve-final-summary.md       # NEW (Phase 8)
    ├── platform-facts.md             # NEW (Phase 2)
    ├── replit-runbook.md             # NEW (Phase 8)
    ├── deployment-topology.md        # NEW (Phase 8)
    └── # All existing docs retained
```

---

## 3. Design System File Tree

```
packages/design-system/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    # Main barrel export
    │
    ├── tokens/
    │   ├── index.ts
    │   ├── color.ts                # Color tokens (expanded + refined)
    │   ├── spacing.ts              # 8px-base spacing scale
    │   ├── typography.ts           # Enterprise sans stack + scale
    │   ├── elevation.ts            # Restrained shadow/elevation tokens
    │   ├── radius.ts               # Border radius tokens
    │   ├── motion.ts               # Minimal motion tokens (≤200ms)
    │   ├── chart.ts                # Executive-quiet chart palette
    │   └── semantic.ts             # Semantic state tokens
    │
    ├── foundations/
    │   ├── index.ts
    │   ├── density.ts              # Density mode definitions (comfortable/compact/dense)
    │   └── theme.ts                # Theme definitions (dark/light future)
    │
    ├── hooks/
    │   ├── index.ts
    │   ├── useDensity.ts           # Density mode hook
    │   └── useTheme.ts             # Theme hook
    │
    ├── providers/
    │   ├── index.ts
    │   └── DesignSystemProvider.tsx # Context provider (density + theme)
    │
    ├── shell/                      # App shell components
    │   ├── index.ts
    │   ├── AppShell.tsx            # Root shell with nav + inspector slots
    │   ├── SideNav.tsx             # Left navigation
    │   ├── TopBar.tsx              # Top bar with breadcrumbs + controls
    │   ├── CommandBar.tsx          # Command bar / ⌘K palette
    │   ├── PageHeader.tsx          # Page-level header
    │   ├── SectionPanel.tsx        # Section container
    │   ├── GlobalCommandPalette.tsx # Full command palette
    │   └── TenantIndicator.tsx     # Tenant/env indicator
    │
    ├── layout/                     # Layout primitives
    │   ├── index.ts
    │   ├── SplitPane.tsx           # Horizontal split pane
    │   ├── SideInspector.tsx       # Right inspector panel
    │   └── InspectorTabs.tsx       # Tabbed inspector
    │
    ├── data/                       # Data display components
    │   ├── index.ts
    │   ├── DataGrid.tsx            # High-density data grid
    │   ├── TableToolbar.tsx        # Grid toolbar (filter/sort/export)
    │   ├── FilterBar.tsx           # Filter bar
    │   ├── MetricStat.tsx          # Single metric stat block
    │   └── StatusBadge.tsx         # Status / severity badge
    │
    ├── detail/                     # Detail / drawer components
    │   ├── index.ts
    │   ├── DetailDrawer.tsx        # Side drawer for record detail
    │   └── RecordTabs.tsx          # Summary/Activity/Evidence/Governance/Artifacts tabs
    │
    ├── timeline/                   # Timeline and activity components
    │   ├── index.ts
    │   ├── Timeline.tsx            # Workflow / event timeline
    │   ├── ActivityFeed.tsx        # Live activity feed
    │   └── AuditTrailList.tsx      # Audit trail list
    │
    ├── evidence/                   # Evidence-first components
    │   ├── index.ts
    │   └── EvidencePanel.tsx       # Evidence side panel (source/policy/trace)
    │
    ├── approval/                   # Approval components
    │   ├── index.ts
    │   └── ApprovalDialog.tsx      # Approval / rejection modal (existing)
    │
    ├── form/                       # Form components
    │   ├── index.ts
    │   ├── FormField.tsx           # Form field wrapper
    │   ├── SearchInput.tsx         # Search input
    │   ├── Select.tsx              # Select control
    │   ├── SegmentedControl.tsx    # Segmented control
    │   └── Stepper.tsx             # Multi-step stepper
    │
    ├── feedback/                   # Feedback / state components
    │   ├── index.ts
    │   ├── EmptyState.tsx          # Empty state
    │   ├── ErrorState.tsx          # Error state
    │   └── LoadingState.tsx        # Loading state
    │
    ├── proof/                      # Proof envelope (existing — keep)
    │   └── (existing files)
    │
    ├── cockpit/                    # Cockpit primitives (existing — keep + extend)
    │   └── (existing files)
    │
    ├── alloy-bridge.ts             # Alloy data adapter (existing)
    └── utils.ts                    # cn utility (existing)
```

---

## 4. New Packages File Trees

### `packages/shared-contracts/`
```
src/
├── index.ts
├── v1/
│   ├── tasks.ts        # /v1/tasks/plan|execute contracts
│   ├── search.ts       # /v1/search/hybrid contract
│   ├── embed.ts        # /v1/embed contract
│   ├── rerank.ts       # /v1/rerank contract
│   ├── memory.ts       # /v1/memory/write|query contracts
│   ├── workflows.ts    # /v1/workflows/start|resume|approve contracts
│   ├── index.ts        # /v1/index/rebuild|verify contracts
│   └── evals.ts        # /v1/evals/run contract
├── roles/
│   ├── mission-planner.ts
│   ├── retrieval-strategist.ts
│   ├── memory-custodian.ts
│   ├── tool-orchestrator.ts
│   ├── policy-guardian.ts
│   ├── execution-supervisor.ts
│   ├── evidence-synthesizer.ts
│   └── evaluator.ts
├── evidence.ts         # Full Evidence object schema
├── tenant.ts           # Tenant context schema
└── common.ts           # Shared primitives
```

### `packages/agent-core/`
```
src/
├── index.ts
├── types.ts            # Core agent types
├── roles/              # Typed role implementations
│   ├── mission-planner.ts
│   ├── retrieval-strategist.ts
│   ├── memory-custodian.ts
│   ├── tool-orchestrator.ts
│   ├── policy-guardian.ts
│   ├── execution-supervisor.ts
│   ├── evidence-synthesizer.ts
│   └── evaluator.ts
├── loop/               # Cognitive loop (from cognitive-runtime)
│   ├── perceive.ts
│   ├── orient.ts
│   ├── plan.ts
│   ├── execute.ts
│   ├── verify.ts
│   ├── reflect.ts
│   ├── update-self-model.ts
│   └── update-memory.ts
├── orchestrator.ts     # Loop orchestrator
└── execution-order.ts  # AEEP 12-step execution order
```

### `packages/workflow-runtime/`
```
src/
├── index.ts
├── types.ts            # Workflow types
├── engine.ts           # Core workflow engine
├── checkpoint.ts       # Checkpoint store
├── event-source.ts     # Event sourcing / append-only log
├── timeline.ts         # Timeline replay
├── approval.ts         # Approval interrupt + routing
├── retry.ts            # Retry-safe node contracts
├── workflows/          # Starter workflow definitions
│   ├── ingest-source.ts
│   ├── rebuild-index.ts
│   ├── verify-index-health.ts
│   ├── investigate-signal.ts
│   ├── prepare-executive-brief.ts
│   ├── compile-case-timeline.ts
│   ├── review-property-risk.ts
│   ├── generate-operational-digest.ts
│   ├── rotate-profile-version.ts
│   └── run-eval-suite.ts
└── migrations.md       # Migration guide: alloy → workflow-runtime
```

### `packages/domain-profiles/`
```
src/
├── index.ts
├── types.ts            # Profile type definitions
├── lyte.ts             # Lyte domain profile
├── vessels.ts          # Vessels domain profile
├── terra.ts            # Terra domain profile
├── aegis.ts            # Aegis domain profile
├── prism.ts            # PRISM domain profile
└── carlota.ts          # Carlota domain profile
```

### `packages/platform-metrics-registry/`
```
src/
├── index.ts
├── schema.ts           # Typed PlatformFacts schema
├── registry.ts         # Generated + curated registry
├── overrides.json      # Manual override file (curated public numbers)
├── helpers.ts          # Docs + UI consumption helpers
└── validate.ts         # Drift validation logic
```

---

## 5. Migration Windows

| Phase | Old Package | New Package | Migration Window |
|-------|------------|-------------|-----------------|
| 5 | `aef-contracts` | `shared-contracts` | Immediate (adapter re-export) |
| 6 | `cognitive-runtime` | `agent-core` | 30 days |
| 6 | `alloy` | `workflow-runtime` | 30 days |
| 6 | `memory-fabric` | `memory-core` | 30 days |
| 5 | `aef-retrieval-core` | `retrieval-core` | 30 days |
| 5 | `aef-evidence-ledger` | `evidence-ledger` | 30 days |
| 5 | `aef-policy-guard` | `policy-guard` | 30 days |
| 3 | `ui-command` | `design-system` | 60 days |
| 2 | Hard-coded metrics | `platform-metrics-registry` | 60 days |
