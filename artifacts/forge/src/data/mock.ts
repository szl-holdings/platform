export type Domain = "vessels" | "terra" | "legal" | "security";

export interface ClientProfile {
  id: string;
  name: string;
  companyName: string;
  email: string;
  relationship: string;
  memberSince: string;
  tier: "platinum" | "gold" | "silver";
  domains: Domain[];
  avatarInitials: string;
}

export interface DomainCard {
  domain: Domain;
  label: string;
  summary: string;
  metrics: { label: string; value: string; delta?: string; up?: boolean }[];
  status: "active" | "attention" | "critical";
  lastUpdated: string;
}

export interface PortfolioHolding {
  id: string;
  name: string;
  domain: Domain;
  capitalDeployed: number;
  currentValue: number;
  irr: string;
  vintage: string;
  status: "active" | "exited" | "pending";
}

export interface LegalMatter {
  id: string;
  title: string;
  type: string;
  status: "active" | "pending" | "resolved" | "on-hold";
  nextDeadline: string;
  recoveryProgress: number;
  leadAttorney: string;
  openedDate: string;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  domain: "vessels" | "terra";
  type: string;
  status: "active" | "docked" | "transit" | "listed" | "under-contract";
  value: string;
  lastUpdate: string;
  location: string;
  alert?: string;
}

export interface Document {
  id: string;
  title: string;
  domain: Domain | "general";
  type: "report" | "filing" | "contract" | "briefing" | "invoice";
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  version: string;
}

export interface Message {
  id: string;
  from: string;
  fromRole: string;
  content: string;
  timestamp: string;
  isClient: boolean;
  read: boolean;
}

export const CLIENT: ClientProfile = {
  id: "c001",
  name: "Marcus Hale",
  companyName: "Hale Capital Partners",
  email: "m.hale@halecap.com",
  relationship: "Managing Director — Investments",
  memberSince: "2021",
  tier: "platinum",
  domains: ["vessels", "terra", "legal", "security"],
  avatarInitials: "MH",
};

export const DOMAIN_CARDS: DomainCard[] = [
  {
    domain: "vessels",
    label: "Maritime",
    summary: "Vessel fleet tracking & voyage intelligence",
    metrics: [
      { label: "Active Vessels", value: "4", delta: "+1", up: true },
      { label: "Avg. ETA Accuracy", value: "97.2%", delta: "+1.4%", up: true },
      { label: "Cargo Value at Sea", value: "$48.3M" },
    ],
    status: "active",
    lastUpdated: "2 min ago",
  },
  {
    domain: "terra",
    label: "Real Estate",
    summary: "Property portfolio & market intelligence",
    metrics: [
      { label: "Portfolio NAV", value: "$142.8M", delta: "+3.2%", up: true },
      { label: "Active Properties", value: "12" },
      { label: "Avg. Cap Rate", value: "6.4%", delta: "-0.1%", up: false },
    ],
    status: "active",
    lastUpdated: "1 hr ago",
  },
  {
    domain: "legal",
    label: "Legal",
    summary: "Active matters & recovery management",
    metrics: [
      { label: "Active Matters", value: "3" },
      { label: "Next Deadline", value: "Apr 18" },
      { label: "Recovery Rate", value: "84%" },
    ],
    status: "attention",
    lastUpdated: "4 hr ago",
  },
  {
    domain: "security",
    label: "Security",
    summary: "Cyber posture & threat monitoring",
    metrics: [
      { label: "Risk Score", value: "Low" },
      { label: "Open Incidents", value: "0" },
      { label: "Compliance", value: "SOC 2 ✓" },
    ],
    status: "active",
    lastUpdated: "5 min ago",
  },
];

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  { id: "p001", name: "Meridian Logistics Fleet", domain: "vessels", capitalDeployed: 22000000, currentValue: 26400000, irr: "12.8%", vintage: "2022", status: "active" },
  { id: "p002", name: "Harborview Industrial REIT", domain: "terra", capitalDeployed: 15000000, currentValue: 18750000, irr: "11.2%", vintage: "2021", status: "active" },
  { id: "p003", name: "Pacific Gateway Terminal", domain: "vessels", capitalDeployed: 8000000, currentValue: 9600000, irr: "9.6%", vintage: "2023", status: "active" },
  { id: "p004", name: "Coastal Office Portfolio", domain: "terra", capitalDeployed: 30000000, currentValue: 31500000, irr: "4.8%", vintage: "2020", status: "active" },
  { id: "p005", name: "Atlas Container Lines", domain: "vessels", capitalDeployed: 12000000, currentValue: 14880000, irr: "14.2%", vintage: "2022", status: "active" },
  { id: "p006", name: "Sunbelt Logistics Park", domain: "terra", capitalDeployed: 18000000, currentValue: 21600000, irr: "10.5%", vintage: "2021", status: "active" },
  { id: "p007", name: "Apex Dry-Bulk Carrier", domain: "vessels", capitalDeployed: 5000000, currentValue: 5350000, irr: "2.1%", vintage: "2023", status: "active" },
  { id: "p008", name: "Northgate Distribution Hub", domain: "terra", capitalDeployed: 9000000, currentValue: 10800000, irr: "8.9%", vintage: "2023", status: "active" },
];

