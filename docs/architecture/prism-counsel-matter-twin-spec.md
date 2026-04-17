# Prism Counsel — Matter Twin Specification

> **DEPRECATED:** PRISM Counsel has been retired and consolidated into the Aegis legal workspace. This document is preserved for historical reference only.

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Engineering + product reference

---

## What Is the Matter Twin?

The Matter Twin is a structured, living snapshot of a legal matter's complete state at a point in time. It is not a dashboard — it is a computed data artifact that captures every dimension of a matter: people, documents, claims, deadlines, evidence, financial exposure, AI insights, pressure signals, forecasts, and outstanding questions.

The Matter Twin serves three functions:

1. **Observability** — Attorneys and paralegals can see the current state of a matter in a single structured view, including what is missing and what is at risk
2. **AI context assembly** — The Matter Twin is the primary input for AI reasoning calls — it is the context window that tells the model what is known, what has changed, and what needs attention
3. **Audit anchor** — Each snapshot is an immutable record of matter state at a point in time, enabling before/after comparisons and change attribution

---

## Matter Twin Data Model

### Core Matter Profile

```typescript
interface MatterProfile {
  id: number;
  orgId: number;
  title: string;
  caseNumber?: string;
  matterType: MatterType;  // auto_injury | premises_liability | no_fault | ...
  status: MatterStatus;    // intake | investigation | discovery | pre_trial | trial | settlement | closed
  stage?: string;
  jurisdiction: string;
  courtName?: string;
  filingDate?: Date;
  statOfLimitations?: Date;
  healthScore?: number;     // 0-100, computed from pressure dimensions
  settlementRange: {
    low?: number;
    high?: number;
    mid?: number;
  };
  totalDamages?: number;
  totalLiens?: number;
  assignedAttorney?: PartyRef;
  assignedParalegal?: PartyRef;
  privilegeFlag: boolean;
  exportSafe: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Document Stack

The document stack captures all ingested materials and their processing state:

```typescript
interface DocumentStack {
  documents: Array<{
    id: number;
    documentType: string;  // medical_record | police_report | correspondence | contract | ...
    filename: string;
    sourceConnector?: string;  // where it came from (M365 | manual | email)
    extractionState: "pending" | "processing" | "completed" | "failed";
    extractionConfidence?: number;
    privilegeState: PrivilegeState;
    reviewState: ReviewState;
    exportSafe: boolean;
    pageCount?: number;
    extractedAt?: Date;
  }>;
  summary: {
    total: number;
    pendingExtraction: number;
    pendingReview: number;
    exportSafe: number;
    byType: Record<string, number>;
  };
}
```

### Parties

```typescript
interface PartyStack {
  parties: Array<{
    id: number;
    role: PartyRole;  // plaintiff | defendant | carrier | adjuster | witness | expert | provider | judge | mediator | opposing_counsel
    name: string;
    organization?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>;
  coverage: {
    hasPlaintiff: boolean;
    hasCarrier: boolean;
    hasAdjuster: boolean;
    hasOpposingCounsel: boolean;
    hasExpert: boolean;
  };
}
```

### Chronology

```typescript
interface Chronology {
  events: Array<{
    date: Date;
    eventType: string;  // incident | medical_visit | filing | communication | deadline | offer | ...
    description: string;
    sourceDocuments: string[];  // proof chain IDs
    confidence: number;
    reviewState: ReviewState;
  }>;
  gaps: string[];   // identified timeline gaps requiring evidence
  conflicts: string[];  // conflicting dates or facts between sources
}
```

### Issues and Claims

```typescript
interface IssueStack {
  claims: Array<{
    id: number;
    coverageType: CoverageType;
    claimNumber?: string;
    carrierName?: string;
    policyLimit?: number;
    status: ClaimStatus;  // open | pending | denied | accepted | settled | litigated
  }>;
  damages: Array<{
    category: DamagesCategory;
    amount: number;
    isProjected: boolean;
    verificationStatus: VerificationStatus;
    sourceDocument?: string;
  }>;
  openIssues: string[];   // identified coverage or liability disputes
  blockers: string[];     // what is blocking resolution
}
```

### Deadlines

```typescript
interface DeadlineMap {
  deadlines: Array<{
    id: number;
    deadlineType: string;  // statute_of_limitations | discovery_cutoff | expert_disclosure | etc.
    description: string;
    dueDate: Date;
    status: "pending" | "completed" | "overdue" | "waived";
    daysUntilDue?: number;
    riskLevel: "critical" | "high" | "medium" | "low";
    assignedTo?: string;
  }>;
  summary: {
    overdue: number;
    dueWithin7Days: number;
    dueWithin30Days: number;
    totalPending: number;
  };
}
```

### Evidence Map

```typescript
interface EvidenceMap {
  categories: {
    medicalRecords: { complete: boolean; outstanding: number; confidence: number };
    policeReports: { complete: boolean; outstanding: number };
    photographs: { count: number; extractionPending: number };
    witnessStatements: { count: number; pending: number };
    expertReports: { count: number; scheduled: number };
    financialDocuments: { complete: boolean; outstanding: number };
  };
  completenessScore: number;   // 0.0-1.0 weighted completeness
  criticalGaps: string[];      // Missing items that materially impact readiness
  readinessBlockers: string[]; // Items preventing demand or trial readiness
}
```

### Source Chain

```typescript
interface SourceChain {
  entries: Array<{
    id: number;
    outputType: string;
    outputHash: string;
    modelLane?: string;
    modelProvider?: string;
    modelVersion?: string;
    reviewState: ReviewState;
    approvalState: ApprovalState;
    exportSafe: boolean;
    confidence?: number;
    createdAt: Date;
    reviewedAt?: Date;
    approvedAt?: Date;
  }>;
  summary: {
    total: number;
    pendingReview: number;
    approved: number;
    exportSafe: number;
    byOutputType: Record<string, number>;
    modelLanesUsed: string[];
    providersUsed: string[];
  };
}
```

### AI Insights (with Review Status)

```typescript
interface AIInsights {
  pressureProfile: {
    dimensions: Record<PressureDimension, {
      score: number;
      movement: "rising" | "stable" | "falling" | "new";
      confidence: number;
      topDrivers: string[];
      recommendedActions: string[];
    }>;
    overallHealthScore: number;
    highPressureDimensions: string[];
  };
  dataProducts: Record<DataProduct, {
    score: number;
    movement: string;
    components: Record<string, number>;
    confidence: number;
  }>;
  forecasts: Array<{
    type: ForecastType;
    currentScore: number;
    trend: "improving" | "declining" | "stable" | "volatile";
    confidence: number;
    topDrivers: string[];
    recommendedActions: string[];
    requiresReview: boolean;
    modelVersion: string;
  }>;
  worldlineOverlays: Array<{
    featureName: string;
    featureValue: number;
    featureText: string;
    sourceClass: string;
    confidence: number;
  }>;
  copilotInsights: Array<{
    sessionId: number;
    mode: string;
    lastMessage: string;
    proofChainId?: number;
    approvalRequired: boolean;
  }>;
}
```

### Open Questions and Contradictions

```typescript
interface OpenQuestions {
  flaggedContradictions: Array<{
    description: string;
    sourceA: string;
    sourceB: string;
    severity: "critical" | "moderate" | "minor";
    reviewState: ReviewState;
  }>;
  unansweredQuestions: string[];
  missingArtifacts: string[];
  openApprovals: Array<{
    id: number;
    type: string;
    title: string;
    requestedBy: string;
    requestedAt: Date;
    daysOpen: number;
  }>;
}
```

---

## Snapshot Lifecycle

Matter Twin snapshots are created at defined trigger points:

| Trigger | Frequency | Notes |
|---------|-----------|-------|
| `daily` | Once per day | Scheduled nightly batch |
| `weekly` | Once per week | Summary snapshot for reporting |
| `on_change` | On material change | Pressure score change, new document, approval event |
| `manual` | User-initiated | Attorney can request snapshot on demand |

Each snapshot stores:
- Full domain state at time of snapshot
- `changesSincePrior` — diff vs. previous snapshot
- `missingArtifacts` — computed list of missing required items
- `riskFactors` — sorted list of active risks with severity
- `nextActions` — top recommended actions for the attorney

Snapshots are **immutable once created**. They are never updated in place — each new computation creates a new snapshot with a reference to the prior.

---

## Change Detection

The Matter Twin computes changes between the current snapshot and the most recent prior:

```typescript
interface ChangesSincePrior {
  isFirst: boolean;
  changes: string[];   // e.g. "insurer pressure increased by 12%"
  totalChanges: number;
}
```

Change detection runs across:
- Pressure dimension movements (threshold: ±5%)
- New parties, claims, or deadlines added
- Documents added or extraction completed
- Proof chain entries approved or flagged
- Forecast trend changes

---

## Missing Artifact Detection

The Matter Twin checks for required artifacts at each snapshot:

| Check | Condition |
|-------|-----------|
| No parties assigned | `parties.length === 0` |
| No claims linked | `claims.length === 0` |
| No plaintiff identified | No party with `role=plaintiff` |
| No carrier identified | No party with `role=carrier` |
| No deadlines set | `deadlines.length === 0` |
| No communications recorded | `communications.length === 0` |
| No settlement range estimated | `settlementLow` and `settlementHigh` both null |
| No proof chain entries | `proofChain.length === 0` |

Missing artifacts are surfaced in the Matter Twin dashboard and in Copilot matter mode context.

---

## Risk Factor Identification

Risk factors are computed from pressure scores and deadlines:

| Severity | Condition |
|----------|-----------|
| `critical` | Overdue deadline(s) |
| `high` | Pressure dimension score > 0.7 |
| `medium` | Pressure dimension score 0.5-0.7 |
| `low` | Pressure dimension score 0.3-0.5 |

Risk factors are sorted by severity and presented as the top items requiring attention.

---

## Matter Twin in AI Context Assembly

When a Copilot session starts or a matter-related AI call is routed, the Matter Twin is the primary context source. The most recent snapshot is loaded, augmented with any real-time data, and assembled into the context window:

```
Matter Twin Snapshot (latest)
    + Real-time deadline check (if snapshot > 4h old)
    + Recent communications (last 20, direct from DB)
    + Open approval queue (direct from DB)
    → Context window assembled
    → Policy guardrail check
    → Reasoning lane call
    → Proof chain entry created
    → Response returned with source references
```

---

*See also:*
- *[Proof Chain Specification](prism-counsel-proof-chain-spec.md)*
- *[Alloy Control Plane Architecture](prism-counsel-alloy-control-plane.md)*
- *[Model Routing Strategy](prism-counsel-model-routing.md)*
