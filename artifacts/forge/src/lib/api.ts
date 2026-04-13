const API_BASE = import.meta.env.BASE_URL
  ? `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/../../api`
  : "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: { error?: string; code?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, body.code, body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const portalApi = {
  getDashboard: () => request<DashboardData>("/forge-portal/dashboard"),
  getMe: () => request<ClientProfile>("/forge-portal/me"),

  getPortfolio: (params?: { domain?: string; status?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<PortfolioResponse>(`/forge-portal/portfolio${qs}`);
  },

  getMatters: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : "";
    return request<MattersResponse>(`/forge-portal/matters${qs}`);
  },
  getMatter: (id: string) => request<LegalMatter>(`/forge-portal/matters/${id}`),

  getAssets: (params?: { domain?: string; status?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<AssetsResponse>(`/forge-portal/assets${qs}`);
  },
  getAsset: (id: string) => request<PortalAsset>(`/forge-portal/assets/${id}`),
  updateAssetThreshold: (id: string, threshold: number) =>
    request<{ id: string; notificationThreshold: number }>(`/forge-portal/assets/${id}/threshold`, {
      method: "PATCH",
      body: JSON.stringify({ threshold }),
    }),

  getDocuments: (params?: { domain?: string; type?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<DocumentsResponse>(`/forge-portal/documents${qs}`);
  },
  getDocument: (id: string) => request<PortalDocument>(`/forge-portal/documents/${id}`),
  uploadDocument: (data: { title: string; domain: string; type: string; size?: string }) =>
    request<Omit<PortalDocument, "accessLog" | "clientId">>("/forge-portal/documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMessages: () => request<MessagesResponse>("/forge-portal/messages"),
  getThread: (id: string) => request<MessageThread>(`/forge-portal/messages/${id}`),
  replyToThread: (id: string, content: string) =>
    request<Message>(`/forge-portal/messages/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  newThread: (subject: string, content: string) =>
    request<{ id: string; subject: string; status: string }>("/forge-portal/messages", {
      method: "POST",
      body: JSON.stringify({ subject, content }),
    }),

  getOnboardingStatus: () => request<OnboardingStatus>("/forge-portal/onboarding/status"),
  submitOnboardingStep: (step: number, data: Record<string, unknown>) =>
    request<OnboardingStatus>("/forge-portal/onboarding/submit", {
      method: "POST",
      body: JSON.stringify({ step, data }),
    }),

  getHealthScore: () => request<ClientHealthScore>("/forge-portal/health-score"),

  getProposals: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : "";
    return request<ProposalsResponse>(`/forge-portal/proposals${qs}`);
  },
  getProposal: (id: string) => request<Proposal>(`/forge-portal/proposals/${id}`),
  generateProposal: (data: { title: string; type?: string; domains?: string[]; description?: string }) =>
    request<Proposal>("/forge-portal/proposals/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  acceptProposal: (id: string) =>
    request<Proposal>(`/forge-portal/proposals/${id}/accept`, { method: "PATCH" }),

  getPackages: () => request<PackagesResponse>("/forge-portal/packages"),
  getPackage: (id: string) => request<IntelligencePackage>(`/forge-portal/packages/${id}`),
  subscribeToPackage: (id: string, billingCycle: "monthly" | "annual") =>
    request<PackageSubscription>(`/forge-portal/packages/${id}/subscribe`, {
      method: "POST",
      body: JSON.stringify({ billingCycle }),
    }),

  getCommunications: (params?: { type?: string; domain?: string; status?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<CommunicationsResponse>(`/forge-portal/communications${qs}`);
  },
  getCommunication: (id: string) => request<CommunicationItem>(`/forge-portal/communications/${id}`),
  getCommunicationPreferences: () => request<CommunicationPreferences>("/forge-portal/communications/preferences"),
  updateCommunicationPreferences: (prefs: Partial<CommunicationPreferences>) =>
    request<CommunicationPreferences>("/forge-portal/communications/preferences", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    }),

  getRevenueSummary: () => request<RevenueSummary>("/forge-portal/revenue/summary"),

  getUpgrades: () => request<UpgradesResponse>("/forge-portal/upgrades"),
  requestUpgrade: (upgradeId: string, type: string, details?: Record<string, unknown>) =>
    request<UpgradeRequestResult>("/forge-portal/upgrades/request", {
      method: "POST",
      body: JSON.stringify({ upgradeId, type, details }),
    }),
};

// ─── Types shared with mock.ts for smooth migration ───────────────────────

export type Domain = "vessels" | "terra" | "legal" | "security";

export interface ClientProfile {
  id: string;
  userId: number;
  name: string;
  companyName: string;
  email: string;
  relationship: string;
  memberSince: string;
  tier: "platinum" | "gold" | "silver";
  domains: Domain[];
  avatarInitials: string;
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

export interface PortfolioResponse {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalDeployed: number;
  count: number;
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

export interface MattersResponse {
  matters: LegalMatter[];
  count: number;
}

export interface PortalAsset {
  id: string;
  name: string;
  domain: "vessels" | "terra";
  type: string;
  status: "active" | "docked" | "transit" | "listed" | "under-contract";
  value: string;
  lastUpdate: string;
  location: string;
  alert?: string;
  notificationThreshold?: number;
}

export interface AssetsResponse {
  assets: PortalAsset[];
  count: number;
}

export interface PortalDocument {
  id: string;
  title: string;
  domain: Domain | "general";
  type: "report" | "filing" | "contract" | "briefing" | "invoice";
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  version: string;
  accessLog?: { userId: number; accessedAt: string }[];
}

export interface DocumentsResponse {
  documents: PortalDocument[];
  count: number;
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

export interface ThreadSummary {
  id: string;
  subject: string;
  status: "open" | "resolved" | "archived";
  participants: { name: string; role: string; isClient: boolean }[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  status: "open" | "resolved" | "archived";
  participants: { name: string; role: string; isClient: boolean }[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  threads: ThreadSummary[];
  totalUnread: number;
  count: number;
}

export interface DashboardData {
  client: ClientProfile;
  summary: {
    totalValue: number;
    totalDeployed: number;
    totalReturn: string;
    openMatters: number;
    unreadMessages: number;
  };
  nextDeadline: {
    title: string;
    date: string;
    leadAttorney: string;
  } | null;
  recentActivity: {
    type: string;
    description: string;
    date: string;
  }[];
  demoMode?: boolean;
}

export interface OnboardingStatus {
  id?: string;
  status: "not_started" | "in_progress" | "completed" | "pending_review";
  currentStep: number;
  totalSteps: number;
  companyProfile?: {
    name: string;
    industry: string;
    size: string;
    website: string;
    headquarters: string;
  } | null;
  domainInterests?: Domain[];
  kycStatus?: string;
  kycDocuments?: { name: string; type: string; uploadedAt: string; status: string }[];
  portfolioConfig?: {
    investmentHorizon: string;
    riskProfile: string;
    targetAllocation: Record<string, number>;
  } | null;
  teamInvitations?: { email: string; role: string; status: string; sentAt: string }[];
  billingSetup?: {
    tier: string;
    billingCycle: string;
    stripeCustomerId: string | null;
  } | null;
  startedAt?: string;
  completedAt?: string | null;
}

export interface ClientHealthScore {
  clientId: string;
  overallScore: number;
  trend: "improving" | "stable" | "declining";
  trendDelta: number;
  dimensions: {
    engagement: number;
    adoption: number;
    satisfaction: number;
    growth: number;
    billing: number;
  };
  riskLevel: "low" | "medium" | "high" | "critical";
  churnProbability: number;
  daysSinceLastLogin: number;
  reportsViewedLast30d: number;
  featuresAdopted: number;
  totalFeatures: number;
  supportTicketsOpen: number;
  npsScore: number | null;
  recommendations: { action: string; impact: string; priority: "high" | "medium" | "low" }[];
  computedAt: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  title: string;
  type: "consulting" | "advisory" | "intelligence" | "custom";
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  executiveSummary: string;
  services: { name: string; description: string; deliverables: string[] }[];
  timeline: { phase: string; duration: string; milestones: string[] }[];
  pricing: {
    total: number;
    currency: string;
    breakdown: { item: string; amount: number }[];
    paymentTerms: string;
  };
  validUntil: string;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
}

export interface ProposalsResponse {
  proposals: Proposal[];
  count: number;
}

export interface IntelligencePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  domains: Domain[];
  tier: "starter" | "professional" | "enterprise";
  features: { name: string; description: string; included: boolean }[];
  deliverables: { name: string; frequency: string }[];
  pricing: { monthly: number; annual: number; currency: string };
  agentWorkflows: string[];
  usageLimits: { metric: string; limit: number; unit: string }[];
  subscriberCount: number;
}

export interface PackagesResponse {
  packages: IntelligencePackage[];
  count: number;
}

export interface PackageSubscription {
  subscriptionId: string;
  packageId: string;
  packageName: string;
  billingCycle: string;
  price: number;
  currency: string;
  status: string;
  activatedAt: string;
  agentWorkflows: string[];
}

export interface CommunicationItem {
  id: string;
  clientId: string;
  type: "briefing" | "alert" | "milestone" | "newsletter" | "report";
  subject: string;
  summary: string;
  body: string;
  domain: Domain | "general";
  priority: "urgent" | "high" | "normal" | "low";
  status: "scheduled" | "sent" | "read" | "archived";
  scheduledAt: string;
  sentAt: string | null;
  readAt: string | null;
  metadata: Record<string, unknown>;
}

export interface CommunicationsResponse {
  communications: CommunicationItem[];
  unread: number;
  count: number;
}

export interface CommunicationPreferences {
  clientId: string;
  briefingFrequency: "daily" | "weekly" | "monthly";
  alertThreshold: "all" | "high" | "critical";
  newsletterOptIn: boolean;
  emailNotifications: boolean;
  inPortalNotifications: boolean;
  domainPreferences: Record<Domain, boolean>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface RevenueSummary {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  totalClients: number;
  activeClients: number;
  churnRate: number;
  avgLtv: number;
  avgContractValue: number;
  pipeline: { prospects: number; onboarding: number; active: number; expanded: number; churned: number };
  revenueByDomain: { domain: string; revenue: number; percentage: number; clients: number }[];
  revenueByPackage: { package: string; revenue: number; subscribers: number }[];
  monthlyTrend: { month: string; mrr: number; clients: number }[];
  churnRisk: { low: number; medium: number; high: number; critical: number };
  upsellOpportunities: { clientName: string; currentPackage: string; recommended: string; incrementalMrr: number; probability: number }[];
  aiAttributedRevenue: { total: number; percentage: number; topInsights: { insight: string; attributedRevenue: number }[] };
  computedAt: string;
}

export interface UpgradesResponse {
  currentTier: string;
  currentDomains: string[];
  currentPackages: { id: string; name: string; status: string; since: string }[];
  availableUpgrades: {
    id: string;
    type: string;
    name: string;
    description: string;
    currentCost: number;
    upgradeCost: number;
    incrementalCost: number;
    currency: string;
    benefits: string[];
  }[];
  seatManagement: { currentSeats: number; maxSeats: number; pricePerSeat: number; currency: string };
  customAgentDeployment: { available: boolean; basePrice: number; currency: string; description: string; examples: string[] };
}

export interface UpgradeRequestResult {
  requestId: string;
  upgradeId: string;
  type: string;
  status: string;
  estimatedActivation: string;
  message: string;
  requestedAt: string;
}