export const LEGAL_MATTERS: LegalMatter[] = [
  {
    id: "m001",
    title: "Hale v. Meridian Shipping Co.",
    type: "Commercial Arbitration",
    status: "active",
    nextDeadline: "April 18, 2026",
    recoveryProgress: 72,
    leadAttorney: "Prism Counsel — A. Torres",
    openedDate: "Jan 14, 2025",
    description: "Cargo damage claim arising from voyage #MRD-2024-441. Seeking recovery of $4.2M in damaged cargo value plus consequential losses.",
  },
  {
    id: "m002",
    title: "Re: Harborview Lease Dispute",
    type: "Real Estate Litigation",
    status: "pending",
    nextDeadline: "May 6, 2026",
    recoveryProgress: 28,
    leadAttorney: "Prism Counsel — R. Osei",
    openedDate: "Mar 2, 2026",
    description: "Disputed lease termination clause affecting three industrial units in the Harborview portfolio. Mediation scheduled.",
  },
  {
    id: "m003",
    title: "Insurance Subrogation — Pacific Gateway",
    type: "Insurance Recovery",
    status: "active",
    nextDeadline: "June 12, 2026",
    recoveryProgress: 51,
    leadAttorney: "Prism Counsel — D. Nguen",
    openedDate: "Nov 8, 2024",
    description: "Subrogation claim against equipment manufacturer following terminal incident at Pacific Gateway facility. $1.8M recovery target.",
  },
];

export const ASSETS: Asset[] = [
  { id: "a001", name: "MV Meridian Star", domain: "vessels", type: "Container Vessel", status: "transit", value: "$12.4M", lastUpdate: "4 min ago", location: "Pacific Ocean — 38.2°N 144.8°E" },
  { id: "a002", name: "MV Pacific Pioneer", domain: "vessels", type: "Bulk Carrier", status: "docked", value: "$8.6M", lastUpdate: "1 hr ago", location: "Port of Los Angeles" },
  { id: "a003", name: "Atlas Condor", domain: "vessels", type: "Container Vessel", status: "transit", value: "$9.1M", lastUpdate: "8 min ago", location: "Indian Ocean — 12.4°S 88.2°E" },
  { id: "a004", name: "MV North Shore", domain: "vessels", type: "Dry-Bulk", status: "docked", value: "$5.2M", lastUpdate: "2 hr ago", location: "Port of Seattle", alert: "Inspection scheduled Apr 15" },
  { id: "a005", name: "Harborview Industrial — Unit 1", domain: "terra", type: "Industrial", status: "active", value: "$8.2M", lastUpdate: "Today", location: "Long Beach, CA" },
  { id: "a006", name: "Harborview Industrial — Unit 2", domain: "terra", type: "Industrial", status: "active", value: "$7.6M", lastUpdate: "Today", location: "Long Beach, CA" },
  { id: "a007", name: "Coastal Office — Block A", domain: "terra", type: "Office", status: "under-contract", value: "$14.8M", lastUpdate: "Yesterday", location: "San Francisco, CA", alert: "Under LOI — due diligence" },
  { id: "a008", name: "Sunbelt Logistics Park", domain: "terra", type: "Industrial", status: "active", value: "$21.6M", lastUpdate: "Today", location: "Phoenix, AZ" },
];

