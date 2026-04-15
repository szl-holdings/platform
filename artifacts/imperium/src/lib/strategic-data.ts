export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ReserveStatus = "HEALTHY" | "WATCH" | "DEPLETED";
export type DirectiveStatus = "ISSUED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE" | "OVERDUE";
export type AllianceStatus = "ACTIVE" | "STRAINED" | "SUSPENDED" | "PENDING";

// ─── WARGAMING ───────────────────────────────────────────────────────────────

export interface ScenarioBranch {
  id: string;
  label: string;
  probability: number;
  outcome: string;
  impact: { financial: number; operational: number; strategic: number; legal: number };
  children?: ScenarioBranch[];
}

export interface Scenario {
  id: string;
  name: string;
  domain: "MARKET" | "SECURITY" | "OPERATIONAL" | "LEGAL";
  trigger: string;
  description: string;
  monteCarloPct: number;
  expectedValue: number;
  worstCase: number;
  bestCase: number;
  branches: ScenarioBranch[];
  status: "ACTIVE" | "SIMULATED" | "ARCHIVED";
  createdAt: Date;
}

export const WARGAME_SCENARIOS: Scenario[] = [
  {
    id: "sc-001",
    name: "Azure Region Failover",
    domain: "OPERATIONAL",
    trigger: "East US primary region outage > 4 hours",
    description: "Simulates cascading effects of a primary cloud region failure across all SZL Holdings applications and services. Models recovery paths and business continuity postures.",
    monteCarloPct: 12,
    expectedValue: -480000,
    worstCase: -2100000,
    bestCase: -80000,
    status: "ACTIVE",
    createdAt: new Date("2026-01-15"),
    branches: [
      {
        id: "b1", label: "Auto-failover succeeds", probability: 0.65, outcome: "RTO < 2 hours, minimal revenue loss",
        impact: { financial: -2, operational: -15, strategic: -5, legal: 0 },
        children: [
          { id: "b1a", label: "Full recovery in 4h", probability: 0.8, outcome: "Normal operations restored", impact: { financial: 0, operational: 5, strategic: 0, legal: 0 } },
          { id: "b1b", label: "Partial degradation persists", probability: 0.2, outcome: "3 services remain degraded", impact: { financial: -8, operational: -20, strategic: -5, legal: 5 } },
        ]
      },
      {
        id: "b2", label: "Manual intervention required", probability: 0.25, outcome: "RTO 4–8 hours, SLA breach risk",
        impact: { financial: -18, operational: -40, strategic: -12, legal: -15 },
        children: [
          { id: "b2a", label: "SLA breach triggers penalties", probability: 0.6, outcome: "Legal obligations triggered", impact: { financial: -35, operational: -10, strategic: -20, legal: -40 } },
          { id: "b2b", label: "Client agreements honored", probability: 0.4, outcome: "Goodwill credit issued", impact: { financial: -10, operational: -5, strategic: 5, legal: 0 } },
        ]
      },
      {
        id: "b3", label: "Catastrophic data loss", probability: 0.10, outcome: "Backups fail, extended outage > 24h",
        impact: { financial: -85, operational: -90, strategic: -60, legal: -80 },
      },
    ],
  },
  {
    id: "sc-002",
    name: "Competitor Acquisition Threat",
    domain: "MARKET",
    trigger: "Major competitor acquires key technology vendor",
    description: "Models strategic response options if a primary competitor acquires a shared-stack technology vendor, potentially cutting off preferential pricing or API access.",
    monteCarloPct: 28,
    expectedValue: -320000,
    worstCase: -1800000,
    bestCase: 240000,
    status: "SIMULATED",
    createdAt: new Date("2026-02-01"),
    branches: [
      {
        id: "b1", label: "Accelerate vendor diversification", probability: 0.45, outcome: "Reduced dependency within 6 months",
        impact: { financial: -12, operational: -8, strategic: 20, legal: 0 },
      },
      {
        id: "b2", label: "Negotiate long-term contract lock-in", probability: 0.35, outcome: "3-year pricing protection secured",
        impact: { financial: 15, operational: 0, strategic: -5, legal: 10 },
      },
      {
        id: "b3", label: "Build proprietary alternative", probability: 0.20, outcome: "18-month build, high capital burn",
        impact: { financial: -40, operational: -5, strategic: 35, legal: 0 },
      },
    ],
  },
  {
    id: "sc-003",
    name: "Regulatory Compliance Squeeze",
    domain: "LEGAL",
    trigger: "New data sovereignty regulations enacted across 3 jurisdictions",
    description: "Cascading compliance obligations from simultaneous regulatory changes in EU, UK, and Canada affecting data residency, processing consent, and audit requirements.",
    monteCarloPct: 67,
    expectedValue: -560000,
    worstCase: -3400000,
    bestCase: -120000,
    status: "ACTIVE",
    createdAt: new Date("2026-03-10"),
    branches: [
      {
        id: "b1", label: "Full compliance achieved on time", probability: 0.40, outcome: "No penalties, slight cost increase",
        impact: { financial: -8, operational: -12, strategic: 10, legal: 15 },
      },
      {
        id: "b2", label: "Partial compliance — grace period", probability: 0.45, outcome: "6-month extension granted",
        impact: { financial: -20, operational: -20, strategic: -5, legal: -10 },
      },
      {
        id: "b3", label: "Non-compliance penalties", probability: 0.15, outcome: "Regulatory fines + audit obligations",
        impact: { financial: -75, operational: -15, strategic: -40, legal: -85 },
      },
    ],
  },
];

