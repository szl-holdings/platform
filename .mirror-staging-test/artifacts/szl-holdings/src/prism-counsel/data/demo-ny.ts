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
