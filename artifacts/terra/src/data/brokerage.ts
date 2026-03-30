export interface Agent {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  team: string;
  teamId: string;
  role: "agent" | "team-lead" | "coordinator" | "broker";
  activeListings: number;
  activeDeals: number;
  closingsThisMonth: number;
  commissionMTD: number;
  avgDaysToClose: number;
  conversionRate: number;
  leadsAssigned: number;
  stalledDeals: number;
  pipelineValue: number;
  joinDate: string;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  members: string[];
  region: string;
  specialization: string;
  activeListings: number;
  activeDeals: number;
  pipelineValue: number;
  closingsThisMonth: number;
  commissionMTD: number;
  conversionRate: number;
}

export interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  pricePerSqft: number;
  sqft: number;
  beds: number;
  baths: number;
  type: "single-family" | "condo" | "multi-family" | "commercial" | "land" | "townhouse";
  status: "active" | "pending" | "under-contract" | "sold" | "expired" | "withdrawn";
  dom: number;
  agentId: string;
  agentName: string;
  teamId: string;
  listDate: string;
  photos: number;
  description: string;
  riskLevel: "low" | "medium" | "high";
  riskFlags: string[];
  buyerActivity: number;
  showings: number;
  priceReductions: number;
  originalPrice: number;
  offerCount: number;
  documents: { name: string; status: "complete" | "missing" | "pending" }[];
  lat: number;
  lng: number;
  yearBuilt: number;
  lotSize: number;
  hoa?: number;
  taxes: number;
  propertyId?: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stage: "new" | "engaged" | "nurtured" | "hot" | "inactive" | "converted";
  source: "referral" | "website" | "zillow" | "realtor" | "open-house" | "social" | "cold-call" | "past-client";
  type: "buyer" | "seller" | "both";
  budget?: { min: number; max: number };
  desiredAreas: string[];
  agentId: string;
  agentName: string;
  assignedDate: string;
  lastContact: string;
  nextFollowUp: string;
  score: number;
  engagementCount: number;
  messagesCount: number;
  tasksComplete: number;
  tasksPending: number;
  conversionProbability: number;
  notes: string;
  timeline: { date: string; event: string; type: "contact" | "showing" | "offer" | "note" | "task" }[];
  tags: string[];
  preApproved: boolean;
  preApprovalAmount?: number;
  propertyInterests: string[];
}

export type DealStage =
  | "lead"
  | "qualified"
  | "showing"
  | "offer-drafted"
  | "offer-submitted"
  | "negotiation"
  | "accepted"
  | "attorney-review"
  | "inspection"
  | "financing"
  | "appraisal"
  | "under-contract"
  | "clear-to-close"
  | "closed"
  | "lost-stalled";

export interface BrokerageDeal {
  id: string;
  listingId?: string;
  address: string;
  city: string;
  state: string;
  type: "buy-side" | "sell-side" | "dual";
  stage: DealStage;
  price: number;
  commission: number;
  commissionRate: number;
  agentId: string;
  agentName: string;
  teamId: string;
  clientId: string;
  clientName: string;
  closeDate: string;
  estimatedCloseDate: string;
  probability: number;
  daysInStage: number;
  totalDays: number;
  bottleneckFlag: boolean;
  bottleneckReason?: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  nextAction: string;
  nextActionOwner: string;
  nextActionDue: string;
  notes: string;
  dealHealthScore: number;
  isStalled: boolean;
  stalledReason?: string;
  hasUrgentIssue: boolean;
  urgentIssue?: string;
  created: string;
  lastUpdated: string;
}

export interface Offer {
  id: string;
  dealId?: string;
  listingId: string;
  listingAddress: string;
  buyerName: string;
  agentName: string;
  agentId: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "rejected" | "countered" | "expired" | "withdrawn";
  price: number;
  listPrice: number;
  earnestMoney: number;
  downPayment: number;
  financingType: "conventional" | "fha" | "va" | "cash" | "arm";
  contingencies: { type: string; days: number; waived: boolean }[];
  inspectionDays: number;
  closingDate: string;
  expiresAt: string;
  submittedAt: string;
  closeConfidence: number;
  financingStrength: "strong" | "moderate" | "weak";
  notes: string;
  counterHistory: { date: string; from: string; price: number; terms: string }[];
  brokerApprovalRequired: boolean;
  brokerApproved: boolean;
  brokerApprovedBy?: string;
  recommendation: string;
}

export interface TransactionStep {
  id: string;
  label: string;
  owner: string;
  ownerId: string;
  dueDate: string;
  completedDate?: string;
  status: "pending" | "in-progress" | "complete" | "overdue" | "blocked";
  dependencies: string[];
  linkedDocuments: string[];
  blockers: string[];
  notes: string;
  auditHistory: { date: string; by: string; action: string }[];
}

export interface Transaction {
  id: string;
  dealId: string;
  listingAddress: string;
  buyers: string[];
  sellers: string[];
  agentId: string;
  agentName: string;
  coordinatorId?: string;
  coordinatorName?: string;
  acceptedDate: string;
  projectedCloseDate: string;
  actualCloseDate?: string;
  purchasePrice: number;
  escrowNumber?: string;
  titleCompany: string;
  lender?: string;
  attorney?: string;
  status: "active" | "closed" | "cancelled" | "on-hold";
  steps: TransactionStep[];
  riskFlags: string[];
  complianceReadiness: "green" | "yellow" | "red";
}

export interface Document {
  id: string;
  transactionId?: string;
  dealId?: string;
  listingId?: string;
  name: string;
  type: "contract" | "disclosure" | "inspection" | "appraisal" | "title" | "loan" | "legal" | "compliance" | "other";
  status: "complete" | "missing" | "pending-signature" | "pending-review" | "expired" | "rejected";
  uploadedBy?: string;
  uploadedAt?: string;
  requiredBy: string;
  dueDate: string;
  signers: { name: string; signed: boolean; signedAt?: string }[];
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
  required: boolean;
  category: "buyer" | "seller" | "agent" | "lender" | "title" | "legal";
  notes?: string;
}

export interface Prediction {
  id: string;
  dealId: string;
  dealAddress: string;
  agentName: string;
  generatedAt: string;
  closeLikelihood: {
    probability: number;
    confidence: number;
    rationale: string;
    assumptions: string[];
    risks: string[];
    nextAction: string;
    nextActionOwner: string;
    nextActionDue: string;
  };
  pricingConfidence: {
    band: { low: number; high: number; estimate: number };
    riskOfOverpricing: "low" | "medium" | "high";
    riskOfUnderpricing: "low" | "medium" | "high";
    recommendation: string;
    rationale: string;
    assumptions: string[];
  };
  stallRisk: {
    riskLevel: "low" | "medium" | "high" | "critical";
    bottleneckStage: string;
    delayWindowDays: number;
    recoveryRecommendation: string;
    rationale: string;
    triggerFactors: string[];
  };
  dealHealth: {
    score: number;
    timelineConfidence: number;
    missingDependencies: string[];
    urgencyLevel: "normal" | "elevated" | "critical";
    summary: string;
  };
}