// ─── RESOURCE ALLOCATION ─────────────────────────────────────────────────────

export interface ResourcePool {
  id: string;
  name: string;
  category: "CAPITAL" | "PERSONNEL" | "TECHNOLOGY" | "TIME";
  total: number;
  unit: string;
  allocations: ResourceAllocation[];
  color: string;
}

export interface ResourceAllocation {
  initiative: string;
  amount: number;
  priority: "P1" | "P2" | "P3";
  impactScore: number;
  roi: number;
  locked: boolean;
}

export const RESOURCE_POOLS: ResourcePool[] = [
  {
    id: "cap-001",
    name: "Investment Capital",
    category: "CAPITAL",
    total: 12000000,
    unit: "$",
    color: "#c9a227",
    allocations: [
      { initiative: "CORTEX Platform Build", amount: 3200000, priority: "P1", impactScore: 94, roi: 3.2, locked: true },
      { initiative: "Terra AI Engine", amount: 1800000, priority: "P1", impactScore: 88, roi: 2.8, locked: false },
      { initiative: "Vessels Maritime Expansion", amount: 950000, priority: "P2", impactScore: 72, roi: 2.1, locked: false },
      { initiative: "Security Hardening", amount: 600000, priority: "P1", impactScore: 85, roi: 1.5, locked: true },
      { initiative: "Aegis Legal AI", amount: 750000, priority: "P2", impactScore: 78, roi: 2.4, locked: false },
      { initiative: "Strategic Reserve", amount: 2400000, priority: "P1", impactScore: 95, roi: 0, locked: true },
    ],
  },
  {
    id: "per-001",
    name: "Engineering Headcount",
    category: "PERSONNEL",
    total: 48,
    unit: "FTE",
    color: "#60a5fa",
    allocations: [
      { initiative: "CORTEX Platform", amount: 12, priority: "P1", impactScore: 92, roi: 4.1, locked: true },
      { initiative: "Terra Intelligence", amount: 8, priority: "P1", impactScore: 87, roi: 3.3, locked: false },
      { initiative: "Vessels & Maritime", amount: 6, priority: "P2", impactScore: 71, roi: 2.2, locked: false },
      { initiative: "Aegis / Legal", amount: 7, priority: "P2", impactScore: 76, roi: 2.6, locked: false },
      { initiative: "Infrastructure / DevOps", amount: 9, priority: "P1", impactScore: 88, roi: 1.8, locked: true },
      { initiative: "Bench / Reserve", amount: 6, priority: "P3", impactScore: 60, roi: 0, locked: false },
    ],
  },
  {
    id: "tech-001",
    name: "Technology Budget",
    category: "TECHNOLOGY",
    total: 2800000,
    unit: "$",
    color: "#a78bfa",
    allocations: [
      { initiative: "Azure Cloud Infrastructure", amount: 850000, priority: "P1", impactScore: 95, roi: 2.5, locked: true },
      { initiative: "AI/ML Licensing (OpenAI, Azure AI)", amount: 480000, priority: "P1", impactScore: 91, roi: 3.8, locked: false },
      { initiative: "Security & Compliance Tools", amount: 320000, priority: "P1", impactScore: 89, roi: 1.2, locked: true },
      { initiative: "Data & Analytics Platform", amount: 390000, priority: "P2", impactScore: 82, roi: 2.9, locked: false },
      { initiative: "Developer Toolchain", amount: 210000, priority: "P2", impactScore: 75, roi: 2.1, locked: false },
      { initiative: "Contingency Reserve", amount: 550000, priority: "P3", impactScore: 70, roi: 0, locked: true },
    ],
  },
  {
    id: "time-001",
    name: "Executive Bandwidth",
    category: "TIME",
    total: 2080,
    unit: "hrs/yr",
    color: "#4ade80",
    allocations: [
      { initiative: "Strategic Partnerships", amount: 480, priority: "P1", impactScore: 88, roi: 3.5, locked: false },
      { initiative: "Investor Relations", amount: 320, priority: "P1", impactScore: 85, roi: 4.2, locked: false },
      { initiative: "Product Direction", amount: 560, priority: "P1", impactScore: 92, roi: 3.9, locked: true },
      { initiative: "Regulatory / Legal", amount: 240, priority: "P2", impactScore: 78, roi: 1.4, locked: false },
      { initiative: "Team Leadership", amount: 380, priority: "P2", impactScore: 82, roi: 2.8, locked: false },
      { initiative: "Buffer / Unplanned", amount: 100, priority: "P3", impactScore: 55, roi: 0, locked: false },
    ],
  },
];

// ─── GEOSPATIAL INTELLIGENCE ──────────────────────────────────────────────────

export type GeoLayerType = "ASSETS" | "THREATS" | "OPERATIONS" | "PARTNERS" | "INFRASTRUCTURE";

export interface GeoPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel: string;
  type: GeoLayerType;
  severity?: RiskLevel;
  status: "ACTIVE" | "MONITORING" | "ALERT" | "OFFLINE";
}

export interface GeoLayer {
  id: string;
  name: string;
  type: GeoLayerType;
  color: string;
  enabled: boolean;
  pinCount: number;
  pins: GeoPin[];
}

