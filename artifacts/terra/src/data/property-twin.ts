export type PropertyTwinStatus =
  | "active"
  | "under_review"
  | "pending_diligence"
  | "distress_watch"
  | "approved"
  | "closed";

export type DiligenceStage =
  | "pre_diligence"
  | "title_review"
  | "environmental"
  | "financial_audit"
  | "legal_review"
  | "final_approval";

export type DistressSignal =
  | "none"
  | "watch"
  | "elevated"
  | "critical";

export interface PropertyOwner {
  id: string;
  name: string;
  type: "individual" | "llc" | "trust" | "corporate" | "reit";
  ownershipPct: number;
  since: string;
  contactEmail?: string;
  flags?: string[];
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: "deed" | "appraisal" | "environmental" | "financial" | "legal" | "lease" | "other";
  status: "pending" | "received" | "reviewed" | "approved" | "rejected";
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface DiligenceTask {
  id: string;
  label: string;
  stage: DiligenceStage;
  status: "not_started" | "in_progress" | "complete" | "blocked" | "waived";
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  blockerReason?: string;
}

export interface WhatChangedEvent {
  id: string;
  propertyId: string;
  propertyName: string;
  eventType:
    | "ownership_change"
    | "valuation_update"
    | "distress_signal"
    | "diligence_update"
    | "approval_action"
    | "document_added"
    | "lease_event"
    | "market_signal"
    | "readiness_change";
  summary: string;
  detail?: string;
  severity: "info" | "warning" | "critical";
  source: string;
  occurredAt: string;
  actor?: string;
}

export interface PropertyApproval {
  id: string;
  propertyId: string;
  propertyName: string;
  actionClass: "acquisition" | "disposition" | "refinance" | "diligence" | "export_packet";
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "escalated" | "withdrawn";
  priority: "low" | "medium" | "high" | "critical";
  requestedBy: string;
  requestedAt: string;
  approver?: string;
  approvedAt?: string;
  comments: Array<{ author: string; body: string; at: string; internal?: boolean }>;
  payload?: Record<string, unknown>;
}

export interface PropertyAuditEntry {
  id: string;
  propertyId: string;
  action: string;
  actor: string;
  actorRole: string;
  at: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface PropertyTwin {
  id: string;
  propertyId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  sqft: number;
  value: number;
  capRate: number;
  noi: number;
  occupancy: number;
  status: PropertyTwinStatus;
  distressSignal: DistressSignal;
  diligenceStage: DiligenceStage;
  diligenceCompletionPct: number;
  readinessScore: number;
  owners: PropertyOwner[];
  documents: PropertyDocument[];
  diligenceTasks: DiligenceTask[];
  approvals: PropertyApproval[];
  auditTrail: PropertyAuditEntry[];
  lastChangedAt: string;
  createdAt: string;
  tags: string[];
  localContextNotes?: string;
  externalDataConnectors: Array<{
    name: string;
    type: "zoning" | "permits" | "liens" | "flood_zone" | "market_comp" | "demographics";
    status: "not_connected" | "connected" | "error";
    lastSyncAt?: string;
  }>;
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();

export const propertyTwins: PropertyTwin[] = [
  {
    id: "twin-001",
    propertyId: "prop-001",
    name: "Meridian Tower",
    address: "1200 Meridian Ave",
    city: "Miami",
    state: "FL",
    propertyType: "multifamily",
    sqft: 285000,
    value: 72100000,
    capRate: 5.8,
    noi: 4180000,
    occupancy: 94.2,
    status: "active",
    distressSignal: "none",
    diligenceStage: "final_approval",
    diligenceCompletionPct: 92,
    readinessScore: 88,
    tags: ["performing", "core", "miami"],
    lastChangedAt: hoursAgo(3),
    createdAt: daysAgo(180),
    localContextNotes: "Strong submarket fundamentals in Brickell/Edgewater corridor. Miami-Dade Commission approved adjacent transit project Q1 2026.",
    owners: [
      { id: "own-001", name: "SZL Holdings LLC", type: "llc", ownershipPct: 100, since: "2021-06-15" },
    ],
    documents: [
      { id: "doc-001", name: "Appraisal — Q1 2026", type: "appraisal", status: "reviewed", uploadedAt: daysAgo(30), reviewedAt: daysAgo(25), reviewedBy: "J. Torres" },
      { id: "doc-002", name: "Phase I Environmental", type: "environmental", status: "approved", uploadedAt: daysAgo(60), reviewedAt: daysAgo(55), reviewedBy: "E. Fischer" },
      { id: "doc-003", name: "Lease Abstract — Master", type: "lease", status: "approved", uploadedAt: daysAgo(45), reviewedAt: daysAgo(40), reviewedBy: "J. Torres" },
    ],
    diligenceTasks: [
      { id: "dt-001", label: "Title search & clearance", stage: "title_review", status: "complete", assignedTo: "J. Torres", completedAt: daysAgo(20) },
      { id: "dt-002", label: "Phase I ESA report", stage: "environmental", status: "complete", assignedTo: "E. Fischer", completedAt: daysAgo(55) },
      { id: "dt-003", label: "Financial audit — T12", stage: "financial_audit", status: "complete", assignedTo: "M. Park", completedAt: daysAgo(15) },
      { id: "dt-004", label: "Legal entity review", stage: "legal_review", status: "in_progress", assignedTo: "R. Adams", dueDate: daysAgo(-5) },
      { id: "dt-005", label: "Final IC approval packet", stage: "final_approval", status: "not_started", dueDate: daysAgo(-10) },
    ],
    approvals: [
      {
        id: "apr-001",
        propertyId: "prop-001",
        propertyName: "Meridian Tower",
        actionClass: "diligence",
        title: "Proceed to Final IC Review",
        description: "Legal entity review complete. Requesting IC sign-off to close diligence.",
        status: "pending",
        priority: "high",
        requestedBy: "R. Adams",
        requestedAt: hoursAgo(6),
        comments: [{ author: "M. Park", body: "Financials look clean. LTV within threshold.", at: hoursAgo(4) }],
      },
    ],
    auditTrail: [
      { id: "aud-001", propertyId: "prop-001", action: "diligence_stage_advanced", actor: "J. Torres", actorRole: "analyst", at: daysAgo(20), details: { from: "title_review", to: "environmental" } },
      { id: "aud-002", propertyId: "prop-001", action: "document_approved", actor: "E. Fischer", actorRole: "analyst", at: daysAgo(55) },
      { id: "aud-003", propertyId: "prop-001", action: "approval_requested", actor: "R. Adams", actorRole: "associate", at: hoursAgo(6) },
    ],
    externalDataConnectors: [
      { name: "Miami-Dade Permits", type: "permits", status: "not_connected" },
      { name: "FEMA Flood Zone", type: "flood_zone", status: "not_connected" },
      { name: "CoStar Comps", type: "market_comp", status: "not_connected" },
      { name: "Miami-Dade Zoning", type: "zoning", status: "not_connected" },
    ],
  },
  {
    id: "twin-002",
    propertyId: "prop-005",
    name: "The Atrium",
    address: "555 Market Square",
    city: "Nashville",
    state: "TN",
    propertyType: "retail",
    sqft: 95000,
    value: 21100000,
    capRate: 7.2,
    noi: 1520000,
    occupancy: 78.1,
    status: "distress_watch",
    distressSignal: "elevated",
    diligenceStage: "pre_diligence",
    diligenceCompletionPct: 12,
    readinessScore: 34,
    tags: ["watch", "retail-distress", "nashville"],
    lastChangedAt: hoursAgo(1),
    createdAt: daysAgo(90),
    owners: [
      { id: "own-002", name: "Market Square Partners LLC", type: "llc", ownershipPct: 70, since: "2018-04-01", flags: ["debt_maturity_q3_2026"] },
      { id: "own-003", name: "T. Caldwell (Individual)", type: "individual", ownershipPct: 30, since: "2018-04-01" },
    ],
    documents: [
      { id: "doc-010", name: "Appraisal — 2024 (stale)", type: "appraisal", status: "pending" },
    ],
    diligenceTasks: [
      { id: "dt-010", label: "Obtain current appraisal", stage: "pre_diligence", status: "not_started", dueDate: daysAgo(-14) },
      { id: "dt-011", label: "Title search", stage: "title_review", status: "not_started" },
      { id: "dt-012", label: "Lien & encumbrance review", stage: "legal_review", status: "not_started" },
    ],
    approvals: [],
    auditTrail: [
      { id: "aud-010", propertyId: "prop-005", action: "distress_flag_raised", actor: "system", actorRole: "automation", at: hoursAgo(1), details: { signal: "elevated", trigger: "occupancy_drop + debt_maturity" } },
    ],
    externalDataConnectors: [
      { name: "Davidson County Permits", type: "permits", status: "not_connected" },
      { name: "FEMA Flood Zone", type: "flood_zone", status: "not_connected" },
      { name: "CoStar Comps", type: "market_comp", status: "not_connected" },
    ],
  },
  {
    id: "twin-003",
    propertyId: "prop-003",
    name: "Riverside Commons",
    address: "88 River Walk",
    city: "Austin",
    state: "TX",
    propertyType: "mixed-use",
    sqft: 195000,
    value: 56100000,
    capRate: 6.1,
    noi: 3420000,
    occupancy: 91.8,
    status: "under_review",
    distressSignal: "watch",
    diligenceStage: "financial_audit",
    diligenceCompletionPct: 58,
    readinessScore: 62,
    tags: ["mixed-use", "austin", "refi-candidate"],
    lastChangedAt: hoursAgo(8),
    createdAt: daysAgo(120),
    owners: [
      { id: "own-004", name: "SZL Holdings LLC", type: "llc", ownershipPct: 60, since: "2022-01-10" },
      { id: "own-005", name: "River Capital Partners", type: "corporate", ownershipPct: 40, since: "2022-01-10" },
    ],
    documents: [
      { id: "doc-020", name: "Appraisal — Q4 2025", type: "appraisal", status: "reviewed", reviewedAt: daysAgo(10) },
      { id: "doc-021", name: "Phase I ESA", type: "environmental", status: "approved", reviewedAt: daysAgo(30) },
      { id: "doc-022", name: "T12 Financials", type: "financial", status: "pending" },
    ],
    diligenceTasks: [
      { id: "dt-020", label: "Title review", stage: "title_review", status: "complete", completedAt: daysAgo(45) },
      { id: "dt-021", label: "Phase I ESA", stage: "environmental", status: "complete", completedAt: daysAgo(30) },
      { id: "dt-022", label: "T12 financial audit", stage: "financial_audit", status: "in_progress", assignedTo: "M. Park", dueDate: daysAgo(-3) },
      { id: "dt-023", label: "Legal review", stage: "legal_review", status: "not_started" },
    ],
    approvals: [],
    auditTrail: [
      { id: "aud-020", propertyId: "prop-003", action: "watch_flag_set", actor: "system", actorRole: "automation", at: hoursAgo(8), details: { reason: "occupancy_decline_2pct_90d" } },
    ],
    externalDataConnectors: [
      { name: "Travis County Permits", type: "permits", status: "not_connected" },
      { name: "FEMA Flood Zone", type: "flood_zone", status: "not_connected" },
      { name: "CoStar Comps", type: "market_comp", status: "not_connected" },
      { name: "Austin Zoning DB", type: "zoning", status: "not_connected" },
    ],
  },
];

export const whatChangedFeed: WhatChangedEvent[] = [
  {
    id: "wc-001",
    propertyId: "prop-005",
    propertyName: "The Atrium",
    eventType: "distress_signal",
    summary: "Distress signal elevated to WATCH",
    detail: "Occupancy dropped 4.2% over 90 days while debt maturity (Q3 2026) approaching. Immediate review recommended.",
    severity: "critical",
    source: "Distress Engine",
    occurredAt: hoursAgo(1),
  },
  {
    id: "wc-002",
    propertyId: "prop-001",
    propertyName: "Meridian Tower",
    eventType: "approval_action",
    summary: "Approval requested: Proceed to Final IC Review",
    detail: "R. Adams requested IC sign-off following legal entity review completion.",
    severity: "info",
    source: "Approvals",
    occurredAt: hoursAgo(6),
    actor: "R. Adams",
  },
  {
    id: "wc-003",
    propertyId: "prop-003",
    propertyName: "Riverside Commons",
    eventType: "distress_signal",
    summary: "Watch flag set — occupancy decline detected",
    detail: "2% occupancy decline over 90-day rolling window. Financial audit in progress.",
    severity: "warning",
    source: "Distress Engine",
    occurredAt: hoursAgo(8),
  },
  {
    id: "wc-004",
    propertyId: "prop-001",
    propertyName: "Meridian Tower",
    eventType: "diligence_update",
    summary: "Legal entity review marked in progress",
    detail: "R. Adams began legal entity review. Due in 5 days.",
    severity: "info",
    source: "Diligence Tracker",
    occurredAt: daysAgo(1),
    actor: "R. Adams",
  },
  {
    id: "wc-005",
    propertyId: "prop-001",
    propertyName: "Meridian Tower",
    eventType: "document_added",
    summary: "Appraisal document reviewed: Q1 2026",
    detail: "J. Torres completed review of Q1 2026 appraisal. No material issues flagged.",
    severity: "info",
    source: "Document Engine",
    occurredAt: daysAgo(25),
    actor: "J. Torres",
  },
  {
    id: "wc-006",
    propertyId: "prop-003",
    propertyName: "Riverside Commons",
    eventType: "diligence_update",
    summary: "T12 Financial Audit — overdue",
    detail: "Financial audit assigned to M. Park is 3 days past due date.",
    severity: "warning",
    source: "Diligence Tracker",
    occurredAt: daysAgo(3),
  },
];
