export interface InsurerProfile {
  id: number;
  carrierName: string;
  region: string;
  avgResponseDays: number;
  avgOfferToSettlementRatio: number;
  denialRate: number;
  mediationWillingness: string;
  negotiationPosture: string;
  silenceWindowDays: number;
  verificationBehavior: string;
  tags: string[];
  notes: string;
  mattersHandled: number;
  lastUpdated: string;
}

export interface AdjusterProfile {
  id: number;
  name: string;
  carrier: string;
  region: string;
  avgResponseDays: number;
  communicationStyle: string;
  verificationTendency: string;
  offerPattern: string;
  mattersHandled: number;
  tags: string[];
  notes: string;
}

export interface VenueProfile {
  id: number;
  state: string;
  county: string;
  court: string;
  part: string;
  track: string;
  avgDaysToTrial: number;
  avgDaysToMediation: number;
  avgDaysNoteOfIssue: number;
  conferenceType: string;
  adrTendency: string;
  schedulingNotes: string;
  observedVelocity: string;
  staffingGuidance: string;
  escalationGuidance: string;
}

export interface NoFaultClaim {
  id: number;
  matterId: number;
  matterTitle: string;
  claimNumber: string;
  carrier: string;
  claimType: string;
  dateOfLoss: string;
  noticeDate: string;
  ackDeadline: string;
  ackStatus: string;
  verificationSent: boolean;
  verificationDeadline: string | null;
  payDenyDeadline: string;
  status: string;
  totalBilled: number;
  totalPaid: number;
  totalDenied: number;
  arbitrationRisk: string;
  pendingBills: number;
  notes: string;
}

export interface ClockRule {
  id: number;
  name: string;
  ruleRef: string;
  matterType: string;
  triggerEvent: string;
  durationDays: number;
  tollingApplies: boolean;
  description: string;
  escalationLadder: string[];
  nextAction: string;
}

export interface WatchlistItem {
  matterId: number;
  matterTitle: string;
  caseNumber: string;
  riskType: string;
  riskLevel: string;
  description: string;
  daysUntil: number | null;
  assignedTo: string;
  lastUpdated: string;
}

export interface DemandPacket {
  matterId: number;
  matterTitle: string;
  readinessScore: number;
  missingItems: string[];
  completedItems: string[];
  targetDate: string;
  status: string;
}

export interface CommunicationWindow {
  matterId: number;
  matterTitle: string;
  party: string;
  lastContact: string;
  daysSilent: number;
  expectedResponse: string;
  silenceRisk: string;
  recommendedAction: string;
}

export const INSURER_PROFILES: InsurerProfile[] = [
  {
    id: 1,
    carrierName: "National General Insurance",
    region: "Southeast / Mid-Atlantic",
    avgResponseDays: 18,
    avgOfferToSettlementRatio: 0.32,
    denialRate: 0.12,
    mediationWillingness: "moderate",
    negotiationPosture: "incremental — small increases over multiple rounds",
    silenceWindowDays: 22,
    verificationBehavior: "aggressive — requests multiple verifications before first offer",
    tags: ["slow_responder", "incremental_offers", "verification_heavy"],
    notes: "Pattern of delaying initial response, then issuing low initial offer. Tends to increase meaningfully only after demand packet is complete and mediation is scheduled.",
    mattersHandled: 14,
    lastUpdated: "2026-03-28",
  },
  {
    id: 2,
    carrierName: "Hartford Financial Services",
    region: "Northeast",
    avgResponseDays: 12,
    avgOfferToSettlementRatio: 0.28,
    denialRate: 0.08,
    mediationWillingness: "high",
    negotiationPosture: "professional — responds to strong demand packages",
    silenceWindowDays: 14,
    verificationBehavior: "standard — single verification round typical",
    tags: ["responsive", "mediation_friendly", "professional"],
    notes: "Generally responsive carrier. Engages meaningfully when demand packet is well-documented. Mediation conversion rate historically strong.",
    mattersHandled: 22,
    lastUpdated: "2026-03-15",
  },
  {
    id: 3,
    carrierName: "Atlantic Casualty Insurance Co.",
    region: "Northeast / Mid-Atlantic",
    avgResponseDays: 28,
    avgOfferToSettlementRatio: 0.18,
    denialRate: 0.35,
    mediationWillingness: "low",
    negotiationPosture: "adversarial — relies on exclusion arguments and delay",
    silenceWindowDays: 35,
    verificationBehavior: "extensive — broad verification requests, document subpoenas",
    tags: ["slow_responder", "high_denial", "adversarial", "exclusion_focused"],
    notes: "Known for aggressive use of pollution and mold exclusions. Long silence windows. Typically requires motion practice to move forward. Bad faith argument often viable.",
    mattersHandled: 8,
    lastUpdated: "2026-03-20",
  },
  {
    id: 4,
    carrierName: "GEICO",
    region: "National",
    avgResponseDays: 10,
    avgOfferToSettlementRatio: 0.25,
    denialRate: 0.15,
    mediationWillingness: "moderate",
    negotiationPosture: "formula-driven — relies on Colossus/internal valuation models",
    silenceWindowDays: 12,
    verificationBehavior: "moderate",
    tags: ["formula_driven", "fast_initial", "low_first_offer"],
    notes: "Quick initial response but first offers typically very low (formula-driven). Responds better to documented specials and strong medical narrative. IME scheduling common.",
    mattersHandled: 31,
    lastUpdated: "2026-04-01",
  },
  {
    id: 5,
    carrierName: "State Farm",
    region: "National",
    avgResponseDays: 14,
    avgOfferToSettlementRatio: 0.30,
    denialRate: 0.10,
    mediationWillingness: "high",
    negotiationPosture: "methodical — structured negotiation with defined authority levels",
    silenceWindowDays: 16,
    verificationBehavior: "standard",
    tags: ["methodical", "authority_levels", "mediation_friendly"],
    notes: "Structured negotiation process. Adjusters have defined authority levels — larger offers require supervisor approval. Generally fair when documentation is complete.",
    mattersHandled: 27,
    lastUpdated: "2026-03-22",
  },
];

export const ADJUSTER_PROFILES: AdjusterProfile[] = [
  {
    id: 1,
    name: "Karen Mitchell",
    carrier: "National General Insurance",
    region: "South Florida",
    avgResponseDays: 21,
    communicationStyle: "Formal, minimal disclosure",
    verificationTendency: "High — sends multiple verification requests before engaging",
    offerPattern: "Low initial, slow increments, responds to scheduled mediation",
    mattersHandled: 6,
    tags: ["slow_responder", "verification_heavy"],
    notes: "Tends to delay beyond standard response windows. Pattern of requesting additional verifications when demand is near-ready.",
  },
  {
    id: 2,
    name: "Steven Torres",
    carrier: "Hartford Financial Services",
    region: "Northern NJ / NYC Metro",
    avgResponseDays: 10,
    communicationStyle: "Professional, direct",
    verificationTendency: "Standard",
    offerPattern: "Reasonable initial, negotiates in 2-3 rounds, authority up to $500K",
    mattersHandled: 9,
    tags: ["responsive", "professional", "authority_limited"],
    notes: "Generally cooperative adjuster. Clear about authority limits. Will escalate to supervisor for amounts above $500K.",
  },
  {
    id: 3,
    name: "Patricia Alvarez",
    carrier: "Atlantic Casualty Insurance Co.",
    region: "NYC / Westchester",
    avgResponseDays: 32,
    communicationStyle: "Adversarial, legalistic",
    verificationTendency: "Extensive — outside counsel involvement early",
    offerPattern: "Denial-first, no offer without motion practice",
    mattersHandled: 4,
    tags: ["adversarial", "denial_first", "outside_counsel_early"],
    notes: "Involves outside counsel within first 30 days. Communications are legalistic and designed to create adverse record. Bad faith pattern possible.",
  },
];

