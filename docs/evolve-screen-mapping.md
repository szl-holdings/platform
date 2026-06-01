# AEEP Screen Mapping

Maps the 8-item nav structure to screen patterns, components, and data sources.

---

## Nav Structure

| Route | Screen | Primary Mode | Key Components |
|---|---|---|---|
| `/overview` | Executive Dashboard | Executive | MetricStatGrid, EvidencePanel, StatusBadge, ActivityFeed |
| `/operations` | Operations Center | Operator | DataGrid, FilterBar, TableToolbar, Timeline, StatusBadge |
| `/search` | Evidence Search | Operator | SearchInput, SplitPane, EvidencePanel, SideInspector |
| `/workflows` | Workflow Hub | Operator | DataGrid, Timeline, Stepper, GlobalCommandPalette |
| `/evidence` | Evidence Ledger | Operator | DataGrid, EvidencePanel, AuditTrailList, FilterBar |
| `/memory` | Memory Inspector | Operator | DataGrid, FilterBar, DetailDrawer, StatusBadge |
| `/reports` | Report Builder | Executive | MetricStatGrid, EvidencePanel, SectionPanel, PageHeader |
| `/admin` | Administration | Operator | DataGrid, FormField, SegmentedControl, SectionPanel |

---

## Screen Pattern: Overview (Executive Mode)

```
AppShell
└── PageHeader (title, meta)
└── MetricStatGrid (4-6 KPIs: open approvals, active runs, confidence avg, freshness)
└── [2-col split]
    ├── SectionPanel "Active Signals" → FilterBar + DataGrid
    └── SectionPanel "Pending Approvals" → AuditTrailList
└── SectionPanel "Recent Activity" → ActivityFeed
```

## Screen Pattern: Search (Operator Mode)

```
AppShell
└── FilterBar (strategy: semantic | keyword | hybrid)
└── SplitPane
    ├── [Left] SearchInput + DataGrid (results)
    └── [Right] SideInspector → InspectorTabs
        ├── Summary tab → excerpt, confidence
        └── Evidence tab → EvidencePanel (traceId, sources, policy)
```

## Screen Pattern: Workflows

```
AppShell
└── FilterBar (status: all | running | pending | approval-required)
└── SectionPanel "Active Runs" → DataGrid (with StatusBadge per run)
└── DetailDrawer (on row click) → InspectorTabs
    ├── Summary tab → PageHeader, MetricStatGrid
    ├── Activity tab → Timeline (step-by-step run)
    └── Evidence tab → EvidencePanel
```

## Screen Pattern: Evidence Ledger

```
AppShell
└── FilterBar (entity type, policy verdict, date range)
└── TableToolbar (count, export)
└── DataGrid (entries with StatusBadge for policy verdict)
└── DetailDrawer → EvidencePanel (full ProofEnvelope)
```

---

## Screen Mode Adaptation

| Component | Executive Mode | Operator Mode |
|---|---|---|
| DataGrid | 4 visible columns max | All columns + density control |
| EvidencePanel | Collapsed by default | Expanded by default |
| Timeline | Last 5 events | Full timeline |
| FilterBar | Top-level filters only | All filters + search |
| PageHeader | Large, with summary | Compact, with meta |
