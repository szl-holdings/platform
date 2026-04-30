# 02 — Overlap & Duplication Map
*One-of-One Audit · SZL Holdings Platform · April 2026*

---

## Purpose
Map every concept that appears in 2+ artifacts today, then assign a consolidation verdict per row.

**Verdict codes**
| Code | Meaning |
|------|---------|
| KEEP-SHARED | Exists in shared-ui or packages; all surfaces already consume it. No action needed. |
| PROMOTE | Logic exists in 1–2 artifacts; extract to `lib/shared-ui` or `packages/`. |
| MERGE | Multiple divergent implementations; pick one canonical, delete the rest. |
| RETIRE | Appears multiple places, only needed in one (or none). Remove duplicates. |
| PER-SURFACE | Intentional per-surface variation; keep in artifact, don't extract. |

---

## Concept Matrix

### 1. Decision Center

| Surface | File | Implementation | Verdict |
|---------|------|----------------|---------|
| SZL Holdings | `pages/decision-center.tsx` | Custom page | MERGE |
| Sentra | `pages/decision-center.tsx` | Custom page | MERGE |
| Aegis | `pages/decision-center.tsx` | Custom page | MERGE |
| Counsel | `pages/decision-center.tsx` | Custom page | MERGE |
| Vessels | `pages/decision-center.tsx` | Custom page | MERGE |
| Terra | `pages/decision-center.tsx` | Custom page | MERGE |
| Lyte | `pages/decision-center.tsx` | Custom page | MERGE |
| Pulse | `pages/decision-center.tsx` | Custom page | MERGE |
| Command | `pages/decision-center.tsx` | Custom page | MERGE |
| shared-ui | `DecisionCenter.tsx` | ✅ EXISTS — shared component | **KEEP-SHARED** |

**Action:** All artifact `decision-center.tsx` pages should import and compose from `@szl-holdings/shared-ui`'s `DecisionCenter`. Add domain-specific signal feeds as props, not reimplementations.

---

### 2. Trust & Provenance

| Surface | File | Verdict |
|---------|------|---------|
| Sentra | `pages/trust-provenance.tsx` | MERGE |
| Counsel | `pages/trust-provenance.tsx` | MERGE |
| Vessels | `pages/trust-provenance.tsx` | MERGE |
| Terra | `pages/trust-provenance.tsx` | MERGE |
| SZL Holdings | `pages/trust.tsx`, `pages/trust-center.tsx` | MERGE |
| Aegis | `pages/trust-provenance.tsx`, `pages/audit-chain.tsx` | MERGE |
| design-system | `proof/ProofEnvelope.tsx`, `proof/EvidenceBadge.tsx` | KEEP-SHARED |

**Action:** Canonical `<TrustPanel />` wrapping ProofChain + CovenantPolicy verdict. Per-surface pages become thin wrappers supplying domain entity IDs.

---

### 3. Pulse / Executive Briefing

| Surface | File | Verdict |
|---------|------|---------|
| Vessels | `pages/pulse.tsx` | RETIRE (redirect to /pulse app) |
| Terra | `pages/pulse.tsx` | RETIRE |
| Aegis | `pages/pulse.tsx` | RETIRE |
| SZL Holdings | `pages/pulse.tsx` | RETIRE |
| **Pulse app** | All pages | **KEEP** — canonical surface |
| shared-ui | `pulse-briefing-panel.tsx` | KEEP-SHARED — embeddable widget |

**Action:** Remove standalone `/pulse` routes from Vessels, Terra, Aegis, SZL Holdings. Replace with `<PulseBriefingPanel />` widget embedded in each surface's overview page.

---

### 4. Governed Cockpit

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/governed-cockpit.tsx` | RETIRE (duplicate) |
| Vessels | `pages/governed-cockpit.tsx` | RETIRE |
| Terra | `pages/governed-cockpit.tsx` | RETIRE |
| Pulse | `pages/governed-cockpit.tsx` | RETIRE |
| Command | `pages/governed-cockpit.tsx` | RETIRE |
| SZL Holdings | `pages/governed-cockpit.tsx` | RETIRE |
| Command app | Canonical governed cockpit | **KEEP** |

**Action:** All `/governed-cockpit` routes in non-Command surfaces should redirect to `/command/governed-cockpit`. Remove the page files.

---

### 5. Atlas Runtime

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/atlas-runtime.tsx` | RETIRE |
| Vessels | `pages/atlas-runtime.tsx` | RETIRE |
| Terra | `pages/atlas-runtime.tsx` | RETIRE |
| Command | `pages/atlas-runtime.tsx` | **KEEP** — canonical |

