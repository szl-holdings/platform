export type ClientTier = "Platinum" | "Diamond" | "Founding";

export type SLAStatus = "on-track" | "at-risk" | "breached";

export type RequestStatus =
  | "open"
  | "in-progress"
  | "escalated"
  | "resolved"
  | "deferred";

export type PlaybookCategory =
  | "private-travel"
  | "restaurant-access"
  | "residence-prep"
  | "gifting"
  | "events"
  | "wellness"
  | "family-office";

export type CommunicationChannel =
  | "encrypted-message"
  | "telephone"
  | "in-person"
  | "courier";

export interface HouseholdContact {
  id: string;
  name: string;
  relationship: string;
  directLine?: string;
  note?: string;
}

export interface GiftRecord {
  id: string;
  occasion: string;
  date: string;
  description: string;
  value?: string;
  recipient: string;
  note?: string;
}

export interface TravelPreferences {
  cabin: string;
  seatPreference: string;
  airlines: string[];
  hotelBrands: string[];
  dietaryRequirements: string[];
  allergies: string[];
  vehiclePreference: string;
  passportNumber?: string;
  frequentFlyerNumbers: { airline: string; number: string }[];
  notes: string;
}

export interface ResidenceDetails {
  name: string;
  address: string;
  accessCode?: string;
  houseManager?: string;
  houseManagerContact?: string;
  notes: string;
}

export interface ClientDossier {
  id: string;
  name: string;
  code: string;
  tier: ClientTier;
  since: string;
  primaryContact: string;
  conciergeDirector: string;
  household: HouseholdContact[];
  travelPreferences: TravelPreferences;
  residences: ResidenceDetails[];
  brandAffinities: string[];
  giftHistory: GiftRecord[];
  standigInstructions: string[];
  accessScope: string[];
  lastTouchpoint: string;
  openRequests: number;
  slaRisk: SLAStatus;
}

export interface PlaybookTask {
  id: string;
  order: number;
  title: string;
  description: string;
  slaDays: number;
  specialist: string;
  dependencies: string[];
  externalConnector?: string;
  connectorStatus: "active" | "stub";
}

export interface ServicePlaybook {
  id: string;
  name: string;
  category: PlaybookCategory;
  description: string;
  estimatedDays: number;
  tasks: PlaybookTask[];
  usageCount: number;
  lastUsed: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  targetField?: string;
  redacted?: boolean;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientTier: ClientTier;
  title: string;
  category: PlaybookCategory;
  playbookId?: string;
  status: RequestStatus;
  priority: "standard" | "priority" | "vip-exception";
  openedAt: string;
  slaDeadline: string;
  slaStatus: SLAStatus;
  assignedTo: string;
  escalatedTo?: string;
  escalationReason?: string;
  escalationResolvedAt?: string;
  progressPct: number;
  notes: string;
  auditTrail: AuditEntry[];
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  clientName: string;
  channel: CommunicationChannel;
  direction: "inbound" | "outbound";
  timestamp: string;
  conductor: string;
  subject: string;
  summary: string;
  redacted: boolean;
  accessScope: string[];
  linkedRequestId?: string;
  auditTrail: AuditEntry[];
}