export const GEO_LAYERS: GeoLayer[] = [
  {
    id: "layer-assets",
    name: "Strategic Assets",
    type: "ASSETS",
    color: "#c9a227",
    enabled: true,
    pinCount: 6,
    pins: [
      { id: "a1", lat: 40.7128, lng: -74.006, label: "HQ — New York", sublabel: "Primary command center", type: "ASSETS", status: "ACTIVE" },
      { id: "a2", lat: 51.5074, lng: -0.1278, label: "London Office", sublabel: "EMEA operations hub", type: "ASSETS", status: "ACTIVE" },
      { id: "a3", lat: 37.7749, lng: -122.4194, label: "Tech Hub — SF", sublabel: "Engineering center", type: "ASSETS", status: "ACTIVE" },
      { id: "a4", lat: 43.6532, lng: -79.3832, label: "Toronto Data Center", sublabel: "Primary cloud region", type: "ASSETS", status: "ACTIVE" },
      { id: "a5", lat: 52.52, lng: 13.405, label: "Berlin Office", sublabel: "Legal & compliance", type: "ASSETS", status: "MONITORING" },
      { id: "a6", lat: 35.6762, lng: 139.6503, label: "Tokyo Node", sublabel: "APAC data node", type: "ASSETS", status: "ACTIVE" },
    ],
  },
  {
    id: "layer-threats",
    name: "Threat Indicators",
    type: "THREATS",
    color: "#ef4444",
    enabled: true,
    pinCount: 4,
    pins: [
      { id: "t1", lat: 55.7558, lng: 37.6176, label: "APT-41 Cluster", sublabel: "Persistent reconnaissance", type: "THREATS", severity: "HIGH", status: "ALERT" },
      { id: "t2", lat: 39.9042, lng: 116.4074, label: "Infrastructure Probe", sublabel: "Active scanning detected", type: "THREATS", severity: "MEDIUM", status: "MONITORING" },
      { id: "t3", lat: 6.5244, lng: 3.3792, label: "Phishing Campaign", sublabel: "West Africa origin", type: "THREATS", severity: "LOW", status: "MONITORING" },
      { id: "t4", lat: 25.2048, lng: 55.2708, label: "Supply Chain Indicator", sublabel: "Vendor security concern", type: "THREATS", severity: "HIGH", status: "ALERT" },
    ],
  },
  {
    id: "layer-ops",
    name: "Active Operations",
    type: "OPERATIONS",
    color: "#60a5fa",
    enabled: true,
    pinCount: 5,
    pins: [
      { id: "o1", lat: 48.8566, lng: 2.3522, label: "OPERATION MINERVA", sublabel: "EU compliance rollout", type: "OPERATIONS", status: "ACTIVE" },
      { id: "o2", lat: 1.3521, lng: 103.8198, label: "OPERATION MERIDIAN", sublabel: "APAC expansion", type: "OPERATIONS", status: "ACTIVE" },
      { id: "o3", lat: -33.8688, lng: 151.2093, label: "OPERATION AURORA", sublabel: "ANZ market entry", type: "OPERATIONS", status: "MONITORING" },
      { id: "o4", lat: 19.4326, lng: -99.1332, label: "OPERATION CORTEZ", sublabel: "LATAM partnership", type: "OPERATIONS", status: "ACTIVE" },
      { id: "o5", lat: 41.0082, lng: 28.9784, label: "OPERATION BOSPHORUS", sublabel: "Infrastructure transit node", type: "OPERATIONS", status: "MONITORING" },
    ],
  },
  {
    id: "layer-partners",
    name: "Alliance Partners",
    type: "PARTNERS",
    color: "#4ade80",
    enabled: true,
    pinCount: 5,
    pins: [
      { id: "p1", lat: 47.6062, lng: -122.3321, label: "Microsoft Azure", sublabel: "Cloud infrastructure partner", type: "PARTNERS", status: "ACTIVE" },
      { id: "p2", lat: 37.3861, lng: -122.0839, label: "OpenAI", sublabel: "AI capability partner", type: "PARTNERS", status: "ACTIVE" },
      { id: "p3", lat: 40.7589, lng: -73.9851, label: "Legal Alliance Group", sublabel: "Regulatory counsel", type: "PARTNERS", status: "ACTIVE" },
      { id: "p4", lat: 51.5033, lng: -0.1195, label: "Barclays Corporate", sublabel: "Banking & treasury", type: "PARTNERS", status: "MONITORING" },
      { id: "p5", lat: 22.3193, lng: 114.1694, label: "Hong Kong Hub", sublabel: "APAC banking partner", type: "PARTNERS", status: "ACTIVE" },
    ],
  },
  {
    id: "layer-infra",
    name: "Infrastructure Nodes",
    type: "INFRASTRUCTURE",
    color: "#a78bfa",
    enabled: false,
    pinCount: 4,
    pins: [
      { id: "i1", lat: 38.9072, lng: -77.0369, label: "Azure East US", sublabel: "Primary region — 91 Aquila", type: "INFRASTRUCTURE", status: "ACTIVE" },
      { id: "i2", lat: 47.6062, lng: -122.3321, label: "Azure West US", sublabel: "Secondary region — 88 Aquila", type: "INFRASTRUCTURE", status: "ACTIVE" },
      { id: "i3", lat: 52.3676, lng: 4.9041, label: "Azure West Europe", sublabel: "EU data residency — 85 Aquila", type: "INFRASTRUCTURE", status: "ACTIVE" },
      { id: "i4", lat: 35.6762, lng: 139.6503, label: "Azure Japan East", sublabel: "APAC node — 82 Aquila", type: "INFRASTRUCTURE", status: "MONITORING" },
    ],
  },
];

