import {
  apiFetch,
  type PaginatedResponse,
} from '@szl-holdings/shared-ui/api-fetch';

async function apiFetchList<T>(path: string): Promise<T[]> {
  const json = await apiFetch<T[] | PaginatedResponse<T>>(path);
  if (json && typeof json === 'object' && 'data' in json && 'meta' in json) {
    return (json as PaginatedResponse<T>).data;
  }
  return json as T[];
}

export interface CommandSignal {
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

export interface CommandIncident {
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

export interface CommandRecommendation {
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

export interface CommandPlaybook {
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

export interface CommandCard {
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

export interface CommandAction {
  id: number;
  workspaceId?: number;
  title: string;
  description?: string;
  state: string;
  priority?: string;
  urgency?: string;
  signalCategory?: string;
  assignedTo?: string;
  owner?: string;
  ownerTeam?: string;
  signalId?: number;
  incidentId?: number;
  valueAtRisk?: string;
  valueProtected?: number;
  dueAt?: string;
  dueBy?: string;
  notes?: string;
  stateHistory?: Array<{ from: string; to: string; at: string }>;
  roleVisibility?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CommandSavedView {
  id: number;
  workspaceId?: number;
  userId?: number;
  name: string;
  description?: string;
  viewType?: string;
  role?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: string;
  columns?: string[];
  isDefault?: boolean;
  isShared?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommandReadinessItem {
  id: number;
  workspaceId?: number;
  title: string;
  description?: string;
  category?: string;
  itemType?: string;
  status: string;
  score?: number;
  readinessScore?: number;
  owner?: string;
  ownerTeam?: string;
  dueAt?: string;
  dueBy?: string;
  blockedBy?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommandDashboard {
  summary: {
    totalSignals: number;
    criticalUnresolved: number;
    openIncidents: number;
    openActions: number;
    pendingRecommendations: number;
    readinessScore: number;
    agedApprovals?: number;
    ownershipGaps?: number;
    valueAtRisk?: string;
    decisionLatency?: string;
  };
  correlations?: Array<{ cluster: string; entities: string[]; impact: string; sev: string }>;
  recentSignals: CommandSignal[];
  fetchedAt: string;
}

export interface CommandReadinessSummary {
  items: CommandReadinessItem[];
  summary: { total: number; complete: number; blocked: number; score: number };
}

export const api = {
  signals: {
    list: () => apiFetchList<CommandSignal>('/lyte/signals'),
    create: (data: Partial<CommandSignal>) =>
      apiFetch<CommandSignal>('/lyte/signals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CommandSignal>) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/signals/${id}`, { method: 'DELETE' }),
    acknowledge: (id: number) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}/acknowledge`, { method: 'POST' }),
    assign: (id: number, assignee: string) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignee }),
      }),
    escalate: (id: number, to?: string, notes?: string) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ escalateTo: to, notes }),
      }),
    resolve: (id: number, notes?: string) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    override: (id: number, reason: string) =>
      apiFetch<CommandSignal>(`/lyte/signals/${id}/override`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    timeline: (id: number) => apiFetchList<unknown>(`/lyte/signals/${id}/timeline`),
    comments: (id: number) => apiFetchList<unknown>(`/lyte/signals/${id}/comments`),
    addComment: (id: number, body: string, authorName: string) =>
      apiFetch<unknown>(`/lyte/signals/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body, authorName, commentType: 'comment' }),
      }),
  },
  incidents: {
    list: () => apiFetchList<CommandIncident>('/lyte/incidents'),
    create: (data: Partial<CommandIncident>) =>
      apiFetch<CommandIncident>('/lyte/incidents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CommandIncident>) =>
      apiFetch<CommandIncident>(`/lyte/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/incidents/${id}`, { method: 'DELETE' }),
  },
  recommendations: {
    list: () => apiFetchList<CommandRecommendation>('/lyte/recommendations'),
    create: (data: Partial<CommandRecommendation>) =>
      apiFetch<CommandRecommendation>('/lyte/recommendations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<CommandRecommendation>) =>
      apiFetch<CommandRecommendation>(`/lyte/recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/recommendations/${id}`, { method: 'DELETE' }),
  },
  playbooks: {
    list: () => apiFetchList<CommandPlaybook>('/lyte/playbooks'),
    get: (id: number) => apiFetch<CommandPlaybook>(`/lyte/playbooks/${id}`),
    create: (data: Partial<CommandPlaybook>) =>
      apiFetch<CommandPlaybook>('/lyte/playbooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CommandPlaybook>) =>
      apiFetch<CommandPlaybook>(`/lyte/playbooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/playbooks/${id}`, { method: 'DELETE' }),
  },
  commandCards: {
    list: () => apiFetchList<CommandCard>('/lyte/command-cards'),
    create: (data: Partial<CommandCard>) =>
      apiFetch<CommandCard>('/lyte/command-cards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<CommandCard>) =>
      apiFetch<CommandCard>(`/lyte/command-cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/command-cards/${id}`, { method: 'DELETE' }),
  },
  actions: {
    list: (params?: { workspaceId?: number; role?: string; state?: string }) => {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null) as [string, string][],
          ).toString()
        : '';
      return apiFetchList<CommandAction>(`/lyte/actions${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => apiFetch<CommandAction>(`/lyte/actions/${id}`),
    create: (data: Partial<CommandAction>) =>
      apiFetch<CommandAction>('/lyte/actions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CommandAction>) =>
      apiFetch<CommandAction>(`/lyte/actions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/actions/${id}`, { method: 'DELETE' }),
  },
  views: {
    list: (params?: { workspaceId?: number; role?: string }) => {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null) as [string, string][],
          ).toString()
        : '';
      return apiFetchList<CommandSavedView>(`/lyte/views${qs ? `?${qs}` : ''}`);
    },
    create: (data: Partial<CommandSavedView>) =>
      apiFetch<CommandSavedView>('/lyte/views', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CommandSavedView>) =>
      apiFetch<CommandSavedView>(`/lyte/views/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/views/${id}`, { method: 'DELETE' }),
  },
  readiness: {
    get: () => apiFetch<CommandReadinessSummary>('/lyte/readiness'),
    list: (workspaceId?: number) =>
      apiFetchList<CommandReadinessItem>(
        `/lyte/readiness${workspaceId ? `?workspaceId=${workspaceId}` : ''}`,
      ),
    getItem: (id: number) => apiFetch<CommandReadinessItem>(`/lyte/readiness/${id}`),
    create: (data: Partial<CommandReadinessItem>) =>
      apiFetch<CommandReadinessItem>('/lyte/readiness', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<CommandReadinessItem>) =>
      apiFetch<CommandReadinessItem>(`/lyte/readiness/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/readiness/${id}`, { method: 'DELETE' }),
    score: (workspaceId?: number) =>
      apiFetch<{
        score: number;
        breakdown: unknown[];
        readyCount: number;
        totalItems: number;
        lastUpdated: string;
      }>(`/lyte/readiness/score${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  },
  dashboard: () => apiFetch<CommandDashboard>('/lyte/dashboard'),
  dashboards: {
    list: () => apiFetch<unknown[]>('/lyte/dashboards'),
    get: (id: number) => apiFetch<unknown>(`/lyte/dashboards/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch<unknown>('/lyte/dashboards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      apiFetch<unknown>(`/lyte/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/lyte/dashboards/${id}`, { method: 'DELETE' }),
  },
  executiveSummary: () => apiFetch<Record<string, unknown>>('/lyte/executive-summary'),
  insights: () =>
    apiFetch<{
      narratives: Array<{ type: string; priority: string; headline: string; detail: string }>;
      signalSummary: Record<string, number>;
      sourceSummary: Record<string, number>;
    }>('/lyte/insights/narratives'),
  live: {
    techNews: () => apiFetch<any>('/lyte/live/tech-news'),
    blsEmployment: () => apiFetch<any>('/lyte/live/bls-employment'),
    githubTrending: (language?: string) =>
      apiFetch<any>(
        `/lyte/live/github-trending${language ? `?language=${encodeURIComponent(language)}` : ''}`,
      ),
  },
  ai: {
    health: () => apiFetch<AlloyAIHealth>('/ai/health'),
    models: () => apiFetch<AlloyAIModels>('/ai/models'),
    respond: (messages: Array<{ role: string; content: string }>, routeClass?: string) =>
      apiFetch<AlloyAIResponse>('/ai/respond', {
        method: 'POST',
        body: JSON.stringify({ messages, routeClass }),
      }),
    triage: (input: string, context?: string) =>
      apiFetch<AlloyAITriageResult>('/ai/triage', {
        method: 'POST',
        body: JSON.stringify({ input, context }),
      }),
    extract: (input: string) =>
      apiFetch<AlloyAIExtractResult>('/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ input }),
      }),
    plan: (objective: string, context?: string) =>
      apiFetch<AlloyAIPlanResult>('/ai/plan', {
        method: 'POST',
        body: JSON.stringify({ objective, context }),
      }),
    retrieve: (query: string, topK?: number) =>
      apiFetch<AlloyAIRetrievalResult>('/ai/retrieve', {
        method: 'POST',
        body: JSON.stringify({ query, topK }),
      }),
    tools: () => apiFetch<AlloyAIToolsResult>('/ai/tools'),
    toolPreview: (toolName: string, args?: Record<string, unknown>) =>
      apiFetch<AlloyAIToolPreview>('/ai/tools/preview', {
        method: 'POST',
        body: JSON.stringify({ toolName, arguments: args }),
      }),
    audit: (limit?: number) => apiFetch<AlloyAIAuditResult>(`/ai/audit?limit=${limit || 50}`),
    decisions: (params?: {
      limit?: number;
      offset?: number;
      status?: string;
      riskLevel?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      if (params?.status) q.set('status', params.status);
      if (params?.riskLevel) q.set('riskLevel', params.riskLevel);
      return apiFetch<{ total: number; offset: number; limit: number; decisions: AlloyDecision[] }>(
        `/ai/decision?${q.toString()}`,
      );
    },
    createDecision: (payload: {
      recommendedAction: string;
      rationaleSummary: string;
      riskLevel: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
      confidence?: number;
      workflowId?: string | null;
      signalIds?: string[];
      evidenceRefs?: AlloyEvidenceRef[];
      ownerSuggestion?: string | null;
      fallbackPlan?: string | null;
      modelRoute?: string;
      rawInput?: string;
    }) =>
      apiFetch<{ decision: AlloyDecision; approvalPolicy: AlloyApprovalPolicy; message: string }>(
        '/ai/decision',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    approveDecision: (id: string, approverName?: string) =>
      apiFetch<{ decision: AlloyDecision; message: string }>(`/ai/decision/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverName }),
      }),
    rejectDecision: (id: string, reason?: string, rejectorName?: string) =>
      apiFetch<{ decision: AlloyDecision; message: string }>(`/ai/decision/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, rejectorName }),
      }),
    approvalMatrix: () =>
      apiFetch<{
        matrix: Record<string, AlloyApprovalPolicy>;
        description: string;
        executionMode: string;
      }>('/ai/approval-matrix'),
  },
  covenant: {
    status: () =>
      apiFetch<{
        engine: string;
        status: string;
        stats: Record<string, unknown>;
        highRiskActions: string[];
      }>('/covenant/status'),
    policies: () =>
      apiFetch<{ policies: Array<Record<string, unknown>>; count: number }>('/covenant/policies'),
    simulate: (
      subject: { roles: string[] },
      resource: { type: string; domain?: string },
      action: string,
      context?: Record<string, unknown>,
    ) =>
      apiFetch<{
        decision: Record<string, unknown>;
        explanation: string;
        ui: Record<string, unknown>;
      }>('/covenant/simulate', {
        method: 'POST',
        body: JSON.stringify({ subject, resource, action, context }),
      }),
    evaluate: (
      subject: { roles: string[] },
      resource: { type: string; domain?: string },
      action: string,
      context?: Record<string, unknown>,
    ) =>
      apiFetch<{ decision: Record<string, unknown>; ui: Record<string, unknown> }>(
        '/covenant/evaluate',
        {
          method: 'POST',
          body: JSON.stringify({ subject, resource, action, context }),
        },
      ),
    recent: (limit?: number) =>
      apiFetch<{ decisions: Array<Record<string, unknown>>; count: number }>(
        `/covenant/decisions/recent?limit=${limit || 20}`,
      ),
    denied: (limit?: number) =>
      apiFetch<{ decisions: Array<Record<string, unknown>>; count: number }>(
        `/covenant/decisions/denied?limit=${limit || 20}`,
      ),
  },
  alloyRuns: {
    list: (params?: { state?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.state) q.set('state', params.state);
      if (params?.limit) q.set('limit', String(params.limit));
      return apiFetch<{ data: AlloyWorkflowRun[]; meta: { total: number } }>(
        `/continuum/runs?${q.toString()}`,
      );
    },
    get: (id: number) => apiFetch<AlloyWorkflowRun>(`/continuum/runs/${id}`),
  },
  alloyWorkflows: {
    list: (params?: { limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      return apiFetch<{ data: AlloyWorkflow[]; meta: { total: number } }>(
        `/continuum/workflows?${q.toString()}`,
      );
    },
    run: (id: number, input?: Record<string, unknown>) =>
      apiFetch<AlloyWorkflowRun>(`/continuum/workflows/${id}/run`, {
        method: 'POST',
        body: JSON.stringify({ input }),
      }),
  },
  receipts: {
    list: (params?: { limit?: number; contentType?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.contentType) q.set('contentType', params.contentType);
      return apiFetch<{ receipts: Array<Record<string, unknown>>; count: number }>(
        `/receipt-graph/receipts?${q.toString()}`,
      );
    },
    get: (id: string) => apiFetch<Record<string, unknown>>(`/receipt-graph/receipts/${id}`),
    executiveSummary: () => apiFetch<Record<string, unknown>>('/receipt-graph/trust-summary'),
  },
  handoffs: {
    contracts: () =>
      apiFetch<{ contracts: Array<Record<string, unknown>>; count: number }>(
        '/cross-app/handoffs/contracts',
      ),
    history: (params?: { sourceDomain?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.sourceDomain) q.set('sourceDomain', params.sourceDomain);
      if (params?.limit) q.set('limit', String(params.limit));
      return apiFetch<{ handoffs: Array<Record<string, unknown>>; count: number }>(
        `/cross-app/handoffs/history?${q.toString()}`,
      );
    },
    stats: () => apiFetch<Record<string, unknown>>('/cross-app/handoffs/stats'),
    trigger: (type: string, payload?: Record<string, unknown>) =>
      apiFetch<{ handoff: Record<string, unknown>; message: string }>(
        '/cross-app/handoffs/trigger',
        {
          method: 'POST',
          body: JSON.stringify({ type, payload }),
        },
      ),
  },
};

export interface AlloyWorkflowRun {
  id: number;
  workflowId: number;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'waiting_approval' | 'cancelled';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorMessage?: string;
  stateHistory: Array<{ state: string; at: string; by: string; reason?: string }>;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  queuedAt: string;
  createdAt: string;
}

export interface AlloyWorkflow {
  id: number;
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
  orgId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlloyAIHealth {
  status: string;
  provider: string;
  models: Array<{ model: string; role: string; provider: string }>;
  routes: string[];
  retrieval: { totalChunks: number; withEmbeddings: number };
  config: Record<string, unknown>;
  auditLogSize: number;
  degraded?: boolean;
  degradedReason?: string;
}

export interface AlloyAIModels {
  slots: Array<{ model: string; role: string; provider: string }>;
  routes: Record<
    string,
    {
      model: string;
      role: string;
      maxTokens: number;
      temperature: number;
      structuredOutput: boolean;
    }
  >;
  provider: string;
  tokenConfigured: boolean;
}

export interface AlloyAIResponse {
  content: string;
  model: string;
  provider: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  latencyMs: number;
  finishReason: string;
}

export interface AlloyAITriageResult {
  decision: {
    priority: string;
    urgency: string;
    category: string;
    routeTo: string;
    routeReason: string;
    summary: string;
    keyEntities: Array<{ type: string; value: string; confidence: number }>;
    suggestedActions: Array<{ action: string; reason: string; confidence: number }>;
    requiresHumanReview: boolean;
    confidence: number;
  };
  model: string;
  latencyMs: number;
}

export interface AlloyAIExtractResult {
  result: {
    entities: Array<{ type: string; value: string; confidence: number; context: string }>;
    relationships: Array<{ from: string; to: string; relationType: string; confidence: number }>;
    summary: string;
    confidence: number;
  };
  model: string;
  latencyMs: number;
}

export interface AlloyAIPlanResult {
  plan: {
    action: string;
    actionType: string;
    confidence: number;
    evidence: Array<{
      source: string;
      sourceType: string;
      content: string;
      relevanceScore: number;
    }>;
    impactedOwner: string | null;
    approvalRequired: boolean;
    approvalLevel: string;
    reasoning: string;
    alternatives: Array<{ action: string; confidence: number; tradeoff: string }>;
  };
  model: string;
  latencyMs: number;
}

export interface AlloyAIRetrievalResult {
  chunks: Array<{
    id: string;
    content: string;
    source: string;
    sourceType: string;
    score: number;
    matchType: string;
  }>;
  evidence: Array<{ source: string; sourceType: string; content: string; relevanceScore: number }>;
  query: string;
  method: string;
  totalIndexed: number;
  latencyMs: number;
}

export interface AlloyAIToolsResult {
  tools: Array<{
    name: string;
    description: string;
    policy: { allowed: boolean; requiresApproval: boolean; reason: string };
  }>;
  executionMode: string;
  approvalRequired: boolean;
}

export interface AlloyAIToolPreview {
  toolName: string;
  exists: boolean;
  policy: { allowed: boolean; requiresApproval: boolean; reason: string };
  dryRun: boolean;
}

export interface AlloyAIAuditResult {
  total: number;
  offset: number;
  limit: number;
  entries: Array<Record<string, unknown>>;
}

export interface AlloyEvidenceRef {
  chunkId: string;
  source: string;
  excerpt?: string;
  score?: number;
}

export interface AlloyDecision {
  decisionId: string;
  workflowId: string | null;
  signalIds: string[];
  recommendedAction: string;
  rationaleSummary: string;
  evidenceRefs: AlloyEvidenceRef[];
  confidence: number;
  ownerSuggestion: string | null;
  approvalRequired: boolean;
  riskLevel: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  fallbackPlan: string | null;
  modelRoute: string;
  schemaVersion: '2.0.0';
  status:
    | 'proposed'
    | 'pending_approval'
    | 'approved'
    | 'rejected'
    | 'executed'
    | 'failed'
    | 'expired';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  executedAt: string | null;
  executionOutcome: 'pending' | 'success' | 'failure' | 'partial' | 'rejected' | null;
  rawInput: string | null;
  rawOutput: string | null;
  createdAt: string;
}

export interface AlloyApprovalPolicy {
  requiresApproval: boolean;
  approverRole: string;
  sla: string;
  escalationPath: string[];
  autoApproveAfterSla: boolean;
}
