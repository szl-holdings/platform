# Digital Twin & Simulation Strategy

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Platform Engineering — Spatial Intelligence

---

## Overview

SZL Holdings operates across three domains where physical-world state must be digitally represented, simulated, and reasoned over: maritime fleet operations (Vessels), real estate asset intelligence (Terra), and cybersecurity posture management (Aegis). 

The `@szl-holdings/openusd-export` package provides a standardized export layer for all three domains using **OpenUSD** (Universal Scene Description) as the interchange format. OpenUSD enables simulation, 3D visualization, spatial reasoning, and downstream integration with NVIDIA Omniverse, digital twin platforms, and physics-based simulation engines.

This document describes the digital twin data model, simulation scenarios, and the export architecture for each domain.

---

## Package: `@szl-holdings/openusd-export`

```
packages/openusd-export/
├── src/
│   ├── serializer.ts      OpenUSD USDA text format serializer
│   ├── vessel-usd.ts      Maritime vessel twin + route simulation export
│   ├── property-usd.ts    Real estate property twin + scenario export
│   ├── scenario-usd.ts    Security scenario rehearsal export
│   └── index.ts
```

All exporters produce **USDA** (USD ASCII) format — a human-readable text representation that can be consumed by any USD-compatible tool. USDZ (binary, zipped) is the planned Phase 2 output format for distribution and web streaming.

---

## OpenUSD as the Digital Twin Exchange Format

OpenUSD was selected as the foundation for three reasons:

1. **Interoperability** — USD is supported natively by NVIDIA Omniverse, Apple Vision Pro, USDZ for web, and every major 3D platform. Exports are not vendor-locked.
2. **Composability** — USD's layer/reference system allows partial-state overlays. A scenario simulation can be expressed as a delta over a base live-state twin.
3. **Simulation-Ready** — USD's schema system supports physics, materials, animation, and custom metadata. NVIDIA PhysX and Omniverse Kit operate directly on USD scenes.

All SZL domain exports use a consistent prim hierarchy with `szl:` namespace custom attributes for domain-specific metadata.

---

## Domain 1: Vessels — Maritime Digital Twins

### Vessel Twin State

A `VesselTwinState` captures the live operational state of a vessel:

| Attribute | USD Attribute | Description |
|-----------|--------------|-------------|
| IMO Number | `szl:imo` | International Maritime Organization ID |
| Name | `szl:name` | Vessel name |
| Position | `xformOp:translate` | (lon, 0, lat) in geographic space |
| Heading | `xformOp:rotateY` | Degrees, true north |
| Speed | `szl:speedKnots` | Current speed over ground |
| Destination | `szl:destination` | Port destination (UN/LOCODE) |
| ETA | `szl:eta` | Estimated time of arrival (ISO8601) |
| Fuel Level | `szl:fuelLevelPct` | Percentage of fuel remaining |
| Route Risk | `szl:riskLevel` | `low / medium / high / critical` |
| Flag State | `szl:flagState` | Flag state jurisdiction |
| DWT | `szl:dwt` | Deadweight tonnage |

Route waypoints are expressed as child prims under the vessel prim, each with geographic position and a waypoint index.

### Route Simulation Scenarios

```typescript
import { exportRouteSimulation } from "@szl-holdings/openusd-export";

const result = exportRouteSimulation({
  vessel: vesselState,
  originPort: { lat: 1.35, lon: 103.82, name: "Singapore (SGSIN)" },
  destinationPort: { lat: 51.93, lon: 4.13, name: "Rotterdam (NLRTM)" },
  scenario: "storm_diversion",
  weatherConditions: { windSpeedKnots: 45, waveHeightM: 6.2 },
  simulatedDurationHours: 336,
});

// result.content → USDA text ready for Omniverse or custom renderer
```

**Supported Simulation Scenarios:**

| Scenario | Description | USD Metadata |
|---------|-------------|-------------|
| `normal` | Live position + planned route | Baseline state |
| `storm_diversion` | Route diverges around weather system | Alternate waypoints inserted |
| `chokepoint_delay` | ETA extended by queue-based congestion | Delay estimate attached |
| `emergency_deviation` | Emergency heading change from MAYDAY | New waypoints + risk=critical |

**Use Cases:**
- Voyage P&L scenario modeling before route commitment
- Insurance underwriting — simulating route risk at placement time
- NVIDIA Omniverse port simulation for congestion optimization
- Regulatory rehearsal for flag state reporting

---

## Domain 2: Terra — Real Estate Digital Twins

### Property Twin State

A `PropertyTwinState` captures the financial and physical state of a real estate asset:

| Attribute | USD Attribute | Description |
|-----------|--------------|-------------|
| Property ID | `szl:propertyId` | Internal asset identifier |
| Address | `szl:address` | Street address |
| Type | `szl:type` | `commercial / residential / industrial / mixed_use / land` |
| Valuation | `szl:valuation` | Current assessed value (USD) |
| NOI | `szl:noi` | Net Operating Income (annual USD) |
| Cap Rate | `szl:capRate` | Capitalization rate |
| Occupancy | `szl:occupancyRate` | Percentage occupied |
| LTV | `szl:ltv` | Loan-to-value ratio |
| DSCR | `szl:dscr` | Debt Service Coverage Ratio |
| Flood Risk | `szl:floodRisk` | Score 0–100 |
| Market Trend | `szl:marketTrend` | `rising / stable / declining` |
| Scenario | `szl:scenario` | Active simulation scenario |

### Simulation Scenarios

