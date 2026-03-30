import { apiFetch, type PaginationMeta, type PaginatedResponse } from "@workspace/shared-ui";

async function apiFetchList<T>(path: string): Promise<T[]> {
  const json = await apiFetch<T[] | PaginatedResponse<T>>(path);
  if (json && typeof json === "object" && "data" in json && "meta" in json) {
    return (json as PaginatedResponse<T>).data;
  }
  return json as T[];
}

export interface LyteSignal {
  id: number;
  workspaceId: number;
  source: string;
  sourceType: string;
  severity: string;
  title: string;
  body?: string;
  status: string;
  metadata?: Record<string, unknown>;
  receivedAt: string;
  createdAt: string;
}

export interface LyteIncident {
  id: number;
  workspaceId: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  assignee?: string;
  signalIds?: number[];
  timeline?: unknown[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LyteRecommendation {
  id: number;
  workspaceId: number;
  incidentId?: number;
  title: string;
  description?: string;
  category: string;
  impact: string;
  effort: string;
  status: string;
  actionItems?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LytePlaybook {
  id: number;
  workspaceId: number;
  title: string;
  description?: string;
  category?: string;
  content?: string;
  triggerConditions?: Record<string, unknown>;
  steps?: unknown[];
  isActive: boolean;
  lastTriggered?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LyteCommandCard {
  id: number;
  workspaceId: number;
  title: string;
  description?: string;
  category: string;
  metricValue?: string;
  metricUnit?: string;
  trend?: string;
  trendValue?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LyteAction {
  id: number;
  workspaceId: number;
  signalId?: number;
  title: string;
  description?: string;
  signalCategory: string;
  state: string;
  priority: string;
  owner?: string;
  assignedTo?: string;
  valueAtRisk?: string;
  dueAt?: string;
  resolvedAt?: string;
  notes?: string;
  stateHistory?: unknown;
  roleVisibility?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LyteSavedView {
  id: number;
  workspaceId: number;
  userId?: number;
  name: string;
  viewType: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder: string;
  isDefault: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LyteReadinessItem {
  id: number;
  workspaceId: number;
  title: string;
  description?: string;
  itemType: string;
  status: string;
  owner?: string;
  dueAt?: string;
  readinessScore?: number;
  blockedBy?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LyteDashboard {
  signals: { total: number; critical: number; high: number; medium: number; unresolved: number };
  actions: { total: number; open: number; critical: number; inProgress: number };
  incidents: { total: number; open: number };
  readiness: { score: number; complete: number; total: number };
  fetchedAt: string;
}

export const api = {
  signals: {
    list: () => apiFetchList<LyteSignal>("/lyte/signals"),
    create: (data: Partial<LyteSignal>) => apiFetch<LyteSignal>("/lyte/signals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteSignal>) => apiFetch<LyteSignal>(`/lyte/signals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/signals/${id}`, { method: "DELETE" }),
    acknowledge: (id: number) => apiFetch<LyteSignal>(`/lyte/signals/${id}/acknowledge`, { method: "POST" }),
    assign: (id: number, assignee: string) => apiFetch<LyteSignal>(`/lyte/signals/${id}/assign`, { method: "POST", body: JSON.stringify({ assignee }) }),
    escalate: (id: number, to?: string, notes?: string) => apiFetch<LyteSignal>(`/lyte/signals/${id}/escalate`, { method: "POST", body: JSON.stringify({ escalateTo: to, notes }) }),
    resolve: (id: number, notes?: string) => apiFetch<LyteSignal>(`/lyte/signals/${id}/resolve`, { method: "POST", body: JSON.stringify({ notes }) }),
    override: (id: number, reason: string) => apiFetch<LyteSignal>(`/lyte/signals/${id}/override`, { method: "POST", body: JSON.stringify({ reason }) }),
    timeline: (id: number) => apiFetchList<unknown>(`/lyte/signals/${id}/timeline`),
    comments: (id: number) => apiFetchList<unknown>(`/lyte/signals/${id}/comments`),
    addComment: (id: number, body: string, authorName: string) => apiFetch<unknown>(`/lyte/signals/${id}/comments`, { method: "POST", body: JSON.stringify({ body, authorName, commentType: "comment" }) }),
  },
  incidents: {
    list: () => apiFetchList<LyteIncident>("/lyte/incidents"),
    create: (data: Partial<LyteIncident>) => apiFetch<LyteIncident>("/lyte/incidents", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteIncident>) => apiFetch<LyteIncident>(`/lyte/incidents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/incidents/${id}`, { method: "DELETE" }),
  },
  recommendations: {
    list: () => apiFetchList<LyteRecommendation>("/lyte/recommendations"),
    create: (data: Partial<LyteRecommendation>) => apiFetch<LyteRecommendation>("/lyte/recommendations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteRecommendation>) => apiFetch<LyteRecommendation>(`/lyte/recommendations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/recommendations/${id}`, { method: "DELETE" }),
  },
  playbooks: {
    list: () => apiFetchList<LytePlaybook>("/lyte/playbooks"),
    get: (id: number) => apiFetch<LytePlaybook>(`/lyte/playbooks/${id}`),
    create: (data: Partial<LytePlaybook>) => apiFetch<LytePlaybook>("/lyte/playbooks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LytePlaybook>) => apiFetch<LytePlaybook>(`/lyte/playbooks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/playbooks/${id}`, { method: "DELETE" }),
  },
  commandCards: {
    list: () => apiFetchList<LyteCommandCard>("/lyte/command-cards"),
    create: (data: Partial<LyteCommandCard>) => apiFetch<LyteCommandCard>("/lyte/command-cards", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteCommandCard>) => apiFetch<LyteCommandCard>(`/lyte/command-cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/command-cards/${id}`, { method: "DELETE" }),
  },
  actions: {
    list: (workspaceId?: number) => apiFetchList<LyteAction>(`/lyte/actions${workspaceId ? `?workspaceId=${workspaceId}` : ""}`),
    get: (id: number) => apiFetch<LyteAction>(`/lyte/actions/${id}`),
    create: (data: Partial<LyteAction>) => apiFetch<LyteAction>("/lyte/actions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteAction>) => apiFetch<LyteAction>(`/lyte/actions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/actions/${id}`, { method: "DELETE" }),
  },
  savedViews: {
    list: (workspaceId?: number) => apiFetchList<LyteSavedView>(`/lyte/saved-views${workspaceId ? `?workspaceId=${workspaceId}` : ""}`),
    create: (data: Partial<LyteSavedView>) => apiFetch<LyteSavedView>("/lyte/saved-views", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteSavedView>) => apiFetch<LyteSavedView>(`/lyte/saved-views/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/saved-views/${id}`, { method: "DELETE" }),
  },
  readiness: {
    list: (workspaceId?: number) => apiFetchList<LyteReadinessItem>(`/lyte/readiness${workspaceId ? `?workspaceId=${workspaceId}` : ""}`),
    get: (id: number) => apiFetch<LyteReadinessItem>(`/lyte/readiness/${id}`),
    create: (data: Partial<LyteReadinessItem>) => apiFetch<LyteReadinessItem>("/lyte/readiness", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteReadinessItem>) => apiFetch<LyteReadinessItem>(`/lyte/readiness/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/readiness/${id}`, { method: "DELETE" }),
    score: (workspaceId?: number) => apiFetch<{ score: number; breakdown: unknown[]; readyCount: number; totalItems: number; lastUpdated: string }>(`/lyte/readiness/score${workspaceId ? `?workspaceId=${workspaceId}` : ""}`),
  },
  dashboard: () => apiFetch<LyteDashboard>("/lyte/dashboard"),
  executiveSummary: () => apiFetch<Record<string, unknown>>("/lyte/executive-summary"),
  insights: () => apiFetch<{ narratives: unknown[]; fetchedAt: string }>("/lyte/insights"),
  live: {
    techNews: () => apiFetch<any>("/lyte/live/tech-news"),
    blsEmployment: () => apiFetch<any>("/lyte/live/bls-employment"),
    githubTrending: (language?: string) =>
      apiFetch<any>(`/lyte/live/github-trending${language ? `?language=${encodeURIComponent(language)}` : ""}`),
  },
};
