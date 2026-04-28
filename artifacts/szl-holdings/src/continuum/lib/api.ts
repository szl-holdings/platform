import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';

export interface ContinuumWorkflow {
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

export interface ContinuumSignal {
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

export interface ContinuumWorkflowRun {
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

export interface ContinuumArtifact {
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

export interface ContinuumDashboard {
  summary: {
    activeWorkflows: number;
    totalRuns: number;
    pendingApprovals: number;
    totalSignals: number;
    newSignals: number;
    totalArtifacts: number;
  };
  recentRuns: ContinuumWorkflowRun[];
  pendingArtifacts: ContinuumArtifact[];
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
  status: 'active' | 'inactive';
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
  dashboard: () => apiFetch<ContinuumDashboard>('/continuum/dashboard'),

  workflows: {
    list: () =>
      apiFetch<{ data: ContinuumWorkflow[] } | ContinuumWorkflow[]>('/continuum/workflows').then(unwrapList),
    get: (id: number) => apiFetch<ContinuumWorkflow>(`/continuum/workflows/${id}`),
    create: (data: Partial<ContinuumWorkflow>) =>
      apiFetch<ContinuumWorkflow>('/continuum/workflows', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ContinuumWorkflow>) =>
      apiFetch<ContinuumWorkflow>(`/continuum/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/continuum/workflows/${id}`, { method: 'DELETE' }),
    trigger: (id: number, input?: Record<string, unknown>) =>
      apiFetch<ContinuumWorkflowRun>(`/continuum/workflows/${id}/run`, {
        method: 'POST',
        body: JSON.stringify({ input }),
      }),
    runs: (id: number) =>
      apiFetch<{ data: ContinuumWorkflowRun[] } | ContinuumWorkflowRun[]>(
        `/continuum/runs?workflowId=${id}`,
      ).then(unwrapList),
  },

  signals: {
    list: (params?: { status?: string; severity?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.severity) q.set('severity', params.severity);
      const qs = q.toString();
      return apiFetch<{ data: ContinuumSignal[] } | ContinuumSignal[]>(
        `/continuum/signals${qs ? `?${qs}` : ''}`,
      ).then(unwrapList);
    },
    ingest: (signal: {
      source: string;
      sourceType: string;
      title: string;
      severity?: string;
      body?: string;
      valueAtRisk?: number;
    }) =>
      apiFetch<{ signal: ContinuumSignal; triggeredWorkflows: number }>('/continuum/ingest/signal', {
        method: 'POST',
        body: JSON.stringify(signal),
      }),
    batchIngest: (signals: unknown[]) =>
      apiFetch<{ processed: number; failed: number; signals: ContinuumSignal[] }>(
        '/continuum/ingest/batch',
        { method: 'POST', body: JSON.stringify({ signals }) },
      ),
  },

  runs: {
    list: (params?: { state?: string; workflowId?: number }) => {
      const q = new URLSearchParams();
      if (params?.state) q.set('state', params.state);
      if (params?.workflowId) q.set('workflowId', String(params.workflowId));
      const qs = q.toString();
      return apiFetch<{ data: ContinuumWorkflowRun[] } | ContinuumWorkflowRun[]>(
        `/continuum/runs${qs ? `?${qs}` : ''}`,
      ).then(unwrapList);
    },
    get: (id: number) => apiFetch<ContinuumWorkflowRun>(`/continuum/runs/${id}`),
    retry: (id: number) =>
      apiFetch<ContinuumWorkflowRun>(`/continuum/runs/${id}/retry`, { method: 'POST' }),
    cancel: (id: number) =>
      apiFetch<ContinuumWorkflowRun>(`/continuum/runs/${id}/cancel`, { method: 'POST' }),
  },

  artifacts: {
    list: (params?: { status?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      const qs = q.toString();
      return apiFetch<{ data: ContinuumArtifact[] } | ContinuumArtifact[]>(
        `/continuum/artifacts${qs ? `?${qs}` : ''}`,
      ).then(unwrapList);
    },
    get: (id: number) => apiFetch<ContinuumArtifact>(`/continuum/artifacts/${id}`),
    approve: (id: number, notes?: string) =>
      apiFetch<ContinuumArtifact>(`/continuum/artifacts/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    reject: (id: number, notes: string) =>
      apiFetch<ContinuumArtifact>(`/continuum/artifacts/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
  },

  featureFlags: {
    list: () => apiFetch<FeatureFlag[]>('/continuum/admin/flags'),
    update: (key: string, data: { isEnabled?: boolean; rolloutPercentage?: number }) =>
      apiFetch<FeatureFlag>(`/continuum/admin/flags/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  audit: {
    list: (params?: { resourceType?: string; action?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.resourceType) q.set('resourceType', params.resourceType);
      if (params?.action) q.set('action', params.action);
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return apiFetch<{ data: unknown[] } | unknown[]>(`/continuum/audit${qs ? `?${qs}` : ''}`).then(
        unwrapList,
      );
    },
  },

  admin: {
    users: () =>
      apiFetch<{ users: AdminUser[]; total: number }>('/admin/users').then((r) => r.users),
    systemHealth: () => apiFetch<AdminSystemHealth>('/admin/system-health'),
  },
};
