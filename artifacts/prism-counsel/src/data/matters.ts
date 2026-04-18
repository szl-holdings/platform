export type MatterStatus = "active" | "pending" | "closed" | "escalated" | "on-hold";
export type MatterType = "litigation" | "transaction" | "regulatory" | "employment" | "ip" | "real-estate" | "contract";
export type PrivilegeLevel = "public" | "confidential" | "privileged" | "restricted";
export type ObligationStatus = "pending" | "in-progress" | "complete" | "overdue" | "at-risk";
export type PartyRole = "client" | "opposing-counsel" | "regulator" | "third-party" | "expert" | "co-counsel";
export type AuditAction = "viewed" | "edited" | "exported" | "redacted" | "accessed-wall" | "escalated" | "deadline-updated" | "privilege-changed";

export interface Party {
  id: string;
  name: string;
  role: PartyRole;
  counsel?: string;
  jurisdiction?: string;
}

export interface Obligation {
  id: string;
  matterId: string;
  title: string;
  description: string;
  dueDate: string;
  status: ObligationStatus;
  assignee: string;
  dependencies: string[];
  privilegeLevel: PrivilegeLevel;
  filingRequired: boolean;
  courtId?: string;
  consequence?: string;
  completedDate?: string;
}

export interface AuditEntry {
  id: string;
  matterId: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  detail: string;
  ip: string;
}

export interface MatterWall {
  enabled: boolean;
  reason: string;
  blockedRoles: string[];
  approvedUsers: string[];
  createdAt: string;
  createdBy: string;
}

export interface ProofChainEntry {
  id: string;
  matterId: string;
  timestamp: string;
  eventType: "filing" | "communication" | "discovery" | "order" | "settlement" | "hearing" | "deadline" | "expert-report";
  title: string;
  summary: string;
  privilegeLevel: PrivilegeLevel;
  author: string;
  parties: string[];
  documentRef?: string;
  hash?: string;
  redacted?: boolean;
}

export interface Matter {
  id: string;
  name: string;
  clientName: string;
  matterNumber: string;
  type: MatterType;
  status: MatterStatus;
  privilegeLevel: PrivilegeLevel;
  pressureScore: number;
  complexityScore: number;
  openedDate: string;
  trialDate?: string;
  closingDate?: string;
  nextDeadline: string;
  nextDeadlineLabel: string;
  leadCounsel: string;
  parties: Party[];
  obligations: Obligation[];
  auditTrail: AuditEntry[];
  proofChain: ProofChainEntry[];
  wall: MatterWall;
  tags: string[];
  jurisdiction: string;
  estimatedExposure?: number;
  summary: string;
}

const now = new Date();
const d = (offsetDays: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().split("T")[0];
};
const t = (offsetDays: number, hour = 9) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