**Action:** Same pattern — redirect to Command's canonical view.

---

### 6. Scenario Branches / Replay

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/scenario-branches.tsx`, `pages/replay.tsx` | PER-SURFACE |
| Vessels | `pages/scenario-branches.tsx`, `pages/replay.tsx` | PER-SURFACE |
| Terra | `pages/scenario-branches.tsx`, `pages/replay.tsx` | PER-SURFACE |
| Lyte | `pages/decision-replay.tsx` | PER-SURFACE |

**Action:** Keep per-surface since domain data differs (voyage vs property vs threat). Extract shared `<ScenarioBranchesPanel />` UI shell to shared-ui and supply per-surface data hooks.

---

### 7. Agent Insights

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/agent-insights.tsx` | MERGE |
| Vessels | `pages/agent-insights.tsx` | MERGE |
| Terra | `pages/agent-insights.tsx` | MERGE |
| shared-ui | `agent-insights-widget.tsx` | **KEEP-SHARED** |

**Action:** Use shared `agent-insights-widget.tsx` from shared-ui for all surfaces. Delete per-artifact `agent-insights.tsx` pages.

---

### 8. Observability Page

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/observability.tsx` | RETIRE |
| Vessels | `pages/observability.tsx` | RETIRE |
| Terra | `pages/observability.tsx` | RETIRE |
| SZL Holdings | `pages/observability.tsx` | RETIRE |
| Command | owns canonical observability | **KEEP** |

**Action:** All redirect to `/command/` for platform observability. Per-surface operational health stays in surface's own dashboard.

---

### 9. Atlas Artifacts Panel

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/atlas-artifacts.tsx` | RETIRE |
| Vessels | `pages/atlas-artifacts.tsx` | RETIRE |
| Terra | `pages/atlas-artifacts.tsx` | RETIRE |
| shared-ui | `atlas-artifact-panel.tsx` | **KEEP-SHARED** |

**Action:** Use shared panel. Remove per-surface page files.

---