export const CLIENT_DOSSIERS: ClientDossier[] = [
  {
    id: "c001",
    name: "Montserrat Villanueva-Arroyo",
    code: "MVA",
    tier: "Founding",
    since: "2019-03",
    primaryContact: "Valentina Ruiz (Chief of Staff)",
    conciergeDirector: "Isabella Moreno",
    household: [
      { id: "h1", name: "Eduardo Villanueva", relationship: "Spouse", directLine: "+34 91 xxx xxxx", note: "Prefers WhatsApp after 20:00 CET" },
      { id: "h2", name: "Valentina Ruiz", relationship: "Chief of Staff", directLine: "+34 91 xxx xxxx", note: "Primary point of contact for all logistics" },
      { id: "h3", name: "Lucía Villanueva", relationship: "Daughter (14)", note: "Nut allergy — strict. School schedule attached." },
    ],
    travelPreferences: {
      cabin: "First Class / Private",
      seatPreference: "Window, forward galley",
      airlines: ["Iberia (long-haul)", "NetJets (intra-Europe)"],
      hotelBrands: ["Aman", "Four Seasons", "Rosewood"],
      dietaryRequirements: ["Pescatarian", "No shellfish"],
      allergies: ["Tree nuts (anaphylactic — carry EpiPen)"],
      vehiclePreference: "Rolls-Royce Phantom or Mercedes S-Class",
      frequentFlyerNumbers: [{ airline: "Iberia", number: "IB-XXXXXX" }],
      notes: "Never connects through Heathrow. Prefers early morning departures. Family travels together whenever possible.",
    },
    residences: [
      { name: "Madrid Penthouse", address: "Paseo de la Castellana, Madrid", accessCode: "••••", houseManager: "Carmen López", houseManagerContact: "+34 xxx", notes: "Fresh orchids on arrival. Temperature set to 22°C." },
      { name: "Mallorca Estate", address: "Port Andratx, Mallorca", houseManager: "Miquel Torres", houseManagerContact: "+34 xxx", notes: "Pool temp 28°C. Preferred arrival day is Friday." },
    ],
    brandAffinities: ["Loro Piana", "Cartier", "Brunello Cucinelli", "Aman", "Dallmayr"],
    giftHistory: [
      { id: "g1", occasion: "Birthday", date: "2025-09-12", description: "Cartier Panthère bracelet, white gold", value: "€12,400", recipient: "Montserrat", note: "Delivered via private courier to Madrid penthouse." },
      { id: "g2", occasion: "Wedding Anniversary", date: "2024-06-20", description: "Aman Venice private dinner arrangement, 2 nights", value: "€9,800", recipient: "Eduardo & Montserrat" },
    ],
    standigInstructions: [
      "Always address as 'Doña Montserrat' in correspondence.",
      "All scheduling passes through Valentina Ruiz first.",
      "No media exposure — request press avoidance on any event.",
      "Lucía's nut allergy must be flagged on every catering arrangement.",
    ],
    accessScope: ["Isabella Moreno", "Carlota Jo"],
    lastTouchpoint: "2026-04-17",
    openRequests: 3,
    slaRisk: "at-risk",
  },
  {
    id: "c002",
    name: "Aleksandr Reinholt",
    code: "AR",
    tier: "Diamond",
    since: "2021-11",
    primaryContact: "Direct — Aleksandr Reinholt",
    conciergeDirector: "Carlota Jo",
    household: [
      { id: "h4", name: "Freyja Reinholt", relationship: "Partner", directLine: "+47 xxx", note: "Handles all art-related inquiries" },
    ],
    travelPreferences: {
      cabin: "Private only (Gulfstream G650 preferred)",
      seatPreference: "N/A — private",
      airlines: ["VistaJet", "NetJets"],
      hotelBrands: ["Rosewood", "The Lanesborough", "Six Senses"],
      dietaryRequirements: ["Vegan", "Organic preferred"],
      allergies: [],
      vehiclePreference: "Tesla S or Bentley Bentayga",
      frequentFlyerNumbers: [],
      notes: "Does not travel commercial. Always requires ground security sweep protocol on arrival.",
    },
    residences: [
      { name: "Oslo Residence", address: "Holmenkollen, Oslo", houseManager: "Erik Svendsen", houseManagerContact: "+47 xxx", notes: "Sauna to be pre-heated on arrival. Organic provisions stocked." },
      { name: "London Townhouse", address: "Belgravia, London", accessCode: "••••", notes: "Art climate control at 19°C, 50% humidity." },
    ],
    brandAffinities: ["Hermès", "Bottega Veneta", "Bang & Olufsen", "Dom Pérignon"],
    giftHistory: [
      { id: "g3", occasion: "New Year", date: "2026-01-01", description: "Signed limited edition print by Olafur Eliasson", value: "€8,500", recipient: "Aleksandr", note: "Freyja selected." },
    ],
    standigInstructions: [
      "Prefers encrypted Signal communications only for sensitive matters.",
      "Ground security briefing required on all new destination arrivals.",
      "No third-party contractors without written pre-approval.",
    ],
    accessScope: ["Carlota Jo"],
    lastTouchpoint: "2026-04-16",
    openRequests: 1,
    slaRisk: "on-track",
  },
  {
    id: "c003",
    name: "Priya Chandra-Mehta",
    code: "PCM",
    tier: "Platinum",
    since: "2023-02",
    primaryContact: "Rajan Mehta (EA)",
    conciergeDirector: "Isabella Moreno",
    household: [
      { id: "h5", name: "Rajan Mehta", relationship: "Executive Assistant", directLine: "+65 xxx", note: "Singapore timezone. Responds within the hour." },
      { id: "h6", name: "Aanya Chandra", relationship: "Mother", note: "Accompanies on wellness retreats." },
    ],
    travelPreferences: {
      cabin: "Business / First",
      seatPreference: "Aisle",
      airlines: ["Singapore Airlines", "Emirates"],
      hotelBrands: ["Raffles", "Mandarin Oriental", "COMO"],
      dietaryRequirements: ["Vegetarian (Jain)"],
      allergies: ["Dairy"],
      vehiclePreference: "Mercedes V-Class (with privacy glass)",
      frequentFlyerNumbers: [{ airline: "Singapore Airlines", number: "SQ-XXXXXX" }],
      notes: "Travelling with mother requires mobility assistance pre-arranged.",
    },
    residences: [
      { name: "Singapore Primary", address: "Nassim Road, Singapore", notes: "Priya's primary base. Request advance of 48h for property prep." },
    ],
    brandAffinities: ["Bulgari", "Assouline", "Aesop", "La Mer"],
    giftHistory: [],
    standigInstructions: [
      "All arrangements to be confirmed in writing with Rajan Mehta.",
      "Dietary requirements (Jain vegetarian, no dairy) must be verified with every catering team.",
    ],
    accessScope: ["Isabella Moreno", "Carlota Jo"],
    lastTouchpoint: "2026-04-14",
    openRequests: 2,
    slaRisk: "on-track",
  },
];

