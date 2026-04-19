# 05 — Consolidation Plan
*One-of-One Audit · SZL Holdings Platform · April 2026*

---

## What This Document Is

The locked go-forward specification for the SZL platform consolidation. Every implementation decision flows from this document. When in doubt, this wins.

---

## 1. Surfaces: Keep / Merge / Retire

### Keep (distinct products, distinct audiences)
| Surface | Reason |
|---------|--------|
| **SZL Holdings** | Portfolio hub + public marketing site — audience is investors, public, operators |
| **Sentra** | Security operations — CISO / SOC / security engineers |
| **Aegis** | Investor pitch deck + deep security analytics — separate from Sentra's ops focus |
| **Counsel** | Legal operations — general counsel, compliance |
| **PRISM Counsel** | Advanced legal intelligence — senior legal, external counsel |
| **Vessels** | Maritime operations — fleet operators, trading desks |
| **Terra** | Real estate intelligence — investors, fund managers, brokers |
| **Lyte** | Decision intelligence layer — platform operators |
| **Pulse** | Executive briefing — C-suite, board |
| **Command** | Platform control tower — platform admins, AI operators |
| **Carlota Jo** | Independent consulting brand — separate identity |
| **Mobile** | Mobile companion — executives on the go |
| **Demo Video** | Marketing asset — keep for outbound |

**No surfaces retire.** All 13 surfaces have distinct audiences and distinct value.

### Merge (collapse within surface)
- **Aegis `marketing-home.tsx` + `aegis-home.tsx`** → one canonical home; retire the other
- **SZL Holdings `investors-overview-v2.tsx` + `investors-founder-v2.tsx`** → retire v2 files, canonicalize v1
- **All duplicate `/governed-cockpit`, `/pulse`, `/observability`, `/atlas-runtime` routes across non-canonical surfaces** → redirect to canonical surface

### Retire (dead code / orphaned routes)
See `02-overlap-and-duplication-map.md` for the full 56-file list. High-priority retirements:
- Per-artifact component copies: `graphql-data-panel.tsx`, `atlas-scene-panel.tsx`, `policy-mode-badge.tsx`, `pending-autonomy-approvals.tsx` (3 surfaces × 4 components = 12 files)
- Orphaned route files in Aegis, Vessels, Terra: `pulse.tsx`, `governed-cockpit.tsx`, `observability.tsx`, `atlas-runtime.tsx`, `atlas-artifacts.tsx` (5 concepts × 3 surfaces = 15 files)
- Duplicate investor pages in SZL Holdings: `investors-overview-v2.tsx`, `investors-founder-v2.tsx` (2 files)

---

## 2. Unified Information Architecture

Every web artifact (except Carlota Jo + Demo Video) exposes this canonical top-level rhythm:

```
[Surface Name]
├── Overview              ← "What's happening right now"
│   └── [Domain dashboard + embedded Pulse briefing widget]
├── Workspaces            ← Surface-specific operational pages
│   └── [Domain-specific pages — varies per surface]
├── Decision Center       ← [Shared DecisionCenter module]
│   ├── Active Decisions
│   ├── Policy Evaluation
│   └── Simulation Branches
├── Trust & Proof         ← [Shared TrustPanel module]
│   ├── Proof Chain
│   ├── Audit Timeline
│   ├── Evidence
│   └── Approvals Inbox
└── Settings              ← [Shared SettingsShell module]
    ├── Profile
    ├── Team
    ├── Integrations
    └── Data & Exports
```

**Context preservation:** When an operator navigates from Vessels → Command, the following persist in URL params or localStorage:
- `tenantId` — which tenant / account
- `timeRange` — selected time window
- `entityId` + `entityType` — currently selected entity (vessel, property, matter, etc.)

Cross-surface jumps (from ⌘K or explicit links) carry these as query params: `?from=vessels&entityId=VESSEL_001&entityType=vessel`

---

## 3. Design Token Specification

All surfaces share a single token set. Per-surface variation is limited to **one accent color** and **one icon family reference**.

### Base Tokens (from `@szl-holdings/design-system/tokens`)

```
color.bg.base       = #060b12  (all surfaces)
color.bg.surface    = #0d1520
color.bg.overlay    = #111c2a
color.bg.raised     = #162030
color.border.subtle = #1a2535
color.border.default= #243040
color.text.primary  = #c8d8e8
color.text.secondary= #7a99b8
color.text.muted    = #4a6070
```

