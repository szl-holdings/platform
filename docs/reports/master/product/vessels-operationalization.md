# Vessels Operationalization Report

**Date:** April 2, 2026  
**Status:** Post-Payload Phase 4 — Shared Backbone Integrated  
**Version:** 2.0

---

## Executive Summary

Vessels (Fleet Command) has been upgraded from a fleet dashboarding surface into a working operational command shell that inherits the shared operational backbone from Alloy/Lyte/Terra. This report documents the **actual** API surface, UI integration, and data contracts delivered in Phase 4. Maritime domain-specific differences remain cleanly isolated.

---

## What Vessels Is

Vessels is the **maritime fleet intelligence and exception management** surface for the SZL Holdings platform. It is the primary interface through which fleet operators, logistics teams, and executives:

- **Monitor** — live vessel positions, route status, and AIS telemetry
- **Exception-manage** — route deviations, delays, fuel anomalies, security alerts, and weather disruptions
- **Audit** — full event history for each vessel (voyage legs, port calls, maintenance, exceptions)
- **Act** — acknowledge, escalate, or resolve fleet exceptions with ownership tracking

---

## Shared Backbone Integration

### Primitives Adopted

All of the following are imported from `@workspace/shared-ui/operational-primitives`:

| Primitive | Usage in Vessels |
|---|---|
| `OperationalAuditTimeline` | Vessel-level event history tab in vessel detail |
| `OperationalOwnerChip` | Exception owner display in expanded exception cards |
| `OperationalRiskBadge` | Severity-normalised risk display on exceptions |
| `OperationalStatusBadge` | Exception status lifecycle display |
| `severityToRiskLevel` | Maps exception severity string to canonical risk level |

### Domain Mapping Approach

Rather than forcing the full `OperationalDetailPane` + `OperationalEntity` shape onto maritime data, Vessels uses **selective primitive adoption** — injecting shared backbone components into existing high-fidelity maritime views rather than replacing them with generic entity panes.

This was the correct architectural choice because:
- Vessel detail pages contain geospatial maps, AIS position plots, and voyage corridors that require custom rendering
- Exception cards carry maritime-specific fields (route, vessel name, port congestion data, cargo type) that have no generic equivalent
- The audit timeline and owner chip are pure compositional elements with no layout dependencies

---

## UI Integration: Vessel Detail — Event History Tab

### New "Event History" Tab in `/dashboard/vessels/:id`

A new `audit` tab has been added to `VesselDetailEnhancedPage` alongside existing tabs.

**Tab state type (updated):**
```typescript
const [tab, setTab] = useState<
  "overview" | "voyage" | "maintenance" | "portcalls" | "history" | "audit"
>("overview");
```

**Audit entries are built at render time from real vessel data:**