export const SERVICE_PLAYBOOKS: ServicePlaybook[] = [
  {
    id: "pb001",
    name: "Private Jet Arrangement",
    category: "private-travel",
    description: "End-to-end choreography for private aviation: charter sourcing, ground transport, FBO coordination, catering to dietary profile, and security sweep.",
    estimatedDays: 3,
    usageCount: 14,
    lastUsed: "2026-04-10",
    tasks: [
      { id: "t1", order: 1, title: "Itinerary confirmation & aircraft type selection", description: "Confirm travel dates, passenger manifest, and preferred aircraft category with client.", slaDays: 0.5, specialist: "Carlota Jo", dependencies: [], connectorStatus: "active" },
      { id: "t2", order: 2, title: "Charter sourcing & pricing", description: "Contact VistaJet, NetJets, and Air Partner for availability and pricing.", slaDays: 0.5, specialist: "Aviation Desk", dependencies: ["t1"], externalConnector: "VistaJet API", connectorStatus: "stub" },
      { id: "t3", order: 3, title: "Ground transport at origin & destination", description: "Pre-position vehicle aligned to client vehicle preference and flight timing.", slaDays: 1, specialist: "Ground Logistics", dependencies: ["t2"], connectorStatus: "active" },
      { id: "t4", order: 4, title: "FBO catering brief", description: "Submit dietary requirements and brand preferences to FBO catering.", slaDays: 1, specialist: "Lifestyle Desk", dependencies: ["t2"], connectorStatus: "active" },
      { id: "t5", order: 5, title: "Security sweep confirmation", description: "Brief destination ground team. Request site sweep for applicable clients.", slaDays: 1, specialist: "Security Liaison", dependencies: ["t2"], connectorStatus: "active" },
      { id: "t6", order: 6, title: "Final confirmation & travel pack", description: "Issue digital travel pack to client household contact.", slaDays: 0.5, specialist: "Carlota Jo", dependencies: ["t3", "t4", "t5"], connectorStatus: "active" },
    ],
  },
  {
    id: "pb002",
    name: "Bespoke Restaurant Access",
    category: "restaurant-access",
    description: "Securing reservations at Michelin-starred or private dining venues, including dietary pre-briefings, table preferences, and arrival discretion.",
    estimatedDays: 2,
    usageCount: 31,
    lastUsed: "2026-04-17",
    tasks: [
      { id: "t7", order: 1, title: "Venue selection & availability", description: "Review client brand affinities and identify suitable venues for occasion.", slaDays: 0.5, specialist: "Lifestyle Desk", dependencies: [], connectorStatus: "active" },
      { id: "t8", order: 2, title: "Reservation approach", description: "Contact maître d' or reservations directly on behalf of household.", slaDays: 0.5, specialist: "Lifestyle Desk", dependencies: ["t7"], externalConnector: "SevenRooms", connectorStatus: "stub" },
      { id: "t9", order: 3, title: "Dietary & allergy brief to kitchen", description: "Transmit full dietary requirements and allergy profile to head chef.", slaDays: 0.5, specialist: "Lifestyle Desk", dependencies: ["t8"], connectorStatus: "active" },
      { id: "t10", order: 4, title: "Table preference & arrival note", description: "Confirm preferred seating, arrange discreet arrival, and note wine preference to sommelier.", slaDays: 0.5, specialist: "Lifestyle Desk", dependencies: ["t8"], connectorStatus: "active" },
      { id: "t11", order: 5, title: "Day-of confirmation to household", description: "Issue confirmation and any venue-specific guidance 24h prior.", slaDays: 0.5, specialist: "Concierge Director", dependencies: ["t9", "t10"], connectorStatus: "active" },
    ],
  },
  {
    id: "pb003",
    name: "Residence Preparation",
    category: "residence-prep",
    description: "Pre-arrival orchestration for any household property: provisions, temperature, floristry, staff briefing, and security clearance.",
    estimatedDays: 2,
    usageCount: 8,
    lastUsed: "2026-03-28",
    tasks: [
      { id: "t12", order: 1, title: "Travel dates & property confirmation", description: "Confirm which residence, arrival time, and party composition with household contact.", slaDays: 0.5, specialist: "Carlota Jo", dependencies: [], connectorStatus: "active" },
      { id: "t13", order: 2, title: "House manager briefing", description: "Brief house manager on arrival party, duration, and any special requirements.", slaDays: 0.5, specialist: "Lifestyle Desk", dependencies: ["t12"], connectorStatus: "active" },
      { id: "t14", order: 3, title: "Provisions sourcing", description: "Source provisions per standing dietary instructions from client dossier.", slaDays: 1, specialist: "Lifestyle Desk", dependencies: ["t12"], connectorStatus: "active" },
      { id: "t15", order: 4, title: "Floristry & presentation", description: "Commission floristry per client preference (orchids, seasonal, etc.).", slaDays: 1, specialist: "Lifestyle Desk", dependencies: ["t12"], connectorStatus: "active" },
      { id: "t16", order: 5, title: "Pre-arrival checklist sign-off", description: "Verify all items complete with house manager 4h before arrival.", slaDays: 0.25, specialist: "Concierge Director", dependencies: ["t13", "t14", "t15"], connectorStatus: "active" },
    ],
  },
  {
    id: "pb004",
    name: "Curated Gifting",
    category: "gifting",
    description: "Selection, sourcing, personalisation, and discreet delivery of exceptional gifts, informed by gift history and brand affinities.",
    estimatedDays: 5,
    usageCount: 22,
    lastUsed: "2026-04-01",
    tasks: [
      { id: "t17", order: 1, title: "Occasion & recipient review", description: "Review gift history, brand affinities, and occasion notes from client dossier.", slaDays: 0.5, specialist: "Carlota Jo", dependencies: [], connectorStatus: "active" },
      { id: "t18", order: 2, title: "Gift curation — three proposals", description: "Prepare three gift proposals with visual references and sourcing notes.", slaDays: 1, specialist: "Lifestyle Desk", dependencies: ["t17"], connectorStatus: "active" },
      { id: "t19", order: 3, title: "Client selection", description: "Present proposals to client and receive selection.", slaDays: 1, specialist: "Concierge Director", dependencies: ["t18"], connectorStatus: "active" },
      { id: "t20", order: 4, title: "Sourcing & personalisation", description: "Source selected gift, arrange engraving or personalisation where applicable.", slaDays: 2, specialist: "Lifestyle Desk", dependencies: ["t19"], connectorStatus: "active" },
      { id: "t21", order: 5, title: "Private courier dispatch", description: "Dispatch via private courier to designated recipient address.", slaDays: 1, specialist: "Logistics Desk", dependencies: ["t20"], externalConnector: "DHL Express API", connectorStatus: "stub" },
    ],
  },
];

