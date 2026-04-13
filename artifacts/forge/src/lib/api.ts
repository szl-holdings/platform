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
