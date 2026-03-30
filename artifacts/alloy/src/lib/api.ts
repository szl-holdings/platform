import { apiFetch } from "@workspace/shared-ui";

export interface AlloyWorkflow {
  id: number;
  orgId?: number;
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  steps?: unknown[];
  outputType: string;
  requiresApproval: boolean;
  approverRole?: string;
  isActive: boolean;
  runCount: number;
  lastRunAt?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlloySignal {
  id: number;
  orgId?: number;
  source: string;
  sourceType: string;
  severity: string;
  title: string;
  body?: string;
  status: string;
  normalizedScore?: string;
  valueAtRisk?: string;
  metadata?: Record<string, unknown>;
  receivedAt: string;
  processedAt?: string;
}

export interface AlloyWorkflowRun {
  id: number;
  workflowId: number;
  signalId?: number;
  triggeredBy?: number;
  state: string;
  input?: unknown;
  output?: unknown;
  errorMessage?: string;
  retryCount: number;
  durationMs?: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AlloyArtifact {
  id: number;
  workflowRunId?: number;
  workflowId?: number;
  orgId?: number;
  title: string;
  artifactType: string;
  content?: unknown;
  status: string;
  approvalStatus: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlloyDashboard {
  summary: {
    activeWorkflows: number;
    totalRuns: number;
    pendingApprovals: number;
    totalSignals: number;
    newSignals: number;
    totalArtifacts: number;
  };
  recentRuns: AlloyWorkflowRun[];
  pendingArtifacts: AlloyArtifact[];
  signalsBySeverity: Record<string, number>;
  runsByState: Record<string, number>;
  fetchedAt: string;
}

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  roles: string[];
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string | null;
}

export interface AdminSystemHealth {
  status: string;
  timestamp: string;
  database: { connected: boolean; latencyMs?: number };
  services: { name: string; status: string; latencyMs?: number }[];
}

function unwrapList<T>(res: { data: T[] } | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export const alloyApi = {
  dashboard: () => apiFetch<AlloyDashboard>("/alloy/dashboard"),

  workflows: {
    list: () => apiFetch<{ data: AlloyWorkflow[] } | AlloyWorkflow[]>("/alloy/workflows").then(unwrapList),
    get: (id: number) => apiFetch<AlloyWorkflow>(`/alloy/workflows/${id}`),
    create: (data: Partial<AlloyWorkflow>) => apiFetch<AlloyWorkflow>("/alloy/workflows", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<AlloyWorkflow>) => apiFetch<AlloyWorkflow>(`/alloy/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ deleted: boolean }>(`/alloy/workflows/${id}`, { method: "DELETE" }),
    trigger: (id: number, input?: Record<string, unknown>) =>
      apiFetch<AlloyWorkflowRun>(`/alloy/workflows/${id}/run`, { method: "POST", body: JSON.stringify({ input }) }),
    runs: (id: number) =>
      apiFetch<{ data: AlloyWorkflowRun[] } | AlloyWorkflowRun[]>(`/alloy/runs?workflowId=${id}`).then(unwrapList),
  },

  signals: {
    list: (params?: { status?: string; severity?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.severity) q.set("severity", params.severity);
      const qs = q.toString();
      return apiFetch<{ data: AlloySignal[] } | AlloySignal[]>(`/alloy/signals${qs ? `?${qs}` : ""}`).then(unwrapList);
    },
    ingest: (signal: { source: string; sourceType: string; title: string; severity?: string; body?: string; valueAtRisk?: number }) =>
      apiFetch<{ signal: AlloySignal; triggeredWorkflows: number }>("/alloy/ingest/signal", { method: "POST", body: JSON.stringify(signal) }),
    batchIngest: (signals: unknown[]) =>
      apiFetch<{ processed: number; failed: number; signals: AlloySignal[] }>("/alloy/ingest/batch", { method: "POST", body: JSON.stringify({ signals }) }),
  },

  runs: {
    list: (params?: { state?: string; workflowId?: number }) => {
      const q = new URLSearchParams();
      if (params?.state) q.set("state", params.state);
      if (params?.workflowId) q.set("workflowId", String(params.workflowId));
      const qs = q.toString();
      return apiFetch<{ data: AlloyWorkflowRun[] } | AlloyWorkflowRun[]>(`/alloy/runs${qs ? `?${qs}` : ""}`).then(unwrapList);
    },
    get: (id: number) => apiFetch<AlloyWorkflowRun>(`/alloy/runs/${id}`),
    retry: (id: number) => apiFetch<AlloyWorkflowRun>(`/alloy/runs/${id}/retry`, { method: "POST" }),
    cancel: (id: number) => apiFetch<AlloyWorkflowRun>(`/alloy/runs/${id}/cancel`, { method: "POST" }),
  },

  artifacts: {
    list: (params?: { status?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return apiFetch<{ data: AlloyArtifact[] } | AlloyArtifact[]>(`/alloy/artifacts${qs ? `?${qs}` : ""}`).then(unwrapList);
    },
    get: (id: number) => apiFetch<AlloyArtifact>(`/alloy/artifacts/${id}`),
    approve: (id: number, notes?: string) => apiFetch<AlloyArtifact>(`/alloy/artifacts/${id}/approve`, { method: "POST", body: JSON.stringify({ notes }) }),
    reject: (id: number, notes: string) => apiFetch<AlloyArtifact>(`/alloy/artifacts/${id}/reject`, { method: "POST", body: JSON.stringify({ notes }) }),
  },

  featureFlags: {
    list: () => apiFetch<FeatureFlag[]>("/alloy/admin/flags"),
    update: (key: string, data: { isEnabled?: boolean; rolloutPercentage?: number }) =>
      apiFetch<FeatureFlag>(`/alloy/admin/flags/${key}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  audit: {
    list: (params?: { resourceType?: string; action?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.resourceType) q.set("resourceType", params.resourceType);
      if (params?.action) q.set("action", params.action);
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      return apiFetch<{ data: unknown[] } | unknown[]>(`/alloy/audit${qs ? `?${qs}` : ""}`).then(unwrapList);
    },
  },

  admin: {
    users: () => apiFetch<{ users: AdminUser[]; total: number }>("/admin/users").then(r => r.users),
    systemHealth: () => apiFetch<AdminSystemHealth>("/admin/system-health"),
  },
};