// ─── COALITION & STAKEHOLDER ──────────────────────────────────────────────────

export interface Partner {
  id: string;
  name: string;
  type: "TECHNOLOGY" | "LEGAL" | "FINANCIAL" | "STRATEGIC" | "OPERATIONAL";
  status: AllianceStatus;
  since: Date;
  obligations: Obligation[];
  sharedResources: string[];
  contactName: string;
  contactRole: string;
  lastActivity: Date;
  riskScore: number;
  commitmentScore: number;
}

export interface Obligation {
  id: string;
  title: string;
  dueDate: Date;
  status: "ON_TRACK" | "AT_RISK" | "OVERDUE" | "COMPLETE";
  value: number;
  description: string;
}

export const COALITION_PARTNERS: Partner[] = [
  {
    id: "part-001",
    name: "Microsoft Azure",
    type: "TECHNOLOGY",
    status: "ACTIVE",
    since: new Date("2022-03-01"),
    contactName: "James Whitfield",
    contactRole: "Enterprise Account Executive",
    lastActivity: new Date("2026-04-10"),
    riskScore: 12,
    commitmentScore: 94,
    sharedResources: ["Azure Credits ($48K/yr)", "Enterprise Support", "Architecture Review Board", "Early Access Programs"],
    obligations: [
      { id: "ob1", title: "Q2 Usage Report submission", dueDate: new Date("2026-06-30"), status: "ON_TRACK", value: 0, description: "Quarterly cloud usage report required for enterprise agreement compliance." },
      { id: "ob2", title: "Security posture attestation", dueDate: new Date("2026-05-15"), status: "AT_RISK", value: 0, description: "Annual security review attestation for premium support tier." },
    ],
  },
  {
    id: "part-002",
    name: "OpenAI Enterprise",
    type: "TECHNOLOGY",
    status: "ACTIVE",
    since: new Date("2023-09-01"),
    contactName: "Sarah Chen",
    contactRole: "Strategic Accounts",
    lastActivity: new Date("2026-04-08"),
    riskScore: 28,
    commitmentScore: 87,
    sharedResources: ["GPT-4o API Access", "Fine-tuning Capacity", "Priority Rate Limits"],
    obligations: [
      { id: "ob3", title: "Usage terms renewal", dueDate: new Date("2026-09-01"), status: "ON_TRACK", value: 0, description: "Annual enterprise agreement renewal." },
    ],
  },
  {
    id: "part-003",
    name: "Apex Legal Partners LLP",
    type: "LEGAL",
    status: "ACTIVE",
    since: new Date("2021-06-15"),
    contactName: "Victoria Harmon",
    contactRole: "Partner, Corporate",
    lastActivity: new Date("2026-04-12"),
    riskScore: 8,
    commitmentScore: 96,
    sharedResources: ["Retainer Access (120 hrs/mo)", "Regulatory Monitoring", "Cross-jurisdiction Filing"],
    obligations: [
      { id: "ob4", title: "Q2 retainer renewal", dueDate: new Date("2026-06-01"), status: "ON_TRACK", value: 85000, description: "Quarterly legal retainer payment." },
      { id: "ob5", title: "EU GDPR audit response", dueDate: new Date("2026-05-01"), status: "ON_TRACK", value: 0, description: "Regulatory compliance audit response filing." },
    ],
  },
  {
    id: "part-004",
    name: "Meridian Capital Group",
    type: "FINANCIAL",
    status: "ACTIVE",
    since: new Date("2024-01-01"),
    contactName: "David Lau",
    contactRole: "Managing Director",
    lastActivity: new Date("2026-03-28"),
    riskScore: 35,
    commitmentScore: 78,
    sharedResources: ["$25M Credit Facility", "Treasury Services", "FX Hedging"],
    obligations: [
      { id: "ob6", title: "Monthly covenant reporting", dueDate: new Date("2026-05-15"), status: "ON_TRACK", value: 0, description: "Monthly financial covenant compliance report." },
      { id: "ob7", title: "Annual audit access", dueDate: new Date("2026-12-31"), status: "ON_TRACK", value: 0, description: "Annual auditor access to financial systems." },
    ],
  },
  {
    id: "part-005",
    name: "Helios Defense Systems",
    type: "STRATEGIC",
    status: "STRAINED",
    since: new Date("2025-03-01"),
    contactName: "Col. Marcus Webb",
    contactRole: "VP Partnerships",
    lastActivity: new Date("2026-02-14"),
    riskScore: 62,
    commitmentScore: 45,
    sharedResources: ["Intelligence Sharing Protocol", "Joint Exercise Access"],
    obligations: [
      { id: "ob8", title: "Q1 intelligence exchange", dueDate: new Date("2026-03-31"), status: "OVERDUE", value: 0, description: "Quarterly threat intelligence data exchange." },
    ],
  },
];

// ─── AFTER-ACTION REVIEW ─────────────────────────────────────────────────────

export interface AAREvent {
  timestamp: Date;
  actor: string;
  action: string;
  outcome: string;
  type: "DECISION" | "ACTION" | "INCIDENT" | "ESCALATION" | "RESOLUTION";
}

export interface LessonLearned {
  id: string;
  category: "PROCESS" | "TECHNOLOGY" | "COMMUNICATION" | "SECURITY" | "RESOURCE";
  finding: string;
  recommendation: string;
  priority: RiskLevel;
  implemented: boolean;
}