### 10. Document Engine

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/document-engine.tsx` | MERGE |
| Vessels | `pages/document-engine.tsx` | MERGE |
| Terra | `pages/document-engine.tsx` | MERGE |
| shared-ui | `document-engine/` | **KEEP-SHARED** |

**Action:** All should import from shared-ui document engine. Domain-specific templates passed as props.

---

### 11. Evidence Panel

| Surface | File | Verdict |
|---------|------|---------|
| Vessels | `pages/evidence.tsx` | MERGE |
| Terra | `pages/evidence.tsx` | MERGE |
| Counsel | `pages/evidence.tsx` | MERGE |
| Lyte | `pages/evidence-explorer.tsx` | MERGE |
| Command | `pages/evidence-explorer.tsx` | MERGE |
| shared-ui | `evidence-explorer.tsx` | **KEEP-SHARED** |
| design-system | `cockpit/EvidenceDrawer.tsx` | KEEP-SHARED |

**Action:** All surfaces use `@szl-holdings/shared-ui/evidence-explorer` as the canonical evidence view.

---

### 12. Settings

| Surface | File | Verdict |
|---------|------|---------|
| Aegis | `pages/settings/unified-settings.tsx` | MERGE |
| Vessels | `pages/settings.tsx` | MERGE |
| SZL Holdings | `pages/unified-settings-page.tsx` | MERGE |
| shared-ui | `settings-shell.tsx` | **KEEP-SHARED** |

**Action:** Each surface mounts `<SettingsShell />` from shared-ui with surface-specific settings sections passed as props.

---

### 13. Approvals / Approval Review

| Surface | File | Verdict |
|---------|------|---------|
| Sentra | `pages/approvals.tsx` | MERGE |
| Counsel | `pages/approvals.tsx` | MERGE |
| Vessels | `pages/vessels-approval-review.tsx` | MERGE |
| Terra | `pages/approval-review.tsx` | MERGE |
| SZL Holdings | `pages/trust-approvals.tsx` | MERGE |
| packages | `approvals-inbox/` | **KEEP-SHARED** |
| shared-ui | `ApprovalStack` | KEEP-SHARED |

**Action:** All surfaces compose `<ApprovalsInbox />` from `@szl-holdings/approvals-inbox` package. Surface-specific filters passed as props.

---

### 14. GraphQL Data Panel

| Surface | Component file | Verdict |
|---------|---------------|---------|
| Aegis | `components/graphql-data-panel.tsx` | RETIRE |
| Vessels | `components/graphql-data-panel.tsx` | RETIRE |
| Terra | `components/graphql-data-panel.tsx` | RETIRE |
| shared-ui | `design-system/GraphQLDataPanel.tsx` | **KEEP-SHARED** |

**Action:** Already in shared-ui. Delete per-artifact copies.

---

### 15. Atlas Scene Panel

| Surface | Component file | Verdict |
|---------|---------------|---------|
| Aegis | `components/atlas-scene-panel.tsx` | RETIRE |
| Vessels | `components/atlas-scene-panel.tsx` | RETIRE |
| Terra | `components/atlas-scene-panel.tsx` | RETIRE |
| shared-ui | `atlas-artifact-panel.tsx` | **KEEP-SHARED** |

**Action:** Delete per-artifact copies; use shared-ui.

---

### 16. Policy Mode Badge

| Surface | Component file | Verdict |
|---------|---------------|---------|
| Vessels | `components/policy-mode-badge.tsx` | RETIRE |
| Terra | `components/policy-mode-badge.tsx` | RETIRE |
| design-system | `proof/PolicyModeBadge.tsx` | **KEEP-SHARED** |

**Action:** Delete per-artifact copies. Import from `@szl-holdings/design-system/proof/policy-mode-badge`.

---

### 17. Pending Autonomy Approvals

| Surface | Component file | Verdict |
|---------|---------------|---------|
| Vessels | `components/pending-autonomy-approvals.tsx` | RETIRE |
| Terra | `components/pending-autonomy-approvals.tsx` | RETIRE |
| shared-ui | `AutonomyDial.tsx`, `design-system/ApprovalStack.tsx` | **KEEP-SHARED** |

**Action:** Delete per-artifact copies.

---

### 18. Risk Simulation Panel

| Surface | Component file | Verdict |
|---------|---------------|---------|
| Vessels | `components/risk-simulation-panel.tsx` | MERGE |
| Terra | `components/risk-simulation-panel.tsx` | MERGE |
| shared-ui | `simulation-cockpit.tsx` | PROMOTE |

**Action:** Promote shared-ui `simulation-cockpit.tsx` as canonical. Delete per-artifact risk-simulation-panel.

---

### 19. Dashboard Shell / Platform Shell

| Surface | Pattern | Verdict |
|---------|---------|---------|
| Sentra | `DashboardShell` from shared-ui ✅ | KEEP-SHARED |
| Counsel | `DashboardShell` from shared-ui ✅ | KEEP-SHARED |
| Vessels | `DashboardShell` from shared-ui ✅ | KEEP-SHARED |
| Terra | `DashboardShell` from shared-ui ✅ | KEEP-SHARED |
| Command | `DashboardShell` from shared-ui ✅ | KEEP-SHARED |
| Aegis | **Bespoke shell** ❌ | **MERGE** — migrate to DashboardShell |
| Lyte | Unknown shell | MERGE |
| Pulse | Custom layout | MERGE |
| SZL Holdings | Custom SiteNav | PER-SURFACE (marketing site) |

**Action:** Aegis, Lyte, Pulse to adopt `DashboardShell` + `SidebarNav` + `EcosystemNav` from shared-ui.

---

### 20. Command Palette

| Surface | Pattern | Verdict |
|---------|---------|---------|
| Vessels | `CommandPalette` from shared-ui ✅ | KEEP-SHARED |
| shared-ui | `command-palette.tsx` | KEEP-SHARED |
| All other surfaces | Not wired | PROMOTE |

**Action:** Wire `CommandPalette` from shared-ui into Aegis, Sentra, Counsel, Terra, Lyte, Pulse, Command, SZL Holdings.

---

### 21. Ecosystem Nav (Top Bar)

| Surface | Pattern | Verdict |
|---------|---------|---------|
| Sentra, Counsel, Vessels, Terra, Command | `EcosystemNav` from shared-ui ✅ | KEEP-SHARED |
| Aegis, Lyte, Pulse | Unknown / custom | MERGE |

**Action:** All surfaces adopt `EcosystemNav` from shared-ui.

---

## Duplication Summary

| Category | Count of duplicated implementations | Effort to consolidate |
|----------|------------------------------------|-----------------------|
| Duplicate page concepts (can retire/redirect) | 8 concepts × ~4 surfaces = ~32 files | Low |
| Component duplicates (exact copies) | ~8 component files × 3 surfaces = ~24 files | Low |
| Concept merges needing shared canonical | ~6 concepts | Medium |
| Shell migrations (Aegis, Lyte, Pulse) | 3 surfaces | Medium-High |

**Total files to delete after consolidation: ~56 files** — repo gets smaller.
