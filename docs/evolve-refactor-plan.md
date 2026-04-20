# AEEP Refactor Plan — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** Ordered refactor plan, migration steps, coordination notes, risk register

---

## 1. Execution Order

AEEP phases are ordered to minimize merge conflicts and enable incremental value delivery:

```
Phase 1: Audit (complete — this document)
Phase 2: Platform metrics registry (independent, quick win)
Phase 3: Design system expansion (independent, UI team can run in parallel)
Phase 4: Shell rebuild (depends on Phase 3)
Phase 5: Shared contracts + retrieval/memory/evidence/policy/profiles
Phase 6: Runtime consolidation (depends on Phase 5)
Phase 7: UI ↔ runtime integration (depends on Phases 4 + 6)
Phase 8: Ergonomics + docs + final summary (depends on all)
```

---

## 2. Coordination with In-flight Work

Per task requirements, the following in-flight tasks must complete before AEEP touches their areas:

| Task | Area | Coordination Action |
|------|------|-------------------|
| #1224 | Cognitive Consoles → live data | Wait for completion before modifying cognitive-runtime |
| #1234 | Cognitive runtime e2e tests | Wait for completion; tests anchor the refactor |
| #1237 | Trace replay + policy consoles | Wait; these define the policy console UX contract |
| #1238 | Planner Studio + Reflection Console approve/reject | Wait; approval UX feeds into Phase 4 shell |

The following tasks are pending and superseded by AEEP — recommend cancellation:

| Task | AEEP Coverage |
|------|--------------|
| #1209 | Compliance schedule + supervision queue tables — folded into Phase 5 policy/workflow schema |
| #1218 | Share Constellation views — folded into Phase 4 shell saved-view pattern |
| #1225 | Cognitive Consoles overview — folded into Phase 4 Operations/Overview screens |
| #1229 | Live World Model graph updates — folded into Phase 7 evidence/memory UX |

---

## 3. Keep / Refactor / Replace / Remove Matrix (Complete)

### Applications

| Item | Action | Notes |
|------|--------|-------|
| `apps/alloy-embedding-api` | Refactor → `apps/alloy-runtime-api` | Embedding becomes sub-router under /v1 |
| `apps/alloy-ingestion-orchestrator` | Refactor → `apps/alloy-ingest-control` | Rename + harden |
| `apps/alloy-ops-console` | Create (new) | Operator management console |

### Workers

| Item | Action | Notes |
|------|--------|-------|
| `workers/alloy-embed-worker` | Rename → `workers/alloy-vector-worker` | Semantic alignment |
| `workers/alloy-rerank-worker` | Rename → `workers/alloy-rank-worker` | Semantic alignment |
| `workers/substrate-python` | Keep | No change |
| `workers/alloy-tool-executor` | Create (new) | Tool execution |
| `workers/alloy-retrieval-worker` | Create (new) | Retrieval pipeline |
| `workers/alloy-memory-worker` | Create (new) | Memory operations |
| `workers/alloy-eval-worker` | Create (new) | Evaluation |

### Packages — AEEP Core

| Item | Action | Notes |
|------|--------|-------|
| `packages/aef-contracts` | Refactor → `packages/shared-contracts` | Re-export adapter retained |
| `packages/cognitive-runtime` | Refactor → `packages/agent-core` inner loop | Re-export adapter retained |
| `packages/agents-core` | Fold into `packages/agent-core` | Re-export adapter retained |
| `packages/agents-tools` | Fold into `packages/agent-core` | Re-export adapter retained |
| `packages/planner` | Fold into `packages/agent-core` | Re-export adapter retained |
| `packages/action-engine` | Fold into `packages/agent-core` | Re-export adapter retained |
| `packages/alloy` | Refactor → `packages/workflow-runtime` | Re-export adapter retained |
| `packages/replay-core` | Fold into `packages/workflow-runtime` | Re-export adapter retained |
| `packages/approvals-inbox` | Fold into `packages/workflow-runtime` | Re-export adapter retained |
| `packages/szl-alloy` | Remove | Only re-export; no unique value |
| `packages/aef-retrieval-core` | Refactor → `packages/retrieval-core` | Re-export adapter retained |
| `packages/memory-fabric` | Refactor → `packages/memory-core` | Re-export adapter retained |
| `packages/aef-evidence-ledger` | Refactor → `packages/evidence-ledger` | Re-export adapter retained |
| `packages/evidence-graph` | Fold into `packages/evidence-ledger` | Re-export adapter retained |
| `packages/aef-policy-guard` | Refactor → `packages/policy-guard` | Re-export adapter retained |
| `packages/guardian` | Fold into `packages/policy-guard` | Re-export adapter retained |
| `packages/policy-engine` | Fold into `packages/policy-guard` | Re-export adapter retained |
| `packages/eval-forge` | Fold into `packages/evals` | Re-export adapter retained |
| `packages/eval-os` | Fold into `packages/evals` | Re-export adapter retained |
| `packages/evals-core` | Fold into `packages/evals` | Re-export adapter retained |
| `packages/agents-evals` | Fold into `packages/evals` | Re-export adapter retained |
| `packages/domain-profiles` | Create (new) | Domain config for 6 domains |
| `packages/storage-adapters` | Create (new) | local-fs, postgres, object-storage |
| `packages/platform-metrics-registry` | Create (new) | Platform facts registry |