### Per-Surface Accent Overrides

| Surface | Accent | CSS Variable Override |
|---------|--------|----------------------|
| Sentra | `#ef4444` | `--accent: 0 84% 60%` |
| Aegis | `#a855f7` | `--accent: 270 95% 65%` |
| Counsel | `#8b5cf6` | `--accent: 258 90% 66%` |
| PRISM Counsel | `#8b5cf6` | `--accent: 258 90% 66%` |
| Vessels | `#0ea5e9` | `--accent: 199 89% 48%` |
| Terra | `#10b981` | `--accent: 160 84% 39%` |
| Lyte | `#06b6d4` | `--accent: 192 91% 43%` |
| Pulse | `#f59e0b` | `--accent: 38 92% 50%` |
| Command | `#00d4ff` | `--accent: 190 100% 50%` |
| SZL Holdings | `#14b8a6` | `--accent: 172 66% 40%` |

No other token divergence is permitted.

---

## 4. Shared Modules: Canonical List

These modules live in `lib/shared-ui/src/` (for React components) or `packages/design-system/src/` (for headless tokens/primitives). Every artifact imports them — no reimplementation.

### Platform Shell
| Module | Location | Status |
|--------|----------|--------|
| `DashboardShell` | `lib/shared-ui/src/design-system/DashboardShell.tsx` | ✅ EXISTS |
| `SidebarNav` | `lib/shared-ui/src/design-system/SidebarNav.tsx` | ✅ EXISTS |
| `EcosystemNav` | `lib/shared-ui/src/ecosystem-nav.tsx` | ✅ EXISTS |
| `CommandPalette` | `lib/shared-ui/src/command-palette.tsx` | ✅ EXISTS |
| `SentientLayer` | `lib/shared-ui/src/sentient-layer.tsx` | 🔴 MISSING — BUILD |

### Canonical Domain Modules
| Module | Location | Status |
|--------|----------|--------|
| `DecisionCenter` | `lib/shared-ui/src/DecisionCenter.tsx` | ✅ EXISTS |
| `TrustPanel` | `lib/shared-ui/src/proof-panel.tsx` | ✅ EXISTS |
| `AgentRunCard` | `lib/shared-ui/src/design-system/` | 🔴 MISSING — BUILD |
| `EntityGraph` | `lib/shared-ui/src/cortex-entity-graph.tsx` | 🟡 EXISTS (Cortex-specific) → GENERALIZE |
| `IncidentCommander` | Per-surface | 🔴 MISSING — BUILD |
| `ApprovalsInbox` | `packages/approvals-inbox/` | ✅ EXISTS |
| `AuditTimeline` | `lib/shared-ui/src/design-system/AuditDrawer.tsx` | 🟡 EXISTS (drawer) → PROMOTE to page-level |
| `EvidenceExplorer` | `lib/shared-ui/src/evidence-explorer.tsx` | ✅ EXISTS |
| `ScenarioBranchesPanel` | Per-surface | 🔴 MISSING — BUILD |
| `SettingsShell` | `lib/shared-ui/src/settings-shell.tsx` | ✅ EXISTS |
| `SimulationCockpit` | `lib/shared-ui/src/simulation-cockpit.tsx` | ✅ EXISTS |
| `DocumentEngine` | `lib/shared-ui/src/document-engine/` | ✅ EXISTS |
| `AtlasArtifactPanel` | `lib/shared-ui/src/atlas-artifact-panel.tsx` | ✅ EXISTS |
| `PulseBriefingPanel` | `lib/shared-ui/src/pulse-briefing-panel.tsx` | ✅ EXISTS |

### Universal State Components
| Module | Location | Status |
|--------|----------|--------|
| `EmptyState` | `lib/shared-ui/src/EmptyState.tsx` | ✅ EXISTS |
| `LoadingSkeleton` | `lib/shared-ui/src/design-system/LoadingSkeleton.tsx` | ✅ EXISTS |
| `ErrorBoundary` | `lib/shared-ui/src/error-boundary.tsx` | ✅ EXISTS |
| `ErrorState` | `lib/shared-ui/src/design-system/ErrorState.tsx` | ✅ EXISTS |
| `AccessDenied` | `lib/shared-ui/src/design-system/AccessDenied.tsx` | ✅ EXISTS |