export interface AARRecord {
  id: string;
  operationName: string;
  domain: "SECURITY" | "OPERATIONAL" | "MARKET" | "LEGAL";
  dateOccurred: Date;
  duration: string;
  commander: string;
  status: "COMPLETE" | "IN_REVIEW" | "ARCHIVED";
  outcome: "SUCCESS" | "PARTIAL" | "FAILURE";
  executiveSummary: string;
  timeline: AAREvent[];
  lessonsLearned: LessonLearned[];
  improvementTracking: { item: string; owner: string; dueDate: Date; complete: boolean }[];
}

export const AAR_RECORDS: AARRecord[] = [
  {
    id: "aar-001",
    operationName: "OPERATION AEGIS BREACH RESPONSE",
    domain: "SECURITY",
    dateOccurred: new Date("2026-02-14"),
    duration: "6 hours 22 minutes",
    commander: "S. Lutar",
    status: "COMPLETE",
    outcome: "PARTIAL",
    executiveSummary: "Credential stuffing attack against API gateway detected at 03:14 UTC. WAF blocked 94% of attack vectors. 6 accounts required forced rotation. No data exfiltration confirmed. Detection-to-response time exceeded SLA by 38 minutes.",
    timeline: [
      { timestamp: new Date("2026-02-14T03:14:00"), actor: "Praetorian AI", action: "Anomaly detection triggered — 847 failed auth attempts in 4 minutes", outcome: "Alert raised, investigation queued", type: "INCIDENT" },
      { timestamp: new Date("2026-02-14T03:52:00"), actor: "On-call engineer", action: "Alert acknowledged, escalated to security lead", outcome: "38-minute SLA breach on detection-to-response", type: "ESCALATION" },
      { timestamp: new Date("2026-02-14T04:10:00"), actor: "S. Lutar", action: "Activated BELLUM threat condition", outcome: "WAF rules hardened, geo-blocking engaged", type: "DECISION" },
      { timestamp: new Date("2026-02-14T04:35:00"), actor: "Security team", action: "Identified 6 compromised credentials, initiated rotation", outcome: "All 6 accounts secured within 20 minutes", type: "ACTION" },
      { timestamp: new Date("2026-02-14T06:45:00"), actor: "Forensics", action: "Full traffic analysis completed", outcome: "No data exfiltration confirmed, attack vector documented", type: "RESOLUTION" },
      { timestamp: new Date("2026-02-14T09:36:00"), actor: "S. Lutar", action: "Returned to VIGILIA, incident closed", outcome: "Post-incident report commissioned", type: "RESOLUTION" },
    ],
    lessonsLearned: [
      { id: "ll1", category: "PROCESS", finding: "38-minute response lag due to alert fatigue and on-call handoff gap", recommendation: "Implement automated Slack escalation after 10 minutes of unacknowledged BELLUM-tier alerts", priority: "CRITICAL", implemented: false },
      { id: "ll2", category: "SECURITY", finding: "Geo-blocking not pre-configured for known high-risk regions", recommendation: "Pre-configure geo-blocking rules for P1 threat regions, toggle rather than build under pressure", priority: "HIGH", implemented: true },
      { id: "ll3", category: "TECHNOLOGY", finding: "Credential rotation required manual intervention for 2 of 6 accounts", recommendation: "Automate credential rotation via Key Vault rotation policy for all service principals", priority: "HIGH", implemented: false },
    ],
    improvementTracking: [
      { item: "Auto-escalation alert pipeline", owner: "DevOps Lead", dueDate: new Date("2026-05-01"), complete: false },
      { item: "Geo-block rule library", owner: "Security Team", dueDate: new Date("2026-04-15"), complete: true },
      { item: "Automated credential rotation", owner: "Platform Team", dueDate: new Date("2026-06-01"), complete: false },
    ],
  },
  {
    id: "aar-002",
    operationName: "OPERATION TERRA LAUNCH",
    domain: "OPERATIONAL",
    dateOccurred: new Date("2026-03-01"),
    duration: "72 hours (launch window)",
    commander: "S. Lutar",
    status: "COMPLETE",
    outcome: "SUCCESS",
    executiveSummary: "Terra Real Estate Intelligence platform launched on schedule with 99.8% uptime during launch window. Initial user adoption exceeded projections by 34%. One P2 incident related to AI model response latency resolved within SLA.",
    timeline: [
      { timestamp: new Date("2026-03-01T06:00:00"), actor: "Engineering team", action: "Production deployment initiated", outcome: "Zero-downtime deployment confirmed", type: "ACTION" },
      { timestamp: new Date("2026-03-01T08:30:00"), actor: "Marketing", action: "Public launch announcement broadcast", outcome: "350 signups in first 2 hours", type: "ACTION" },
      { timestamp: new Date("2026-03-01T11:15:00"), actor: "Centurion AI", action: "AI response latency degradation detected — P95 > 8 seconds", outcome: "P2 incident opened", type: "INCIDENT" },
      { timestamp: new Date("2026-03-01T12:40:00"), actor: "Platform team", action: "Model scaling adjustment deployed", outcome: "P95 latency returned to < 2 seconds", type: "RESOLUTION" },
      { timestamp: new Date("2026-03-03T18:00:00"), actor: "S. Lutar", action: "Launch window closed, steady-state operations confirmed", outcome: "Launch declared success", type: "RESOLUTION" },
    ],
    lessonsLearned: [
      { id: "ll4", category: "TECHNOLOGY", finding: "AI model scaling not pre-warmed for initial load spike", recommendation: "Implement pre-warming strategy for all AI endpoints before major launches", priority: "MEDIUM", implemented: false },
      { id: "ll5", category: "PROCESS", finding: "Launch war room comms worked well — recommend codifying as template", recommendation: "Document launch war room protocol as standard playbook", priority: "LOW", implemented: true },
    ],
    improvementTracking: [
      { item: "AI pre-warming playbook", owner: "Platform Team", dueDate: new Date("2026-05-15"), complete: false },
      { item: "Launch protocol documentation", owner: "Operations", dueDate: new Date("2026-04-30"), complete: true },
    ],
  },
];

