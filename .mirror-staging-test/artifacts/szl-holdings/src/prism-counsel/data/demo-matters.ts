export interface DemoParty {
  role: string;
  name: string;
  organization?: string;
}

export interface DemoClaim {
  claimNumber: string;
  coverageType: string;
  policyLimit: number;
  status: string;
  carrier: string;
}

export interface DemoOffer {
  type: string;
  amount: number;
  source: string;
  date: string;
}

export interface DemoMedicalEvent {
  date: string;
  provider: string;
  type: string;
  event: string;
  billed: number;
}

export interface DemoDamage {
  category: string;
  description: string;
  amount: number;
  status: string;
}

export interface DemoLien {
  holder: string;
  type: string;
  asserted: number;
  status: string;
}

export interface DemoDeadline {
  title: string;
  type: string;
  date: string;
  priority: string;
  status: string;
}

export interface DemoRecommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
}

export interface DemoMatter {
  id: number;
  title: string;
  caseNumber: string;
  matterType: string;
  status: string;
  stage: string;
  jurisdiction: string;
  courtName: string;
  healthScore: number;
  settlementLow: number;
  settlementHigh: number;
  settlementMid: number;
  totalDamages: number;
  totalLiens: number;
  assignedAttorney: string;
  assignedParalegal: string;
  filingDate: string;
  statOfLimitations: string;
  parties: DemoParty[];
  claims: DemoClaim[];
  offers: DemoOffer[];
  medicalTimeline: DemoMedicalEvent[];
  damages: DemoDamage[];
  liens: DemoLien[];
  deadlines: DemoDeadline[];
  readinessScores: Record<string, number>;
  recommendations: DemoRecommendation[];
}