### Packages — Design System

| Item | Action | Notes |
|------|--------|-------|
| `packages/design-system` | Expand | Full AEEP component set |
| `packages/ui-command` | Remove | Already deprecated; re-exports retained temporarily |
| `lib/shared-ui` DashboardShell etc. | Migrate to design-system/shell | lib/shared-ui retains re-exports |

### Packages — Kept Unchanged

| Item | Action |
|------|--------|
| `packages/config` | Keep (extend for metrics integration) |
| `packages/contracts` | Keep (extend for AEEP v1) |
| `packages/schemas` | Keep |
| `packages/ontology` | Keep |
| `packages/tool-registry` | Keep (enhance) |
| `packages/tool-mesh` | Keep |
| `packages/reflection-engine` | Keep (wire to evals Evaluator) |
| `packages/cognitive-observability` | Keep |
| `packages/self-model` | Keep |
| `packages/verifier` | Keep |
| `packages/signal-mesh` | Keep |
| `packages/trace-graph` | Keep |
| `packages/otel` | Keep |
| `packages/observability-core` | Keep |
| `packages/telemetry-standards` | Keep |
| `packages/brand-registry` | Keep |
| `packages/marketing` | Keep |
| `packages/atlas-*` | Keep |
| `packages/business-events` | Keep |
| `packages/constellation` | Keep |
| `packages/demo-seed` | Keep |
| `packages/executive-briefing` | Keep |
| `packages/nvidia-adapters` | Keep |
| `packages/openusd-export` | Keep |
| `packages/prompt-registry` | Keep |
| `packages/run-ledger` | Keep |
| `packages/simulation` | Keep |
| `packages/skill-library` | Keep |
| `packages/substrate` / `substrate-client` | Keep |
| `packages/ai-control-plane` | Keep |
| `packages/atlassian-connect` | Keep |
| `packages/domain-claims` | Keep |
| `packages/connectors` | Keep |
| `packages/db-*` | Keep |
| `packages/env` | Keep |

---

## 4. Phase-by-Phase Migration Steps

### Phase 2: Platform Metrics Registry

1. Create `packages/platform-metrics-registry/` with schema, registry, overrides, helpers, validate
2. Create `scripts/generate-platform-metrics.ts` — introspects filesystem, generates `src/registry.ts`
3. Create `scripts/validate-platform-facts.ts` — compares generated vs filesystem
4. Create `docs/platform-facts.md` — generated from registry
5. Update `packages/config` to import from metrics registry for numeric facts
6. Update README.md to use registry helpers for count references
7. Wire validation into CI check (non-blocking warning in dev)

### Phase 3: Design System Expansion

1. Expand `packages/design-system/src/tokens/` — add spacing, typography, elevation, radius, motion, chart, semantic tokens
2. Add `packages/design-system/src/foundations/` — density modes, theme
3. Add `packages/design-system/src/hooks/` — useDensity, useTheme
4. Add `packages/design-system/src/providers/` — DesignSystemProvider
5. Add `packages/design-system/src/shell/` — AppShell, SideNav, TopBar, CommandBar, PageHeader, SectionPanel, GlobalCommandPalette, TenantIndicator
6. Add `packages/design-system/src/layout/` — SplitPane, SideInspector, InspectorTabs
7. Add `packages/design-system/src/data/` — DataGrid, TableToolbar, FilterBar, MetricStat, StatusBadge
8. Add `packages/design-system/src/detail/` — DetailDrawer, RecordTabs
9. Add `packages/design-system/src/timeline/` — Timeline, ActivityFeed, AuditTrailList
10. Add `packages/design-system/src/evidence/` — EvidencePanel
11. Add `packages/design-system/src/form/` — FormField, SearchInput, Select, SegmentedControl, Stepper
12. Add `packages/design-system/src/feedback/` — EmptyState, ErrorState, LoadingState
13. Remove neon accents from token file; replace with enterprise-quiet accent family
14. Add lint rule blocking raw hex outside token files