export const DOCUMENTS: Document[] = [
  { id: "d001", title: "Q1 2026 Portfolio Performance Report", domain: "general", type: "report", uploadedBy: "SZL Investment Team", uploadedDate: "Apr 10, 2026", size: "2.4 MB", version: "v1.0" },
  { id: "d002", title: "Meridian Shipping Co. — Arbitration Brief", domain: "legal", type: "briefing", uploadedBy: "Prism Counsel", uploadedDate: "Apr 8, 2026", size: "840 KB", version: "v2.1" },
  { id: "d003", title: "Harborview Portfolio Valuation — Mar 2026", domain: "terra", type: "report", uploadedBy: "SZL Terra Team", uploadedDate: "Apr 1, 2026", size: "1.8 MB", version: "v1.0" },
  { id: "d004", title: "MV Meridian Star — Voyage Charter Agreement", domain: "vessels", type: "contract", uploadedBy: "SZL Vessels Team", uploadedDate: "Mar 28, 2026", size: "620 KB", version: "v1.2" },
  { id: "d005", title: "Pacific Gateway — Insurance Claim Filing", domain: "legal", type: "filing", uploadedBy: "Prism Counsel", uploadedDate: "Mar 22, 2026", size: "1.1 MB", version: "v1.0" },
  { id: "d006", title: "Aegis Security Posture Report — Q1 2026", domain: "security", type: "report", uploadedBy: "Aegis Team", uploadedDate: "Mar 31, 2026", size: "950 KB", version: "v1.0" },
  { id: "d007", title: "Sunbelt Logistics Park — Lease Abstracts", domain: "terra", type: "contract", uploadedBy: "SZL Terra Team", uploadedDate: "Mar 18, 2026", size: "430 KB", version: "v3.0" },
  { id: "d008", title: "Hale Capital — Annual Investor Statement 2025", domain: "general", type: "report", uploadedBy: "SZL Finance", uploadedDate: "Feb 28, 2026", size: "3.2 MB", version: "v1.0" },
];

export const MESSAGES: Message[] = [
  {
    id: "msg001",
    from: "Alexandra Torres",
    fromRole: "Senior Partner, Prism Counsel",
    content: "Marcus — the arbitration brief for Meridian has been filed. The opposing party has 14 days to respond. We expect the full hearing in early June. I've uploaded the filing to your Document Vault for review.",
    timestamp: "Today 10:22 AM",
    isClient: false,
    read: true,
  },
  {
    id: "msg002",
    from: "You",
    fromRole: "Hale Capital Partners",
    content: "Thank you Alexandra. Please confirm the hearing dates once scheduled. Also, are there any outstanding items we need to prepare before the response period ends?",
    timestamp: "Today 10:45 AM",
    isClient: true,
    read: true,
  },
  {
    id: "msg003",
    from: "Alexandra Torres",
    fromRole: "Senior Partner, Prism Counsel",
    content: "I'll coordinate with the arbitration panel and get dates confirmed by end of week. In the meantime, please review the exhibits list I've uploaded — we may need additional documentation from your charter logs.",
    timestamp: "Today 11:03 AM",
    isClient: false,
    read: true,
  },
  {
    id: "msg004",
    from: "James Wei",
    fromRole: "VP Investments, SZL Holdings",
    content: "Marcus, the Q1 portfolio report is now live in your Document Vault. Net returns came in at 11.8% blended across your holdings — outperforming our 9.5% target. Happy to walk through the numbers on a call.",
    timestamp: "Yesterday 4:15 PM",
    isClient: false,
    read: false,
  },
  {
    id: "msg005",
    from: "Rachel Osei",
    fromRole: "Associate, Prism Counsel",
    content: "Per our earlier discussion — the mediation for the Harborview lease dispute has been scheduled for May 6 in San Francisco. We recommend you attend in person if possible.",
    timestamp: "Apr 10, 3:28 PM",
    isClient: false,
    read: false,
  },
];

export const TREND_DATA = [
  { month: "Oct", value: 105 },
  { month: "Nov", value: 108 },
  { month: "Dec", value: 106 },
  { month: "Jan", value: 112 },
  { month: "Feb", value: 118 },
  { month: "Mar", value: 124 },
  { month: "Apr", value: 131 },
];

export const DOMAIN_RETURNS = [
  { domain: "Maritime", irr: 12.8, capital: 47, color: "var(--color-forge-vessels)" },
  { domain: "Real Estate", irr: 8.1, capital: 72, color: "var(--color-forge-terra)" },
];

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function totalDeployed(): number {
  return PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.capitalDeployed, 0);
}

export function totalValue(): number {
  return PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.currentValue, 0);
}

export function totalGain(): number {
  return totalValue() - totalDeployed();
}

export function totalReturn(): string {
  const g = ((totalValue() - totalDeployed()) / totalDeployed()) * 100;
  return g.toFixed(1) + "%";
}