export const VENUE_PROFILES: VenueProfile[] = [
  {
    id: 1,
    state: "New York",
    county: "New York County",
    court: "Supreme Court of the State of New York",
    part: "Part 10 — Commercial Division",
    track: "Standard",
    avgDaysToTrial: 540,
    avgDaysToMediation: 180,
    avgDaysNoteOfIssue: 365,
    conferenceType: "Preliminary + Compliance + Pre-trial",
    adrTendency: "Court-encouraged mediation",
    schedulingNotes: "Heavy caseload. Compliance conferences every 90 days. Note of issue typically filed at 12 months.",
    observedVelocity: "moderate",
    staffingGuidance: "Senior associate or partner for conferences. Full trial team by note of issue.",
    escalationGuidance: "Motion practice common — budget for summary judgment briefing.",
  },
  {
    id: 2,
    state: "New York",
    county: "Kings County",
    court: "Supreme Court — Kings County",
    part: "Part 15 — Tort",
    track: "Standard",
    avgDaysToTrial: 720,
    avgDaysToMediation: 240,
    avgDaysNoteOfIssue: 420,
    conferenceType: "Preliminary + Compliance + Settlement",
    adrTendency: "Settlement conferences mandatory",
    schedulingNotes: "Slower docket. Settlement conferences are substantive — judges actively push resolution. Trial dates frequently adjourned.",
    observedVelocity: "slow",
    staffingGuidance: "Paralegal-led through discovery. Attorney for settlement conferences.",
    escalationGuidance: "Trial adjournments common — plan for extended timeline.",
  },
  {
    id: 3,
    state: "New York",
    county: "Bronx County",
    court: "Supreme Court — Bronx County",
    part: "Part 22 — Tort",
    track: "Expedited (under $150K)",
    avgDaysToTrial: 480,
    avgDaysToMediation: 150,
    avgDaysNoteOfIssue: 300,
    conferenceType: "Preliminary + Pre-trial + Jury Selection",
    adrTendency: "High mediation referral rate",
    schedulingNotes: "Plaintiff-friendly venue. Cases move relatively quickly. Jury selection pools tend to be sympathetic to injury plaintiffs.",
    observedVelocity: "fast",
    staffingGuidance: "Senior team from filing. Trial readiness required earlier than other boroughs.",
    escalationGuidance: "Prepare for trial — this venue goes to verdict more often than Manhattan.",
  },
  {
    id: 4,
    state: "New York",
    county: "Nassau County",
    court: "Supreme Court — Nassau County",
    part: "IAS Part 12",
    track: "Standard",
    avgDaysToTrial: 600,
    avgDaysToMediation: 200,
    avgDaysNoteOfIssue: 380,
    conferenceType: "Preliminary + Compliance + Certification",
    adrTendency: "Private mediation common",
    schedulingNotes: "Moderate pace. Private mediation before note of issue is common. Well-organized judicial part system.",
    observedVelocity: "moderate",
    staffingGuidance: "Standard staffing. Junior associates can handle compliance conferences.",
    escalationGuidance: "Standard motion practice timeline. Summary judgment fully briefed before trial.",
  },
  {
    id: 5,
    state: "Florida",
    county: "Miami-Dade County",
    court: "11th Judicial Circuit Court",
    part: "Civil Division",
    track: "Complex Litigation",
    avgDaysToTrial: 450,
    avgDaysToMediation: 120,
    avgDaysNoteOfIssue: 270,
    conferenceType: "Case Management + Pre-trial",
    adrTendency: "Mandatory mediation before trial",
    schedulingNotes: "Florida mandates mediation. Cases move quickly once discovery closes. Expert disclosure deadlines strictly enforced.",
    observedVelocity: "fast",
    staffingGuidance: "Full team from discovery. Expert retention early.",
    escalationGuidance: "Expert deadlines are hard — no extensions without extraordinary circumstances.",
  },
  {
    id: 6,
    state: "New Jersey",
    county: "Bergen County",
    court: "Superior Court of New Jersey",
    part: "Law Division — Civil",
    track: "Standard Track III",
    avgDaysToTrial: 660,
    avgDaysToMediation: 210,
    avgDaysNoteOfIssue: 450,
    conferenceType: "CMC + Arbitration + Trial",
    adrTendency: "Non-binding arbitration for cases under $150K",
    schedulingNotes: "Track III allows 450 days to trial. Non-binding arbitration is common first step. Cases above $150K go directly to mediation.",
    observedVelocity: "moderate",
    staffingGuidance: "Paralegal-heavy through discovery. Attorney for arbitration and mediation.",
    escalationGuidance: "Arbitration awards are de novo — plan for trial if arbitration result is unfavorable.",
  },
];

export const NO_FAULT_CLAIMS: NoFaultClaim[] = [
  {
    id: 1,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    claimNumber: "NF-2025-04821-A",
    carrier: "National General Insurance",
    claimType: "no_fault_pip",
    dateOfLoss: "2025-03-22",
    noticeDate: "2025-03-25",
    ackDeadline: "2025-04-09",
    ackStatus: "acknowledged_late",
    verificationSent: true,
    verificationDeadline: "2025-04-24",
    payDenyDeadline: "2025-05-25",
    status: "partial_payment",
    totalBilled: 47600,
    totalPaid: 28400,
    totalDenied: 8200,
    arbitrationRisk: "medium",
    pendingBills: 4,
    notes: "Initial PIP claim acknowledged 2 days late. Carrier requested verification within standard window. Partial payment received — denied PT sessions after 24 visits citing peer review.",
  },
  {
    id: 2,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    claimNumber: "NF-2025-04821-B",
    carrier: "State Farm (client policy)",
    claimType: "supplemental_um",
    dateOfLoss: "2025-03-22",
    noticeDate: "2025-04-01",
    ackDeadline: "2025-04-15",
    ackStatus: "acknowledged",
    verificationSent: false,
    verificationDeadline: null,
    payDenyDeadline: "2025-05-01",
    status: "open",
    totalBilled: 0,
    totalPaid: 0,
    totalDenied: 0,
    arbitrationRisk: "low",
    pendingBills: 0,
    notes: "UM/SUM claim opened under client's own State Farm policy. No bills submitted yet — awaiting exhaustion of primary PIP benefits.",
  },
];

export const CLOCK_RULES: ClockRule[] = [
  {
    id: 1,
    name: "PIP Claim Acknowledgement",
    ruleRef: "11 NYCRR § 65-3.2(a)",
    matterType: "auto_injury",
    triggerEvent: "Receipt of completed application (NF-2)",
    durationDays: 15,
    tollingApplies: false,
    description: "Insurer must acknowledge receipt of no-fault claim within 15 business days of receiving completed application for benefits.",
    escalationLadder: ["Flag at 10 days", "Alert attorney at 13 days", "Document late ack for bad faith at 16 days"],
    nextAction: "Verify acknowledgement received and document response date",
  },
  {
    id: 2,
    name: "Verification Request Window",
    ruleRef: "11 NYCRR § 65-3.5(b)",
    matterType: "auto_injury",
    triggerEvent: "Receipt of proof of claim",
    durationDays: 15,
    tollingApplies: true,
    description: "Insurer may request additional verification within 15 business days of receiving proof of claim. Clock tolling applies during verification period.",
    escalationLadder: ["Track verification request date", "Monitor response deadline", "Flag if verification is duplicative"],
    nextAction: "Respond to verification request within deadline to restart pay/deny clock",
  },
  {
    id: 3,
    name: "Pay or Deny Decision",
    ruleRef: "11 NYCRR § 65-3.8(a)(1)",
    matterType: "auto_injury",
    triggerEvent: "Receipt of verification or expiration of verification period",
    durationDays: 30,
    tollingApplies: false,
    description: "Insurer must pay or deny claim within 30 calendar days of receipt of requested verification or expiration of verification request period.",
    escalationLadder: ["Monitor at 20 days", "Alert at 25 days", "Interest accrual notice at 31 days", "Bad faith documentation at 45 days"],
    nextAction: "If no response by day 30, document for interest accrual and potential bad faith",
  },
  {
    id: 4,
    name: "Arbitration Demand Filing",
    ruleRef: "11 NYCRR § 65-4.2",
    matterType: "auto_injury",
    triggerEvent: "Receipt of denial or partial denial",
    durationDays: 0,
    tollingApplies: false,
    description: "Arbitration may be demanded by the applicant or the applicant's assignee at any time after denial. No strict deadline, but timely filing preserves evidence and witness availability.",
    escalationLadder: ["Evaluate within 30 days of denial", "File within 90 days recommended"],
    nextAction: "Evaluate whether arbitration is the best recovery path vs. litigation",
  },
  {
    id: 5,
    name: "Medical Bill Submission",
    ruleRef: "11 NYCRR § 65-3.3",
    matterType: "auto_injury",
    triggerEvent: "Date of service",
    durationDays: 45,
    tollingApplies: false,
    description: "Medical providers must submit bills within 45 days of service date. Late submissions may be denied as untimely.",
    escalationLadder: ["Track at date of service", "Alert provider at 30 days", "Escalate to attorney if provider misses window"],
    nextAction: "Verify all provider bills are submitted within 45-day window",
  },
  {
    id: 6,
    name: "Lost Wage Claim Documentation",
    ruleRef: "11 NYCRR § 65-3.1",
    matterType: "auto_injury",
    triggerEvent: "Date disability certified by physician",
    durationDays: 90,
    tollingApplies: false,
    description: "Lost wage claims require NF-6 form (employer verification) and physician disability certification. Must be submitted within reasonable time to preserve claim.",
    escalationLadder: ["Obtain NF-6 within 14 days", "Submit within 30 days", "Follow up if no response at 45 days"],
    nextAction: "Confirm employer cooperation and physician disability certification",
  },
  {
    id: 7,
    name: "Statute of Limitations — Personal Injury",
    ruleRef: "CPLR § 214(5)",
    matterType: "auto_injury",
    triggerEvent: "Date of accident",
    durationDays: 1095,
    tollingApplies: true,
    description: "Three-year statute of limitations for personal injury claims in New York. Tolling may apply for infancy, insanity, or other statutory grounds.",
    escalationLadder: ["Calendar at intake", "Review at 18 months", "Filing deadline prep at 24 months", "Critical alert at 30 months"],
    nextAction: "Calendar SOL date and set progressive review milestones",
  },
  {
    id: 8,
    name: "Notice of Claim — Municipal",
    ruleRef: "GML § 50-e",
    matterType: "premises_liability",
    triggerEvent: "Date of incident",
    durationDays: 90,
    tollingApplies: true,
    description: "Notice of claim must be served on municipal entity within 90 days of incident. Late notice requires leave of court within 1 year + 90 days.",
    escalationLadder: ["Calendar immediately at intake", "Draft within 30 days", "File within 60 days", "Critical — no extensions after 90 days (absent court leave)"],
    nextAction: "Determine if municipal entity is involved and calendar notice of claim deadline",
  },
];

