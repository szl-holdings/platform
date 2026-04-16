# Operator Experience Upgrade

**Phase 7 — Lyte Command Center**
Generated: 2026-04-16

## Overview

The operator surface upgrade elevates lyte-command-center into a premium command model inspired by Linear's speed and Palantir's seriousness. Every interaction should feel intentional, fast, and trustworthy.

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Speed** | ⌘K command palette for instant navigation, no page reloads for state transitions |
| **Seriousness** | Evidence-backed outputs, provenance on every AI decision, no unexplained numbers |
| **Clarity** | Executive summary cards surface the right metric at the right level |
| **Trust** | Audit timeline on every critical object, demo/prod mode explicit at all times |

## Feature Inventory

### 1. Command Palette (⌘K)

- Trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) from anywhere in the operator surface
- Features:
  - Fuzzy search across pages, signals, actions, and domain routes
  - Keyboard-only navigation (↑↓ to select, Enter to navigate, Esc to close)
  - Quick nav shortcuts (O → Operations, S → Strategy, I → Infrastructure)
  - Live search against `/api/lyte/search` when query is non-empty
- File: `artifacts/command/src/components/command-bar.tsx`

### 2. Service Status Rail

- Location: Bottom of operator layout (persistent, slim 24px bar)
- Shows: Environment badge (PRODUCTION / STAGING / DEVELOPMENT / DEMO), live service dots (API, DB, Auth, AI, Queue), last sync time, version
- Data source: `/api/health` polled every 60 seconds
- File: `artifacts/command/src/operations/components/service-status-rail.tsx`
- Integration: `artifacts/command/src/operations/components/lyte-layout.tsx`

### 3. Executive Summary Cards

- Location: Top of major operator pages (Exec Command, Pulse, Risk)
- Format: 2×2 or 4-column KPI grid with trend indicators
- Metrics: Value at Risk, Escalations, SLA Breach Rate, Resolution Rate
- Data: Live from `/api/lyte/actions` query aggregations
- File: `artifacts/command/src/operations/pages/executive-summary.tsx`

### 4. Evidence/Provenance Panels

- Used in: Alloy Intelligence, signal feed items, AI recommendations
- Components:
  - `EvidencePanel` (from `@szl-holdings/shared-ui`) — source list with confidence scores
  - `OperationalEvidencePanel` — compact variant for action objects
  - `ConfidenceBand` — visual confidence indicator for AI outputs
- Pattern: Every AI-generated output includes model ID, provider, confidence %, evidence sources, timestamp

### 5. Ownership + Due Date + Workflow Stage

- Location: Action Queue, Command Inbox, Escalation Center
- Fields per action object:
  - `owner`: Name, role, assigned-at timestamp
  - `dueDate`: ISO timestamp; displayed as relative "Due in 4h" or "Overdue 2d"
  - `workflowStage`: Current named stage (e.g., "Legal Review", "Finance Reconciliation")
  - `state`: Typed state machine with allowed transitions
- File: `artifacts/command/src/operations/pages/action-queue.tsx`

### 6. Demo Mode vs Production Mode Indicators

- **Live Demo Mode**: Gold banner across top of layout — "Demo Mode — Synthetic data only · No live systems connected"
- **Demo URL param**: `?demo=true` shows `EnvironmentLabel` chips in header
- **Service Status Rail**: Shows `PRODUCTION` / `DEVELOPMENT` / `DEMO` environment badge from `/api/health`
- **DemoModeProvider**: Context wrapping all Lyte pages, tracks `active` state
- File: `artifacts/command/src/operations/lib/demo-mode.tsx`

## Navigation Architecture

```
⌘K → Command Bar (search + quick nav)
├── Operations
│   ├── Exec Command (executive-command.tsx)
│   ├── PRISM: Pulse / Risk / Intelligence / Signals / Motion
│   ├── Action Queue (action-queue.tsx)
│   ├── Blocker Board
│   ├── Approvals Center
│   ├── Command Inbox
│   ├── Escalation Center
│   ├── Trust & Audit
│   └── Ownership Map
├── Strategy
│   ├── Dashboard
│   ├── Executive Briefing
│   └── Simulation
└── Infrastructure
    ├── Executive Console
    ├── Resource Map
    └── Security Perimeter
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `↑` / `↓` | Navigate results |
| `Enter` | Navigate to selected |
| `Esc` | Close palette |
| `O` (in palette) | Jump to Exec Command |
| `S` (in palette) | Jump to Strategy |
| `I` (in palette) | Jump to Infrastructure |