export const SEED_MATTERS: Matter[] = [
  {
    id: "M-2024-001",
    name: "Apex Capital — Series C Acquisition",
    clientName: "Apex Capital Partners LP",
    matterNumber: "2024-MA-001",
    type: "transaction",
    status: "active",
    privilegeLevel: "restricted",
    pressureScore: 87,
    complexityScore: 82,
    openedDate: d(-45),
    closingDate: d(12),
    nextDeadline: d(3),
    nextDeadlineLabel: "HSR Filing Deadline",
    leadCounsel: "M. Farooq",
    jurisdiction: "Delaware / Federal",
    estimatedExposure: 340_000_000,
    summary: "Acquisition of Meridian Software Group by Apex Capital Partners. Pending HSR antitrust review and regulatory approvals. Integration planning underway.",
    tags: ["M&A", "Antitrust", "HSR", "Urgent"],
    wall: {
      enabled: true,
      reason: "Client-requested confidentiality wall — Meridian board members may have conflicting interests",
      blockedRoles: ["associate", "paralegal"],
      approvedUsers: ["partner", "gc"],
      createdAt: t(-30),
      createdBy: "m.farooq",
    },
    parties: [
      { id: "p1", name: "Apex Capital Partners LP", role: "client", counsel: "M. Farooq, R. Chen" },
      { id: "p2", name: "Meridian Software Group", role: "opposing-counsel", counsel: "Latham & Watkins LLP" },
      { id: "p3", name: "Federal Trade Commission", role: "regulator", jurisdiction: "Federal" },
      { id: "p4", name: "Goldman Sachs — Financial Advisor", role: "third-party" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-001", title: "HSR Premerger Notification Filing", description: "Submit Hart-Scott-Rodino notification to FTC and DOJ", dueDate: d(3), status: "in-progress", assignee: "M. Farooq", dependencies: [], privilegeLevel: "confidential", filingRequired: true, courtId: "FTC-2024-HSR-0887", consequence: "Transaction cannot close without HSR clearance. $50K/day penalty for late filing." },
      { id: "o2", matterId: "M-2024-001", title: "Board Approval Resolution", description: "Meridian board meeting and shareholder vote approval documentation", dueDate: d(5), status: "complete", assignee: "R. Chen", dependencies: ["o1"], privilegeLevel: "restricted", filingRequired: false, completedDate: d(-2) },
      { id: "o3", matterId: "M-2024-001", title: "Merger Agreement Execution", description: "Final execution of definitive merger agreement", dueDate: d(8), status: "pending", assignee: "M. Farooq", dependencies: ["o1", "o2"], privilegeLevel: "restricted", filingRequired: true },
      { id: "o4", matterId: "M-2024-001", title: "Employee Notification (WARN Act)", description: "60-day advance notice to affected employees if required", dueDate: d(12), status: "pending", assignee: "J. Whitmore", dependencies: ["o3"], privilegeLevel: "confidential", filingRequired: false, consequence: "WARN Act violation: $500/employee/day + benefits" },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-001", timestamp: t(-30), user: "m.farooq", role: "Partner", action: "accessed-wall", detail: "Created matter wall: Meridian board conflict screen", ip: "10.1.2.3" },
      { id: "a2", matterId: "M-2024-001", timestamp: t(-15), user: "r.chen", role: "Associate", action: "edited", detail: "Updated HSR filing timeline", ip: "10.1.2.4" },
      { id: "a3", matterId: "M-2024-001", timestamp: t(-3), user: "m.farooq", role: "Partner", action: "viewed", detail: "Reviewed merger agreement draft v4", ip: "10.1.2.3" },
      { id: "a4", matterId: "M-2024-001", timestamp: t(-1), user: "j.whitmore", role: "Partner", action: "deadline-updated", detail: "Closing date extended by 5 days per FTC request", ip: "10.1.2.5" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-001", timestamp: t(-45), eventType: "communication", title: "Engagement Letter Executed", summary: "Engagement letter signed between Apex Capital and firm. Scope: M&A advisory, regulatory, employment.", privilegeLevel: "confidential", author: "M. Farooq", parties: ["Apex Capital Partners LP"], hash: "sha256:a3f1e2b4c5d6..." },
      { id: "pc2", matterId: "M-2024-001", timestamp: t(-30), eventType: "discovery", title: "Due Diligence Data Room Access", summary: "Access granted to Meridian VDR. 14,200 documents reviewed.", privilegeLevel: "restricted", author: "R. Chen", parties: ["Meridian Software Group"], hash: "sha256:b8f2c3a1d4e5..." },
      { id: "pc3", matterId: "M-2024-001", timestamp: t(-10), eventType: "filing", title: "HSR Pre-Notification Filing Draft", summary: "Draft HSR notification prepared. Awaiting financial data from Goldman Sachs.", privilegeLevel: "confidential", author: "M. Farooq", parties: ["FTC", "DOJ"], hash: "sha256:c9d4e5f6a1b2..." },
    ],
  },
  {
    id: "M-2024-002",
    name: "NeuralTech v. Prometheus AI — Patent Infringement",
    clientName: "NeuralTech Corporation",
    matterNumber: "2024-LIT-004",
    type: "ip",
    status: "active",
    privilegeLevel: "privileged",
    pressureScore: 94,
    complexityScore: 78,
    openedDate: d(-120),
    trialDate: d(45),
    nextDeadline: d(7),
    nextDeadlineLabel: "Expert Witness Disclosure",
    leadCounsel: "S. Okafor",
    jurisdiction: "N.D. Cal. (San Jose)",
    estimatedExposure: 125_000_000,
    summary: "NeuralTech alleges Prometheus AI willfully infringed 4 patents covering transformer attention mechanisms. Trial set for Q2. Expert reports due imminently.",
    tags: ["Patent", "IP", "Trial Prep", "Critical"],
    wall: {
      enabled: false,
      reason: "",
      blockedRoles: [],
      approvedUsers: [],
      createdAt: "",
      createdBy: "",
    },
    parties: [
      { id: "p1", name: "NeuralTech Corporation", role: "client", counsel: "S. Okafor, T. Park" },
      { id: "p2", name: "Prometheus AI Inc.", role: "opposing-counsel", counsel: "Quinn Emanuel Urquhart" },
      { id: "p3", name: "Hon. M. Chen, USDC N.D. Cal.", role: "regulator" },
      { id: "p4", name: "Dr. Alan Voss — Technical Expert", role: "expert" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-002", title: "Expert Witness Disclosure", description: "Disclose expert witnesses and provide CV/report summaries to opposing counsel", dueDate: d(7), status: "at-risk", assignee: "S. Okafor", dependencies: [], privilegeLevel: "privileged", filingRequired: true, courtId: "5:24-cv-03817-MC", consequence: "Preclusion of expert testimony at trial" },
      { id: "o2", matterId: "M-2024-002", title: "Expert Report — Technical Infringement", description: "Dr. Voss final technical infringement opinion report", dueDate: d(14), status: "in-progress", assignee: "T. Park", dependencies: ["o1"], privilegeLevel: "privileged", filingRequired: false },
      { id: "o3", matterId: "M-2024-002", title: "Pretrial Conference", description: "Joint pretrial conference with Judge Chen", dueDate: d(28), status: "pending", assignee: "S. Okafor", dependencies: ["o2"], privilegeLevel: "confidential", filingRequired: true, courtId: "5:24-cv-03817-MC" },
      { id: "o4", matterId: "M-2024-002", title: "Trial Brief Filing", description: "File trial brief outlining legal theories, witness list, exhibit list", dueDate: d(35), status: "pending", assignee: "S. Okafor", dependencies: ["o3"], privilegeLevel: "confidential", filingRequired: true, courtId: "5:24-cv-03817-MC" },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-002", timestamp: t(-120), user: "s.okafor", role: "Partner", action: "edited", detail: "Matter opened. Complaint filed N.D. Cal.", ip: "10.1.3.1" },
      { id: "a2", matterId: "M-2024-002", timestamp: t(-60), user: "t.park", role: "Associate", action: "edited", detail: "Claim construction brief filed", ip: "10.1.3.2" },
      { id: "a3", matterId: "M-2024-002", timestamp: t(-7), user: "s.okafor", role: "Partner", action: "deadline-updated", detail: "Expert disclosure flagged at-risk — Dr. Voss report delayed", ip: "10.1.3.1" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-002", timestamp: t(-120), eventType: "filing", title: "Complaint Filed — N.D. Cal.", summary: "Patent infringement complaint filed. Patents-in-suit: US 11,234,567; US 11,345,678; US 11,456,789; US 11,567,890.", privilegeLevel: "public", author: "S. Okafor", parties: ["NeuralTech Corporation", "Prometheus AI Inc."], documentRef: "ECF No. 1", hash: "sha256:d2e3f4a5b6c7..." },
      { id: "pc2", matterId: "M-2024-002", timestamp: t(-90), eventType: "order", title: "Scheduling Order Issued", summary: "Trial date set for 45 days out. Expert disclosure: 7 days. Pretrial: 28 days.", privilegeLevel: "public", author: "Hon. M. Chen", parties: ["NeuralTech Corporation", "Prometheus AI Inc."], documentRef: "ECF No. 47", hash: "sha256:e3f4a5b6c7d8..." },
      { id: "pc3", matterId: "M-2024-002", timestamp: t(-14), eventType: "expert-report", title: "Dr. Voss Preliminary Infringement Opinion", summary: "Preliminary technical opinion: high probability of literal infringement on claims 1, 4, 7. Doctrine of equivalents analysis pending.", privilegeLevel: "privileged", author: "Dr. Alan Voss", parties: ["NeuralTech Corporation"], hash: "sha256:f4a5b6c7d8e9...", redacted: false },
    ],
  },
  {
    id: "M-2024-003",
    name: "Citadel Financial — SEC Investigation",
    clientName: "Citadel Financial Holdings",
    matterNumber: "2024-REG-002",
    type: "regulatory",
    status: "escalated",
    privilegeLevel: "restricted",
    pressureScore: 96,
    complexityScore: 91,
    openedDate: d(-90),
    nextDeadline: d(2),
    nextDeadlineLabel: "Document Production Response",
    leadCounsel: "P. Rodriguez",
    jurisdiction: "Federal (SEC / SDNY)",
    estimatedExposure: 850_000_000,
    summary: "SEC Enforcement Division investigation into Citadel's dark pool trading practices. Civil investigative demand outstanding. Criminal referral risk elevated.",
    tags: ["SEC", "Regulatory", "Criminal Risk", "Escalated", "Dark Pool"],
    wall: {
      enabled: true,
      reason: "Firewall: Citadel trading desk vs. compliance function — privilege segregation required",
      blockedRoles: ["associate", "paralegal", "billing"],
      approvedUsers: ["partner", "gc"],
      createdAt: t(-85),
      createdBy: "p.rodriguez",
    },
    parties: [
      { id: "p1", name: "Citadel Financial Holdings", role: "client", counsel: "P. Rodriguez, K. Morrison" },
      { id: "p2", name: "SEC Enforcement Division", role: "regulator", jurisdiction: "Federal" },
      { id: "p3", name: "DOJ Criminal Division", role: "regulator", jurisdiction: "Federal" },
      { id: "p4", name: "C. Nakamura — Forensic Accountant", role: "expert" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-003", title: "Document Production Response", description: "Produce 45,000 documents in response to SEC subpoena. Privilege log required.", dueDate: d(2), status: "at-risk", assignee: "P. Rodriguez", dependencies: [], privilegeLevel: "restricted", filingRequired: true, consequence: "Contempt of subpoena — criminal exposure" },
      { id: "o2", matterId: "M-2024-003", title: "Privilege Log Compilation", description: "Prepare attorney-client privilege log for 3,200 withheld documents", dueDate: d(2), status: "in-progress", assignee: "K. Morrison", dependencies: [], privilegeLevel: "restricted", filingRequired: true, consequence: "Waiver of privilege if log not timely provided" },
      { id: "o3", matterId: "M-2024-003", title: "Wells Submission", description: "Respond to SEC Wells Notice with factual and legal defenses", dueDate: d(21), status: "pending", assignee: "P. Rodriguez", dependencies: ["o1", "o2"], privilegeLevel: "restricted", filingRequired: false },
      { id: "o4", matterId: "M-2024-003", title: "Board Audit Committee Briefing", description: "Privileged briefing to Citadel board audit committee on exposure assessment", dueDate: d(14), status: "pending", assignee: "P. Rodriguez", dependencies: ["o2"], privilegeLevel: "restricted", filingRequired: false },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-003", timestamp: t(-90), user: "p.rodriguez", role: "Partner", action: "accessed-wall", detail: "Firewall established per ethics counsel review", ip: "10.1.4.1" },
      { id: "a2", matterId: "M-2024-003", timestamp: t(-45), user: "k.morrison", role: "Partner", action: "edited", detail: "Document hold notice issued to Citadel trading desk", ip: "10.1.4.2" },
      { id: "a3", matterId: "M-2024-003", timestamp: t(-5), user: "j.gold", role: "Partner", action: "escalated", detail: "Matter escalated: DOJ parallel investigation confirmed", ip: "10.1.4.3" },
      { id: "a4", matterId: "M-2024-003", timestamp: t(-1), user: "p.rodriguez", role: "Partner", action: "privilege-changed", detail: "Production set reclassified — 847 documents downgraded from restricted to confidential", ip: "10.1.4.1" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-003", timestamp: t(-90), eventType: "communication", title: "SEC Formal Order of Investigation", summary: "Formal Order received. Scope: dark pool order routing, best execution obligations, 2022-2024.", privilegeLevel: "confidential", author: "SEC Enforcement", parties: ["Citadel Financial Holdings"], hash: "sha256:a1b2c3d4e5f6..." },
      { id: "pc2", matterId: "M-2024-003", timestamp: t(-60), eventType: "discovery", title: "Document Hold Notice Issued", summary: "Legal hold notice issued to 340 Citadel employees. Trading systems preserved.", privilegeLevel: "restricted", author: "K. Morrison", parties: ["Citadel Financial Holdings"], hash: "sha256:b2c3d4e5f6a7...", redacted: false },
      { id: "pc3", matterId: "M-2024-003", timestamp: t(-15), eventType: "communication", title: "DOJ Parallel Investigation Confirmed", summary: "[REDACTED — Restricted]", privilegeLevel: "restricted", author: "P. Rodriguez", parties: ["DOJ Criminal Division"], hash: "sha256:c3d4e5f6a7b8...", redacted: true },
    ],
  },
  {
    id: "M-2024-004",
    name: "Rosario v. TechGiant — Employment Class Action",
    clientName: "TechGiant Inc.",
    matterNumber: "2024-LIT-007",
    type: "employment",
    status: "active",
    privilegeLevel: "privileged",
    pressureScore: 71,
    complexityScore: 68,
    openedDate: d(-200),
    trialDate: d(180),
    nextDeadline: d(18),
    nextDeadlineLabel: "Class Certification Opposition",
    leadCounsel: "L. Tanaka",
    jurisdiction: "C.D. Cal. (Los Angeles)",
    estimatedExposure: 45_000_000,
    summary: "Class action alleging discriminatory pay practices affecting 2,400 female engineers. Class certification motion pending. Internal pay equity audit completed.",
    tags: ["Employment", "Class Action", "Pay Equity", "Title VII"],
    wall: {
      enabled: false,
      reason: "",
      blockedRoles: [],
      approvedUsers: [],
      createdAt: "",
      createdBy: "",
    },
    parties: [
      { id: "p1", name: "TechGiant Inc.", role: "client", counsel: "L. Tanaka, B. Osei" },
      { id: "p2", name: "Rosario et al. (Class Plaintiffs)", role: "opposing-counsel", counsel: "Outten & Golden LLP" },
      { id: "p3", name: "Hon. R. Yamamoto, USDC C.D. Cal.", role: "regulator" },
      { id: "p4", name: "Dr. E. Goldman — Compensation Expert", role: "expert" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-004", title: "Class Certification Opposition Brief", description: "File opposition to plaintiffs' motion for class certification", dueDate: d(18), status: "in-progress", assignee: "L. Tanaka", dependencies: [], privilegeLevel: "privileged", filingRequired: true, courtId: "2:24-cv-07234-RY" },
      { id: "o2", matterId: "M-2024-004", title: "Expert Declaration (Compensation)", description: "Dr. Goldman declaration opposing numerosity and commonality arguments", dueDate: d(15), status: "at-risk", assignee: "B. Osei", dependencies: [], privilegeLevel: "privileged", filingRequired: false },
      { id: "o3", matterId: "M-2024-004", title: "Deposition: 30(b)(6) HR Witness", description: "Defend corporate designee deposition on compensation practices", dueDate: d(30), status: "pending", assignee: "L. Tanaka", dependencies: ["o1"], privilegeLevel: "privileged", filingRequired: false },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-004", timestamp: t(-200), user: "l.tanaka", role: "Partner", action: "edited", detail: "Matter opened. Class action complaint filed.", ip: "10.1.5.1" },
      { id: "a2", matterId: "M-2024-004", timestamp: t(-30), user: "b.osei", role: "Associate", action: "edited", detail: "Internal pay equity audit report marked privileged", ip: "10.1.5.2" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-004", timestamp: t(-200), eventType: "filing", title: "Class Action Complaint Filed", summary: "Complaint alleges Title VII and EPA violations. Putative class: 2,400 female engineers. Damages: $45M+.", privilegeLevel: "public", author: "Outten & Golden LLP", parties: ["Rosario et al.", "TechGiant Inc."], documentRef: "ECF No. 1", hash: "sha256:d4e5f6a7b8c9..." },
      { id: "pc2", matterId: "M-2024-004", timestamp: t(-60), eventType: "expert-report", title: "Privileged Pay Equity Audit (Internal)", summary: "Pay equity regression analysis. Unexplained gender gap: 4.7% after controls. Scope: 2,400 employees, 2020-2023.", privilegeLevel: "privileged", author: "Dr. E. Goldman", parties: ["TechGiant Inc."], hash: "sha256:e5f6a7b8c9d0...", redacted: false },
      { id: "pc3", matterId: "M-2024-004", timestamp: t(-15), eventType: "hearing", title: "Class Cert Motion Filed by Plaintiffs", summary: "Plaintiffs moved for class certification. 28-day opposition window opened.", privilegeLevel: "public", author: "Outten & Golden LLP", parties: ["Rosario et al."], documentRef: "ECF No. 89", hash: "sha256:f6a7b8c9d0e1..." },
    ],
  },
  {
    id: "M-2024-005",
    name: "Orion Logistics — Supply Agreement Dispute",
    clientName: "Orion Logistics Group",
    matterNumber: "2024-ARB-003",
    type: "contract",
    status: "pending",
    privilegeLevel: "confidential",
    pressureScore: 52,
    complexityScore: 44,
    openedDate: d(-30),
    nextDeadline: d(25),
    nextDeadlineLabel: "Arbitration Demand Filing",
    leadCounsel: "A. Patel",
    jurisdiction: "AAA Commercial Arbitration (NY)",
    estimatedExposure: 18_500_000,
    summary: "Orion disputes exclusive supply agreement termination by Nordic Cold Chain AS. Seeking damages for lost profits and injunctive relief. Arbitration panel selection pending.",
    tags: ["Contract", "Arbitration", "Supply Chain", "International"],
    wall: {
      enabled: false,
      reason: "",
      blockedRoles: [],
      approvedUsers: [],
      createdAt: "",
      createdBy: "",
    },
    parties: [
      { id: "p1", name: "Orion Logistics Group", role: "client", counsel: "A. Patel" },
      { id: "p2", name: "Nordic Cold Chain AS", role: "opposing-counsel", counsel: "Clifford Chance LLP" },
      { id: "p3", name: "AAA Commercial Panel", role: "regulator" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-005", title: "Arbitration Demand Filing", description: "File AAA commercial arbitration demand with statement of claim", dueDate: d(25), status: "pending", assignee: "A. Patel", dependencies: [], privilegeLevel: "confidential", filingRequired: true, consequence: "Statute of limitations may bar claims after 90 days" },
      { id: "o2", matterId: "M-2024-005", title: "Arbitrator Selection (3-Panel)", description: "Submit ranked arbitrator preferences to AAA for 3-person panel", dueDate: d(35), status: "pending", assignee: "A. Patel", dependencies: ["o1"], privilegeLevel: "confidential", filingRequired: false },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-005", timestamp: t(-30), user: "a.patel", role: "Partner", action: "edited", detail: "Matter opened. Contract termination notice received.", ip: "10.1.6.1" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-005", timestamp: t(-45), eventType: "communication", title: "Termination Notice from Nordic Cold Chain", summary: "Nordic served 30-day termination notice citing Orion material breach — disputed. Contract value $18.5M.", privilegeLevel: "confidential", author: "Nordic Cold Chain AS", parties: ["Orion Logistics Group"], hash: "sha256:a7b8c9d0e1f2..." },
      { id: "pc2", matterId: "M-2024-005", timestamp: t(-30), eventType: "communication", title: "Orion Dispute Letter", summary: "Orion disputes breach characterization. Demands reinstatement or damages. Invokes arbitration clause (AAA Commercial Rules).", privilegeLevel: "confidential", author: "A. Patel", parties: ["Nordic Cold Chain AS"], hash: "sha256:b8c9d0e1f2a3..." },
    ],
  },
  {
    id: "M-2024-006",
    name: "Harborview Tower — Commercial Lease Closing",
    clientName: "Harborview Development LLC",
    matterNumber: "2024-RE-009",
    type: "real-estate",
    status: "active",
    privilegeLevel: "confidential",
    pressureScore: 43,
    complexityScore: 35,
    openedDate: d(-20),
    closingDate: d(30),
    nextDeadline: d(10),
    nextDeadlineLabel: "Title Commitment Review",
    leadCounsel: "D. Williams",
    jurisdiction: "New York State",
    estimatedExposure: 92_000_000,
    summary: "125,000 SF Class A office lease for Harborview Tower, Financial District. 15-year term. Tenant improvement allowance of $45M negotiated. Closing in 30 days.",
    tags: ["Real Estate", "Commercial Lease", "Title", "NYC"],
    wall: {
      enabled: false,
      reason: "",
      blockedRoles: [],
      approvedUsers: [],
      createdAt: "",
      createdBy: "",
    },
    parties: [
      { id: "p1", name: "Harborview Development LLC", role: "client", counsel: "D. Williams" },
      { id: "p2", name: "300 West Partners LP (Landlord)", role: "opposing-counsel", counsel: "Fried Frank Harris" },
      { id: "p3", name: "First Republic Title Co.", role: "third-party" },
    ],
    obligations: [
      { id: "o1", matterId: "M-2024-006", title: "Title Commitment Review", description: "Review title commitment and schedule of exceptions. Clear title objections.", dueDate: d(10), status: "in-progress", assignee: "D. Williams", dependencies: [], privilegeLevel: "confidential", filingRequired: false },
      { id: "o2", matterId: "M-2024-006", title: "Lease Agreement Final Execution", description: "Execution of 15-year commercial lease with all amendments", dueDate: d(25), status: "pending", assignee: "D. Williams", dependencies: ["o1"], privilegeLevel: "confidential", filingRequired: true },
      { id: "o3", matterId: "M-2024-006", title: "TI Allowance Escrow Setup", description: "Establish $45M tenant improvement escrow per lease terms", dueDate: d(30), status: "pending", assignee: "D. Williams", dependencies: ["o2"], privilegeLevel: "confidential", filingRequired: false },
    ],
    auditTrail: [
      { id: "a1", matterId: "M-2024-006", timestamp: t(-20), user: "d.williams", role: "Partner", action: "edited", detail: "Matter opened. LOI executed. Formal lease negotiation commenced.", ip: "10.1.7.1" },
      { id: "a2", matterId: "M-2024-006", timestamp: t(-5), user: "d.williams", role: "Partner", action: "edited", detail: "TI allowance increased to $45M following negotiation", ip: "10.1.7.1" },
    ],
    proofChain: [
      { id: "pc1", matterId: "M-2024-006", timestamp: t(-20), eventType: "communication", title: "Letter of Intent Executed", summary: "LOI for 125,000 SF, 15-year term, $85/SF base rent, $45M TI allowance. Non-binding except exclusivity period.", privilegeLevel: "confidential", author: "D. Williams", parties: ["Harborview Development LLC", "300 West Partners LP"], hash: "sha256:c9d0e1f2a3b4..." },
      { id: "pc2", matterId: "M-2024-006", timestamp: t(-3), eventType: "discovery", title: "Title Commitment Received", summary: "Commitment from First Republic Title. Schedule B exceptions: 3 restrictive covenants, 1 utility easement under review.", privilegeLevel: "confidential", author: "First Republic Title Co.", parties: ["Harborview Development LLC"], hash: "sha256:d0e1f2a3b4c5..." },
    ],
  },
];

export function getMatterById(id: string): Matter | undefined {
  return SEED_MATTERS.find((m) => m.id === id);
}

export function getPressureColor(score: number): string {
  if (score >= 90) return "#ef4444";
  if (score >= 70) return "#f97316";
  if (score >= 50) return "#eab308";
  return "#22c55e";
}

export function getPressureLabel(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function getStatusColor(status: MatterStatus): string {
  switch (status) {
    case "escalated": return "#ef4444";
    case "active": return "#a78bfa";
    case "pending": return "#eab308";
    case "on-hold": return "#6b7280";
    case "closed": return "#22c55e";
    default: return "#6b7280";
  }
}

export function getPrivilegeColor(level: PrivilegeLevel): string {
  switch (level) {
    case "restricted": return "#ef4444";
    case "privileged": return "#f97316";
    case "confidential": return "#eab308";
    case "public": return "#22c55e";
    default: return "#6b7280";
  }
}

export function getObligationStatusColor(status: ObligationStatus): string {
  switch (status) {
    case "overdue": return "#ef4444";
    case "at-risk": return "#f97316";
    case "in-progress": return "#a78bfa";
    case "pending": return "#6b7280";
    case "complete": return "#22c55e";
    default: return "#6b7280";
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDeadline(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d`;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