export const SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "r001",
    clientId: "c001",
    clientName: "Montserrat Villanueva-Arroyo",
    clientTier: "Founding",
    title: "Private jet — Madrid to Mallorca, 23 April",
    category: "private-travel",
    playbookId: "pb001",
    status: "in-progress",
    priority: "vip-exception",
    openedAt: "2026-04-15T09:30:00Z",
    slaDeadline: "2026-04-22T12:00:00Z",
    slaStatus: "at-risk",
    assignedTo: "Isabella Moreno",
    escalatedTo: "Carlota Jo",
    escalationReason: "NetJets citing limited availability on 23 April — alternative sourcing required urgently.",
    progressPct: 60,
    notes: "Lucía travelling — catering brief must include strict nut-free confirmation from FBO.",
    auditTrail: [
      { timestamp: "2026-04-15T09:30:00Z", actor: "Isabella Moreno", action: "Request opened. Playbook 'Private Jet Arrangement' initiated." },
      { timestamp: "2026-04-15T14:20:00Z", actor: "Aviation Desk", action: "NetJets capacity check completed. Limited availability flagged." },
      { timestamp: "2026-04-16T08:00:00Z", actor: "Isabella Moreno", action: "VIP exception raised. Escalated to Carlota Jo for direct vendor contact." },
      { timestamp: "2026-04-17T10:15:00Z", actor: "Carlota Jo", action: "Air Partner contacted. G550 confirmed tentatively. Awaiting hold confirmation." },
    ],
  },
  {
    id: "r002",
    clientId: "c001",
    clientName: "Montserrat Villanueva-Arroyo",
    clientTier: "Founding",
    title: "Anniversary dinner — Restaurant request, Madrid, 20 June",
    category: "restaurant-access",
    playbookId: "pb002",
    status: "open",
    priority: "priority",
    openedAt: "2026-04-18T11:00:00Z",
    slaDeadline: "2026-04-25T12:00:00Z",
    slaStatus: "on-track",
    assignedTo: "Lifestyle Desk",
    progressPct: 20,
    notes: "Eduardo's preference: DiverXO or Horcher. Montserrat's dietary restrictions apply.",
    auditTrail: [
      { timestamp: "2026-04-18T11:00:00Z", actor: "Isabella Moreno", action: "Request opened. Playbook 'Bespoke Restaurant Access' initiated." },
    ],
  },
  {
    id: "r003",
    clientId: "c002",
    clientName: "Aleksandr Reinholt",
    clientTier: "Diamond",
    title: "Oslo residence preparation — arrival 25 April",
    category: "residence-prep",
    playbookId: "pb003",
    status: "in-progress",
    priority: "priority",
    openedAt: "2026-04-16T14:00:00Z",
    slaDeadline: "2026-04-24T12:00:00Z",
    slaStatus: "on-track",
    assignedTo: "Lifestyle Desk",
    progressPct: 75,
    notes: "Organic provisions confirmed. Sauna pre-heat protocol confirmed with Erik Svendsen.",
    auditTrail: [
      { timestamp: "2026-04-16T14:00:00Z", actor: "Carlota Jo", action: "Request opened. Playbook 'Residence Preparation' initiated." },
      { timestamp: "2026-04-17T09:00:00Z", actor: "Lifestyle Desk", action: "House manager Erik Svendsen briefed. Provisions sourcing underway." },
      { timestamp: "2026-04-18T11:30:00Z", actor: "Lifestyle Desk", action: "Provisions confirmed. Floristry commissioned. Sauna protocol confirmed." },
    ],
  },
  {
    id: "r004",
    clientId: "c003",
    clientName: "Priya Chandra-Mehta",
    clientTier: "Platinum",
    title: "Gift — Rajan Mehta milestone recognition",
    category: "gifting",
    playbookId: "pb004",
    status: "open",
    priority: "standard",
    openedAt: "2026-04-18T09:00:00Z",
    slaDeadline: "2026-04-28T12:00:00Z",
    slaStatus: "on-track",
    assignedTo: "Lifestyle Desk",
    progressPct: 10,
    notes: "Rajan's 5-year service anniversary. Priya's approved budget: SGD 3,000.",
    auditTrail: [
      { timestamp: "2026-04-18T09:00:00Z", actor: "Isabella Moreno", action: "Request opened. Playbook 'Curated Gifting' initiated." },
    ],
  },
  {
    id: "r005",
    clientId: "c003",
    clientName: "Priya Chandra-Mehta",
    clientTier: "Platinum",
    title: "Singapore to London business travel — 2 May",
    category: "private-travel",
    playbookId: "pb001",
    status: "resolved",
    priority: "priority",
    openedAt: "2026-04-10T08:00:00Z",
    slaDeadline: "2026-04-20T12:00:00Z",
    slaStatus: "on-track",
    assignedTo: "Isabella Moreno",
    progressPct: 100,
    notes: "Singapore Airlines First Class confirmed. Aisle seat secured. Jain vegetarian and dairy-free catering confirmed.",
    auditTrail: [
      { timestamp: "2026-04-10T08:00:00Z", actor: "Isabella Moreno", action: "Request opened." },
      { timestamp: "2026-04-10T14:00:00Z", actor: "Aviation Desk", action: "SQ First Class confirmed. Seat 1A." },
      { timestamp: "2026-04-11T10:00:00Z", actor: "Lifestyle Desk", action: "Catering brief transmitted to Singapore Airlines." },
      { timestamp: "2026-04-12T09:00:00Z", actor: "Isabella Moreno", action: "Travel pack issued to Rajan Mehta. Request resolved." },
    ],
  },
];

