# Evidence UX Final

**Last updated:** April 2026
**Purpose:** Define how evidence is surfaced in every operator interface

---

## Principle: Evidence Rails

Every decision-supporting panel in SZL must have an "evidence rail" — a persistent sidebar or expandable section that shows the provenance of the data being displayed.

Inspired by:
- **Stripe Dashboard:** Every payment has an expandable event log showing the full lifecycle
- **Vanta:** Every control has linked evidence artifacts
- **Cloudflare:** Every security event has associated logs and request details

---

## Evidence Rail Components

### 1. Source Attribution
Every data point shows where it came from:
```
Signal: "Unauthorized SSH access detected"
  Source: aegis-ids-sensor-07
  Ingested: 2026-04-16T12:00:00Z
  Severity: critical
  Domain: Aegis
```

### 2. Correlation Chain
Every correlated signal shows its links:
```
Correlation: 87% confidence
  Signal A: SSH intrusion (Aegis)
  Signal B: AIS dark period (Vessels)
  Link 1: Temporal overlap (4 minutes)
  Link 2: Geographic proximity (Rotterdam)
  Link 3: Threat feed match (OSINT-2026-0341)
```

### 3. AI Attribution
Every AI recommendation shows its provenance:
```
Recommendation: "Initiate port security lockdown"
  Model: szl-threat-correlation-v3
  Provider: SZL CORTEX
  Confidence: 82%
  Input Sources: 4 artifacts cited
  Proof Chain: PC-20260416-abc1
```

### 4. Decision Trail
Every approved action shows the decision chain:
```
Approved by: J. Van den Berg (exec, ops)
  Policy: maritime-critical-response-v2 → ALLOW
  Simulation: 5,000 iterations, P50 cost: $340K
  Rationale: "Cross-domain correlation warrants immediate response"
```

---

## Evidence Density Guidelines

| Context | Evidence Level | Example |
|---------|---------------|---------|
| Signal list | Minimal — source + severity badge | "aegis-ids-07 · critical · 2m ago" |
| Signal detail | Full — all attributes + correlation links | Expandable source attribution + linked signals |
| Recommendation card | Medium — confidence + model + source count | "82% · szl-threat-v3 · 4 sources cited" |
| Recommendation detail | Full — all sources + simulation summary | Expandable input sources + Monte Carlo results |
| Decision timeline | Medium — actor + policy + timestamp | "J. Van den Berg · ALLOW · maritime-critical-v2" |
| Decision detail | Full — receipt with all evidence considered | Complete decision receipt with proof chain link |
| Outcome card | Medium — predicted vs. actual + variance | "Cost: $286K actual vs. $340K predicted (−16%)" |
| Outcome detail | Full — all metrics + learning job status | Complete outcome record with calibration data |

---

## Implementation Pattern

Every data-displaying component should accept an optional `evidence` prop:

```typescript
interface EvidenceRail {
  sources: Array<{ type: string; id: string; label: string; timestamp: string }>;
  correlationId?: string;
  proofChainId?: string;
  confidence?: number;
  modelAttribution?: { modelId: string; provider: string };
}
```

When `evidence` is provided, the component renders an expandable rail. When collapsed, it shows a small evidence indicator (fingerprint icon + source count). When expanded, it shows the full attribution chain.

---

## Competitive Advantage

No platform in the decision intelligence market surfaces evidence at this granularity inline with operational data. Palantir shows data lineage. Vanta shows compliance evidence. Stripe shows payment events. SZL shows *decision evidence* — the full chain from signal to outcome with every intermediate step attributed and provable.