export const WATCHLIST_ITEMS: WatchlistItem[] = [
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    riskType: "deadline_breach",
    riskLevel: "high",
    description: "Expert disclosure deadline in 27 days — expert report not yet drafted",
    daysUntil: 27,
    assignedTo: "Sarah Chen",
    lastUpdated: "2026-04-01",
  },
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    riskType: "demand_readiness",
    riskLevel: "high",
    description: "Demand packet 78% complete — missing wage verification and life care plan",
    daysUntil: null,
    assignedTo: "Marcus Williams",
    lastUpdated: "2026-03-30",
  },
  {
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    riskType: "evidence_gap",
    riskLevel: "critical",
    description: "Surveillance footage request unanswered — motion to compel may be required",
    daysUntil: null,
    assignedTo: "Sarah Chen",
    lastUpdated: "2026-03-28",
  },
  {
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    riskType: "deadline_breach",
    riskLevel: "high",
    description: "Expert report due in 7 days — biomechanical expert not yet retained",
    daysUntil: 7,
    assignedTo: "Sarah Chen",
    lastUpdated: "2026-04-02",
  },
  {
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    riskType: "insurer_silence",
    riskLevel: "medium",
    description: "Atlantic Casualty — 42 days since last substantive communication",
    daysUntil: null,
    assignedTo: "James Whitfield",
    lastUpdated: "2026-03-25",
  },
  {
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    riskType: "strategy",
    riskLevel: "high",
    description: "Summary judgment deadline in 59 days — bad faith argument brief not started",
    daysUntil: 59,
    assignedTo: "James Whitfield",
    lastUpdated: "2026-04-01",
  },
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    riskType: "no_fault_clock",
    riskLevel: "medium",
    description: "4 pending no-fault bills — 2 approaching 45-day submission window",
    daysUntil: 12,
    assignedTo: "Marcus Williams",
    lastUpdated: "2026-04-02",
  },
];

export const DEMAND_PACKETS: DemandPacket[] = [
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    readinessScore: 78,
    missingItems: [
      "Final medical narrative from Dr. Patel",
      "Wage verification letter from employer",
      "Future medical life care plan estimate",
      "Updated lien summary with negotiated amounts",
    ],
    completedItems: [
      "Liability statement with police report",
      "Medical chronology — 10 events documented",
      "Medical bills — $47,600 verified",
      "Lost wage calculation — $38,400",
      "Pain and suffering narrative draft",
      "Insurance policy summaries",
      "Photos and scene documentation",
    ],
    targetDate: "2026-05-15",
    status: "in_progress",
  },
  {
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    readinessScore: 52,
    missingItems: [
      "Surveillance footage from mall",
      "Biomechanical expert report",
      "Updated medical records post-surgery",
      "Future medical cost projection",
      "Lost wage documentation — employer verification",
      "Incident report from mall management",
    ],
    completedItems: [
      "Medical records — surgery documented",
      "Initial medical bills — $78,500",
      "Liability analysis — premises duty",
      "Photos of incident location",
    ],
    targetDate: "2026-04-25",
    status: "blocked",
  },
];

export const COMMUNICATION_WINDOWS: CommunicationWindow[] = [
  {
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    party: "Karen Mitchell (National General)",
    lastContact: "2026-03-05",
    daysSilent: 29,
    expectedResponse: "Response to IME scheduling confirmation",
    silenceRisk: "medium",
    recommendedAction: "Send follow-up email with copy to supervisor",
  },
  {
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    party: "Steven Torres (Hartford)",
    lastContact: "2026-03-20",
    daysSilent: 14,
    expectedResponse: "Response to settlement demand",
    silenceRisk: "low",
    recommendedAction: "Within expected response window — monitor",
  },
  {
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    party: "Patricia Alvarez (Atlantic Casualty)",
    lastContact: "2026-02-20",
    daysSilent: 42,
    expectedResponse: "Response to discovery requests",
    silenceRisk: "high",
    recommendedAction: "Draft motion to compel — 42-day silence exceeds pattern threshold",
  },
  {
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    party: "Hargrove & Associates (Outside Counsel)",
    lastContact: "2026-03-10",
    daysSilent: 24,
    expectedResponse: "Document production scheduling",
    silenceRisk: "medium",
    recommendedAction: "Follow up on document production timeline",
  },
];

// ─── NY Matter Data ─────────────────────────────────────────────────────────

export interface NyMatterClock {
  type: string;
  label: string;
  startedAt: string;
  deadlineAt: string;
  daysRemaining: number;
  status: "running" | "breached" | "met" | "tolled";
  ruleRef: string;
}

export interface NyNoFaultClaim {
  claimant: string;
  carrier: string;
  dateOfLoss: string;
  noticeSentAt: string;
  noticeStatus: "timely" | "late" | "disputed" | "pending";
  billStatus: string;
  totalBilled: number;
  totalPaid: number;
  totalDenied: number;
  arbitrationStatus: string;
  evidenceLockRisk: number;
}

export interface NyVerificationRequest {
  type: string;
  requestedBy: string;
  requestedAt: string;
  dueDate: string;
  status: string;
  suspensionTrigger: boolean;
}

export interface NyDenial {
  type: string;
  deniedBy: string;
  deniedAt: string;
  reason: string;
  amountDenied: number;
  appealStatus: string;
}

export interface NyDisclaimer {
  issuedBy: string;
  issuedAt: string;
  daysFromLoss: number;
  isTimely: boolean;
  basis: string;
  vulnerabilityScore: number;
  challengeStatus: string;
}

export interface NyOfferMovement {
  offerType: string;
  amount: number;
  offeringParty: string;
  offeredAt: string;
  deltaFromPrevious?: number;
  deltaPct?: number;
  movementSignal: string;
}

export interface NyReserveMovement {
  carrierId?: string;
  carrierName: string;
  reserveAmount: number;
  priorReserve?: number;
  delta?: number;
  reserveDate: string;
  movementType: string;
  inferredSignal: string;
}

export interface NyMediationEvent {
  mediatorName: string;
  scheduledAt: string;
  sessionType: string;
  status: string;
  preReadinessScore: number;
  conversionProbability: number;
  openingDemand?: number;
  openingOffer?: number;
  outcome?: string;
}

export interface NyCommunicationWindow {
  partyName: string;
  partyRole: string;
  lastContactAt: string;
  daysSilent: number;
  silenceRisk: "none" | "low" | "medium" | "high" | "critical";
  outstandingItems: string[];
  escalationStatus: string;
}

export interface NyForecast {
  type: string;
  label: string;
  score: number;
  confidence: number;
  weeklyDelta: number;
  nextBestAction: string;
  drivers: Array<{ name: string; impact: "positive" | "negative" | "neutral"; explanation: string }>;
}

export interface NyDemandPacket {
  version: number;
  status: string;
  demandAmount: number;
  readinessScore: number;
  missingItems: string[];
  includedItems: string[];
}

export interface NyInsurerProfile {
  carrierName: string;
  claimOffice: string;
  reservingStyle: string;
  denialPattern: string;
  averageResponseDays: number;
  mediationBehavior: string;
  litigationTolerance: string;
}

export interface NyVenueProfile {
  county: string;
  courtName: string;
  averageCycleMonths: number;
  plaintiffFriendliness: string;
  velocityScore: number;
  typicalPart: string;
  adrAvailability: string;
}