// ─── STRATEGIC RESERVE ────────────────────────────────────────────────────────

export interface ReserveCategory {
  id: string;
  name: string;
  type: "FINANCIAL" | "PERSONNEL" | "EQUIPMENT" | "DIGITAL";
  total: number;
  available: number;
  committed: number;
  unit: string;
  color: string;
  status: ReserveStatus;
  runwayDays: number;
  drawdownScenarios: { name: string; impact: number; duration: string }[];
  replenishmentPlan: string;
  replenishmentDays: number;
}

export const STRATEGIC_RESERVES: ReserveCategory[] = [
  {
    id: "res-001",
    name: "Emergency Capital Reserve",
    type: "FINANCIAL",
    total: 5000000,
    available: 3200000,
    committed: 1800000,
    unit: "$",
    color: "#c9a227",
    status: "HEALTHY",
    runwayDays: 186,
    drawdownScenarios: [
      { name: "Azure region failover costs", impact: 15, duration: "72 hours" },
      { name: "Regulatory penalty payment", impact: 40, duration: "30 days" },
      { name: "Emergency headcount surge", impact: 25, duration: "60 days" },
    ],
    replenishmentPlan: "Monthly allocation from operating cashflow — $200K/mo target",
    replenishmentDays: 18,
  },
  {
    id: "res-002",
    name: "Surge Personnel Pool",
    type: "PERSONNEL",
    total: 24,
    available: 8,
    committed: 16,
    unit: "FTE equiv.",
    color: "#60a5fa",
    status: "WATCH",
    runwayDays: 45,
    drawdownScenarios: [
      { name: "Major product incident response", impact: 50, duration: "1 week" },
      { name: "Client onboarding acceleration", impact: 35, duration: "4 weeks" },
      { name: "Regulatory audit support", impact: 25, duration: "2 weeks" },
    ],
    replenishmentPlan: "Contractor pipeline — 6 pre-vetted agencies on retainer. 2-week activation SLA.",
    replenishmentDays: 14,
  },
  {
    id: "res-003",
    name: "Infrastructure Burst Capacity",
    type: "DIGITAL",
    total: 10000,
    available: 7200,
    committed: 2800,
    unit: "vCore-hrs/mo",
    color: "#a78bfa",
    status: "HEALTHY",
    runwayDays: 312,
    drawdownScenarios: [
      { name: "Traffic spike — viral product launch", impact: 60, duration: "48 hours" },
      { name: "DDoS mitigation scaling", impact: 80, duration: "4 hours" },
      { name: "Model training batch job", impact: 40, duration: "72 hours" },
    ],
    replenishmentPlan: "Azure Consumption Reserve auto-refills at billing cycle. Immediate burst available.",
    replenishmentDays: 0,
  },
  {
    id: "res-004",
    name: "Legal Defense Reserve",
    type: "FINANCIAL",
    total: 1500000,
    available: 420000,
    committed: 1080000,
    unit: "$",
    color: "#fb923c",
    status: "WATCH",
    runwayDays: 72,
    drawdownScenarios: [
      { name: "Regulatory investigation defense", impact: 60, duration: "6 months" },
      { name: "IP litigation response", impact: 45, duration: "3 months" },
      { name: "Employment dispute resolution", impact: 15, duration: "30 days" },
    ],
    replenishmentPlan: "Annual allocation from operating budget — under review for Q3 top-up ($500K proposed)",
    replenishmentDays: 45,
  },
];

// ─── DIRECTIVE CASCADE ────────────────────────────────────────────────────────

export interface DirectiveLayer {
  org: string;
  role: string;
  status: DirectiveStatus;
  assignee: string;
  progress: number;
  blockers: string[];
  lastUpdate: Date;
}

export interface Directive {
  id: string;
  title: string;
  issuedBy: string;
  issuedAt: Date;
  dueDate: Date;
  classification: "OPEN" | "RESTRICTED" | "CONFIDENTIAL" | "SOVEREIGN";
  priority: "P1" | "P2" | "P3";
  domain: "SECURITY" | "OPERATIONAL" | "STRATEGIC" | "COMPLIANCE";
  status: DirectiveStatus;
  overallProgress: number;
  summary: string;
  layers: DirectiveLayer[];
}