export interface AutomationRun {
  id: string;
  automationId: string;
  automationName: string;
  trigger: string;
  status: "success" | "failed" | "retrying" | "skipped" | "overridden";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  affectedEntity: string;
  affectedEntityId: string;
  actions: { label: string; status: "success" | "failed" | "skipped" }[];
  errorMessage?: string;
  retriesLeft?: number;
  overriddenBy?: string;
  auditNotes?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  category: "stage-change" | "document" | "aging" | "stall" | "closing" | "lead" | "compliance";
  enabled: boolean;
  actions: string[];
  runCount: number;
  successRate: number;
  lastRun?: string;
  failedCount: number;
  pendingRetries: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface RiskSignal {
  id: string;
  type: "stall" | "financing-delay" | "missing-doc" | "broker-approval" | "pricing-deviation" | "overloaded-agent" | "aging-listing" | "expiring-offer" | "inspection-issue" | "appraisal-gap";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  entityId: string;
  entityType: "deal" | "listing" | "lead" | "offer" | "transaction" | "agent";
  entityLabel: string;
  detectedAt: string;
  acknowledged: boolean;
  actionRequired: string;
  assignedTo: string;
  daysOpen: number;
}

export const agents: Agent[] = [
  { id: "agt-001", name: "Marcus Chen", avatar: "MC", email: "mchen@terra.com", phone: "415-555-0101", team: "Alpha Team", teamId: "team-001", role: "team-lead", activeListings: 8, activeDeals: 12, closingsThisMonth: 3, commissionMTD: 47200, avgDaysToClose: 34, conversionRate: 0.42, leadsAssigned: 28, stalledDeals: 1, pipelineValue: 4800000, joinDate: "2020-03-15" },
  { id: "agt-002", name: "Sarah Mitchell", avatar: "SM", email: "smitchell@terra.com", phone: "415-555-0102", team: "Alpha Team", teamId: "team-001", role: "agent", activeListings: 5, activeDeals: 9, closingsThisMonth: 2, commissionMTD: 31400, avgDaysToClose: 41, conversionRate: 0.38, leadsAssigned: 22, stalledDeals: 2, pipelineValue: 2900000, joinDate: "2021-08-20" },
  { id: "agt-003", name: "James Wheeler", avatar: "JW", email: "jwheeler@terra.com", phone: "415-555-0103", team: "Alpha Team", teamId: "team-001", role: "agent", activeListings: 11, activeDeals: 6, closingsThisMonth: 4, commissionMTD: 52800, avgDaysToClose: 28, conversionRate: 0.51, leadsAssigned: 18, stalledDeals: 0, pipelineValue: 3200000, joinDate: "2019-11-01" },
  { id: "agt-004", name: "Elena Rodriguez", avatar: "ER", email: "erodriguez@terra.com", phone: "415-555-0104", team: "Beta Team", teamId: "team-002", role: "team-lead", activeListings: 6, activeDeals: 14, closingsThisMonth: 2, commissionMTD: 28900, avgDaysToClose: 39, conversionRate: 0.35, leadsAssigned: 31, stalledDeals: 3, pipelineValue: 5100000, joinDate: "2021-02-10" },
  { id: "agt-005", name: "David Park", avatar: "DP", email: "dpark@terra.com", phone: "415-555-0105", team: "Beta Team", teamId: "team-002", role: "agent", activeListings: 4, activeDeals: 8, closingsThisMonth: 1, commissionMTD: 15600, avgDaysToClose: 52, conversionRate: 0.29, leadsAssigned: 24, stalledDeals: 4, pipelineValue: 2100000, joinDate: "2022-06-14" },
  { id: "agt-006", name: "Amanda Foster", avatar: "AF", email: "afoster@terra.com", phone: "415-555-0106", team: "Beta Team", teamId: "team-002", role: "agent", activeListings: 7, activeDeals: 5, closingsThisMonth: 3, commissionMTD: 38400, avgDaysToClose: 31, conversionRate: 0.47, leadsAssigned: 16, stalledDeals: 0, pipelineValue: 1800000, joinDate: "2020-09-05" },
  { id: "agt-007", name: "Robert Kim", avatar: "RK", email: "rkim@terra.com", phone: "415-555-0107", team: "Gamma Team", teamId: "team-003", role: "team-lead", activeListings: 9, activeDeals: 11, closingsThisMonth: 3, commissionMTD: 42100, avgDaysToClose: 36, conversionRate: 0.44, leadsAssigned: 26, stalledDeals: 2, pipelineValue: 4200000, joinDate: "2019-05-22" },
  { id: "agt-008", name: "Victoria Lane", avatar: "VL", email: "vlane@terra.com", phone: "415-555-0108", team: "Gamma Team", teamId: "team-003", role: "agent", activeListings: 3, activeDeals: 7, closingsThisMonth: 2, commissionMTD: 24600, avgDaysToClose: 44, conversionRate: 0.33, leadsAssigned: 19, stalledDeals: 1, pipelineValue: 1600000, joinDate: "2022-01-18" },
];

export const teams: Team[] = [
  { id: "team-001", name: "Alpha Team", leadId: "agt-001", leadName: "Marcus Chen", members: ["agt-001", "agt-002", "agt-003"], region: "Bay Area / Peninsula", specialization: "Luxury Residential & Multi-Family", activeListings: 24, activeDeals: 27, pipelineValue: 10900000, closingsThisMonth: 9, commissionMTD: 131400, conversionRate: 0.44 },
  { id: "team-002", name: "Beta Team", leadId: "agt-004", leadName: "Elena Rodriguez", members: ["agt-004", "agt-005", "agt-006"], region: "South Bay / East Bay", specialization: "Residential & Investment Properties", activeListings: 17, activeDeals: 27, pipelineValue: 9000000, closingsThisMonth: 6, commissionMTD: 82900, conversionRate: 0.37 },
  { id: "team-003", name: "Gamma Team", leadId: "agt-007", leadName: "Robert Kim", members: ["agt-007", "agt-008"], region: "North Bay / Marin", specialization: "Luxury Estates & Commercial", activeListings: 12, activeDeals: 18, pipelineValue: 5800000, closingsThisMonth: 5, commissionMTD: 66700, conversionRate: 0.40 },
];

export const listings: Listing[] = [
  {
    id: "lst-001", address: "1842 Pacific Heights Dr", city: "San Francisco", state: "CA", zip: "94115", price: 3250000, pricePerSqft: 1425, sqft: 2281, beds: 4, baths: 3.5, type: "single-family", status: "active", dom: 12, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", listDate: "2026-03-18", photos: 32, description: "Stunning Pacific Heights Victorian with panoramic bay views.", riskLevel: "low", riskFlags: [], buyerActivity: 14, showings: 7, priceReductions: 0, originalPrice: 3250000, offerCount: 2, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "complete" }, { name: "Pre-Sale Inspection", status: "complete" }], lat: 37.7924, lng: -122.4351, yearBuilt: 1908, lotSize: 3200, taxes: 38400,
  },
  {
    id: "lst-002", address: "534 Maple Grove Ave", city: "Palo Alto", state: "CA", zip: "94301", price: 4850000, pricePerSqft: 1680, sqft: 2887, beds: 5, baths: 4, type: "single-family", status: "active", dom: 31, agentId: "agt-002", agentName: "Sarah Mitchell", teamId: "team-001", listDate: "2026-02-27", photos: 28, description: "Stunning Palo Alto estate in prime Old Palo Alto location.", riskLevel: "high", riskFlags: ["31+ DOM — stale listing", "Price above recent comps", "High carrying costs accumulating"], buyerActivity: 6, showings: 3, priceReductions: 1, originalPrice: 5100000, offerCount: 0, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "pending" }, { name: "Inspection Report", status: "missing" }], lat: 37.4419, lng: -122.143, yearBuilt: 2005, lotSize: 8400, taxes: 58000,
  },
  {
    id: "lst-003", address: "2901 Telegraph Ave #8B", city: "Oakland", state: "CA", zip: "94609", price: 625000, pricePerSqft: 712, sqft: 878, beds: 2, baths: 2, type: "condo", status: "pending", dom: 8, agentId: "agt-003", agentName: "James Wheeler", teamId: "team-001", listDate: "2026-03-22", photos: 24, description: "Modern condo in vibrant Temescal neighborhood.", riskLevel: "low", riskFlags: [], buyerActivity: 22, showings: 11, priceReductions: 0, originalPrice: 625000, offerCount: 4, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "HOA Documents", status: "complete" }, { name: "Disclosure Package", status: "complete" }], lat: 37.8271, lng: -122.2629, yearBuilt: 2018, lotSize: 0, hoa: 485, taxes: 7800,
  },
  {
    id: "lst-004", address: "88 Waterfront Blvd", city: "San Jose", state: "CA", zip: "95134", price: 1850000, pricePerSqft: 895, sqft: 2067, beds: 3, baths: 2.5, type: "townhouse", status: "under-contract", dom: 19, agentId: "agt-004", agentName: "Elena Rodriguez", teamId: "team-002", listDate: "2026-03-11", photos: 36, description: "Luxury townhouse with premium finishes and skyline views.", riskLevel: "medium", riskFlags: ["Buyer financing pending approval"], buyerActivity: 18, showings: 9, priceReductions: 0, originalPrice: 1850000, offerCount: 3, documents: [{ name: "Purchase Agreement", status: "complete" }, { name: "Loan Pre-Approval", status: "pending-review" }, { name: "Inspection Report", status: "complete" }, { name: "Title Commitment", status: "pending" }], lat: 37.4138, lng: -121.9842, yearBuilt: 2021, lotSize: 0, hoa: 650, taxes: 22000,
  },
  {
    id: "lst-005", address: "470 Hillcrest Rd", city: "Burlingame", state: "CA", zip: "94010", price: 2900000, pricePerSqft: 1105, sqft: 2625, beds: 4, baths: 3, type: "single-family", status: "active", dom: 5, agentId: "agt-006", agentName: "Amanda Foster", teamId: "team-002", listDate: "2026-03-25", photos: 41, description: "Elegant Burlingame Hills home with mature landscaping.", riskLevel: "low", riskFlags: [], buyerActivity: 29, showings: 12, priceReductions: 0, originalPrice: 2900000, offerCount: 5, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "complete" }, { name: "Pre-Sale Inspection", status: "complete" }, { name: "Natural Hazard Disclosure", status: "complete" }], lat: 37.5841, lng: -122.3622, yearBuilt: 1967, lotSize: 6800, taxes: 34400,
  },
  {
    id: "lst-006", address: "1201 University Ave", city: "Berkeley", state: "CA", zip: "94702", price: 1450000, pricePerSqft: 825, sqft: 1758, beds: 3, baths: 2, type: "single-family", status: "active", dom: 14, agentId: "agt-005", agentName: "David Park", teamId: "team-002", listDate: "2026-03-16", photos: 22, description: "Classic Berkeley bungalow blocks from UC campus.", riskLevel: "low", riskFlags: [], buyerActivity: 11, showings: 5, priceReductions: 0, originalPrice: 1450000, offerCount: 1, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "pending" }], lat: 37.8716, lng: -122.2727, yearBuilt: 1924, lotSize: 4200, taxes: 17300,
  },
  {
    id: "lst-007", address: "300 Marina Green Dr", city: "San Francisco", state: "CA", zip: "94123", price: 5750000, pricePerSqft: 1920, sqft: 2995, beds: 5, baths: 4.5, type: "single-family", status: "active", dom: 22, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", listDate: "2026-03-08", photos: 48, description: "Iconic Marina District home with direct bay access.", riskLevel: "medium", riskFlags: ["Above-median price in volatile range", "3 weeks on market without offer"], buyerActivity: 9, showings: 6, priceReductions: 0, originalPrice: 5750000, offerCount: 0, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "complete" }, { name: "Structural Inspection", status: "complete" }], lat: 37.8043, lng: -122.4429, yearBuilt: 1938, lotSize: 4800, taxes: 69000,
  },
  {
    id: "lst-008", address: "7720 Almaden Expressway", city: "San Jose", state: "CA", zip: "95120", price: 1175000, pricePerSqft: 715, sqft: 1643, beds: 3, baths: 2, type: "single-family", status: "active", dom: 9, agentId: "agt-004", agentName: "Elena Rodriguez", teamId: "team-002", listDate: "2026-03-21", photos: 26, description: "Turn-key Almaden Valley home in top-rated school district.", riskLevel: "low", riskFlags: [], buyerActivity: 19, showings: 8, priceReductions: 0, originalPrice: 1175000, offerCount: 3, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "complete" }], lat: 37.2236, lng: -121.8686, yearBuilt: 1988, lotSize: 5600, taxes: 13900,
  },
  {
    id: "lst-009", address: "55 Throckmorton Ave #204", city: "Mill Valley", state: "CA", zip: "94941", price: 975000, pricePerSqft: 982, sqft: 993, beds: 2, baths: 2, type: "condo", status: "active", dom: 37, agentId: "agt-007", agentName: "Robert Kim", teamId: "team-003", listDate: "2026-02-21", photos: 18, description: "Light-filled condo steps from downtown Mill Valley.", riskLevel: "high", riskFlags: ["37 DOM — significantly stale", "Two price reductions already", "HOA financials under review"], buyerActivity: 3, showings: 2, priceReductions: 2, originalPrice: 1150000, offerCount: 0, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "HOA Documents", status: "pending-review" }, { name: "Disclosure Package", status: "complete" }], lat: 37.9059, lng: -122.5434, yearBuilt: 1999, lotSize: 0, hoa: 720, taxes: 11600,
  },
  {
    id: "lst-010", address: "1048 Elm Street", city: "Menlo Park", state: "CA", zip: "94025", price: 3100000, pricePerSqft: 1280, sqft: 2422, beds: 4, baths: 3, type: "single-family", status: "sold", dom: 6, agentId: "agt-003", agentName: "James Wheeler", teamId: "team-001", listDate: "2026-03-01", photos: 38, description: "Premier Willows neighborhood home sold above asking.", riskLevel: "low", riskFlags: [], buyerActivity: 34, showings: 15, priceReductions: 0, originalPrice: 3100000, offerCount: 7, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Purchase Agreement", status: "complete" }, { name: "Closing Disclosure", status: "complete" }], lat: 37.4535, lng: -122.1826, yearBuilt: 1952, lotSize: 7200, taxes: 36800,
  },
  {
    id: "lst-011", address: "220 Second St #1500", city: "San Francisco", state: "CA", zip: "94105", price: 8200000, pricePerSqft: 1080, sqft: 7593, beds: 0, baths: 8, type: "commercial", status: "active", dom: 44, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", listDate: "2026-02-14", photos: 20, description: "Premier SoMa Class-A office floor with sweeping skyline views.", riskLevel: "high", riskFlags: ["44 DOM — stale commercial listing", "No offers received", "Market softness in office sector"], buyerActivity: 4, showings: 2, priceReductions: 0, originalPrice: 8200000, offerCount: 0, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Environmental Report", status: "pending" }, { name: "Lease Abstracts", status: "complete" }], lat: 37.7858, lng: -122.3964, yearBuilt: 2007, lotSize: 0, taxes: 98200,
  },
  {
    id: "lst-012", address: "4811 Fruitvale Ave", city: "Oakland", state: "CA", zip: "94601", price: 785000, pricePerSqft: 548, sqft: 1432, beds: 3, baths: 2, type: "single-family", status: "active", dom: 18, agentId: "agt-005", agentName: "David Park", teamId: "team-002", listDate: "2026-03-12", photos: 16, description: "Charming craftsman bungalow in established Fruitvale neighborhood.", riskLevel: "medium", riskFlags: ["Deferred maintenance items flagged in inspection"], buyerActivity: 8, showings: 4, priceReductions: 0, originalPrice: 785000, offerCount: 1, documents: [{ name: "Listing Agreement", status: "complete" }, { name: "Disclosure Package", status: "complete" }, { name: "Pest Inspection", status: "missing" }], lat: 37.7721, lng: -122.2244, yearBuilt: 1932, lotSize: 4000, taxes: 9300,
  },
];