export interface NyMatter {
  id: number;
  title: string;
  caseNumber: string;
  matterType: string;
  status: string;
  jurisdiction: string;
  county: string;
  courtName: string;
  part: string;
  assignedAttorney: string;
  assignedParalegal: string;
  filingDate: string;
  statOfLimitations: string;
  healthScore: number;
  settlementLow: number;
  settlementHigh: number;
  settlementMid: number;
  totalDamages: number;
  totalLiens: number;
  nyTags: string[];
  clocks: NyMatterClock[];
  noFaultClaims: NyNoFaultClaim[];
  verificationRequests: NyVerificationRequest[];
  denials: NyDenial[];
  disclaimers: NyDisclaimer[];
  offerMovements: NyOfferMovement[];
  reserveMovements: NyReserveMovement[];
  mediationEvents: NyMediationEvent[];
  communicationWindows: NyCommunicationWindow[];
  forecasts: NyForecast[];
  demandPacket: NyDemandPacket | null;
  insurerProfile: NyInsurerProfile;
  venueProfile: NyVenueProfile;
  readinessScores: Record<string, number>;
  deadlineBreach: { score: number; label: string };
}

export const NY_DEMO_MATTERS: NyMatter[] = [
  {
    id: 101,
    title: "Vasquez v. Progressive Insurance (NY Auto / No-Fault)",
    caseNumber: "2025-NY-CV-00419",
    matterType: "auto_no_fault",
    status: "discovery",
    jurisdiction: "Queens County, NY",
    county: "Queens",
    courtName: "Supreme Court, Queens County",
    part: "Part 36",
    assignedAttorney: "Michael Reyes",
    assignedParalegal: "Amanda Torres",
    filingDate: "2025-09-10",
    statOfLimitations: "2028-07-22",
    healthScore: 64,
    settlementLow: 95000,
    settlementHigh: 220000,
    settlementMid: 157500,
    totalDamages: 198400,
    totalLiens: 34800,
    nyTags: ["No-Fault", "Notice Clock", "Bill Arbitration Risk", "Offer Movement", "EUO Pending"],
    clocks: [
      {
        type: "no_fault_notice",
        label: "No-Fault Notice of Claim",
        startedAt: "2025-07-22",
        deadlineAt: "2025-09-20",
        daysRemaining: 0,
        status: "met",
        ruleRef: "11 NYCRR § 65-3.3",
      },
      {
        type: "no_fault_verification",
        label: "EUO Verification Window",
        startedAt: "2025-10-15",
        deadlineAt: "2026-04-15",
        daysRemaining: 12,
        status: "running",
        ruleRef: "11 NYCRR § 65-3.5",
      },
      {
        type: "no_fault_arbitration",
        label: "Bill Arbitration Deadline (Bill #3)",
        startedAt: "2025-12-01",
        deadlineAt: "2026-05-01",
        daysRemaining: 28,
        status: "running",
        ruleRef: "11 NYCRR § 65-4.2",
      },
      {
        type: "sol_tolling",
        label: "Statute of Limitations — Bodily Injury",
        startedAt: "2025-07-22",
        deadlineAt: "2028-07-22",
        daysRemaining: 841,
        status: "running",
        ruleRef: "CPLR § 214",
      },
    ],
    noFaultClaims: [
      {
        claimant: "Carlos Vasquez",
        carrier: "Progressive Insurance",
        dateOfLoss: "2025-07-22",
        noticeSentAt: "2025-08-10",
        noticeStatus: "timely",
        billStatus: "partial",
        totalBilled: 82400,
        totalPaid: 41200,
        totalDenied: 22600,
        arbitrationStatus: "pending",
        evidenceLockRisk: 72,
      },
    ],
    verificationRequests: [
      {
        type: "euo",
        requestedBy: "Progressive Insurance",
        requestedAt: "2025-10-15",
        dueDate: "2026-04-15",
        status: "scheduled",
        suspensionTrigger: true,
      },
      {
        type: "imc",
        requestedBy: "Progressive Insurance",
        requestedAt: "2025-11-20",
        dueDate: "2026-02-20",
        status: "completed",
        suspensionTrigger: false,
      },
    ],
    denials: [
      {
        type: "no_fault_bill",
        deniedBy: "Progressive Insurance",
        deniedAt: "2025-11-14",
        reason: "IME finding — treatment not causally related after visit #8",
        amountDenied: 14800,
        appealStatus: "filed",
      },
      {
        type: "no_fault_bill",
        deniedBy: "Progressive Insurance",
        deniedAt: "2025-12-22",
        reason: "Peer review — excessive frequency of treatment",
        amountDenied: 7800,
        appealStatus: "not_appealed",
      },
    ],
    disclaimers: [],
    offerMovements: [
      {
        offerType: "insurer_offer",
        amount: 35000,
        offeringParty: "Progressive Insurance",
        offeredAt: "2025-11-01",
        movementSignal: "opening",
      },
      {
        offerType: "plaintiff_demand",
        amount: 195000,
        offeringParty: "Plaintiff",
        offeredAt: "2026-01-15",
        movementSignal: "opening",
      },
      {
        offerType: "insurer_offer",
        amount: 72000,
        offeringParty: "Progressive Insurance",
        offeredAt: "2026-02-28",
        deltaFromPrevious: 37000,
        deltaPct: 105.7,
        movementSignal: "approaching",
      },
    ],
    reserveMovements: [
      {
        carrierName: "Progressive Insurance",
        reserveAmount: 125000,
        priorReserve: 85000,
        delta: 40000,
        reserveDate: "2026-01-20",
        movementType: "increase",
        inferredSignal: "Carrier acknowledging higher exposure — positive settlement signal",
      },
    ],
    mediationEvents: [
      {
        mediatorName: "Hon. Sandra Bloom (Ret.)",
        scheduledAt: "2026-06-15",
        sessionType: "court_ordered",
        status: "scheduled",
        preReadinessScore: 61,
        conversionProbability: 0.58,
        openingDemand: 195000,
        openingOffer: 72000,
      },
    ],
    communicationWindows: [
      {
        partyName: "Progressive Insurance (Adjuster: Mark Soto)",
        partyRole: "insurer",
        lastContactAt: "2026-02-28",
        daysSilent: 34,
        silenceRisk: "medium",
        outstandingItems: ["Response to counter-demand", "EUO transcript delivery"],
        escalationStatus: "sent",
      },
    ],
    forecasts: [
      {
        type: "deadline_breach_risk",
        label: "Deadline Breach Risk",
        score: 68,
        confidence: 0.81,
        weeklyDelta: 3.2,
        nextBestAction: "Complete EUO scheduling confirmation within 72 hours to avoid clock breach",
        drivers: [
          { name: "EUO window expiration", impact: "negative", explanation: "12 days remaining on verification window; non-compliance triggers coverage suspension" },
          { name: "Bill arbitration deadline", impact: "negative", explanation: "Bill #3 arbitration must be filed within 28 days or claim forfeited" },
          { name: "SOL safety margin", impact: "positive", explanation: "SOL over 800 days out — no near-term SOL risk" },
        ],
      },
      {
        type: "no_fault_evidence_lock_risk",
        label: "No-Fault Evidence-Lock Risk",
        score: 72,
        confidence: 0.77,
        weeklyDelta: 1.8,
        nextBestAction: "File arbitration for denied bills before deadline; obtain certified IME rebuttal from treating physician",
        drivers: [
          { name: "Dual denial on record", impact: "negative", explanation: "Two IME/peer review denials limit recoverable no-fault amount" },
          { name: "EUO suspension risk", impact: "negative", explanation: "Failure to appear at EUO triggers mandatory suspension of no-fault benefits" },
          { name: "Notice timely filed", impact: "positive", explanation: "Notice sent within 30-day window — no late notice exposure" },
        ],
      },
      {
        type: "demand_readiness_score",
        label: "Demand Readiness Score",
        score: 61,
        confidence: 0.85,
        weeklyDelta: 2.1,
        nextBestAction: "Obtain life care plan estimate and final medical narrative before finalizing demand",
        drivers: [
          { name: "Medical chronology complete", impact: "positive", explanation: "All treatment events documented through Q1 2026" },
          { name: "Missing life care plan", impact: "negative", explanation: "Future damages not supported without expert life care plan" },
          { name: "IME rebuttal outstanding", impact: "negative", explanation: "Treating physician has not submitted formal rebuttal to defense IME" },
        ],
      },
      {
        type: "offer_movement_forecast",
        label: "Offer Movement Forecast",
        score: 74,
        confidence: 0.72,
        weeklyDelta: 1.5,
        nextBestAction: "Issue 30-day response deadline on counter-demand; silence past that point triggers escalation",
        drivers: [
          { name: "105% reserve increase", impact: "positive", explanation: "Reserve movement from $85K to $125K signals carrier acknowledging higher exposure" },
          { name: "Counter offer velocity", impact: "positive", explanation: "Insurer moved $37K in single response — atypical for Progressive at this case stage" },
          { name: "EUO leverage", impact: "negative", explanation: "Carrier may stall pending EUO outcome before next significant move" },
        ],
      },
      {
        type: "mediation_conversion_probability",
        label: "Mediation Conversion Probability",
        score: 58,
        confidence: 0.68,
        weeklyDelta: 0.8,
        nextBestAction: "Improve pre-mediation readiness score to 75+ before June mediation session",
        drivers: [
          { name: "Strong offer velocity", impact: "positive", explanation: "Positive movement over 3 offers suggests willingness to resolve" },
          { name: "Gap between positions", impact: "negative", explanation: "$123K gap between demand and last offer remains substantial" },
          { name: "EUO pending", impact: "negative", explanation: "Carrier may want EUO outcome before committing to mediation posture" },
        ],
      },
      {
        type: "venue_velocity_forecast",
        label: "Venue / Part Velocity Forecast",
        score: 62,
        confidence: 0.74,
        weeklyDelta: 0.0,
        nextBestAction: "Confirm Part 36 assignment and review judge's conference schedule to align preparation timeline",
        drivers: [
          { name: "Queens Part 36 — moderate velocity", impact: "neutral", explanation: "Average cycle time 28–34 months in this part" },
          { name: "IMC / discovery pending", impact: "negative", explanation: "Discovery compliance outstanding could delay track assignment" },
          { name: "Court order mediation", impact: "positive", explanation: "Part 36 typically orders mediation at 18-month mark — aligns with June schedule" },
        ],
      },
      {
        type: "ai_defensibility_score",
        label: "AI Defensibility Score",
        score: 88,
        confidence: 0.92,
        weeklyDelta: 0.0,
        nextBestAction: "Complete pending AI review approval for demand packet draft",
        drivers: [
          { name: "Full audit trail", impact: "positive", explanation: "All AI outputs logged with source citations and actor attribution" },
          { name: "Human approval gates active", impact: "positive", explanation: "Demand send requires partner approval — gate is configured" },
          { name: "1 pending AI review packet", impact: "negative", explanation: "Demand packet AI draft is not yet reviewed — creates governance gap if sent" },
        ],
      },
    ],
    demandPacket: {
      version: 2,
      status: "review",
      demandAmount: 195000,
      readinessScore: 61,
      missingItems: ["Life care plan estimate", "IME rebuttal letter", "Final wage documentation (Nov–Dec)"],
      includedItems: ["Medical chronology (10 providers)", "ER/hospital records", "MRI reports", "PT records", "Pain management records", "Past medical specials ($82,400)", "Lost wage calculation", "Photographs of injuries", "Police report"],
    },
    insurerProfile: {
      carrierName: "Progressive Insurance",
      claimOffice: "Long Island City, NY",
      reservingStyle: "conservative",
      denialPattern: "IME / peer review denials at 60–90 days of treatment; no-fault suspension on EUO non-compliance",
      averageResponseDays: 21,
      mediationBehavior: "strategic",
      litigationTolerance: "moderate",
    },
    venueProfile: {
      county: "Queens",
      courtName: "Supreme Court, Queens County",
      averageCycleMonths: 31,
      plaintiffFriendliness: "moderate",
      velocityScore: 62,
      typicalPart: "Part 36",
      adrAvailability: "mandatory",
    },
    readinessScores: {
      posture: 67,
      readiness: 61,
      integrity: 79,
      strategy: 68,
      money: 58,
      governance: 91,
    },
    deadlineBreach: { score: 68, label: "Medium-High" },
  },

  {
    id: 102,
    title: "Okafor v. Starbucks Corp. (NY Premises / Bodily Injury)",
    caseNumber: "2025-NY-CV-02817",
    matterType: "premises_liability",
    status: "pre_trial",
    jurisdiction: "Bronx County, NY",
    county: "Bronx",
    courtName: "Supreme Court, Bronx County",
    part: "Part 18",
    assignedAttorney: "Sarah Chen",
    assignedParalegal: "Lisa Park",
    filingDate: "2025-05-12",
    statOfLimitations: "2028-01-09",
    healthScore: 57,
    settlementLow: 180000,
    settlementHigh: 480000,
    settlementMid: 330000,
    totalDamages: 412800,
    totalLiens: 67500,
    nyTags: ["Bronx Premium", "Lien Exposure", "Mediation Window", "Insurer Silence", "Demand Gap"],
    clocks: [
      {
        type: "sol_tolling",
        label: "Statute of Limitations — Bodily Injury",
        startedAt: "2025-01-09",
        deadlineAt: "2028-01-09",
        daysRemaining: 646,
        status: "running",
        ruleRef: "CPLR § 214",
      },
      {
        type: "discovery_clock",
        label: "Discovery Compliance Deadline",
        startedAt: "2025-10-01",
        deadlineAt: "2026-07-01",
        daysRemaining: 89,
        status: "running",
        ruleRef: "CPLR § 3101",
      },
    ],
    noFaultClaims: [],
    verificationRequests: [],
    denials: [],
    disclaimers: [],
    offerMovements: [
      {
        offerType: "insurer_offer",
        amount: 40000,
        offeringParty: "AIG / Chartis",
        offeredAt: "2025-11-15",
        movementSignal: "opening",
      },
      {
        offerType: "plaintiff_demand",
        amount: 600000,
        offeringParty: "Plaintiff",
        offeredAt: "2025-12-01",
        movementSignal: "opening",
      },
    ],
    reserveMovements: [
      {
        carrierName: "AIG / Chartis",
        reserveAmount: 200000,
        reserveDate: "2026-01-10",
        movementType: "set",
        inferredSignal: "Reserve at $200K — significant gap from $600K demand",
      },
    ],
    mediationEvents: [
      {
        mediatorName: "TBD (JAMS Panel)",
        scheduledAt: "2026-08-20",
        sessionType: "court_ordered",
        status: "pending",
        preReadinessScore: 54,
        conversionProbability: 0.47,
        openingDemand: 600000,
        openingOffer: 40000,
      },
    ],
    communicationWindows: [
      {
        partyName: "AIG / Chartis (Adjuster: Jennifer Walton)",
        partyRole: "insurer",
        lastContactAt: "2026-01-22",
        daysSilent: 71,
        silenceRisk: "critical",
        outstandingItems: [
          "Response to demand letter (Dec 1, 2025)",
          "Medical records acknowledgment",
          "Reserve position disclosure request",
          "IME scheduling",
        ],
        escalationStatus: "escalated",
      },
      {
        partyName: "Defense Counsel: Gregory Holt, Esq.",
        partyRole: "opposing_counsel",
        lastContactAt: "2026-02-15",
        daysSilent: 47,
        silenceRisk: "high",
        outstandingItems: ["Document production response", "Deposition scheduling"],
        escalationStatus: "sent",
      },
    ],
    forecasts: [
      {
        type: "deadline_breach_risk",
        label: "Deadline Breach Risk",
        score: 54,
        confidence: 0.78,
        weeklyDelta: 1.1,
        nextBestAction: "File motion to compel on overdue document production before July discovery deadline",
        drivers: [
          { name: "Discovery deadline 89 days", impact: "negative", explanation: "Document production still outstanding — risk of non-compliance sanction" },
          { name: "SOL safe margin", impact: "positive", explanation: "SOL remains 646 days away — no near-term risk" },
          { name: "No no-fault clocks", impact: "positive", explanation: "Premises matter has no no-fault timing obligations" },
        ],
      },
      {
        type: "demand_readiness_score",
        label: "Demand Readiness Score",
        score: 54,
        confidence: 0.82,
        weeklyDelta: -0.5,
        nextBestAction: "Retain biomechanical expert and complete gap analysis before finalizing demand",
        drivers: [
          { name: "Expert not retained", impact: "negative", explanation: "No biomechanical expert on record — liability gap in contested fall case" },
          { name: "Lien exposure unresolved", impact: "negative", explanation: "$67.5K in asserted liens — Medicaid lien not yet negotiated" },
          { name: "Strong medical chronology", impact: "positive", explanation: "Surgery + rehab records complete through current date" },
        ],
      },
      {
        type: "offer_movement_forecast",
        label: "Offer Movement Forecast",
        score: 32,
        confidence: 0.61,
        weeklyDelta: -1.2,
        nextBestAction: "Issue formal insurer silence escalation letter; demand response within 10 business days",
        drivers: [
          { name: "71-day insurer silence", impact: "negative", explanation: "AIG has not responded to demand — stall pattern emerging" },
          { name: "Large demand-offer gap", impact: "negative", explanation: "15x gap between $40K offer and $600K demand" },
          { name: "Reserve below demand", impact: "negative", explanation: "$200K reserve suggests carrier not yet evaluating at full exposure" },
        ],
      },
      {
        type: "mediation_conversion_probability",
        label: "Mediation Conversion Probability",
        score: 47,
        confidence: 0.65,
        weeklyDelta: -0.9,
        nextBestAction: "Achieve demand readiness of 70+ and close lien gaps before August mediation window",
        drivers: [
          { name: "Bronx venue premium", impact: "positive", explanation: "Bronx jury pool commands significant plaintiff verdicts — carrier motivation to settle" },
          { name: "Large gap", impact: "negative", explanation: "Without expert evidence, demand not fully supported" },
          { name: "Insurer silence pattern", impact: "negative", explanation: "Delay behavior suggests carrier is not yet in resolution mode" },
        ],
      },
      {
        type: "venue_velocity_forecast",
        label: "Venue / Part Velocity Forecast",
        score: 55,
        confidence: 0.73,
        weeklyDelta: 0.0,
        nextBestAction: "Confirm Part 18 Bronx assignment; prepare for intensive pre-trial conference schedule",
        drivers: [
          { name: "Bronx Part 18 — high jury exposure", impact: "positive", explanation: "Plaintiff-friendly venue with above-average verdicts in BI matters" },
          { name: "Moderate velocity", impact: "neutral", explanation: "Average cycle 32–36 months in Bronx Supreme" },
          { name: "Discovery compliance risk", impact: "negative", explanation: "Outstanding production delays track assignment" },
        ],
      },
      {
        type: "ai_defensibility_score",
        label: "AI Defensibility Score",
        score: 83,
        confidence: 0.91,
        weeklyDelta: 0.0,
        nextBestAction: "Approve pending chronology AI review packet to complete governance chain",
        drivers: [
          { name: "All communications logged", impact: "positive", explanation: "Insurer silence documented with timestamps" },
          { name: "Demand requires approval", impact: "positive", explanation: "Approval gate confirmed before demand send" },
          { name: "2 open AI review packets", impact: "negative", explanation: "Chronology and expert retention memo drafts not yet approved" },
        ],
      },
    ],
    demandPacket: {
      version: 1,
      status: "draft",
      demandAmount: 600000,
      readinessScore: 54,
      missingItems: ["Biomechanical expert report", "Medicaid lien resolution", "Future medical life care plan", "Wage loss documentation (post-surgery)"],
      includedItems: ["Surgery records (Dr. Kim)", "PT records (Summit PT)", "ER records (Valley Hospital)", "Medical specials ($78,500)", "Incident report", "Photographs"],
    },
    insurerProfile: {
      carrierName: "AIG / Chartis",
      claimOffice: "New York Metro",
      reservingStyle: "conservative",
      denialPattern: "Early low-ball offer; silent on demands; escalate IME at discovery stage",
      averageResponseDays: 45,
      mediationBehavior: "resistant",
      litigationTolerance: "high",
    },
    venueProfile: {
      county: "Bronx",
      courtName: "Supreme Court, Bronx County",
      averageCycleMonths: 34,
      plaintiffFriendliness: "very_high",
      velocityScore: 55,
      typicalPart: "Part 18",
      adrAvailability: "available",
    },
    readinessScores: {
      posture: 62,
      readiness: 54,
      integrity: 73,
      strategy: 51,
      money: 47,
      governance: 87,
    },
    deadlineBreach: { score: 54, label: "Moderate" },
  },

  {
    id: 103,
    title: "Kensington Realty v. Travelers (NY Coverage Dispute)",
    caseNumber: "2025-NY-CV-08834",
    matterType: "insurance_coverage",
    status: "discovery",
    jurisdiction: "New York County, NY",
    county: "New York",
    courtName: "Supreme Court, New York County",
    part: "Commercial Division, Part IAS-6",
    assignedAttorney: "James Whitfield",
    assignedParalegal: "Marcus Williams",
    filingDate: "2025-07-28",
    statOfLimitations: "2029-04-15",
    healthScore: 69,
    settlementLow: 680000,
    settlementHigh: 2100000,
    settlementMid: 1390000,
    totalDamages: 3200000,
    totalLiens: 0,
    nyTags: ["Disclaimer Dispute", "Commercial Division", "Venue Velocity", "Strategic Action Queue", "Bad Faith Exposure"],
    clocks: [
      {
        type: "disclaimer_timeliness",
        label: "Disclaimer Timeliness Challenge",
        startedAt: "2025-04-15",
        deadlineAt: "2025-05-30",
        daysRemaining: 0,
        status: "breached",
        ruleRef: "Insurance Law § 3420(d)(2)",
      },
      {
        type: "discovery_clock",
        label: "Commercial Division Discovery Schedule",
        startedAt: "2025-10-01",
        deadlineAt: "2026-09-01",
        daysRemaining: 151,
        status: "running",
        ruleRef: "Commercial Division Rule 11",
      },
    ],
    noFaultClaims: [],
    verificationRequests: [],
    denials: [],
    disclaimers: [
      {
        issuedBy: "Travelers Insurance",
        issuedAt: "2025-05-15",
        daysFromLoss: 30,
        isTimely: false,
        basis: "Pollution exclusion endorsement — alleged soil contamination from prior tenant",
        vulnerabilityScore: 84,
        challengeStatus: "challenged",
      },
    ],
    offerMovements: [],
    reserveMovements: [],
    mediationEvents: [
      {
        mediatorName: "TBD (Commercial Division ADR Panel)",
        scheduledAt: "2026-11-10",
        sessionType: "court_ordered",
        status: "pending",
        preReadinessScore: 71,
        conversionProbability: 0.63,
      },
    ],
    communicationWindows: [
      {
        partyName: "Travelers Insurance (Coverage Counsel: Thomas Hatch, Esq.)",
        partyRole: "opposing_counsel",
        lastContactAt: "2026-03-01",
        daysSilent: 33,
        silenceRisk: "medium",
        outstandingItems: ["Response to coverage argument memorandum", "Underwriting file production"],
        escalationStatus: "sent",
      },
    ],
    forecasts: [
      {
        type: "disclaimer_vulnerability_score",
        label: "Disclaimer Vulnerability Score",
        score: 84,
        confidence: 0.88,
        weeklyDelta: 0.0,
        nextBestAction: "File motion to void disclaimer — Ins. Law § 3420(d)(2) requires timely disclaimer; 30-day issue date is untimely",
        drivers: [
          { name: "Disclaimer issued 30 days post-loss", impact: "negative", explanation: "NY Ins. Law § 3420(d)(2) requires disclaimer as soon as reasonably possible — 30 days is presumptively untimely" },
          { name: "Pollution exclusion ambiguity", impact: "negative", explanation: "Exclusion language does not clearly cover contamination from prior occupant's operations" },
          { name: "No reservation of rights", impact: "negative", explanation: "Carrier did not issue ROR prior to disclaimer — potential waiver argument" },
        ],
      },
      {
        type: "deadline_breach_risk",
        label: "Deadline Breach Risk",
        score: 38,
        confidence: 0.84,
        weeklyDelta: 0.5,
        nextBestAction: "Monitor Commercial Division discovery schedule; calendar all expert exchange deadlines",
        drivers: [
          { name: "Discovery 151 days out", impact: "positive", explanation: "Adequate runway on discovery deadline" },
          { name: "SOL years away", impact: "positive", explanation: "SOL runs to 2029 — no near-term risk" },
          { name: "Disclaimer clock already breached", impact: "negative", explanation: "This clock is favorable to plaintiff — breach strengthens challenge argument" },
        ],
      },
      {
        type: "demand_readiness_score",
        label: "Demand Readiness Score",
        score: 71,
        confidence: 0.83,
        weeklyDelta: 1.2,
        nextBestAction: "Complete underwriting file review and finalize coverage analysis memo before demand issuance",
        drivers: [
          { name: "Strong disclaimer challenge theory", impact: "positive", explanation: "Untimely disclaimer + ambiguous exclusion = strong coverage position" },
          { name: "Underwriting file pending", impact: "negative", explanation: "Carrier has not produced underwriting file — critical for bad faith argument" },
          { name: "Damages well-documented", impact: "positive", explanation: "Remediation costs verified at $1.45M with contractor invoices" },
        ],
      },
      {
        type: "offer_movement_forecast",
        label: "Offer Movement Forecast",
        score: 45,
        confidence: 0.59,
        weeklyDelta: 0.0,
        nextBestAction: "Issue pre-mediation settlement demand; leverage disclaimer vulnerability score in negotiations",
        drivers: [
          { name: "No offers on record", impact: "negative", explanation: "Carrier has not made any settlement offer — in full denial posture" },
          { name: "Bad faith exposure escalating", impact: "positive", explanation: "Continued coverage denial after untimely disclaimer creates bad faith damages exposure" },
          { name: "Commercial Division trajectory", impact: "neutral", explanation: "Commercial matters typically see offers emerge post-discovery" },
        ],
      },
      {
        type: "mediation_conversion_probability",
        label: "Mediation Conversion Probability",
        score: 63,
        confidence: 0.71,
        weeklyDelta: 0.8,
        nextBestAction: "Use disclaimer vulnerability as leverage in pre-mediation demand — carrier has bad faith exposure at trial",
        drivers: [
          { name: "Bad faith exposure", impact: "positive", explanation: "Untimely disclaimer + continued denial creates significant trial risk for carrier" },
          { name: "High policy limits", impact: "positive", explanation: "$5M policy — carrier has room to settle well above remediation costs" },
          { name: "No current offers", impact: "negative", explanation: "Parties haven't entered negotiation phase yet" },
        ],
      },
      {
        type: "venue_velocity_forecast",
        label: "Venue / Part Velocity Forecast",
        score: 71,
        confidence: 0.79,
        weeklyDelta: 0.0,
        nextBestAction: "Leverage Commercial Division speed — file for summary judgment on disclaimer timeliness at discovery close",
        drivers: [
          { name: "Commercial Division — expedited", impact: "positive", explanation: "NY Commercial Division has strict scheduling with fewer delays than civil parts" },
          { name: "Complex coverage case", impact: "neutral", explanation: "Expert witnesses and underwriting file complexity may add 3–6 months" },
          { name: "NY County plaintiff-favorable", impact: "positive", explanation: "NY County juries return high verdicts in bad faith coverage disputes" },
        ],
      },
      {
        type: "ai_defensibility_score",
        label: "AI Defensibility Score",
        score: 91,
        confidence: 0.94,
        weeklyDelta: 0.0,
        nextBestAction: "Approve coverage analysis AI memo through partner review before filing",
        drivers: [
          { name: "All outputs reviewed", impact: "positive", explanation: "Coverage analysis memo has pending partner review — process is active" },
          { name: "Full source grounding", impact: "positive", explanation: "All AI citations link to actual policy language and case law references" },
          { name: "Privilege controls active", impact: "positive", explanation: "Strategy memos flagged as privileged — not included in any export packages" },
        ],
      },
    ],
    demandPacket: null,
    insurerProfile: {
      carrierName: "Travelers Insurance",
      claimOffice: "Hartford, CT (NY Claims Unit)",
      reservingStyle: "aggressive",
      denialPattern: "Immediate disclaimer on commercial claims; pollution exclusion frequently invoked; underwriting file production delayed",
      averageResponseDays: 35,
      mediationBehavior: "strategic",
      litigationTolerance: "high",
    },
    venueProfile: {
      county: "New York",
      courtName: "Supreme Court, New York County — Commercial Division",
      averageCycleMonths: 24,
      plaintiffFriendliness: "high",
      velocityScore: 71,
      typicalPart: "IAS Part 6 (Commercial)",
      adrAvailability: "mandatory",
    },
    readinessScores: {
      posture: 74,
      readiness: 71,
      integrity: 86,
      strategy: 68,
      money: 65,
      governance: 93,
    },
    deadlineBreach: { score: 38, label: "Low" },
  },
];