export const DIRECTIVES: Directive[] = [
  {
    id: "dir-001",
    title: "DIRECTIVE MINERVA — Zero-Trust Architecture Implementation",
    issuedBy: "Senate Chamber",
    issuedAt: new Date("2026-01-15"),
    dueDate: new Date("2026-06-30"),
    classification: "CONFIDENTIAL",
    priority: "P1",
    domain: "SECURITY",
    status: "IN_PROGRESS",
    overallProgress: 62,
    summary: "Complete migration to zero-trust network architecture across all SZL Holdings digital infrastructure. No implicit trust for any user, device, or service regardless of network location.",
    layers: [
      { org: "Senate", role: "Directive Authority", status: "COMPLETE", assignee: "S. Lutar", progress: 100, blockers: [], lastUpdate: new Date("2026-01-15") },
      { org: "Praetorian Guard", role: "Security Architecture", status: "IN_PROGRESS", assignee: "Security Lead", progress: 75, blockers: [], lastUpdate: new Date("2026-04-10") },
      { org: "DevOps / Platform", role: "Infrastructure Implementation", status: "IN_PROGRESS", assignee: "Platform Team", progress: 60, blockers: ["Service Bus private endpoint pending Senate vote"], lastUpdate: new Date("2026-04-09") },
      { org: "Engineering", role: "Application Integration", status: "IN_PROGRESS", assignee: "Engineering Leads", progress: 45, blockers: [], lastUpdate: new Date("2026-04-08") },
      { org: "Operations", role: "Access Policy Rollout", status: "IN_PROGRESS", assignee: "Ops Lead", progress: 30, blockers: ["Requires completion of Engineering layer"], lastUpdate: new Date("2026-04-01") },
    ],
  },
  {
    id: "dir-002",
    title: "DIRECTIVE OLYMPUS — CORTEX Platform Launch",
    issuedBy: "Senate Chamber",
    issuedAt: new Date("2026-02-01"),
    dueDate: new Date("2026-07-01"),
    classification: "RESTRICTED",
    priority: "P1",
    domain: "STRATEGIC",
    status: "IN_PROGRESS",
    overallProgress: 48,
    summary: "Launch CORTEX as the unified command surface for all SZL Holdings digital products. Consolidate Stephen, Forge, PRISM, and all subsidiary platforms into a single authenticated command center.",
    layers: [
      { org: "Senate", role: "Strategic Authorization", status: "COMPLETE", assignee: "S. Lutar", progress: 100, blockers: [], lastUpdate: new Date("2026-02-01") },
      { org: "Product", role: "Requirements & Design", status: "COMPLETE", assignee: "Product Lead", progress: 100, blockers: [], lastUpdate: new Date("2026-02-28") },
      { org: "Engineering", role: "Platform Build", status: "IN_PROGRESS", assignee: "CORTEX Team", progress: 55, blockers: [], lastUpdate: new Date("2026-04-11") },
      { org: "QA / Testing", role: "Integration Testing", status: "IN_PROGRESS", assignee: "QA Lead", progress: 25, blockers: ["Waiting on Engineering 80% completion"], lastUpdate: new Date("2026-04-05") },
      { org: "Marketing", role: "Launch Preparation", status: "IN_PROGRESS", assignee: "Marketing Lead", progress: 40, blockers: [], lastUpdate: new Date("2026-04-10") },
    ],
  },
  {
    id: "dir-003",
    title: "DIRECTIVE JANUS — Multi-Jurisdiction Compliance",
    issuedBy: "Senate Chamber",
    issuedAt: new Date("2026-03-01"),
    dueDate: new Date("2026-05-31"),
    classification: "CONFIDENTIAL",
    priority: "P1",
    domain: "COMPLIANCE",
    status: "IN_PROGRESS",
    overallProgress: 34,
    summary: "Achieve full compliance with EU AI Act, UK GDPR, and Canada PIPEDA requirements across all SZL Holdings data processing activities before regulatory deadlines.",
    layers: [
      { org: "Senate", role: "Compliance Authorization", status: "COMPLETE", assignee: "S. Lutar", progress: 100, blockers: [], lastUpdate: new Date("2026-03-01") },
      { org: "Legal / Compliance", role: "Gap Analysis & Framework", status: "COMPLETE", assignee: "Legal Lead", progress: 100, blockers: [], lastUpdate: new Date("2026-03-20") },
      { org: "Engineering", role: "Technical Controls", status: "IN_PROGRESS", assignee: "Engineering", progress: 35, blockers: ["EU AI Act technical standards still evolving"], lastUpdate: new Date("2026-04-08") },
      { org: "Operations", role: "Policy & Process Updates", status: "IN_PROGRESS", assignee: "Ops Team", progress: 20, blockers: [], lastUpdate: new Date("2026-04-05") },
      { org: "HR & Training", role: "Staff Training", status: "IN_PROGRESS", assignee: "HR Lead", progress: 15, blockers: ["Requires Operations policy completion"], lastUpdate: new Date("2026-04-01") },
    ],
  },
  {
    id: "dir-004",
    title: "DIRECTIVE FORTUNA — Q1 Revenue Optimization",
    issuedBy: "Legatus Console",
    issuedAt: new Date("2026-01-01"),
    dueDate: new Date("2026-03-31"),
    classification: "RESTRICTED",
    priority: "P2",
    domain: "OPERATIONAL",
    status: "COMPLETE",
    overallProgress: 100,
    summary: "Optimize cloud spend, reduce vendor costs by 15%, and implement chargeback reporting for all SZL Holdings subsidiaries. Target: $640K annualized savings.",
    layers: [
      { org: "Senate", role: "Budget Authorization", status: "COMPLETE", assignee: "S. Lutar", progress: 100, blockers: [], lastUpdate: new Date("2026-01-01") },
      { org: "Finance", role: "Cost Analysis", status: "COMPLETE", assignee: "Finance Lead", progress: 100, blockers: [], lastUpdate: new Date("2026-01-15") },
      { org: "DevOps", role: "Infrastructure Optimization", status: "COMPLETE", assignee: "DevOps Team", progress: 100, blockers: [], lastUpdate: new Date("2026-03-15") },
      { org: "Operations", role: "Vendor Negotiation", status: "COMPLETE", assignee: "Ops Lead", progress: 100, blockers: [], lastUpdate: new Date("2026-03-20") },
      { org: "Finance", role: "Chargeback Reporting", status: "COMPLETE", assignee: "Finance Lead", progress: 100, blockers: [], lastUpdate: new Date("2026-03-31") },
    ],
  },
];

