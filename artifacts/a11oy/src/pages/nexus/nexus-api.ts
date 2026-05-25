const _BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const API = '/api/nexus';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const praxisApi = {
  getStatus: () => req<import('./nexus-types').PraxisStatus>('/status'),

  startResearch: (query: string) =>
    req<{ id: string }>('/research', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getResearch: (id: string) => req<import('./nexus-types').ResearchRun>(`/research/${id}`),

  listResearch: () => req<import('./nexus-types').ResearchRun[]>('/research'),

  researchStreamUrl: (id: string) => `${API}/research/${id}/stream`,

  listMemory: (params?: { search?: string; type?: string; pinned?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    if (params?.pinned !== undefined) qs.set('pinned', String(params.pinned));
    return req<import('./nexus-types').MemoryItem[]>(`/memory?${qs}`);
  },

  addMemory: (item: Partial<import('./nexus-types').MemoryItem>) =>
    req<import('./nexus-types').MemoryItem>('/memory', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  updateMemory: (id: string, update: Partial<import('./nexus-types').MemoryItem>) =>
    req<import('./nexus-types').MemoryItem>(`/memory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    }),

  forgetMemory: (id: string) => req<{ ok: boolean }>(`/memory/${id}`, { method: 'DELETE' }),

  listSkills: (params?: { pattern?: string; enabled?: boolean; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.pattern) qs.set('pattern', params.pattern);
    if (params?.enabled !== undefined) qs.set('enabled', String(params.enabled));
    if (params?.search) qs.set('search', params.search);
    return req<import('./nexus-types').Skill[]>(`/skills?${qs}`);
  },

  toggleSkill: (id: string, enabled: boolean) =>
    req<import('./nexus-types').Skill>(`/skills/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  listPatterns: () => req<import('./nexus-types').PatternFamily[]>('/patterns'),

  listBridgeTools: (protocol?: string) => {
    const qs = protocol ? `?protocol=${protocol}` : '';
    return req<import('./nexus-types').ProtocolTool[]>(`/bridge/tools${qs}`);
  },

  invokeTool: (protocol: string, toolId: string, args: Record<string, unknown>) =>
    req<import('./nexus-types').ToolCallResult>('/bridge/invoke', {
      method: 'POST',
      body: JSON.stringify({ protocol, toolId, args }),
    }),

  orchestrate: (intent: string) =>
    req<{ id: string }>('/orchestrate', {
      method: 'POST',
      body: JSON.stringify({ intent }),
    }),

  getOrchestration: (id: string) => req<import('./nexus-types').OrchestrationPlan>(`/orchestrate/${id}`),

  getOrchestrationByTrace: (traceId: string) =>
    req<import('./nexus-types').OrchestrationPlan>(
      `/orchestrate/by-trace/${encodeURIComponent(traceId)}`,
    ),

  listOrchestrations: () => req<import('./nexus-types').OrchestrationPlan[]>('/orchestrate'),

  listIngestJobs: () => req<import('./nexus-types').IngestJob[]>('/ingest'),

  startIngest: (repoUrl: string) =>
    req<{ id: string }>('/ingest', {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    }),

  getIngestJob: (id: string) => req<import('./nexus-types').IngestJob>(`/ingest/${id}`),

  retryOrchestration: (id: string) =>
    req<{ id: string }>(`/orchestrate/${id}/retry`, { method: 'POST' }),

  retryIngest: (id: string) => req<{ id: string }>(`/ingest/${id}/retry`, { method: 'POST' }),

  resetCustomizations: () =>
    req<import('./nexus-types').CustomizationsResetResult>('/customizations/reset', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  listLeaders: () => req<import('./nexus-types').ThirdPartyLeader[]>('/leaders'),

  toggleLeader: (id: string, enabled: boolean) =>
    req<import('./nexus-types').ThirdPartyLeader>(`/leaders/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  listRecipes: () => req<import('./nexus-types').OrchestrationRecipe[]>('/recipes'),

  getRecipe: (id: string) => req<import('./nexus-types').OrchestrationRecipe>(`/recipes/${id}`),
};

export function getApiBase() {
  return API;
}