```typescript
import { exportPropertySimulation } from "@szl-holdings/openusd-export";

const result = exportPropertySimulation({
  property: propertyState,
  scenario: "stress_test",
  vacancyRateDelta: 0.15,     // +15% vacancy
  marketCapRateDelta: 0.015,  // +150bps cap rate expansion
  noiDelta: -75000,           // -$75K annual NOI
});
```

**Supported Simulation Scenarios:**

| Scenario | Description | Key Modified Fields |
|---------|-------------|-------------------|
| `baseline` | Current live state | None |
| `stress_test` | Combined NOI decline + vacancy + cap rate expansion | NOI, occupancy, cap rate, valuation |
| `vacancy_spike` | Sudden occupancy loss | Occupancy, vacancy risk |
| `cap_rate_compression` | Market repricing event | Cap rate, implied valuation |
| `rate_shock` | Interest rate spike → DSCR reduction | DSCR |

**Use Cases:**
- Portfolio stress testing across multiple cap rate assumptions
- CMBS underwriting — scenario modeling before disposition
- Climate risk overlay (flood risk at different sea-level scenarios)
- NVIDIA Omniverse for 3D property visualization + AVM integration

---

## Domain 3: Aegis — Security Scenario Rehearsals

### Security Scenario Structure

The Aegis digital twin export targets **cyber and hybrid threat rehearsal**. Rather than physical space, it models the attack surface, threat actors, affected systems, kill chain phases, and projected impact.

```typescript
import { exportSecurityScenario } from "@szl-holdings/openusd-export";

const result = exportSecurityScenario({
  scenarioId: "ransomware-supply-chain-q2-2026",
  name: "Supply Chain Ransomware — Tier 2 Vendor",
  type: "threat_simulation",
  domain: "cyber",
  threatActors: [{
    id: "actor-001",
    label: "LockBit 3.0 Affiliate",
    category: "ransomware",
    ttp: ["T1566.001", "T1078", "T1486"],
  }],
  affectedSystems: [
    { id: "sys-erp", name: "ERP System", criticality: "critical" },
    { id: "sys-wms", name: "Warehouse Management", criticality: "high" },
  ],
  phases: [
    { id: "initial-access", name: "Initial Access", durationMinutes: 30, detectionProbability: 0.05, ttps: ["T1566.001"] },
    { id: "lateral-movement", name: "Lateral Movement", durationMinutes: 240, detectionProbability: 0.25 },
    { id: "impact", name: "Ransomware Deployment", durationMinutes: 15, detectionProbability: 0.90 },
  ],
  postureScoreBefore: 67,
  postureScoreAfter: 22,
  mttdEstimateMinutes: 270,
  mttrEstimateMinutes: 4320,
  blastRadiusPct: 45,
});
```

**Scenario Taxonomy:**

| Type | Description |
|------|-------------|
| `incident_response` | Rehearse IR playbook against simulated breach |
| `threat_simulation` | Simulate a specific threat actor's TTPs |
| `red_team` | Structured adversarial test scenario |
| `tabletop` | Executive tabletop exercise narrative |
| `breach_rehearsal` | Full breach lifecycle simulation |

**USD Prim Structure:**

```
/ScenarioId (Xform)        — scenario metadata, posture scores, MTTD/MTTR
  /ThreatActor_0 (Xform)  — actor label, category, TTPs
  /ThreatActor_1 (Xform)
  /AffectedSystem_0 (Xform) — system ID, name, criticality
  /AffectedSystem_1 (Xform)
  /Phase_0 (Xform)         — phase name, duration, detection probability, TTPs
  /Phase_1 (Xform)
  /Phase_2 (Xform)
```

**Use Cases:**
- CISO board reporting — 3D / visual attack surface representation
- NVIDIA Omniverse for immersive incident command visualization
- Red team scenario scripting and replay
- Insurance actuarial modeling (blast radius × criticality)

---

## USD Prim Conventions

All SZL domain exports follow these conventions:

| Convention | Value |
|------------|-------|
| Namespace | `szl:` for all custom attributes |
| Up Axis | `Y` (standard for spatial/geographic data) |
| Meters Per Unit | `1.0` |
| Stage Metadata | `szl:exportType`, `szl:exportedAt`, `szl:scenario` |
| Geographic Coordinates | `(longitude, 0, latitude)` in `xformOp:translate` |

---

## NVIDIA Omniverse Integration Path

### Phase 1 — USDA Export (Current)
Export USDA files from the API. Load into Omniverse Kit via `omni.usd.get_context().open_stage()`. Custom `szl:` attributes are readable via Omniverse's USD Python API.

### Phase 2 — Live Streaming (Planned)
Use NVIDIA Omniverse Nucleus to host live USD stages. The API server pushes state updates as USD layer deltas. Omniverse clients observe changes in real time.

### Phase 3 — Physics Simulation (Future)
Attach NVIDIA PhysX physics schemas to vessel prim geometry. Enable real-time route simulation with hydrodynamic modeling and weather-based deviation computation.

---

## Export API

The digital twins API (`/digital-twins`) exposes export endpoints that produce USDA content:

```
GET  /digital-twins                    List registered twin entities
GET  /digital-twins/:twinId            Get twin state
POST /digital-twins/vessel             Create/update vessel twin
POST /digital-twins/property           Create/update property twin
POST /digital-twins/posture            Create/update security posture twin
POST /digital-twins/:twinId/simulate   Run simulation scenario
```

The `/simulate` endpoint accepts a `scenario` parameter and returns structured simulation output including projected state changes, risk flags, and optionally a USDA export payload.

---

*See also:*
- *[AI Control Plane Architecture](../ai/ai-control-plane.md)*
- *[NVIDIA Optional Runtime Strategy](../ai/nvidia-optional-runtime.md)*
- *[Vessels Maritime Intelligence](../architecture/vessels-architecture.md)*
