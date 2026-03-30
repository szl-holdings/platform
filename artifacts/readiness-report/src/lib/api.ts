import { apiFetch, type PaginationMeta, type PaginatedResponse } from "@workspace/shared-ui";

export interface ReadinessProgram {
  id: number;
  name: string;
  description?: string;
  overallScore?: string;
  targetScore?: string;
  status: string;
  owner?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessDimension {
  id: number;
  programId: number;
  name: string;
  description?: string;
  weight?: string;
  currentScore?: string;
  targetScore?: string;
  status: string;
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessScoreHistory {
  id: number;
  dimensionId: number;
  programId: number;
  score: string;
  recordedAt: string;
  notes?: string;
  createdAt: string;
}

export interface ReadinessMilestone {
  id: number;
  programId: number;
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  completedDate?: string;
  owner?: string;
  dependencies?: unknown[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReadinessRisk {
  id: number;
  programId: number;
  dimensionId?: number;
  title: string;
  description?: string;
  severity: string;
  likelihood: string;
  impact: string;
  status: string;
  owner?: string;
  mitigationPlan?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReadinessAlert {
  id: number;
  programId: number;
  dimensionId?: number;
  type: string;
  title: string;
  message?: string;
  severity: string;
  status: string;
  isRead?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const api = {
  programs: {
    list: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return apiFetch<{ data: ReadinessProgram[]; meta: PaginationMeta }>(`/readiness/programs${q ? `?${q}` : ""}`);
    },
    get: (id: number) => apiFetch<ReadinessProgram>(`/readiness/programs/${id}`),
    create: (data: Partial<ReadinessProgram>) => apiFetch<ReadinessProgram>("/readiness/programs", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReadinessProgram>) => apiFetch<ReadinessProgram>(`/readiness/programs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/readiness/programs/${id}`, { method: "DELETE" }),
  },
  dimensions: {
    listForProgram: (programId: number) => apiFetch<ReadinessDimension[]>(`/readiness/programs/${programId}/dimensions`),
    create: (data: Partial<ReadinessDimension>) => apiFetch<ReadinessDimension>("/readiness/dimensions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReadinessDimension>) => apiFetch<ReadinessDimension>(`/readiness/dimensions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/readiness/dimensions/${id}`, { method: "DELETE" }),
    scores: (dimensionId: number) => apiFetch<ReadinessScoreHistory[]>(`/readiness/dimensions/${dimensionId}/scores`),
  },
  scores: {
    create: (data: Partial<ReadinessScoreHistory>) => apiFetch<ReadinessScoreHistory>("/readiness/scores", { method: "POST", body: JSON.stringify(data) }),
  },
  milestones: {
    listForProgram: (programId: number) => apiFetch<ReadinessMilestone[]>(`/readiness/programs/${programId}/milestones`),
    create: (data: Partial<ReadinessMilestone>) => apiFetch<ReadinessMilestone>("/readiness/milestones", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReadinessMilestone>) => apiFetch<ReadinessMilestone>(`/readiness/milestones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/readiness/milestones/${id}`, { method: "DELETE" }),
  },
  risks: {
    listForProgram: (programId: number) => apiFetch<ReadinessRisk[]>(`/readiness/programs/${programId}/risks`),
    create: (data: Partial<ReadinessRisk>) => apiFetch<ReadinessRisk>("/readiness/risks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReadinessRisk>) => apiFetch<ReadinessRisk>(`/readiness/risks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/readiness/risks/${id}`, { method: "DELETE" }),
  },
  alerts: {
    listForProgram: (programId: number) => apiFetch<ReadinessAlert[]>(`/readiness/programs/${programId}/alerts`),
    create: (data: Partial<ReadinessAlert>) => apiFetch<ReadinessAlert>("/readiness/alerts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReadinessAlert>) => apiFetch<ReadinessAlert>(`/readiness/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/readiness/alerts/${id}`, { method: "DELETE" }),
  },
  executiveRollup: () => apiFetch<Record<string, unknown>>("/readiness/executive-rollup"),
};