// ─── RISK INTERDEPENDENCY MATRIX ──────────────────────────────────────────────

export interface RiskNode {
  id: string;
  domain: "MARKET" | "OPERATIONAL" | "SECURITY" | "LEGAL" | "FINANCIAL" | "REPUTATIONAL";
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: "ACTIVE" | "MITIGATED" | "MONITORING" | "ACCEPTED";
  mitigation: string;
  dependencies: string[];
  affectedBy: string[];
  color: string;
}

export const RISK_NODES: RiskNode[] = [
  {
    id: "risk-001",
    domain: "OPERATIONAL",
    title: "Azure Primary Region Failure",
    description: "Outage or severe degradation of the East US Azure region hosting primary SZL Holdings infrastructure.",
    likelihood: 0.12,
    impact: 0.85,
    riskScore: 78,
    status: "MONITORING",
    mitigation: "Multi-region failover configured. RTO < 2 hours. Tested quarterly.",
    dependencies: ["risk-003", "risk-005", "risk-007"],
    affectedBy: [],
    color: "#fb923c",
  },
  {
    id: "risk-002",
    domain: "SECURITY",
    title: "Credential Breach / Identity Attack",
    description: "Successful credential stuffing, phishing, or identity provider compromise targeting SZL Holdings systems.",
    likelihood: 0.28,
    impact: 0.72,
    riskScore: 82,
    status: "ACTIVE",
    mitigation: "MFA enforced, WAF active, VIGILIA threat condition. Praetorian monitoring 24/7.",
    dependencies: ["risk-004", "risk-008"],
    affectedBy: [],
    color: "#ef4444",
  },
  {
    id: "risk-003",
    domain: "FINANCIAL",
    title: "Revenue Impact — Service Outage",
    description: "Direct revenue loss and SLA penalty obligations triggered by extended service unavailability.",
    likelihood: 0.18,
    impact: 0.68,
    riskScore: 71,
    status: "MONITORING",
    mitigation: "SLA insurance, client notification protocols, compensation caps in contracts.",
    dependencies: ["risk-006"],
    affectedBy: ["risk-001", "risk-002"],
    color: "#c9a227",
  },
  {
    id: "risk-004",
    domain: "LEGAL",
    title: "Data Breach — Regulatory Penalties",
    description: "GDPR, PIPEDA, or UK DPA violations triggered by unauthorized data access, requiring regulatory notification and potential fines.",
    likelihood: 0.15,
    impact: 0.90,
    riskScore: 85,
    status: "ACTIVE",
    mitigation: "Data classification enforced, breach notification SOP in place, legal counsel on retainer.",
    dependencies: ["risk-006", "risk-008"],
    affectedBy: ["risk-002"],
    color: "#ef4444",
  },
  {
    id: "risk-005",
    domain: "OPERATIONAL",
    title: "Supply Chain — Vendor API Failure",
    description: "Failure or discontinuation of critical third-party APIs (OpenAI, mapping, financial data) causing product capability degradation.",
    likelihood: 0.22,
    impact: 0.55,
    riskScore: 62,
    status: "MONITORING",
    mitigation: "Vendor diversification roadmap in progress. Fallback models identified for AI services.",
    dependencies: ["risk-003"],
    affectedBy: ["risk-001"],
    color: "#fb923c",
  },
  {
    id: "risk-006",
    domain: "REPUTATIONAL",
    title: "Client Trust Erosion",
    description: "Loss of client confidence following security incident, extended outage, or regulatory action becoming public.",
    likelihood: 0.20,
    impact: 0.78,
    riskScore: 74,
    status: "MONITORING",
    mitigation: "PR response playbook, client communication protocols, executive communication program.",
    dependencies: [],
    affectedBy: ["risk-003", "risk-004", "risk-007"],
    color: "#a78bfa",
  },
  {
    id: "risk-007",
    domain: "MARKET",
    title: "Competitive Displacement",
    description: "Key competitor acquires critical technology advantage or market position, threatening SZL Holdings product differentiation.",
    likelihood: 0.35,
    impact: 0.60,
    riskScore: 68,
    status: "MONITORING",
    mitigation: "Continuous competitive intelligence, R&D investment acceleration, partnership moat strategy.",
    dependencies: ["risk-006"],
    affectedBy: ["risk-001"],
    color: "#60a5fa",
  },
  {
    id: "risk-008",
    domain: "LEGAL",
    title: "Multi-Jurisdiction Compliance Failure",
    description: "Failure to achieve compliance with EU AI Act, UK GDPR, or PIPEDA deadlines resulting in enforcement actions.",
    likelihood: 0.42,
    impact: 0.75,
    riskScore: 79,
    status: "ACTIVE",
    mitigation: "Directive JANUS active. Legal counsel engaged. Regulatory monitoring service subscribed.",
    dependencies: ["risk-004", "risk-006"],
    affectedBy: ["risk-002"],
    color: "#ef4444",
  },
];
