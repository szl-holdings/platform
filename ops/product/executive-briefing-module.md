# Executive Briefing Module

Generated: 2026-04-16

## Purpose

The Executive Briefing module surfaces a business-readable digest of operational health for leadership. It is the final step in the Lyte intelligence chain: signals → incidents → actions → briefing.

## Module Architecture

```
Executive Briefing
├── Period selector (7d / 30d / 90d)
├── Health Trend (area chart)
├── Service Health Table (per service: uptime, P99, incidents)
├── Highlights Panel (achievements, issues, forecasts, recommendations)
└── Export (PDF / Markdown)
```

## Components

### Health Trend Chart
- Type: Area chart (Recharts `AreaChart`)
- Metrics: Composite health score (0–100) over time
- Color: `#d4a054` (gold) gradient fill
- Data source: `/api/analytics/health-trend?period=<7d|30d|90d>`

### Services Health Table

| Column | Source |
|--------|--------|
| Service Name | Static config + `/api/health/detailed` |
| Uptime % | SLO tracking table |
| Active Incidents | Incident count for period |
| P99 Latency | APM/telemetry aggregation |
| Trend | Computed from recent vs prior period |

### Highlights Panel

Each highlight item has a type with distinct visual treatment:

| Type | Icon | Color | When to show |
|------|------|-------|--------------|
| `achievement` | CheckCircle | Green `#34d399` | Milestones hit, latency improvements |
| `issue` | AlertTriangle | Orange `#f97316` | Incidents, degradations |
| `forecast` | TrendingUp | Blue `#60a5fa` | Projected availability, capacity |
| `recommendation` | Zap | Gold `#d4a054` | Pre-emptive actions, tuning |

### Export

- **PDF**: Generated server-side via `/api/reports/executive-briefing/export`
- **Markdown**: Client-side serialization of the briefing data
- Format: SZL Holdings letterhead, timestamp, period, all sections

## Data Fetching

```typescript
// Executive briefing data
GET /api/analytics/executive-summary?period=7d

// Response shape
{
  period: "7d",
  healthTrend: Array<{ day: string; score: number }>,
  services: Array<{
    name: string;
    uptime: number;
    incidents: number;
    p99: string;
    trend: "stable" | "degraded" | "improved"
  }>,
  highlights: Array<{
    type: "achievement" | "issue" | "forecast" | "recommendation";
    text: string;
  }>,
  generatedAt: string;
}
```

## Role-Based Access

| Role | Access |
|------|--------|
| `super_admin` | Full access, can export |
| `ops` | Full access, can export |
| `manager` | Read-only view |
| `analyst` | Read-only view |
| `viewer` | Access to own domain summary only |
| `guest` | No access |

## Integration with Lyte PRISM

The executive briefing draws from all five PRISM dimensions:

| Dimension | Contribution |
|-----------|-------------|
| **Pulse** | Overall health score trend |
| **Risk** | Unresolved exposures, SLA breaches |
| **Intelligence** | AI-generated highlights and forecasts |
| **Signals** | Event count by severity for period |
| **Motion** | Action resolution rate, workflow throughput |

## File Location

- Page component: `artifacts/command/src/operations/pages/executive-summary.tsx`
- Briefing history: `artifacts/command/src/pages/briefing-history.tsx`
- Executive briefing page: `artifacts/command/src/pages/executive-briefing.tsx`
- API route: `artifacts/api-server/src/routes/briefing.ts`