export const NY_SIGNAL_FAMILIES = [
  {
    id: "claim_clock",
    label: "Claim Clock",
    description: "No-fault notice windows, verification request timelines, disclaimer timeliness, and SOL tracking",
    signals: ["no_fault_notice", "euo_window", "verification_response", "disclaimer_date", "sol_status"],
  },
  {
    id: "coverage_denial",
    label: "Coverage / Denial",
    description: "Disclaimer vulnerability, coverage position, denial pattern analysis, and appeal status tracking",
    signals: ["disclaimer_timeliness", "coverage_position", "denial_pattern", "appeal_status", "bad_faith_exposure"],
  },
  {
    id: "matter_execution",
    label: "Matter Execution",
    description: "Discovery compliance, deposition readiness, expert retention, and playbook completion tracking",
    signals: ["discovery_status", "deposition_readiness", "expert_retention", "playbook_progress", "filing_compliance"],
  },
  {
    id: "damages_medical",
    label: "Damages / Medical",
    description: "Medical chronology integrity, lien exposure, damages completeness, and future damages support",
    signals: ["medical_chronology", "lien_exposure", "damages_completeness", "future_damages", "imr_outcomes"],
  },
  {
    id: "insurer_negotiation",
    label: "Insurer / Negotiation",
    description: "Reserve movements, offer velocity, insurer silence patterns, and negotiation behavior scoring",
    signals: ["reserve_movement", "offer_velocity", "communication_silence", "adjuster_behavior", "mediation_readiness"],
  },
  {
    id: "ai_governance",
    label: "AI / Governance",
    description: "AI defensibility scoring, approval gate compliance, source grounding, and privilege controls",
    signals: ["defensibility_score", "approval_compliance", "source_grounding", "privilege_integrity", "audit_completeness"],
  },
];