export const leads: Lead[] = [
  { id: "lead-001", firstName: "Tyler", lastName: "Brooks", email: "tyler.brooks@email.com", phone: "650-555-0201", stage: "hot", source: "referral", type: "buyer", budget: { min: 2000000, max: 3500000 }, desiredAreas: ["San Francisco", "Palo Alto"], agentId: "agt-001", agentName: "Marcus Chen", assignedDate: "2026-03-10", lastContact: "2026-03-28", nextFollowUp: "2026-03-31", score: 94, engagementCount: 18, messagesCount: 12, tasksComplete: 8, tasksPending: 2, conversionProbability: 0.87, notes: "Pre-approved $3.2M. Ready to make offer on right property. Prefers Pacific Heights.", timeline: [{ date: "2026-03-10", event: "Referred by David Rubin", type: "contact" }, { date: "2026-03-14", event: "Initial consultation — 90 min call", type: "contact" }, { date: "2026-03-19", event: "Toured 3 properties in PH", type: "showing" }, { date: "2026-03-25", event: "Second showing at lst-001", type: "showing" }], tags: ["pre-approved", "cash-backup", "serious-buyer"], preApproved: true, preApprovalAmount: 3200000, propertyInterests: ["lst-001", "lst-007"] },
  { id: "lead-002", firstName: "Priya", lastName: "Patel", email: "ppatel@techcorp.com", phone: "408-555-0202", stage: "engaged", source: "zillow", type: "buyer", budget: { min: 1200000, max: 1800000 }, desiredAreas: ["San Jose", "Santa Clara"], agentId: "agt-004", agentName: "Elena Rodriguez", assignedDate: "2026-03-05", lastContact: "2026-03-27", nextFollowUp: "2026-04-01", score: 72, engagementCount: 9, messagesCount: 6, tasksComplete: 4, tasksPending: 3, conversionProbability: 0.58, notes: "Relocating from NYC for tech job. Wants to close by June.", timeline: [{ date: "2026-03-05", event: "Zillow inquiry on lst-004", type: "contact" }, { date: "2026-03-12", event: "Zoom consultation", type: "contact" }, { date: "2026-03-22", event: "Toured 2 properties in SJ", type: "showing" }], tags: ["relocation", "time-sensitive"], preApproved: true, preApprovalAmount: 1650000, propertyInterests: ["lst-004", "lst-008"] },
  { id: "lead-003", firstName: "Michael", lastName: "Torres", email: "mtorres@gmail.com", phone: "510-555-0203", stage: "new", source: "open-house", type: "buyer", budget: { min: 700000, max: 900000 }, desiredAreas: ["Oakland", "Berkeley"], agentId: "agt-005", agentName: "David Park", assignedDate: "2026-03-28", lastContact: "2026-03-28", nextFollowUp: "2026-03-30", score: 41, engagementCount: 1, messagesCount: 0, tasksComplete: 0, tasksPending: 3, conversionProbability: 0.22, notes: "Met at lst-012 open house. First-time buyer. Needs pre-approval.", timeline: [{ date: "2026-03-28", event: "Met at open house — lst-012", type: "contact" }], tags: ["first-time-buyer", "needs-pre-approval"], preApproved: false, propertyInterests: ["lst-012", "lst-006"] },
  { id: "lead-004", firstName: "Jennifer", lastName: "Nakamura", email: "jnakamura@law.com", phone: "415-555-0204", stage: "nurtured", source: "past-client", type: "seller", budget: undefined, desiredAreas: ["San Francisco"], agentId: "agt-003", agentName: "James Wheeler", assignedDate: "2026-02-15", lastContact: "2026-03-20", nextFollowUp: "2026-04-05", score: 65, engagementCount: 6, messagesCount: 4, tasksComplete: 3, tasksPending: 1, conversionProbability: 0.45, notes: "Purchased with James in 2019. Thinking of downsizing. Timing TBD.", timeline: [{ date: "2026-02-15", event: "Outreach — past client check-in", type: "contact" }, { date: "2026-02-22", event: "Coffee meeting, discussed market", type: "contact" }, { date: "2026-03-10", event: "CMA presented for current home", type: "note" }, { date: "2026-03-20", event: "Follow-up call", type: "contact" }], tags: ["past-client", "seller-prospect", "downsizing"], preApproved: false, propertyInterests: [] },
  { id: "lead-005", firstName: "Brandon", lastName: "Lee", email: "blee@startup.io", phone: "650-555-0205", stage: "hot", source: "referral", type: "buyer", budget: { min: 3000000, max: 6000000 }, desiredAreas: ["San Francisco", "Marin"], agentId: "agt-007", agentName: "Robert Kim", assignedDate: "2026-03-15", lastContact: "2026-03-29", nextFollowUp: "2026-03-31", score: 91, engagementCount: 14, messagesCount: 9, tasksComplete: 6, tasksPending: 1, conversionProbability: 0.82, notes: "Tech exec. Recent IPO. Cash buyer. Wants Marin or SF luxury. Urgent timeline.", timeline: [{ date: "2026-03-15", event: "Referral from Jennifer Nakamura", type: "contact" }, { date: "2026-03-17", event: "In-person consultation — SF office", type: "contact" }, { date: "2026-03-22", event: "Toured lst-007 and 2 others", type: "showing" }, { date: "2026-03-28", event: "Second showing lst-007", type: "showing" }], tags: ["cash-buyer", "urgent", "luxury", "high-net-worth"], preApproved: false, propertyInterests: ["lst-007", "lst-001"] },
  { id: "lead-006", firstName: "Rachel", lastName: "Kim", email: "rkim@corp.com", phone: "415-555-0206", stage: "inactive", source: "website", type: "buyer", budget: { min: 500000, max: 800000 }, desiredAreas: ["Oakland"], agentId: "agt-005", agentName: "David Park", assignedDate: "2026-01-20", lastContact: "2026-02-28", nextFollowUp: "2026-03-31", score: 28, engagementCount: 2, messagesCount: 1, tasksComplete: 1, tasksPending: 2, conversionProbability: 0.11, notes: "Initial inquiry but has gone quiet. David to attempt re-engagement.", timeline: [{ date: "2026-01-20", event: "Website inquiry submitted", type: "contact" }, { date: "2026-01-25", event: "Intro call — low engagement", type: "contact" }], tags: ["cold", "re-engagement-needed"], preApproved: false, propertyInterests: ["lst-012"] },
  { id: "lead-007", firstName: "Kevin", lastName: "Zhang", email: "kzhang@invest.com", phone: "415-555-0207", stage: "engaged", source: "referral", type: "both", budget: { min: 2000000, max: 8000000 }, desiredAreas: ["San Francisco", "Palo Alto", "San Jose"], agentId: "agt-002", agentName: "Sarah Mitchell", assignedDate: "2026-03-18", lastContact: "2026-03-28", nextFollowUp: "2026-04-02", score: 78, engagementCount: 7, messagesCount: 5, tasksComplete: 2, tasksPending: 4, conversionProbability: 0.64, notes: "Real estate investor. Looking for off-market or value-add opportunities. May also sell current properties.", timeline: [{ date: "2026-03-18", event: "Referral from Marcus Chen", type: "contact" }, { date: "2026-03-22", event: "90-min portfolio strategy session", type: "contact" }, { date: "2026-03-27", event: "Toured lst-011 (commercial)", type: "showing" }], tags: ["investor", "multi-property", "off-market-interest"], preApproved: true, preApprovalAmount: 7500000, propertyInterests: ["lst-011", "lst-012"] },
  { id: "lead-008", firstName: "Diana", lastName: "Foster", email: "dfoster@med.edu", phone: "650-555-0208", stage: "converted", source: "zillow", type: "buyer", budget: { min: 1500000, max: 2200000 }, desiredAreas: ["Palo Alto", "Menlo Park"], agentId: "agt-003", agentName: "James Wheeler", assignedDate: "2026-01-10", lastContact: "2026-03-01", nextFollowUp: "2026-04-01", score: 100, engagementCount: 24, messagesCount: 16, tasksComplete: 12, tasksPending: 0, conversionProbability: 1.0, notes: "Successfully purchased lst-010 on Elm Street. Now closed.", timeline: [{ date: "2026-01-10", event: "Zillow inquiry on Menlo Park listings", type: "contact" }, { date: "2026-01-15", event: "Buyer consultation", type: "contact" }, { date: "2026-02-05", event: "Toured 5 properties", type: "showing" }, { date: "2026-02-18", event: "Offer drafted on lst-010", type: "offer" }, { date: "2026-03-01", event: "Closed — lst-010 Elm Street", type: "offer" }], tags: ["closed", "converted", "satisfied-client"], preApproved: true, preApprovalAmount: 2000000, propertyInterests: ["lst-010"] },
  { id: "lead-009", firstName: "Alex", lastName: "Donovan", email: "adonovan@gmail.com", phone: "510-555-0209", stage: "nurtured", source: "social", type: "buyer", budget: { min: 900000, max: 1300000 }, desiredAreas: ["Oakland", "Berkeley"], agentId: "agt-006", agentName: "Amanda Foster", assignedDate: "2026-02-28", lastContact: "2026-03-24", nextFollowUp: "2026-04-03", score: 58, engagementCount: 5, messagesCount: 3, tasksComplete: 2, tasksPending: 2, conversionProbability: 0.38, notes: "Instagram DM from @terra_realty post. Interested in East Bay condos or small SFR.", timeline: [{ date: "2026-02-28", event: "Instagram DM inquiry", type: "contact" }, { date: "2026-03-05", event: "Intro call", type: "contact" }, { date: "2026-03-17", event: "Toured lst-003 and lst-006", type: "showing" }, { date: "2026-03-24", event: "Follow-up — requesting more info", type: "contact" }], tags: ["social-media-lead", "east-bay"], preApproved: false, propertyInterests: ["lst-003", "lst-006"] },
  { id: "lead-010", firstName: "Naomi", lastName: "Washington", email: "nwashington@finance.com", phone: "415-555-0210", stage: "hot", source: "past-client", type: "seller", budget: undefined, desiredAreas: ["Marin County"], agentId: "agt-007", agentName: "Robert Kim", assignedDate: "2026-03-20", lastContact: "2026-03-29", nextFollowUp: "2026-03-31", score: 88, engagementCount: 11, messagesCount: 7, tasksComplete: 5, tasksPending: 1, conversionProbability: 0.79, notes: "Previous buyer who is now selling her Mill Valley home. Ready to list by April 15.", timeline: [{ date: "2026-03-20", event: "Past client outreach — selling intent", type: "contact" }, { date: "2026-03-23", event: "CMA presentation — $2.1M estimate", type: "note" }, { date: "2026-03-27", event: "Listing agreement drafted", type: "note" }, { date: "2026-03-29", event: "Toured competitor listings for context", type: "showing" }], tags: ["past-client", "ready-to-list", "time-sensitive"], preApproved: false, propertyInterests: [] },
];