```typescript
const auditEntries: OperationalAuditEntry[] = [
  // Exceptions → "alert" category
  ...(vesselData.exceptions ?? []).map(exc => ({
    id: `exc-${exc.id}`,
    actor: exc.acknowledgedBy ? `Analyst #${exc.acknowledgedBy}` : "System",
    action: `${exc.exceptionType.replace(/_/g, " ")}: ${exc.title}`,
    timestamp: exc.detectedAt,
    category: "alert" as const,
    detail: exc.description ?? undefined,
  })),
  // Port calls → "update" category
  ...(vesselData.portCalls ?? []).map(pc => ({
    id: `port-${pc.id}`,
    actor: "Port Authority",
    action: `${pc.status === "departed" ? "Departed" : "Arrived"} ${pc.portName}`,
    timestamp: pc.status === "departed" ? pc.departedAt : pc.arrivedAt,
    category: "update" as const,
    detail: pc.cargoOps ? `Cargo ops: ${pc.cargoOps}` : undefined,
  })),
  // Voyages → "update" category
  ...(vesselData.voyages ?? []).map(v => ({
    id: `voy-${v.id}`,
    actor: "Navigation",
    action: `Voyage: ${v.origin} → ${v.destination}`,
    timestamp: v.departureDate,
    category: "update" as const,
    detail: v.status,
  })),
  // Maintenance → "comment" category
  ...(vesselData.maintenanceItems ?? []).map(m => ({
    id: `maint-${m.id}`,
    actor: "Maintenance",
    action: `${m.category}: ${m.description}`,
    timestamp: m.dueDate,
    category: "comment" as const,
    detail: `Status: ${m.status} · Priority: ${m.priority}`,
  })),
];
```

Entries are combined and rendered via `OperationalAuditTimeline`, which handles sorting and empty-state presentation.

**Note:** This is client-side reconstruction from existing vessel data fields — there is no separate server-side audit log endpoint for vessels. The pattern is consistent with Aegis incidents' audit approach.

---

## UI Integration: Exceptions Center (`/exceptions`)

### Changes Applied

- `OperationalOwnerChip` replaces the previous manual `<User>` icon + text pattern in expanded exception card footers
- `OperationalRiskBadge` added using `severityToRiskLevel()` to map exception severity to the canonical risk level

### Exception Card Footer (Before vs After)

**Before:**
```tsx
{exc.owner && (
  <span className="flex items-center gap-1">
    <User className="w-2.5 h-2.5" />{exc.owner}
    {exc.ownerFunction ? ` · ${exc.ownerFunction}` : ""}
  </span>
)}
```

**After:**
```tsx
<OperationalOwnerChip
  owner={exc.owner ? { name: exc.owner, role: exc.ownerFunction ?? undefined } : undefined}
  size="xs"
  unassignedLabel="No owner assigned"
/>
<OperationalRiskBadge level={severityToRiskLevel(exc.severity)} size="xs" />
```

### Existing Mutations (Unchanged)
The existing exception action mutations remain intact:
- `POST /vessels/exceptions/:id/acknowledge` via `useAcknowledgeException`
- `POST /vessels/exceptions/:id/escalate` via `useEscalateException`
- `POST /vessels/exceptions/:id/resolve` via `useResolveException`

All use optimistic UI and invalidate `["vesselExceptions"]` on success.

---

## Marketing Pages — Operational Nav Isolation

Vessels ships with a full marketing site routed via the same SPA (`/platform`, `/capabilities`, `/use-cases`, `/security`, `/pricing`, `/demo`, `/sign-in`). These pages are **not** included in the operational sidebar navigation.

The operational sidebar uses:
- `primaryNavItems` — dashboard, fleet, vessels, routes, alerts, reports, billing, settings
- `adminNavItems` — team, audit-log
- `legacyNavItems` — legacy fleet routes (still accessible but not primary)

No marketing routes appear in any of these arrays. The only marketing touch-point in the sidebar is a "Request demo" CTA button in the sidebar footer (a conversion element, not operational navigation).

---

## Domain-Specific Isolation

These features remain Vessels-specific:

- AIS live position feed and map rendering
- Voyage corridor and route deviation visualization
- Port call scheduling and berth arrival management
- Commodity flow and cargo type analytics
- Voyage economics (freight cost, fuel burn, TCE calculations)
- Maritime intelligence feed (sanctions lists, piracy zones, weather routing)
- Maintenance schedule and PSC inspection compliance
- Fleet KPIs (DWTEU, fleet utilization, on-time performance)

---

## Data Sources

| Entity | API Endpoint | Notes |
|---|---|---|
| Fleet list | `GET /vessels/vessels` | Live |
| Vessel detail | `GET /vessels/vessels/:id` | Live |
| Exceptions | `GET /vessels/exceptions` | Live, with status/severity filter |
| Acknowledge | `POST /vessels/exceptions/:id/acknowledge` | Live |
| Escalate | `POST /vessels/exceptions/:id/escalate` | Live |
| Resolve | `POST /vessels/exceptions/:id/resolve` | Live |
| Voyages | via vessel detail data | Embedded in vessel detail response |
| Port calls | via vessel detail data | Embedded in vessel detail response |
| Maintenance | via vessel detail data | Embedded in vessel detail response |