export const COMMUNICATION_LOGS: CommunicationLog[] = [
  {
    id: "com001",
    clientId: "c001",
    clientName: "Montserrat Villanueva-Arroyo",
    channel: "encrypted-message",
    direction: "inbound",
    timestamp: "2026-04-17T10:05:00Z",
    conductor: "Valentina Ruiz (via Montserrat)",
    subject: "April travel — urgency note",
    summary: "Valentina conveyed that the 23 April travel window is firm due to a family commitment in Mallorca. Flexibility on aircraft type but not on date.",
    redacted: false,
    accessScope: ["Carlota Jo", "Isabella Moreno"],
    linkedRequestId: "r001",
    auditTrail: [
      { timestamp: "2026-04-17T10:05:00Z", actor: "Isabella Moreno", action: "Communication logged." },
      { timestamp: "2026-04-17T10:06:00Z", actor: "System", action: "Linked to Request r001." },
    ],
  },
  {
    id: "com002",
    clientId: "c002",
    clientName: "Aleksandr Reinholt",
    channel: "telephone",
    direction: "outbound",
    timestamp: "2026-04-16T15:30:00Z",
    conductor: "Carlota Jo",
    subject: "April return — Oslo welcome brief",
    summary: "Carlota Jo confirmed arrival logistics with Aleksandr directly. He requested the sauna pre-heat extended to 2h before arrival rather than the usual 1h. Security sweep confirmed.",
    redacted: false,
    accessScope: ["Carlota Jo"],
    linkedRequestId: "r003",
    auditTrail: [
      { timestamp: "2026-04-16T15:30:00Z", actor: "Carlota Jo", action: "Communication logged. Preference update queued for dossier." },
    ],
  },
  {
    id: "com003",
    clientId: "c001",
    clientName: "Montserrat Villanueva-Arroyo",
    channel: "in-person",
    direction: "inbound",
    timestamp: "2026-04-10T12:00:00Z",
    conductor: "Carlota Jo",
    subject: "Quarterly review — service priorities",
    summary: "[Redacted per client instruction — personal matter discussed]",
    redacted: true,
    accessScope: ["Carlota Jo"],
    linkedRequestId: undefined,
    auditTrail: [
      { timestamp: "2026-04-10T12:00:00Z", actor: "Carlota Jo", action: "Communication logged. Content redacted per standing instruction." },
    ],
  },
  {
    id: "com004",
    clientId: "c003",
    clientName: "Priya Chandra-Mehta",
    channel: "encrypted-message",
    direction: "inbound",
    timestamp: "2026-04-18T08:30:00Z",
    conductor: "Rajan Mehta",
    subject: "Gift request — Rajan milestone",
    summary: "Rajan passed on Priya's request for a recognition gift for him. He disclosed budget range (SGD 3,000) and noted a preference for something 'understated and useful'.",
    redacted: false,
    accessScope: ["Carlota Jo", "Isabella Moreno"],
    linkedRequestId: "r004",
    auditTrail: [
      { timestamp: "2026-04-18T08:30:00Z", actor: "Isabella Moreno", action: "Communication logged. Request r004 opened." },
    ],
  },
];