export const brokerageDeals: BrokerageDeal[] = [
  { id: "bdeal-001", listingId: "lst-001", address: "1842 Pacific Heights Dr", city: "San Francisco", state: "CA", type: "sell-side", stage: "offer-submitted", price: 3250000, commission: 97500, commissionRate: 3.0, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", clientId: "lead-001", clientName: "Tyler Brooks", closeDate: "", estimatedCloseDate: "2026-04-25", probability: 82, daysInStage: 2, totalDays: 14, bottleneckFlag: false, riskScore: 22, riskLevel: "low", nextAction: "Review and respond to offer #2", nextActionOwner: "Marcus Chen", nextActionDue: "2026-03-30", notes: "Strong offer received. Second offer pending.", dealHealthScore: 88, isStalled: false, hasUrgentIssue: false, created: "2026-03-18", lastUpdated: "2026-03-29" },
  { id: "bdeal-002", listingId: "lst-002", address: "534 Maple Grove Ave", city: "Palo Alto", state: "CA", type: "sell-side", stage: "lead", price: 4850000, commission: 145500, commissionRate: 3.0, agentId: "agt-002", agentName: "Sarah Mitchell", teamId: "team-001", clientId: "lead-007", clientName: "Kevin Zhang", closeDate: "", estimatedCloseDate: "2026-05-30", probability: 18, daysInStage: 31, totalDays: 31, bottleneckFlag: true, bottleneckReason: "Stale listing — no offers in 31 days", riskScore: 78, riskLevel: "high", nextAction: "Schedule price reduction meeting with sellers", nextActionOwner: "Sarah Mitchell", nextActionDue: "2026-03-30", notes: "31+ DOM. Sellers resistant to price cut. Need broker intervention.", dealHealthScore: 31, isStalled: true, stalledReason: "No activity — DOM exceeding threshold", hasUrgentIssue: true, urgentIssue: "Listing approaching 45-day cancellation risk", created: "2026-02-27", lastUpdated: "2026-03-29" },
  { id: "bdeal-003", listingId: "lst-003", address: "2901 Telegraph Ave #8B", city: "Oakland", state: "CA", type: "sell-side", stage: "negotiation", price: 625000, commission: 18750, commissionRate: 3.0, agentId: "agt-003", agentName: "James Wheeler", teamId: "team-001", clientId: "lead-009", clientName: "Alex Donovan", closeDate: "", estimatedCloseDate: "2026-04-15", probability: 91, daysInStage: 1, totalDays: 9, bottleneckFlag: false, riskScore: 12, riskLevel: "low", nextAction: "Counter offer terms on inspection contingency", nextActionOwner: "James Wheeler", nextActionDue: "2026-03-30", notes: "Multiple offers in. Best at $640K. Counter in progress.", dealHealthScore: 94, isStalled: false, hasUrgentIssue: false, created: "2026-03-22", lastUpdated: "2026-03-29" },
  { id: "bdeal-004", listingId: "lst-004", address: "88 Waterfront Blvd", city: "San Jose", state: "CA", type: "sell-side", stage: "financing", price: 1850000, commission: 55500, commissionRate: 3.0, agentId: "agt-004", agentName: "Elena Rodriguez", teamId: "team-002", clientId: "lead-002", clientName: "Priya Patel", closeDate: "", estimatedCloseDate: "2026-04-10", probability: 73, daysInStage: 8, totalDays: 19, bottleneckFlag: true, bottleneckReason: "Buyer loan approval delayed — lender backlog", riskScore: 61, riskLevel: "medium", nextAction: "Contact lender to expedite underwriting review", nextActionOwner: "Elena Rodriguez", nextActionDue: "2026-03-31", notes: "Buyer financing stuck at underwriting. Lender says 7-10 more days. Risk of missing close date.", dealHealthScore: 62, isStalled: false, hasUrgentIssue: true, urgentIssue: "Financing delay — close date at risk", created: "2026-03-11", lastUpdated: "2026-03-29" },
  { id: "bdeal-005", listingId: "lst-005", address: "470 Hillcrest Rd", city: "Burlingame", state: "CA", type: "sell-side", stage: "showing", price: 2900000, commission: 87000, commissionRate: 3.0, agentId: "agt-006", agentName: "Amanda Foster", teamId: "team-002", clientId: "lead-005", clientName: "Brandon Lee", closeDate: "", estimatedCloseDate: "2026-05-15", probability: 58, daysInStage: 3, totalDays: 5, bottleneckFlag: false, riskScore: 28, riskLevel: "low", nextAction: "Schedule second showing for cash buyer", nextActionOwner: "Amanda Foster", nextActionDue: "2026-04-01", notes: "5 offers expected. Brandon Lee is cash. Very strong listing.", dealHealthScore: 82, isStalled: false, hasUrgentIssue: false, created: "2026-03-25", lastUpdated: "2026-03-29" },
  { id: "bdeal-006", listingId: "lst-009", address: "55 Throckmorton Ave #204", city: "Mill Valley", state: "CA", type: "sell-side", stage: "lead", price: 975000, commission: 29250, commissionRate: 3.0, agentId: "agt-007", agentName: "Robert Kim", teamId: "team-003", clientId: "lead-010", clientName: "Naomi Washington", closeDate: "", estimatedCloseDate: "2026-06-01", probability: 12, daysInStage: 37, totalDays: 37, bottleneckFlag: true, bottleneckReason: "37 DOM with no offers and 2 price reductions", riskScore: 85, riskLevel: "critical", nextAction: "Broker consultation on withdrawal or aggressive price cut", nextActionOwner: "Robert Kim + Broker", nextActionDue: "2026-03-31", notes: "HOA financials under review creating hesitation. Naomi pushing to delist and relaunch.", dealHealthScore: 18, isStalled: true, stalledReason: "Market rejection — needs strategic intervention", hasUrgentIssue: true, urgentIssue: "37 DOM — broker review required immediately", created: "2026-02-21", lastUpdated: "2026-03-29" },
  { id: "bdeal-007", address: "900 Sand Hill Rd", city: "Menlo Park", state: "CA", type: "buy-side", stage: "attorney-review", price: 12500000, commission: 187500, commissionRate: 1.5, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", clientId: "lead-005", clientName: "Brandon Lee", closeDate: "", estimatedCloseDate: "2026-04-18", probability: 88, daysInStage: 4, totalDays: 31, bottleneckFlag: false, riskScore: 31, riskLevel: "low", nextAction: "Confirm attorney review timeline with buyer's counsel", nextActionOwner: "Marcus Chen", nextActionDue: "2026-04-01", notes: "Off-market acquisition for cash buyer. Clean deal. Attorneys aligned.", dealHealthScore: 85, isStalled: false, hasUrgentIssue: false, created: "2026-02-26", lastUpdated: "2026-03-29" },
  { id: "bdeal-008", address: "2240 Vallejo St", city: "San Francisco", state: "CA", type: "buy-side", stage: "inspection", price: 2750000, commission: 82500, commissionRate: 3.0, agentId: "agt-002", agentName: "Sarah Mitchell", teamId: "team-001", clientId: "lead-001", clientName: "Tyler Brooks", closeDate: "", estimatedCloseDate: "2026-04-30", probability: 77, daysInStage: 5, totalDays: 18, bottleneckFlag: true, bottleneckReason: "Inspector found foundation cracks — negotiation expected", riskScore: 52, riskLevel: "medium", nextAction: "Get foundation repair estimate — share with buyer", nextActionOwner: "Sarah Mitchell", nextActionDue: "2026-03-31", notes: "General inspection completed. Foundation issue flagged. Buyer requesting credit or repair.", dealHealthScore: 68, isStalled: false, hasUrgentIssue: true, urgentIssue: "Foundation issue discovered in inspection — deal risk", created: "2026-03-11", lastUpdated: "2026-03-29" },
  { id: "bdeal-009", address: "101 California St #4200", city: "San Francisco", state: "CA", type: "buy-side", stage: "under-contract", price: 6800000, commission: 102000, commissionRate: 1.5, agentId: "agt-007", agentName: "Robert Kim", teamId: "team-003", clientId: "lead-007", clientName: "Kevin Zhang", closeDate: "", estimatedCloseDate: "2026-04-22", probability: 86, daysInStage: 6, totalDays: 22, bottleneckFlag: false, riskScore: 25, riskLevel: "low", nextAction: "Track title work completion", nextActionOwner: "Victoria Lane", nextActionDue: "2026-04-05", notes: "Commercial office floor. Title work underway. On track.", dealHealthScore: 88, isStalled: false, hasUrgentIssue: false, created: "2026-03-07", lastUpdated: "2026-03-29" },
  { id: "bdeal-010", listingId: "lst-010", address: "1048 Elm Street", city: "Menlo Park", state: "CA", type: "sell-side", stage: "closed", price: 3180000, commission: 95400, commissionRate: 3.0, agentId: "agt-003", agentName: "James Wheeler", teamId: "team-001", clientId: "lead-008", clientName: "Diana Foster", closeDate: "2026-03-01", estimatedCloseDate: "2026-03-01", probability: 100, daysInStage: 0, totalDays: 26, bottleneckFlag: false, riskScore: 0, riskLevel: "low", nextAction: "None — closed", nextActionOwner: "", nextActionDue: "", notes: "Sold above asking. 7 offers. Excellent outcome.", dealHealthScore: 100, isStalled: false, hasUrgentIssue: false, created: "2026-02-03", lastUpdated: "2026-03-01" },
  { id: "bdeal-011", address: "77 Larkspur Way", city: "Larkspur", state: "CA", type: "sell-side", stage: "appraisal", price: 1875000, commission: 56250, commissionRate: 3.0, agentId: "agt-008", agentName: "Victoria Lane", teamId: "team-003", clientId: "lead-009", clientName: "Alex Donovan", closeDate: "", estimatedCloseDate: "2026-04-20", probability: 71, daysInStage: 3, totalDays: 24, bottleneckFlag: true, bottleneckReason: "Appraisal came in $45K below contract price", riskScore: 58, riskLevel: "medium", nextAction: "Renegotiate price or get buyer to cover gap", nextActionOwner: "Victoria Lane", nextActionDue: "2026-04-01", notes: "Appraisal gap of $45K. Buyer wants seller credit. Sellers resistant.", dealHealthScore: 61, isStalled: false, hasUrgentIssue: true, urgentIssue: "Appraisal gap — deal may fall apart without resolution", created: "2026-03-05", lastUpdated: "2026-03-29" },
  { id: "bdeal-012", address: "350 Brannan St #110", city: "San Francisco", state: "CA", type: "buy-side", stage: "clear-to-close", price: 1425000, commission: 42750, commissionRate: 3.0, agentId: "agt-006", agentName: "Amanda Foster", teamId: "team-002", clientId: "lead-004", clientName: "Jennifer Nakamura", closeDate: "", estimatedCloseDate: "2026-04-02", probability: 97, daysInStage: 2, totalDays: 38, bottleneckFlag: false, riskScore: 8, riskLevel: "low", nextAction: "Confirm closing disclosure with title", nextActionOwner: "Amanda Foster", nextActionDue: "2026-04-01", notes: "Clear to close! Walk-through scheduled for April 1.", dealHealthScore: 98, isStalled: false, hasUrgentIssue: false, created: "2026-02-19", lastUpdated: "2026-03-29" },
  { id: "bdeal-013", address: "1580 Lincoln Ave", city: "San Rafael", state: "CA", type: "buy-side", stage: "offer-drafted", price: 1250000, commission: 37500, commissionRate: 3.0, agentId: "agt-007", agentName: "Robert Kim", teamId: "team-003", clientId: "lead-010", clientName: "Naomi Washington", closeDate: "", estimatedCloseDate: "2026-05-10", probability: 52, daysInStage: 1, totalDays: 12, bottleneckFlag: false, riskScore: 32, riskLevel: "low", nextAction: "Finalize offer terms and get client signature", nextActionOwner: "Robert Kim", nextActionDue: "2026-03-31", notes: "Buyer wants $1.2M. Asking $1.275M. Working on terms.", dealHealthScore: 72, isStalled: false, hasUrgentIssue: false, created: "2026-03-17", lastUpdated: "2026-03-29" },
  { id: "bdeal-014", address: "448 Green St", city: "San Francisco", state: "CA", type: "sell-side", stage: "qualified", price: 3800000, commission: 114000, commissionRate: 3.0, agentId: "agt-001", agentName: "Marcus Chen", teamId: "team-001", clientId: "lead-007", clientName: "Kevin Zhang", closeDate: "", estimatedCloseDate: "2026-06-15", probability: 32, daysInStage: 6, totalDays: 6, bottleneckFlag: false, riskScore: 28, riskLevel: "low", nextAction: "Complete CMA and listing presentation", nextActionOwner: "Marcus Chen", nextActionDue: "2026-04-04", notes: "New potential listing from investor client Kevin Zhang.", dealHealthScore: 68, isStalled: false, hasUrgentIssue: false, created: "2026-03-23", lastUpdated: "2026-03-29" },
  { id: "bdeal-015", address: "290 Edgewood Ave", city: "San Francisco", state: "CA", type: "sell-side", stage: "lost-stalled", price: 2100000, commission: 0, commissionRate: 3.0, agentId: "agt-005", agentName: "David Park", teamId: "team-002", clientId: "lead-006", clientName: "Rachel Kim", closeDate: "", estimatedCloseDate: "", probability: 0, daysInStage: 14, totalDays: 61, bottleneckFlag: false, riskScore: 100, riskLevel: "critical", nextAction: "Archive and schedule re-engagement in 90 days", nextActionOwner: "David Park", nextActionDue: "2026-06-30", notes: "Sellers chose a competitor. Lost deal — overpricing was key factor.", dealHealthScore: 0, isStalled: true, stalledReason: "Deal lost to competing brokerage", hasUrgentIssue: false, created: "2026-01-27", lastUpdated: "2026-03-15" },
];

export const offers: Offer[] = [
  { id: "offer-001", listingId: "lst-001", listingAddress: "1842 Pacific Heights Dr, SF", buyerName: "Tyler Brooks", agentName: "Marcus Chen", agentId: "agt-001", direction: "incoming", status: "pending", price: 3280000, listPrice: 3250000, earnestMoney: 100000, downPayment: 1640000, financingType: "conventional", contingencies: [{ type: "Inspection", days: 10, waived: false }, { type: "Financing", days: 21, waived: false }], inspectionDays: 10, closingDate: "2026-04-25", expiresAt: "2026-03-31T23:59:00Z", submittedAt: "2026-03-28T14:00:00Z", closeConfidence: 86, financingStrength: "strong", notes: "Pre-approved at $3.2M. Strong buyer. 50% down.", counterHistory: [], brokerApprovalRequired: false, brokerApproved: true, recommendation: "Accept — strong offer, above list, pre-approved buyer" },
  { id: "offer-002", listingId: "lst-001", listingAddress: "1842 Pacific Heights Dr, SF", buyerName: "Michael Tan", agentName: "James Wheeler", agentId: "agt-003", direction: "incoming", status: "pending", price: 3195000, listPrice: 3250000, earnestMoney: 75000, downPayment: 960000, financingType: "conventional", contingencies: [{ type: "Inspection", days: 10, waived: false }, { type: "Financing", days: 21, waived: false }, { type: "Appraisal", days: 17, waived: false }], inspectionDays: 10, closingDate: "2026-05-02", expiresAt: "2026-03-31T23:59:00Z", submittedAt: "2026-03-28T16:30:00Z", closeConfidence: 71, financingStrength: "moderate", notes: "All contingencies in play. Under list. Backup position.", counterHistory: [], brokerApprovalRequired: false, brokerApproved: true, recommendation: "Counter at $3.25M — all contingencies remain" },
  { id: "offer-003", listingId: "lst-003", listingAddress: "2901 Telegraph Ave #8B, Oakland", buyerName: "Alex Donovan", agentName: "Amanda Foster", agentId: "agt-006", direction: "incoming", status: "countered", price: 640000, listPrice: 625000, earnestMoney: 25000, downPayment: 128000, financingType: "conventional", contingencies: [{ type: "Inspection", days: 7, waived: false }, { type: "Financing", days: 17, waived: false }], inspectionDays: 7, closingDate: "2026-04-14", expiresAt: "2026-04-01T23:59:00Z", submittedAt: "2026-03-27T10:00:00Z", closeConfidence: 83, financingStrength: "strong", notes: "Top offer out of 4. Buyer wants 7-day inspection waiver option.", counterHistory: [{ date: "2026-03-28", from: "Seller", price: 645000, terms: "Keep inspection at 7 days, close April 12" }], brokerApprovalRequired: false, brokerApproved: true, recommendation: "Accept counter — highest net after terms" },
  { id: "offer-004", listingId: "lst-004", listingAddress: "88 Waterfront Blvd, San Jose", buyerName: "Priya Patel", agentName: "Elena Rodriguez", agentId: "agt-004", direction: "outgoing", status: "accepted", price: 1850000, listPrice: 1850000, earnestMoney: 55000, downPayment: 370000, financingType: "conventional", contingencies: [{ type: "Financing", days: 21, waived: false }, { type: "Inspection", days: 10, waived: false }], inspectionDays: 10, closingDate: "2026-04-10", expiresAt: "2026-03-25T23:59:00Z", submittedAt: "2026-03-22T09:00:00Z", closeConfidence: 74, financingStrength: "moderate", notes: "Offer accepted. Now in financing stage — lender delayed.", counterHistory: [], brokerApprovalRequired: false, brokerApproved: true, recommendation: "Monitor financing — critical path item" },
  { id: "offer-005", listingId: "lst-005", listingAddress: "470 Hillcrest Rd, Burlingame", buyerName: "Brandon Lee", agentName: "Amanda Foster", agentId: "agt-006", direction: "incoming", status: "pending", price: 3150000, listPrice: 2900000, earnestMoney: 200000, downPayment: 3150000, financingType: "cash", contingencies: [{ type: "Inspection", days: 5, waived: true }], inspectionDays: 5, closingDate: "2026-04-20", expiresAt: "2026-04-02T23:59:00Z", submittedAt: "2026-03-29T11:00:00Z", closeConfidence: 94, financingStrength: "strong", notes: "Cash offer 8.6% over asking. Waived inspection. Broker review required.", counterHistory: [], brokerApprovalRequired: true, brokerApproved: false, recommendation: "Accept immediately — rare cash over-ask offer" },
  { id: "offer-006", listingId: "lst-008", listingAddress: "7720 Almaden Expressway, SJ", buyerName: "Jennifer Nakamura", agentName: "Amanda Foster", agentId: "agt-006", direction: "outgoing", status: "pending", price: 1195000, listPrice: 1175000, earnestMoney: 35000, downPayment: 240000, financingType: "conventional", contingencies: [{ type: "Inspection", days: 10, waived: false }, { type: "Financing", days: 21, waived: false }], inspectionDays: 10, closingDate: "2026-05-01", expiresAt: "2026-04-01T23:59:00Z", submittedAt: "2026-03-29T14:30:00Z", closeConfidence: 77, financingStrength: "strong", notes: "Strong offer above ask. Good buyer qualifications.", counterHistory: [], brokerApprovalRequired: false, brokerApproved: true, recommendation: "Favorable offer — expect acceptance or minor counter" },
];

export const transactions: Transaction[] = [
  {
    id: "tx-001", dealId: "bdeal-004", listingAddress: "88 Waterfront Blvd, San Jose", buyers: ["Priya Patel"], sellers: ["Waterfront LLC"], agentId: "agt-004", agentName: "Elena Rodriguez", coordinatorId: "coord-001", coordinatorName: "Lisa Chen", acceptedDate: "2026-03-22", projectedCloseDate: "2026-04-10", purchasePrice: 1850000, escrowNumber: "ESC-2026-04419", titleCompany: "Pacific Title Co.", lender: "Wells Fargo Home Mortgage", status: "active",
    riskFlags: ["Loan approval delayed by 7-10 days", "Close date at risk"],
    complianceReadiness: "yellow",
    steps: [
      { id: "step-001", label: "Accepted Offer", owner: "Elena Rodriguez", ownerId: "agt-004", dueDate: "2026-03-22", completedDate: "2026-03-22", status: "complete", dependencies: [], linkedDocuments: ["Purchase Agreement"], blockers: [], notes: "Offer accepted at list price", auditHistory: [{ date: "2026-03-22", by: "Elena Rodriguez", action: "Step completed — offer accepted" }] },
      { id: "step-002", label: "Document Collection", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-03-26", completedDate: "2026-03-25", status: "complete", dependencies: ["step-001"], linkedDocuments: ["Disclosure Package", "Pre-approval Letter"], blockers: [], notes: "All docs collected", auditHistory: [{ date: "2026-03-25", by: "Lisa Chen", action: "Documents collected and verified" }] },
      { id: "step-003", label: "Attorney Review", owner: "Elena Rodriguez", ownerId: "agt-004", dueDate: "2026-03-29", completedDate: "2026-03-28", status: "complete", dependencies: ["step-002"], linkedDocuments: ["Purchase Agreement Review"], blockers: [], notes: "Both attorneys approved", auditHistory: [{ date: "2026-03-28", by: "Elena Rodriguez", action: "Attorney review cleared" }] },
      { id: "step-004", label: "Inspections", owner: "Elena Rodriguez", ownerId: "agt-004", dueDate: "2026-03-29", completedDate: "2026-03-29", status: "complete", dependencies: ["step-003"], linkedDocuments: ["Inspection Report"], blockers: [], notes: "Clean inspection — no major issues", auditHistory: [{ date: "2026-03-29", by: "Elena Rodriguez", action: "Inspection completed — no issues" }] },
      { id: "step-005", label: "Lender / Financing", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-04-01", status: "overdue", dependencies: ["step-004"], linkedDocuments: ["Loan Approval Letter"], blockers: ["Underwriting backlog at Wells Fargo"], notes: "Loan stuck in underwriting. 7-10 day delay expected. Close date at risk.", auditHistory: [{ date: "2026-03-29", by: "Lisa Chen", action: "Escalated to lender relationship manager" }] },
      { id: "step-006", label: "Appraisal", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-04-04", status: "pending", dependencies: ["step-005"], linkedDocuments: ["Appraisal Report"], blockers: ["Waiting for financing to clear first"], notes: "Scheduled for April 3", auditHistory: [] },
      { id: "step-007", label: "Title / Legal", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-04-07", status: "pending", dependencies: ["step-006"], linkedDocuments: ["Title Commitment", "Title Insurance"], blockers: [], notes: "Title ordered", auditHistory: [] },
      { id: "step-008", label: "Walk-Through", owner: "Elena Rodriguez", ownerId: "agt-004", dueDate: "2026-04-09", status: "pending", dependencies: ["step-007"], linkedDocuments: [], blockers: [], notes: "Final walk-through before close", auditHistory: [] },
      { id: "step-009", label: "Closing Prep", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-04-09", status: "pending", dependencies: ["step-007"], linkedDocuments: ["Closing Disclosure", "Settlement Statement"], blockers: [], notes: "Prepare closing package", auditHistory: [] },
      { id: "step-010", label: "Close", owner: "Elena Rodriguez", ownerId: "agt-004", dueDate: "2026-04-10", status: "pending", dependencies: ["step-008", "step-009"], linkedDocuments: ["Final Closing Disclosure", "Deed"], blockers: [], notes: "Closing at Pacific Title — 10am", auditHistory: [] },
      { id: "step-011", label: "Commission Payout", owner: "Lisa Chen", ownerId: "coord-001", dueDate: "2026-04-11", status: "pending", dependencies: ["step-010"], linkedDocuments: ["Commission Agreement", "Payout Record"], blockers: [], notes: "", auditHistory: [] },
    ]
  },
];

export const documents: Document[] = [
  { id: "doc-001", transactionId: "tx-001", dealId: "bdeal-004", listingId: "lst-004", name: "Purchase Agreement", type: "contract", status: "complete", uploadedBy: "Elena Rodriguez", uploadedAt: "2026-03-22T10:30:00Z", requiredBy: "Accepted Offer", dueDate: "2026-03-22", signers: [{ name: "Priya Patel", signed: true, signedAt: "2026-03-22T11:00:00Z" }, { name: "Waterfront LLC", signed: true, signedAt: "2026-03-22T14:30:00Z" }], reviewedBy: "Elena Rodriguez", reviewedAt: "2026-03-22T15:00:00Z", version: 1, required: true, category: "buyer", notes: "Executed purchase agreement" },
  { id: "doc-002", transactionId: "tx-001", dealId: "bdeal-004", listingId: "lst-004", name: "Loan Pre-Approval Letter", type: "loan", status: "complete", uploadedBy: "Lisa Chen", uploadedAt: "2026-03-23T09:00:00Z", requiredBy: "Document Collection", dueDate: "2026-03-26", signers: [], reviewedBy: "Lisa Chen", reviewedAt: "2026-03-23T10:00:00Z", version: 1, required: true, category: "lender", notes: "Wells Fargo pre-approval — $1.65M" },
  { id: "doc-003", transactionId: "tx-001", dealId: "bdeal-004", listingId: "lst-004", name: "Loan Approval Letter", type: "loan", status: "pending-review", requiredBy: "Financing Step", dueDate: "2026-04-01", signers: [], version: 1, required: true, category: "lender", notes: "CRITICAL: Underwriting delayed 7-10 days" },
  { id: "doc-004", transactionId: "tx-001", dealId: "bdeal-004", listingId: "lst-004", name: "Appraisal Report", type: "appraisal", status: "missing", requiredBy: "Appraisal Step", dueDate: "2026-04-04", signers: [], version: 1, required: true, category: "lender", notes: "Scheduled April 3 — pending financing clearance" },
  { id: "doc-005", transactionId: "tx-001", dealId: "bdeal-004", listingId: "lst-004", name: "Title Commitment", type: "title", status: "pending", requiredBy: "Title Step", dueDate: "2026-04-07", signers: [], version: 1, required: true, category: "title", notes: "Pacific Title ordered" },
  { id: "doc-006", listingId: "lst-002", name: "Disclosure Package", type: "disclosure", status: "pending", requiredBy: "Listing Launch", dueDate: "2026-02-27", signers: [{ name: "Sarah Mitchell", signed: false }], version: 1, required: true, category: "seller", notes: "Overdue — requested from sellers 4 weeks ago" },
  { id: "doc-007", listingId: "lst-002", name: "Pre-Sale Inspection Report", type: "inspection", status: "missing", requiredBy: "Listing Launch", dueDate: "2026-02-27", signers: [], version: 1, required: true, category: "seller", notes: "Never ordered. Critical gap." },
  { id: "doc-008", listingId: "lst-009", name: "HOA Financial Documents", type: "legal", status: "pending-review", uploadedAt: "2026-03-10T09:00:00Z", requiredBy: "Listing Compliance", dueDate: "2026-03-10", signers: [], reviewedBy: undefined, version: 1, required: true, category: "title", notes: "Under review — causing buyer hesitation" },
];

export const predictions: Prediction[] = [
  { id: "pred-001", dealId: "bdeal-004", dealAddress: "88 Waterfront Blvd, San Jose", agentName: "Elena Rodriguez", generatedAt: "2026-03-29T08:00:00Z", closeLikelihood: { probability: 0.71, confidence: 0.82, rationale: "Deal is under contract with strong buyer, accepted offer at list price, clean inspection. Primary risk is the financing delay — lender underwriting is 7-10 days behind schedule, putting the April 10 close date at moderate risk.", assumptions: ["Loan approval received by April 5", "No new contingency issues emerge", "Appraisal comes in at or above contract price"], risks: ["Financing falls through — buyer loses pre-approval", "Lender delay extends beyond tolerance window", "Sellers exercise cancellation rights if close date missed"], nextAction: "Contact Wells Fargo relationship manager today to get underwriting status update", nextActionOwner: "Elena Rodriguez", nextActionDue: "2026-03-30" }, pricingConfidence: { band: { low: 1750000, high: 1950000, estimate: 1850000 }, riskOfOverpricing: "low", riskOfUnderpricing: "low", recommendation: "Pricing is well-calibrated to market", rationale: "Three recent comparables in the $870-920/sqft range support the $895/sqft list price. No overpricing risk.", assumptions: ["Market conditions stable", "No flood of competing inventory"] }, stallRisk: { riskLevel: "high", bottleneckStage: "financing", delayWindowDays: 7, recoveryRecommendation: "Request lender commit to April 3 decision or escalate to backup lender immediately", rationale: "Financing delays are the #1 cause of deal collapse at this stage. Current 7-day buffer is within tolerance but eroding.", triggerFactors: ["Underwriting backlog", "Lender staffing constraints", "Close date pressure"] }, dealHealth: { score: 62, timelineConfidence: 0.55, missingDependencies: ["Loan approval letter", "Appraisal (blocked by financing)"], urgencyLevel: "elevated", summary: "Deal is fundamentally sound but the financing bottleneck is a real threat to the April 10 close. Immediate escalation to the lender is the only action that de-risks the outcome." } },
  { id: "pred-002", dealId: "bdeal-002", dealAddress: "534 Maple Grove Ave, Palo Alto", agentName: "Sarah Mitchell", generatedAt: "2026-03-29T08:00:00Z", closeLikelihood: { probability: 0.14, confidence: 0.88, rationale: "31 days on market with zero offers and the listing price is still above the original ask after one reduction. The disclosure package is incomplete and no inspection has been ordered. Without aggressive intervention this deal does not close.", assumptions: ["Sellers agree to price reduction to $4.6M", "Disclosure completed within 7 days", "Pre-sale inspection ordered immediately"], risks: ["Sellers refuse price reduction — listing expires", "Competing properties absorb buyer interest", "Agent loses listing to competitors"], nextAction: "Broker must join meeting with sellers to present data-driven case for $4.5M ask reduction", nextActionOwner: "Broker (Elena Rodriguez)", nextActionDue: "2026-03-31" }, pricingConfidence: { band: { low: 4200000, high: 4750000, estimate: 4500000 }, riskOfOverpricing: "high", riskOfUnderpricing: "low", recommendation: "Reduce to $4.5M immediately — current ask is approximately 8% above market", rationale: "Recent Palo Alto Old PA comps show $1,580-1,620/sqft. Current ask at $1,680/sqft has no support in the data.", assumptions: ["Market absorption continues at current pace", "No competing teardowns list nearby"] }, stallRisk: { riskLevel: "critical", bottleneckStage: "lead", delayWindowDays: 0, recoveryRecommendation: "Price reduction + open house blitz + complete disclosure package — must happen within 72 hours", rationale: "Deal has already stalled. 31 DOM with zero offers is market rejection. Any further delay compounds the problem.", triggerFactors: ["Overpricing", "Incomplete disclosure package", "Weak showing frequency", "No broker outreach"] }, dealHealth: { score: 18, timelineConfidence: 0.12, missingDependencies: ["Disclosure package", "Pre-sale inspection", "Price correction"], urgencyLevel: "critical", summary: "This listing is in crisis. The combination of overpricing, incomplete documents, and 31 DOM creates a self-reinforcing spiral. Broker intervention is not optional — it is required this week." } },
];

export const automations: Automation[] = [
  { id: "auto-001", name: "Stage Change Task Generator", description: "When a deal advances to a new stage, auto-create the standard task checklist for that stage and assign to the responsible agent.", trigger: "deal.stage_changed", category: "stage-change", enabled: true, actions: ["Create task list for new stage", "Assign tasks to deal owner", "Set due dates based on close timeline", "Notify coordinator"], runCount: 124, successRate: 0.98, lastRun: "2026-03-29T08:14:00Z", failedCount: 2, pendingRetries: 0, priority: "high" },
  { id: "auto-002", name: "Aging Listing Alert", description: "Send alert and create broker review task when a listing reaches 21, 30, and 45 DOM without an offer.", trigger: "listing.dom_threshold", category: "aging", enabled: true, actions: ["Create broker review task", "Notify agent team lead", "Log in audit trail", "Schedule price review meeting"], runCount: 38, successRate: 0.92, lastRun: "2026-03-28T07:00:00Z", failedCount: 3, pendingRetries: 1, priority: "high" },
  { id: "auto-003", name: "Missing Document Alert", description: "Detect missing required documents for active transactions and alert the responsible party.", trigger: "document.missing_detection", category: "document", enabled: true, actions: ["Identify missing docs", "Notify responsible party", "Create follow-up task", "Escalate if overdue 48h"], runCount: 67, successRate: 0.87, lastRun: "2026-03-29T06:00:00Z", failedCount: 9, pendingRetries: 3, priority: "critical" },
  { id: "auto-004", name: "Stalled Deal Notification", description: "Flag deals where no activity has been logged in 3+ days and assign recovery actions.", trigger: "deal.no_activity_threshold", category: "stall", enabled: true, actions: ["Flag deal as stalled", "Notify team lead", "Create re-engagement task", "Add to broker review queue"], runCount: 29, successRate: 0.93, lastRun: "2026-03-28T20:00:00Z", failedCount: 2, pendingRetries: 0, priority: "high" },
  { id: "auto-005", name: "Close Date Risk Escalation", description: "When a deal's estimated close date is within 7 days and key steps are incomplete, escalate to broker.", trigger: "transaction.close_date_risk", category: "closing", enabled: true, actions: ["Assess step completeness", "Calculate risk score", "Notify broker if risk > 60", "Create escalation task"], runCount: 18, successRate: 0.94, lastRun: "2026-03-28T18:00:00Z", failedCount: 1, pendingRetries: 0, priority: "critical" },
  { id: "auto-006", name: "Closing Checklist Generator", description: "When deal reaches Clear to Close stage, auto-generate the closing checklist with all required items.", trigger: "deal.stage_changed == clear-to-close", category: "closing", enabled: true, actions: ["Generate closing checklist", "Assign items to coordinator", "Schedule walk-through", "Create payout record"], runCount: 31, successRate: 1.0, lastRun: "2026-03-27T14:00:00Z", failedCount: 0, pendingRetries: 0, priority: "medium" },
  { id: "auto-007", name: "Lead Follow-Up Reminder", description: "Send follow-up reminder to agents when a lead has had no contact in 48h.", trigger: "lead.no_contact_48h", category: "lead", enabled: true, actions: ["Check last contact date", "Send reminder to assigned agent", "Create follow-up task", "Log in CRM"], runCount: 208, successRate: 0.96, lastRun: "2026-03-29T09:00:00Z", failedCount: 8, pendingRetries: 1, priority: "medium" },
  { id: "auto-008", name: "Offer Expiration Warning", description: "Alert agent 4 hours before an offer expires without a response.", trigger: "offer.expiring_4h", category: "compliance", enabled: true, actions: ["Check offer expiration", "Alert listing agent", "Alert buyer agent", "Log warning in audit trail"], runCount: 52, successRate: 0.98, lastRun: "2026-03-29T08:30:00Z", failedCount: 1, pendingRetries: 0, priority: "critical" },
];

export const automationRuns: AutomationRun[] = [
  { id: "run-001", automationId: "auto-003", automationName: "Missing Document Alert", trigger: "document.missing_detection", status: "success", startedAt: "2026-03-29T06:00:00Z", completedAt: "2026-03-29T06:00:08Z", duration: 8000, affectedEntity: "Transaction tx-001", affectedEntityId: "tx-001", actions: [{ label: "Identify missing docs: Loan Approval Letter, Appraisal Report", status: "success" }, { label: "Notify Elena Rodriguez", status: "success" }, { label: "Create follow-up task", status: "success" }] },
  { id: "run-002", automationId: "auto-002", automationName: "Aging Listing Alert", trigger: "listing.dom_threshold (31 days)", status: "success", startedAt: "2026-03-28T07:00:00Z", completedAt: "2026-03-28T07:00:04Z", duration: 4000, affectedEntity: "Listing lst-002", affectedEntityId: "lst-002", actions: [{ label: "Create broker review task", status: "success" }, { label: "Notify Sarah Mitchell", status: "success" }, { label: "Schedule price review meeting", status: "success" }] },
  { id: "run-003", automationId: "auto-003", automationName: "Missing Document Alert", trigger: "document.missing_detection", status: "failed", startedAt: "2026-03-28T06:00:00Z", completedAt: "2026-03-28T06:00:12Z", duration: 12000, affectedEntity: "Listing lst-009", affectedEntityId: "lst-009", actions: [{ label: "Identify missing docs: HOA Financials", status: "success" }, { label: "Notify Robert Kim", status: "failed" }, { label: "Create follow-up task", status: "skipped" }], errorMessage: "Notification delivery failed — agent email bounced", retriesLeft: 2 },
  { id: "run-004", automationId: "auto-008", automationName: "Offer Expiration Warning", trigger: "offer.expiring_4h — offer-005", status: "success", startedAt: "2026-03-29T08:30:00Z", completedAt: "2026-03-29T08:30:05Z", duration: 5000, affectedEntity: "Offer offer-005", affectedEntityId: "offer-005", actions: [{ label: "Alert Amanda Foster (listing agent)", status: "success" }, { label: "Alert buyer rep — external", status: "success" }, { label: "Log warning in audit trail", status: "success" }] },
  { id: "run-005", automationId: "auto-005", automationName: "Close Date Risk Escalation", trigger: "transaction.close_date_risk — tx-001", status: "success", startedAt: "2026-03-29T08:00:00Z", completedAt: "2026-03-29T08:00:06Z", duration: 6000, affectedEntity: "Transaction tx-001", affectedEntityId: "tx-001", actions: [{ label: "Assess step completeness: 4/11 complete", status: "success" }, { label: "Calculate risk score: 72", status: "success" }, { label: "Notify broker — risk threshold exceeded", status: "success" }, { label: "Create escalation task", status: "success" }] },
  { id: "run-006", automationId: "auto-007", automationName: "Lead Follow-Up Reminder", trigger: "lead.no_contact_48h — lead-003", status: "failed", startedAt: "2026-03-29T09:00:00Z", completedAt: "2026-03-29T09:00:03Z", duration: 3000, affectedEntity: "Lead lead-003", affectedEntityId: "lead-003", actions: [{ label: "Check last contact: March 28", status: "success" }, { label: "Send reminder to David Park", status: "failed" }, { label: "Create follow-up task", status: "skipped" }], errorMessage: "CRM write failed — database timeout", retriesLeft: 3 },
];

export const riskSignals: RiskSignal[] = [
  { id: "rsig-001", type: "financing-delay", severity: "high", title: "Buyer Financing Delayed", description: "Loan underwriting at Wells Fargo is 7-10 days behind schedule. April 10 close date at risk.", entityId: "bdeal-004", entityType: "deal", entityLabel: "88 Waterfront Blvd", detectedAt: "2026-03-28T10:00:00Z", acknowledged: false, actionRequired: "Call lender today — escalate to relationship manager", assignedTo: "Elena Rodriguez", daysOpen: 2 },
  { id: "rsig-002", type: "aging-listing", severity: "critical", title: "37-Day Stale Listing", description: "55 Throckmorton Ave #204 has been on market 37 days with no offers and 2 price reductions. HOA issues adding headwind.", entityId: "lst-009", entityType: "listing", entityLabel: "55 Throckmorton, Mill Valley", detectedAt: "2026-03-21T07:00:00Z", acknowledged: false, actionRequired: "Broker consultation + strategic decision required", assignedTo: "Robert Kim", daysOpen: 9 },
  { id: "rsig-003", type: "missing-doc", severity: "high", title: "Missing Pre-Sale Inspection (lst-002)", description: "534 Maple Grove Ave has been listed for 31 days without a pre-sale inspection on file. Compliance risk.", entityId: "lst-002", entityType: "listing", entityLabel: "534 Maple Grove, Palo Alto", detectedAt: "2026-03-14T07:00:00Z", acknowledged: false, actionRequired: "Order inspection immediately — cannot close without it", assignedTo: "Sarah Mitchell", daysOpen: 15 },
  { id: "rsig-004", type: "appraisal-gap", severity: "high", title: "Appraisal Gap — $45K Shortfall", description: "77 Larkspur Way appraised at $1,830,000 — $45K below contract price of $1,875,000.", entityId: "bdeal-011", entityType: "deal", entityLabel: "77 Larkspur Way", detectedAt: "2026-03-26T14:00:00Z", acknowledged: false, actionRequired: "Negotiate resolution — seller credit or buyer covers gap", assignedTo: "Victoria Lane", daysOpen: 3 },
  { id: "rsig-005", type: "broker-approval", severity: "medium", title: "Broker Approval Required — Cash Offer", description: "Offer offer-005 on 470 Hillcrest Rd is a cash offer at $3.15M — 8.6% over ask. Requires broker sign-off before acceptance.", entityId: "offer-005", entityType: "offer", entityLabel: "Offer on 470 Hillcrest Rd", detectedAt: "2026-03-29T11:00:00Z", acknowledged: false, actionRequired: "Broker to review and approve offer immediately", assignedTo: "Broker", daysOpen: 0 },
  { id: "rsig-006", type: "overloaded-agent", severity: "medium", title: "Agent Overloaded — David Park", description: "David Park has 4 stalled deals, the lowest conversion rate on the team (29%), and 24 unworked leads. Performance intervention needed.", entityId: "agt-005", entityType: "agent", entityLabel: "David Park", detectedAt: "2026-03-27T08:00:00Z", acknowledged: false, actionRequired: "Team lead to schedule coaching session + redistribute leads", assignedTo: "Elena Rodriguez", daysOpen: 2 },
  { id: "rsig-007", type: "inspection-issue", severity: "high", title: "Foundation Cracks Found — 2240 Vallejo St", description: "General inspection at 2240 Vallejo St revealed foundation cracks. Buyer requesting seller credit or repair. Deal at risk.", entityId: "bdeal-008", entityType: "deal", entityLabel: "2240 Vallejo St", detectedAt: "2026-03-24T16:00:00Z", acknowledged: false, actionRequired: "Get structural engineer estimate — present options to buyer", assignedTo: "Sarah Mitchell", daysOpen: 5 },
  { id: "rsig-008", type: "expiring-offer", severity: "high", title: "Cash Offer Expiring in 4 Hours", description: "Brandon Lee's all-cash offer on 470 Hillcrest Rd ($3.15M) expires tonight at 11:59pm. Broker approval still pending.", entityId: "offer-005", entityType: "offer", entityLabel: "Offer on 470 Hillcrest Rd", detectedAt: "2026-03-29T20:00:00Z", acknowledged: false, actionRequired: "Get broker approval immediately or offer expires", assignedTo: "Amanda Foster", daysOpen: 0 },
];

export const brokerageSummary = {
  activeListings: listings.filter(l => l.status === "active").length,
  activeBuyers: leads.filter(l => l.type === "buyer" && ["hot", "engaged", "nurtured"].includes(l.stage)).length,
  activeDeals: brokerageDeals.filter(d => !["closed", "lost-stalled"].includes(d.stage)).length,
  pendingOffers: offers.filter(o => o.status === "pending").length,
  underContract: brokerageDeals.filter(d => ["under-contract", "clear-to-close"].includes(d.stage)).length,
  closingsThisMonth: brokerageDeals.filter(d => d.stage === "closed").length,
  pipelineValue: brokerageDeals.filter(d => !["closed", "lost-stalled"].includes(d.stage)).reduce((s, d) => s + d.price, 0),
  commissionAtRisk: brokerageDeals.filter(d => d.riskLevel === "high" || d.riskLevel === "critical").reduce((s, d) => s + d.commission, 0),
  avgDaysToClose: Math.round(agents.reduce((s, a) => s + a.avgDaysToClose, 0) / agents.length),
  stalledDeals: brokerageDeals.filter(d => d.isStalled).length,
  agingApprovals: offers.filter(o => o.brokerApprovalRequired && !o.brokerApproved).length,
  totalCommissionMTD: agents.reduce((s, a) => s + a.commissionMTD, 0),
};