### Phase 4: Shell Rebuild

1. Implement AppShell with left-nav + top-command-bar + tenant-indicator + status-center + approval-center + optional right-inspector
2. Wire GlobalCommandPalette to all surface routes
3. Define Executive Mode and Operator Mode as context modes in AppShell
4. Define primary nav contract: Overview | Operations | Search | Workflows | Evidence | Memory | Reports | Admin
5. Implement workbench screen patterns (overview, operator workbench, investigation, workflow timeline, record detail, admin tables)

### Phase 5: Shared Contracts + Core Packages

For each package (shared-contracts, retrieval-core, memory-core, evidence-ledger, policy-guard, domain-profiles):
1. Create new package with full AEEP feature set
2. Add deprecated re-export in old package pointing to new package
3. Update tsconfig.json references
4. Add validation tests

### Phase 6: Runtime Consolidation

1. Create `packages/agent-core` with typed role contracts + cognitive loop inner execution
2. Create `packages/workflow-runtime` with event sourcing + idempotency + starter workflows
3. Create `packages/evals` from consolidated eval packages
4. Create `packages/storage-adapters`
5. Refactor `apps/alloy-embedding-api` → `apps/alloy-runtime-api` with full AEEP v1 surface
6. Create `apps/alloy-ops-console` scaffold
7. Refactor `apps/alloy-ingestion-orchestrator` → `apps/alloy-ingest-control`
8. Scaffold new workers (tool-executor, retrieval-worker, memory-worker, eval-worker)
9. Rename existing workers (vector-worker, rank-worker)

### Phase 7: UI ↔ Runtime Integration

1. Wire AppShell evidence center to evidence-ledger queries
2. Implement EvidencePanel as a standard overlay on all material search/AI screens
3. Wire approval center to workflow-runtime approval queue
4. Add traceId display to recommendation cards, search results, workflow timeline
5. Implement workflow timeline screens with approval/retry visualization
6. Add Operator Console scaffold under apps/alloy-ops-console

### Phase 8: Ergonomics + Docs

1. Create `docs/replit-runbook.md` — one-command dev startup, Reserved VM, Autoscale, external workers
2. Create `docs/deployment-topology.md` — topology diagrams
3. Write all `docs/evolve-*.md` series (10 documents)
4. Refresh `README.md` with mermaid diagram, curl examples, smoke + benchmark instructions
5. Update `.env.example` with AEEP-specific variables
6. Create `scripts/aef-benchmark.ts` — end-to-end benchmark
7. Add health check endpoints to alloy-runtime-api
8. Create `docs/evolve-final-summary.md` — files created/modified/deprecated/removed

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Merge conflicts with #1224/#1234/#1237/#1238 | Medium | High | Wait for in-flight tasks before touching cognitive-runtime and console areas |
| tsconfig reference cycles | Medium | Medium | Strict boundary checker at `scripts/check-package-boundaries.ts` |
| Consumer breakage during package renames | Medium | High | Adapter re-exports + migration windows + deprecation notices |
| Platform facts drift reappearing | Low | Medium | CI validation script prevents regression |
| Design token refactor breaking existing surfaces | Medium | High | Phased rollout; tokens are additive where possible |
| New AEEP v1 endpoints conflicting with existing routes | Low | Medium | New endpoints under `/v1/` namespace; existing routes unchanged |

---

## 6. Success Criteria

All phases complete when:

- [ ] Six audit docs exist in `docs/evolve-*.md`
- [ ] `packages/platform-metrics-registry` is the single source for platform facts
- [ ] `packages/design-system` exposes full AEEP component set
- [ ] No neon/glow/oversaturated colors remain in authenticated product UX
- [ ] No raw hex outside token files
- [ ] AppShell with AEEP nav structure implemented
- [ ] Executive Mode and Operator Mode contracts defined
- [ ] All 8 typed role contracts defined in `packages/shared-contracts`
- [ ] `packages/retrieval-core` emits full Evidence objects
- [ ] `packages/memory-core` has contradiction detection + source-linking
- [ ] `packages/workflow-runtime` supports checkpoints + event sourcing + approval interrupts
- [ ] All 10 starter workflows defined
- [ ] 6 domain profiles defined
- [ ] `apps/alloy-runtime-api` exposes all 14 AEEP v1 endpoints
- [ ] `apps/alloy-ops-console` scaffold exists
- [ ] Every material screen surfaces traceId + evidence + policy check visibility
- [ ] One-command dev startup works
- [ ] Smoke tests and health checks pass
- [ ] All `docs/evolve-*.md` documents complete
- [ ] `docs/evolve-final-summary.md` lists all files created/modified/deprecated/removed