### Proof & Policy Primitives
| Module | Location | Status |
|--------|----------|--------|
| `ProofEnvelope` | `packages/design-system/src/proof/ProofEnvelope.tsx` | ✅ EXISTS |
| `EvidenceBadge` | `packages/design-system/src/proof/EvidenceBadge.tsx` | ✅ EXISTS |
| `ConfidenceMeter` | `packages/design-system/src/proof/ConfidenceMeter.tsx` | ✅ EXISTS |
| `PolicyModeBadge` | `packages/design-system/src/proof/PolicyModeBadge.tsx` | ✅ EXISTS |
| `PolicyStateChip` | `packages/design-system/src/proof/PolicyStateChip.tsx` | ✅ EXISTS |
| `FreshnessChip` | `packages/design-system/src/proof/FreshnessChip.tsx` | ✅ EXISTS |
| `AutonomyModeToggle` | `packages/design-system/src/proof/AutonomyModeToggle.tsx` | ✅ EXISTS |

---

## 5. Sentient Layer Specification

The Sentient Layer is a new shared module: a summonable intelligence rail that lives at the right edge of every DashboardShell-based surface. It appears when the user presses `⌘J` or clicks the intelligence icon in EcosystemNav.

### Behavior
- **Context-aware:** Knows current surface, current entity, current time range from URL params + localStorage.
- **Three panels (tab-switched):**
  1. **Now** — What changed in the last hour relevant to the current entity/surface. Powered by `PulseBriefingPanel` with entity filter.
  2. **Next** — 3 recommended next actions, each with policy verdict and confidence score.
  3. **Links** — Cross-surface jumps that preserve context. E.g., "View this vessel's sanctions history in Vessels" from Sentra.

### Data Sources
- Pulse briefing data (existing `/api/briefings` endpoint)
- Decision Center pending decisions (existing `/api/decisions` endpoint)
- Agent recommendations from the AI control plane (existing routes)
- No new model providers. No new API keys.

### Implementation
```
lib/shared-ui/src/sentient-layer.tsx
```
Exported as `@szl-holdings/shared-ui/sentient-layer`.

`DashboardShell` gains an optional `sentientLayer?: SentientLayerConfig` prop. When provided, the intelligence icon appears in EcosystemNav and the right rail is mounted.

---

## 6. Command Palette Taxonomy

The portfolio-wide ⌘K palette searches across all surfaces from a single registry.

### Command Groups

| Group | Examples |
|-------|---------|
| **Navigate** | "Go to Fleet Map", "Open PRISM Counsel", "Decision Center" |
| **Switch App** | All 10 platform surfaces with direct links |
| **Search** | Global entity search — vessel names, property addresses, matter titles |
| **Actions** | "Create new decision", "Request approval", "Export audit log" |
| **Recent** | Last 5 visited pages across all surfaces |
| **Slash Commands** | `/proof`, `/decision`, `/brief`, `/simulate` |

### Cross-App Commands (new — from `getEcosystemSwitchCommands`)
Already exists in `command-palette.tsx`. Wire into all artifacts that don't yet have it.

---

## 7. Copy Voice Specification

### Prohibited phrases (sweep and remove from all surfaces)
- "Powered by AI" / "AI-powered"
- "Leveraging machine learning"
- "State-of-the-art"
- "Next-generation"
- "Cutting-edge"
- "Seamlessly"
- "Delightful"
- "Unlock the power of"
- "Coming soon" (on any investor-visible page)
- "We couldn't process your request" (replace with specific error + action)

### Required patterns
- **Metric labels:** Always quantify. "3 pending approvals" not "Pending approvals."
- **Alert copy:** Lead with impact. "High-severity sanctions match — MV Poseidon" not "New alert."
- **Empty states:** State what's missing + what to do. "No active decisions — create one to start governing." Not "No data."
- **Error states:** State what failed + recovery action. "Proof chain unavailable — retry or contact support." Include retry button.
- **CTA buttons:** Verb-first. "Review Decision" not "Decision Review." "Export Audit Log" not "Audit Log Export."

---

## 8. Cleanup: Files to Delete

Execute after shared module extraction is confirmed:

