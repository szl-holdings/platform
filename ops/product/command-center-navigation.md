# Command Center Navigation

Generated: 2026-04-16

## Overview

Navigation in the Lyte Command Center is designed for speed under pressure. An operator should be able to reach any surface within 2 keystrokes or 1 click from anywhere in the app.

## Navigation Hierarchy

```
Lyte Command Center
├── Workspace Mode Tabs (Strategy / Operations / Infrastructure)
├── Sidebar Navigation (per-mode item list)
│   ├── Section headers
│   └── Nav items with optional PRISM color coding
├── Command Palette (⌘K — global, no context required)
│   ├── Quick Nav items (labeled, shortcutted)
│   └── Live search (signals, actions, domain objects)
└── Service Status Rail (environment, health, version)
```

## Workspace Modes

| Mode | Accent Color | Focus |
|------|-------------|-------|
| `strategy` | `#8b7ac8` (purple) | Ecosystem intelligence, simulations, briefings |
| `operations` | `#d4a054` (gold) | AIOps, observability, action queue, PRISM |
| `infrastructure` | `#c9a227` (amber) | Cloud sovereignty, IMPERIUM, security perimeter |

## Sidebar Navigation Groups

### Strategy Mode
- Dashboard
- What-If Simulation
- Executive Briefing
- Briefing History

### Operations Mode (AIOps & Observability)
- Exec Command
- PRISM: Pulse · Risk · Intelligence · Signals · Motion
- Blocker Board
- Digest Center
- Approvals
- Trust & Audit
- Autonomous NOC
- Runbook Studio
- Knowledge Graph
- Self-Healing
- Alloy: Canvas · Action Queue · Intelligence · Governance
- SLO / SLI Management
- FinOps & Cloud Cost
- Distributed Tracing · Log Analytics · On-Call Management
- Inbox · Ownership Map

### Infrastructure Mode
- Executive Console
- Resource Map
- Security Perimeter
- Agent Orchestration
- Sovereignty Map
- Network Topology
- Configuration Audit

## Command Palette (⌘K)

### Trigger
```
Cmd+K (macOS) / Ctrl+K (Windows/Linux)
```

### Behavior
1. Opens a modal overlay with a search input
2. Shows quick-nav items by default (grouped by section)
3. On typing: debounced 300ms → calls `/api/command/search?q=<query>&limit=8`
4. Keyboard navigation: ↑/↓ to select, Enter to navigate, Esc to close
5. Selected item highlighted with accent color ring

### Quick Nav Shortcut Labels

| Section | Key | Destination |
|---------|-----|-------------|
| Operations | `O` | `/operations` |
| Strategy | `S` | `/strategy` |
| Infrastructure | `I` | `/infrastructure` |

### Search Result Types

| Type | Icon | Fields |
|------|------|--------|
| `signal` | Radio | title, domain, severity |
| `action` | CheckSquare | title, state, priority |
| `incident` | AlertTriangle | title, severity, status |
| `page` | LayoutDashboard | label, section |

## URL Structure

All routes are base-relative to the artifact base path.

```
/                     → Marketing / Landing
/strategy             → Strategy Dashboard
/strategy/simulation  → What-If Simulation
/strategy/executive-briefing → Executive Briefing
/operations           → Exec Command (default ops view)
/operations/prism/pulse      → PRISM Pulse
/operations/prism/risk       → PRISM Risk
/operations/prism/intelligence → PRISM Intelligence
/operations/prism/signals    → PRISM Signals
/operations/prism/motion     → PRISM Motion
/operations/action-queue     → Action Queue
/operations/blocker-board    → Blocker Board
/operations/approvals        → Approvals Center
/operations/inbox            → Command Inbox
/operations/trust-audit      → Trust & Audit
/operations/ownership        → Ownership Map
/operations/alloy/canvas     → Alloy Workflow Canvas
/operations/alloy/actions    → Alloy Action Console
/operations/alloy/intelligence → Alloy Intelligence
/infrastructure              → Infrastructure Executive Console
```

## Fast Navigation Patterns

1. **From anywhere → any page**: `⌘K` → type page name → `Enter`
2. **Between PRISM dimensions**: Click P/R/I/S/M bar in sidebar
3. **Between workspace modes**: Click Strategy / Operations / Infrastructure tabs
4. **Back to dashboard**: Click `SZL Business OS` in sidebar footer or `/` route
5. **Cross-domain**: Use ecosystem links in sidebar footer (TERRA · ALLOY · VESSELS)
