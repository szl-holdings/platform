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

export const api = {
  signals: {
    list: () => apiFetchList<LyteSignal>("/lyte/signals"),
    create: (data: Partial<LyteSignal>) => apiFetch<LyteSignal>("/lyte/signals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<LyteSignal>) => apiFetch<LyteSignal>(`/lyte/signals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/lyte/signals/${id}`, { method: "DELETE" }),
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
  executiveSummary: () => apiFetch<Record<string, unknown>>("/lyte/executive-summary"),
};