export const NY_PLAYBOOKS = [
  {
    id: "pb_001",
    title: "First Notice to Demand Readiness",
    description: "End-to-end NY insurance litigation workflow from first notice of claim through a complete, defensible demand package.",
    estimatedWeeks: 26,
    requiredArtifacts: [
      "No-fault notice of claim (within 30 days of loss)",
      "Police / incident report",
      "ER and hospital records",
      "All treating provider records",
      "Medical bill summary",
      "Wage verification letter",
      "Photographs (injury + scene)",
      "Narrative medical report from treating physician",
    ],
    responsibleRole: "Paralegal (artifacts); Attorney (strategy + review)",
    approvalCheckpoint: "Partner approval required before demand send",
    fallbackPath: "If demand readiness score < 70, escalate missing items to attorney with 48-hour resolution window",
    auditOutput: "Demand readiness snapshot, artifact completion log, approval record",
    steps: [
      { label: "File no-fault notice within 30-day window", done: true, blocker: false },
      { label: "Collect incident documentation and police report", done: true, blocker: false },
      { label: "Open claim with carrier — record adjuster assignment", done: true, blocker: false },
      { label: "Initiate medical treatment monitoring", done: true, blocker: false },
      { label: "Complete bill submission and track payment cycle", done: false, blocker: false },
      { label: "Respond to verification requests (EUO / IMC)", done: false, blocker: true },
      { label: "Obtain all medical records and narrative reports", done: false, blocker: false },
      { label: "Compile damages summary — specials + general", done: false, blocker: false },
      { label: "Compute demand readiness score", done: false, blocker: false },
      { label: "Partner review and demand approval", done: false, blocker: false },
    ],
  },
  {
    id: "pb_002",
    title: "No-Fault Arbitration Prep",
    description: "Prepare and file arbitration for denied no-fault bills, including evidence assembly and AAA filing.",
    estimatedWeeks: 8,
    requiredArtifacts: [
      "Certified billing records",
      "Denial letters (all denied bills)",
      "IME / peer review reports",
      "Treating physician rebuttal letter",
      "AAA arbitration demand form",
      "Medical necessity documentation",
    ],
    responsibleRole: "Paralegal (filing); Attorney (strategy review)",
    approvalCheckpoint: "Attorney review of arbitration demand before AAA submission",
    fallbackPath: "If arbitration deadline within 14 days and packet incomplete — emergency escalation to partner",
    auditOutput: "Arbitration filing receipt, exhibit log, hearing outcome record",
    steps: [
      { label: "Identify all denied bills and denial basis", done: true, blocker: false },
      { label: "Obtain certified copies of billing records", done: true, blocker: false },
      { label: "Secure IME rebuttal from treating physician", done: false, blocker: true },
      { label: "Assemble AAA arbitration demand package", done: false, blocker: false },
      { label: "Attorney review of demand package", done: false, blocker: false },
      { label: "File with AAA before deadline", done: false, blocker: false },
      { label: "Calendar hearing date and prep witnesses", done: false, blocker: false },
    ],
  },
  {
    id: "pb_003",
    title: "Denied-Bill / Proof of Claim Assembly",
    description: "Assemble defensible proof-of-claim for denied no-fault bills, resolving evidentiary gaps and preparing for dispute.",
    estimatedWeeks: 4,
    requiredArtifacts: [
      "Original claim submission (NF-3 / NF-6)",
      "Denial letters with specific codes",
      "Treatment records supporting medical necessity",
      "Assignment of benefits documentation",
      "Prescriptions and referrals",
    ],
    responsibleRole: "Paralegal (assembly); Attorney (review + sign-off)",
    approvalCheckpoint: "Attorney review before filing any opposition",
    fallbackPath: "If proof of claim insufficient — request additional records from treating provider within 5 business days",
    auditOutput: "Proof of claim checklist, submission log, attorney sign-off record",
    steps: [
      { label: "Pull denial letters and identify denial codes", done: true, blocker: false },
      { label: "Request missing records from providers", done: false, blocker: false },
      { label: "Compile medical necessity narrative", done: false, blocker: false },
      { label: "Cross-check AOB documentation", done: false, blocker: false },
      { label: "Attorney sign-off on proof of claim", done: false, blocker: false },
    ],
  },
  {
    id: "pb_004",
    title: "Demand Package Escalation",
    description: "Escalation workflow when insurer has not responded to demand letter within the response window.",
    estimatedWeeks: 2,
    requiredArtifacts: [
      "Original demand letter with proof of delivery",
      "Insurer silence log (dates + contact attempts)",
      "Communication window tracker export",
      "Escalation letter draft",
    ],
    responsibleRole: "Paralegal (monitoring); Attorney (escalation letter)",
    approvalCheckpoint: "Partner approval required for any public or court-filed escalation",
    fallbackPath: "If no response after escalation letter — file motion to compel within 10 business days",
    auditOutput: "Communication window log, escalation letter record, motion filing confirmation",
    steps: [
      { label: "Confirm demand delivery and response window", done: true, blocker: false },
      { label: "Log silence with timestamps", done: true, blocker: false },
      { label: "Draft escalation letter", done: false, blocker: false },
      { label: "Partner review and approval", done: false, blocker: false },
      { label: "Send escalation and record delivery", done: false, blocker: false },
      { label: "Evaluate motion to compel if no response", done: false, blocker: false },
    ],
  },
  {
    id: "pb_005",
    title: "Insurer Silence Escalation",
    description: "Formal escalation procedure when insurer communication window exceeds threshold silence days.",
    estimatedWeeks: 1,
    requiredArtifacts: [
      "Communication log with last contact timestamp",
      "Outstanding items checklist",
      "Formal silence escalation letter",
    ],
    responsibleRole: "Attorney (leads escalation); Paralegal (documentation)",
    approvalCheckpoint: "Partner notification required if silence exceeds 60 days",
    fallbackPath: "File motion to compel / bad faith letter if silence continues past 14 days after escalation",
    auditOutput: "Silence log export, escalation letter record, partner notification confirmation",
    steps: [
      { label: "Flag silence risk in communication tracker", done: true, blocker: false },
      { label: "Confirm outstanding items with insurer", done: false, blocker: false },
      { label: "Issue formal silence escalation letter", done: false, blocker: false },
      { label: "Notify partner if 60-day threshold met", done: false, blocker: false },
      { label: "Evaluate bad faith / motion options", done: false, blocker: false },
    ],
  },
  {
    id: "pb_006",
    title: "Mediation Readiness Sprint",
    description: "4–6 week sprint to achieve mediation readiness score of 75+ before scheduled NY mediation session.",
    estimatedWeeks: 6,
    requiredArtifacts: [
      "Updated demand readiness score",
      "Lien resolution status",
      "Expert report (if applicable)",
      "Mediation brief (privileged)",
      "Opening demand and authority confirmation",
      "Client preparation checklist",
    ],
    responsibleRole: "Attorney (strategy + client prep); Paralegal (artifact assembly)",
    approvalCheckpoint: "Partner review of mediation brief; authority confirmation before session",
    fallbackPath: "If readiness score < 70 at T-7 days — escalate specific gaps to attorney with daily check-in",
    auditOutput: "Mediation readiness snapshot, brief approval record, authority confirmation log",
    steps: [
      { label: "Compute pre-mediation readiness score", done: true, blocker: false },
      { label: "Identify and resolve lien gaps", done: false, blocker: false },
      { label: "Obtain any outstanding expert reports", done: false, blocker: false },
      { label: "Draft privileged mediation brief", done: false, blocker: false },
      { label: "Confirm client authority and expectations", done: false, blocker: false },
      { label: "Partner review of brief and authority", done: false, blocker: false },
      { label: "Attend mediation with complete package", done: false, blocker: false },
    ],
  },
  {
    id: "pb_007",
    title: "Discovery Gap Closure Sprint",
    description: "Focused sprint to close discovery compliance gaps before cutoff — including outstanding production, depositions, and expert disclosure.",
    estimatedWeeks: 4,
    requiredArtifacts: [
      "Discovery compliance checklist",
      "Outstanding requests log",
      "Expert disclosure drafts",
      "Deposition transcript summaries",
    ],
    responsibleRole: "Paralegal (tracking); Attorney (compliance + motions)",
    approvalCheckpoint: "Attorney sign-off on all discovery responses before service",
    fallbackPath: "Motion to extend discovery deadline if production cannot be completed — must file before cutoff",
    auditOutput: "Discovery compliance log, production confirmation receipts, extension motion (if filed)",
    steps: [
      { label: "Run discovery compliance audit", done: true, blocker: false },
      { label: "Identify all outstanding items", done: true, blocker: false },
      { label: "Issue supplemental requests if needed", done: false, blocker: false },
      { label: "Complete expert disclosure", done: false, blocker: false },
      { label: "Calendar all remaining depositions", done: false, blocker: false },
      { label: "File for extension if needed", done: false, blocker: false },
    ],
  },
  {
    id: "pb_008",
    title: "Deposition Prep Sprint",
    description: "Client and witness preparation sprint for upcoming depositions, including document review and prep sessions.",
    estimatedWeeks: 3,
    requiredArtifacts: [
      "All prior medical records",
      "Wage and employment records",
      "Prior statements and pleadings",
      "Photograph exhibits",
      "Deposition prep memo (privileged)",
    ],
    responsibleRole: "Attorney (leads prep sessions); Paralegal (document assembly)",
    approvalCheckpoint: "Attorney review of all documents to be used before prep session",
    fallbackPath: "Request adjournment if critical documents unavailable — preserve record of adjournment request",
    auditOutput: "Prep session log, document review checklist, witness readiness assessment",
    steps: [
      { label: "Assemble all deposition documents", done: true, blocker: false },
      { label: "Draft privileged deposition prep memo", done: false, blocker: false },
      { label: "Schedule prep session with client / witness", done: false, blocker: false },
      { label: "Conduct prep session", done: false, blocker: false },
      { label: "Review exhibits for deposition", done: false, blocker: false },
      { label: "Final readiness check", done: false, blocker: false },
    ],
  },
  {
    id: "pb_009",
    title: "Coverage Dispute Issue Spotting",
    description: "Systematic issue spotting for NY coverage disputes — disclaimer timeliness, exclusion analysis, reservation of rights, bad faith triggers.",
    estimatedWeeks: 2,
    requiredArtifacts: [
      "Policy with all endorsements",
      "Disclaimer letter",
      "Reservation of rights letter (if any)",
      "Claim correspondence log",
      "Coverage analysis memo (privileged)",
    ],
    responsibleRole: "Attorney (analysis); Paralegal (document assembly)",
    approvalCheckpoint: "Partner review of coverage analysis memo before any coverage-related filing",
    fallbackPath: "If disclaimer untimely — immediately flag for § 3420(d)(2) challenge; engage coverage counsel if needed",
    auditOutput: "Coverage analysis memo, disclaimer timeliness assessment, issue matrix",
    steps: [
      { label: "Obtain complete policy with endorsements", done: true, blocker: false },
      { label: "Analyze disclaimer letter and timeliness", done: true, blocker: false },
      { label: "Review ROR letter (if applicable)", done: true, blocker: false },
      { label: "Draft coverage analysis memo", done: false, blocker: false },
      { label: "Identify bad faith triggers", done: false, blocker: false },
      { label: "Partner review", done: false, blocker: false },
      { label: "Issue coverage challenge or demand", done: false, blocker: false },
    ],
  },
  {
    id: "pb_010",
    title: "AI Review / Verification / Approval",
    description: "Governed workflow for AI-generated content — grounding verification, human review, and partner approval before any use or disclosure.",
    estimatedWeeks: 1,
    requiredArtifacts: [
      "AI-generated draft document",
      "Source grounding report",
      "Flagged assertions list",
      "Reviewer sign-off form",
      "Approval record",
    ],
    responsibleRole: "Attorney (reviewer); Paralegal (flagged assertion resolution)",
    approvalCheckpoint: "Attorney review required for all AI outputs; Partner approval required before external use",
    fallbackPath: "If grounding score < 70 — return to AI for revision with additional source context before human review",
    auditOutput: "Review completion log, assertion resolution record, approval chain with timestamps",
    steps: [
      { label: "Generate AI draft with source grounding", done: true, blocker: false },
      { label: "Run grounding score check", done: true, blocker: false },
      { label: "Flag all low-confidence assertions", done: true, blocker: false },
      { label: "Attorney reviews flagged assertions", done: false, blocker: true },
      { label: "Paralegal resolves flagged items", done: false, blocker: false },
      { label: "Partner approval for external use", done: false, blocker: false },
      { label: "Log approval and archive AI packet", done: false, blocker: false },
    ],
  },
];