export const DEMO_MATTERS: DemoMatter[] = [
  {
    id: 1,
    title: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    matterType: "auto_injury" as const,
    status: "discovery" as const,
    stage: "Active Discovery — IME Pending",
    jurisdiction: "Miami-Dade County, FL",
    courtName: "11th Judicial Circuit Court",
    healthScore: 72,
    settlementLow: 185000,
    settlementHigh: 340000,
    settlementMid: 262500,
    totalDamages: 298450,
    totalLiens: 42300,
    assignedAttorney: "Sarah Chen",
    assignedParalegal: "Marcus Williams",
    filingDate: "2025-06-14",
    statOfLimitations: "2027-03-22",
    parties: [
      { role: "plaintiff", name: "Maria Rodriguez" },
      { role: "defendant", name: "James Patterson" },
      { role: "carrier", name: "National General Insurance", organization: "National General Holdings" },
      { role: "adjuster", name: "Karen Mitchell" },
      { role: "opposing_counsel", name: "David Hargrove", organization: "Hargrove & Associates" },
    ],
    claims: [
      { claimNumber: "NG-2025-88341", coverageType: "bodily_injury", policyLimit: 300000, status: "open", carrier: "National General" },
      { claimNumber: "NG-2025-88342", coverageType: "uninsured_motorist", policyLimit: 100000, status: "pending", carrier: "State Farm (client policy)" },
    ],
    offers: [
      { type: "offer", amount: 45000, source: "National General", date: "2025-11-20" },
      { type: "counter_offer", amount: 95000, source: "National General", date: "2026-01-15" },
      { type: "demand", amount: 285000, source: "Plaintiff", date: "2026-02-28" },
    ],
    medicalTimeline: [
      { date: "2025-03-22", provider: "Jackson Memorial ER", type: "er", event: "Emergency admission — cervical strain, lumbar disc herniation, right shoulder contusion", billed: 18400 },
      { date: "2025-04-01", provider: "Dr. Patel (Orthopedic)", type: "orthopedic", event: "Initial orthopedic evaluation — MRI ordered", billed: 850 },
      { date: "2025-04-10", provider: "Advanced Imaging", type: "imaging", event: "MRI cervical spine — C5-C6 disc protrusion confirmed", billed: 3200 },
      { date: "2025-04-15", provider: "Dr. Patel (Orthopedic)", type: "orthopedic", event: "Follow-up — conservative treatment plan, 12 weeks PT", billed: 450 },
      { date: "2025-04-22", provider: "PhysioFirst PT", type: "physical_therapy", event: "PT begins — 3x/week cervical/lumbar program", billed: 0 },
      { date: "2025-07-15", provider: "PhysioFirst PT", type: "physical_therapy", event: "12-week PT complete — 36 sessions, partial improvement", billed: 14400 },
      { date: "2025-08-01", provider: "Dr. Navarro (Pain Mgmt)", type: "pain_management", event: "Pain management referral — ESI recommended", billed: 650 },
      { date: "2025-08-20", provider: "Dr. Navarro (Pain Mgmt)", type: "pain_management", event: "Epidural steroid injection #1 — C5-C6", billed: 4800 },
      { date: "2025-10-01", provider: "Dr. Navarro (Pain Mgmt)", type: "pain_management", event: "ESI #2 — moderate relief reported", billed: 4800 },
      { date: "2026-01-10", provider: "Dr. Patel (Orthopedic)", type: "orthopedic", event: "Re-evaluation — continued symptoms, surgical consult discussed", billed: 450 },
    ],
    damages: [
      { category: "medical_specials", description: "Past medical expenses", amount: 47600, status: "verified" },
      { category: "future_medical", description: "Projected surgical intervention + rehab", amount: 85000, status: "estimated" },
      { category: "lost_wages", description: "6 months lost income (warehouse supervisor)", amount: 38400, status: "verified" },
      { category: "pain_suffering", description: "Pain and suffering — ongoing chronic pain", amount: 120000, status: "estimated" },
      { category: "out_of_pocket", description: "Transportation, home care assistance", amount: 7450, status: "pending" },
    ],
    liens: [
      { holder: "Medicaid", type: "medicaid", asserted: 22300, status: "asserted" },
      { holder: "PhysioFirst PT", type: "provider", asserted: 14400, status: "negotiating" },
      { holder: "Jackson Memorial", type: "hospital", asserted: 5600, status: "asserted" },
    ],
    deadlines: [
      { title: "Expert disclosure deadline", type: "expert_disclosure", date: "2026-04-30", priority: "high", status: "pending" },
      { title: "Discovery cutoff", type: "discovery_cutoff", date: "2026-06-15", priority: "critical", status: "pending" },
      { title: "Mediation", type: "mediation", date: "2026-07-20", priority: "high", status: "pending" },
      { title: "Defendant IME", type: "deposition", date: "2026-04-15", priority: "high", status: "pending" },
    ],
    readinessScores: {
      posture: 68, readiness: 55, integrity: 82, strategy: 71, money: 64, governance: 90,
    },
    recommendations: [
      { type: "missing_evidence", title: "Obtain wage verification letter", description: "Employer has not provided formal wage verification. Needed before demand finalization.", priority: "high" },
      { type: "demand_readiness", title: "Demand packet 78% complete", description: "Missing: final medical narrative, wage verification, future medical life care plan estimate.", priority: "high" },
      { type: "deposition_prep", title: "Prepare for defendant IME", description: "IME scheduled for April 15. Prepare client with expected exam protocol and documentation.", priority: "medium" },
      { type: "inconsistency_alert", title: "Treatment gap detected", description: "45-day gap between PT completion and pain management referral. Opposing counsel likely to flag.", priority: "medium" },
    ],
  },
  {
    id: 2,
    title: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    matterType: "premises_liability" as const,
    status: "pre_trial" as const,
    stage: "Mediation Preparation",
    jurisdiction: "Bergen County, NJ",
    courtName: "Superior Court of New Jersey",
    healthScore: 58,
    settlementLow: 120000,
    settlementHigh: 275000,
    settlementMid: 197500,
    totalDamages: 215800,
    totalLiens: 18900,
    assignedAttorney: "Sarah Chen",
    assignedParalegal: "Lisa Park",
    filingDate: "2025-08-20",
    statOfLimitations: "2027-01-12",
    parties: [
      { role: "plaintiff", name: "Robert Thompson" },
      { role: "defendant", name: "Westfield Mall Holdings LLC" },
      { role: "carrier", name: "Hartford Financial Services" },
      { role: "adjuster", name: "Steven Torres" },
    ],
    claims: [
      { claimNumber: "HFS-2025-112876", coverageType: "premises", policyLimit: 1000000, status: "open", carrier: "Hartford" },
    ],
    offers: [
      { type: "offer", amount: 35000, source: "Hartford", date: "2026-01-10" },
      { type: "demand", amount: 350000, source: "Plaintiff", date: "2025-12-01" },
    ],
    damages: [
      { category: "medical_specials", description: "Knee surgery + rehab", amount: 78500, status: "verified" },
      { category: "lost_wages", description: "3 months lost income", amount: 24300, status: "verified" },
      { category: "pain_suffering", description: "Ongoing knee issues, lifestyle limitation", amount: 95000, status: "estimated" },
      { category: "out_of_pocket", description: "Medical devices, transportation", amount: 18000, status: "pending" },
    ],
    readinessScores: {
      posture: 52, readiness: 63, integrity: 71, strategy: 48, money: 59, governance: 88,
    },
    recommendations: [
      { type: "missing_evidence", title: "Surveillance footage request outstanding", description: "Mall management has not produced interior camera footage from incident date. Motion to compel may be necessary.", priority: "critical" },
      { type: "next_best_action", title: "Retain biomechanical expert", description: "Liability is contested. Biomechanical expert can reconstruct fall mechanics and counter defense narrative.", priority: "high" },
    ],
    deadlines: [
      { title: "Mediation session", type: "mediation", date: "2026-04-28", priority: "critical", status: "pending" },
      { title: "Expert report due", type: "expert_disclosure", date: "2026-04-10", priority: "high", status: "pending" },
    ],
    medicalTimeline: [
      { date: "2025-01-12", provider: "Valley Hospital ER", type: "er", event: "Fall in parking structure — right knee fracture", billed: 12800 },
      { date: "2025-01-25", provider: "Dr. Kim (Orthopedic)", type: "surgeon", event: "Arthroscopic knee surgery", billed: 42000 },
      { date: "2025-02-15", provider: "Summit PT", type: "physical_therapy", event: "Post-surgical rehabilitation begins", billed: 0 },
    ],
    liens: [
      { holder: "Blue Cross Blue Shield", type: "health_insurance", asserted: 18900, status: "asserted" },
    ],
  },
  {
    id: 3,
    title: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    matterType: "insurance_coverage" as const,
    status: "discovery" as const,
    stage: "Coverage Analysis — Bad Faith Evaluation",
    jurisdiction: "New York County, NY",
    courtName: "Supreme Court of the State of New York",
    healthScore: 65,
    settlementLow: 450000,
    settlementHigh: 1200000,
    settlementMid: 825000,
    totalDamages: 2100000,
    totalLiens: 0,
    assignedAttorney: "James Whitfield",
    assignedParalegal: "Marcus Williams",
    filingDate: "2025-10-05",
    statOfLimitations: "2028-10-05",
    parties: [
      { role: "plaintiff", name: "Meridian Holdings LLC" },
      { role: "defendant", name: "Atlantic Casualty Insurance Co." },
      { role: "carrier", name: "Atlantic Casualty Insurance Co." },
      { role: "adjuster", name: "Patricia Alvarez" },
    ],
    claims: [
      { claimNumber: "AC-2025-005891", coverageType: "general_liability", policyLimit: 5000000, status: "denied", carrier: "Atlantic Casualty" },
    ],
    offers: [],
    damages: [
      { category: "property_damage", description: "Building remediation costs", amount: 1450000, status: "verified" },
      { category: "lost_wages", description: "Business interruption losses", amount: 380000, status: "pending" },
      { category: "other", description: "Bad faith damages claim", amount: 270000, status: "estimated" },
    ],
    readinessScores: {
      posture: 74, readiness: 45, integrity: 88, strategy: 62, money: 70, governance: 92,
    },
    recommendations: [
      { type: "next_best_action", title: "Analyze denial letter against policy language", description: "Carrier denial cites pollution exclusion. Policy language analysis needed to evaluate coverage argument strength.", priority: "critical" },
      { type: "discovery_follow_up", title: "Subpoena underwriting file", description: "Carrier's underwriting file may show knowledge of conditions at binding. Supports bad faith argument.", priority: "high" },
    ],
    deadlines: [
      { title: "Motion for summary judgment deadline", type: "motion", date: "2026-06-01", priority: "critical", status: "pending" },
      { title: "Document production deadline", type: "discovery_cutoff", date: "2026-05-01", priority: "high", status: "pending" },
    ],
    medicalTimeline: [],
    liens: [],
  },
];

export const PILLAR_LABELS: Record<string, string> = {
  posture: "Posture",
  readiness: "Readiness",
  integrity: "Integrity",
  strategy: "Strategy",
  money: "Money",
  governance: "Governance",
};

export const PILLAR_DESCRIPTIONS: Record<string, string> = {
  posture: "Liability, coverage, venue, and opposing counsel posture assessment",
  readiness: "Demand, discovery, deposition, mediation, and trial readiness",
  integrity: "Source lineage, privilege risk, deadline completeness, fact consistency",
  strategy: "Next best actions, leverage points, evidence gaps, negotiation timing",
  money: "Settlement forecasting, lien exposure, damages completeness, reserve tracking",
  governance: "Approval state, AI usage trace, role attribution, access scope",
};