```bash
# Duplicate component copies (per-artifact, already in shared-ui/design-system)
artifacts/aegis/src/components/graphql-data-panel.tsx
artifacts/aegis/src/components/atlas-scene-panel.tsx
artifacts/vessels/src/components/graphql-data-panel.tsx
artifacts/vessels/src/components/atlas-scene-panel.tsx
artifacts/vessels/src/components/policy-mode-badge.tsx
artifacts/vessels/src/components/pending-autonomy-approvals.tsx
artifacts/terra/src/components/graphql-data-panel.tsx
artifacts/terra/src/components/atlas-scene-panel.tsx
artifacts/terra/src/components/policy-mode-badge.tsx
artifacts/terra/src/components/pending-autonomy-approvals.tsx

# Duplicate route pages (redirect to canonical surface instead)
artifacts/aegis/src/pages/pulse.tsx           → redirect to /pulse/
artifacts/aegis/src/pages/governed-cockpit.tsx → redirect to /command/governed-cockpit
artifacts/aegis/src/pages/observability.tsx   → redirect to /command/
artifacts/vessels/src/pages/pulse.tsx          → redirect to /pulse/
artifacts/vessels/src/pages/governed-cockpit.tsx → redirect to /command/governed-cockpit
artifacts/terra/src/pages/pulse.tsx            → redirect to /pulse/
artifacts/terra/src/pages/governed-cockpit.tsx → redirect to /command/governed-cockpit
artifacts/terra/src/pages/observability.tsx    → redirect to /command/

# Orphaned investor pages
artifacts/szl-holdings/src/pages/investors-overview-v2.tsx
artifacts/szl-holdings/src/pages/investors-founder-v2.tsx
```

---

## 9. Performance Targets

| Metric | Target | Current State |
|--------|--------|---------------|
| First Contentful Paint | < 1.5s on fast-3G | Vessels ~2s, Aegis ~3s |
| Largest Contentful Paint | < 2.5s | Aegis likely 4s+ |
| Time to Interactive | < 3.5s | All surfaces unknown |
| Bundle size (initial) | < 400KB gzip | Aegis likely 800KB+ |
| Route chunk size | < 150KB each | Unknown |

**Priority actions:**
1. Aegis: Enable route-level code splitting via `React.lazy()` on all page imports
2. Vessels: Lazy-load mapping library (Mapbox / Leaflet) only on map routes
3. Terra: Lazy-load chart libraries on analytics routes only

---

## 10. Accessibility Baseline

All shared shell components must pass:
- [ ] Keyboard navigation: Tab order follows visual order; no focus traps
- [ ] Screen reader landmarks: `<main>`, `<nav>`, `<aside>`, `<header>` used correctly
- [ ] Color contrast: All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] Reduced motion: All animations respect `prefers-reduced-motion`
- [ ] Focus indicators: All interactive elements have visible focus rings

---

## 11. Migration Sequence

Execute in this order to minimize risk:

| Phase | Surfaces | Work |
|-------|---------|------|
| **Phase 1** | Sentra, Counsel (already on shared shell) | Wire ⌘K CommandPalette; add demo path markers; seed empty states |
| **Phase 2** | Lyte, Pulse | Migrate to shared DashboardShell + EcosystemNav |
| **Phase 3** | Aegis | Migrate bespoke shell to DashboardShell; collapse 150→30 visible routes |
| **Phase 4** | All surfaces | Deploy SentientLayer; wire cross-surface context preservation |
| **Phase 5** | All surfaces | Dead-code sweep; delete 56 identified files |
| **Phase 6** | SZL Holdings | Portfolio cover storytelling update |

---

## 12. Definition of Done

The task is complete when:

- [ ] All 5 discovery docs committed under `docs/audit/one-of-one/`
- [ ] `SentientLayer` component exists in `lib/shared-ui/src/sentient-layer.tsx`
- [ ] `AgentRunCard` shared module exists in shared-ui
- [ ] `IncidentCommander` shared module exists in shared-ui
- [ ] `ScenarioBranchesPanel` shared module exists in shared-ui
- [ ] `CommandPalette` wired in Sentra, Counsel, PRISM Counsel (3 surfaces that were missing it)
- [ ] Per-artifact duplicate component files deleted (12 files)
- [ ] Orphaned route pages converted to redirects (8 routes)
- [ ] SZL Holdings landing page updated with consolidated platform story
- [ ] `replit.md` updated with new shared module catalog
- [ ] `ARCHITECTURE.md` updated with Sentient Layer + Command Palette architecture
- [ ] `DEMO_GUIDE.md` updated with per-surface 5-step demo paths
- [ ] `docs/audit/one-of-one/README.md` written