export function getSLALabel(status: SLAStatus): string {
  if (status === "on-track") return "Within schedule";
  if (status === "at-risk") return "Attention required";
  return "SLA breached";
}

export function getTierBadgeColor(tier: ClientTier): string {
  if (tier === "Founding") return "#7C5C2E";
  if (tier === "Diamond") return "#4A6FA5";
  return "#6B6B6B";
}

export function getRequestPriorityLabel(priority: ServiceRequest["priority"]): string {
  if (priority === "vip-exception") return "VIP Exception";
  if (priority === "priority") return "Priority";
  return "Standard";
}

export function getStatusLabel(status: RequestStatus): string {
  if (status === "open") return "Open";
  if (status === "in-progress") return "In Progress";
  if (status === "escalated") return "Escalated";
  if (status === "resolved") return "Resolved";
  return "Deferred";
}

export function getCategoryLabel(category: PlaybookCategory): string {
  const labels: Record<PlaybookCategory, string> = {
    "private-travel": "Private Travel",
    "restaurant-access": "Restaurant Access",
    "residence-prep": "Residence Preparation",
    "gifting": "Curated Gifting",
    "events": "Private Events",
    "wellness": "Wellness & Retreats",
    "family-office": "Family Office",
  };
  return labels[category] || category;
}

export function getChannelLabel(channel: CommunicationChannel): string {
  const labels: Record<CommunicationChannel, string> = {
    "encrypted-message": "Encrypted Message",
    "telephone": "Telephone",
    "in-person": "In Person",
    "courier": "Courier",
  };
  return labels[channel] || channel;
}

export const DEMO_NOTE = "DEMO DATA — all client details are illustrative and not associated with real individuals.";
