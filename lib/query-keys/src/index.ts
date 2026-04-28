/**
 * @szl-holdings/query-keys
 *
 * Shared TanStack Query cache key factory.
 * Prevents cache key collisions across artifacts by providing a single
 * authoritative registry for all query keys used platform-wide.
 *
 * Usage:
 *   import { queryKeys } from '@szl-holdings/query-keys';
 *
 *   // In components:
 *   const { data } = useQuery({ queryKey: queryKeys.vessels.list({ status: 'active' }) });
 *   const { data } = useQuery({ queryKey: queryKeys.alloy.workflow(workflowId) });
 *
 * Keys follow the pattern: [domain, entity, variant, ...params]
 * This ensures all React Query operations (queries, mutations, invalidations)
 * use consistent, collision-free keys across all frontend artifacts.
 */

// ── Type helpers ─────────────────────────────────────────────────────────────

type QueryKey = readonly unknown[];

function makeKey<T extends QueryKey>(...parts: T): T {
  return parts;
}

// ── Domain: Auth ─────────────────────────────────────────────────────────────

const auth = {
  all: () => makeKey('auth'),
  me: () => makeKey('auth', 'me'),
  status: () => makeKey('auth', 'status'),
  session: () => makeKey('auth', 'session'),
} as const;

// ── Domain: Vessels ──────────────────────────────────────────────────────────

const vessels = {
  all: () => makeKey('vessels'),
  list: (filters?: { status?: string; limit?: number; offset?: number }) =>
    makeKey('vessels', 'list', filters ?? null),
  detail: (id: string | number) => makeKey('vessels', 'detail', String(id)),
  positions: (vesselId?: string | number, limit?: number) =>
    makeKey('vessels', 'positions', vesselId ? String(vesselId) : null, limit ?? null),
  routes: (filters?: { vesselId?: string | number; status?: string }) =>
    makeKey('vessels', 'routes', filters ?? null),
  events: (filters?: { vesselId?: string | number; severity?: string }) =>
    makeKey('vessels', 'events', filters ?? null),
} as const;

// ── Domain: Alloy ────────────────────────────────────────────────────────────

const alloy = {
  all: () => makeKey('alloy'),
  signals: {
    list: (filters?: { severity?: string; status?: string; domain?: string }) =>
      makeKey('alloy', 'signals', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('alloy', 'signals', 'detail', String(id)),
  },
  workflows: {
    list: (filters?: { status?: string; priority?: string; domain?: string }) =>
      makeKey('alloy', 'workflows', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('alloy', 'workflows', 'detail', String(id)),
    runs: (workflowId: string | number) =>
      makeKey('alloy', 'workflows', String(workflowId), 'runs'),
    transitions: (workflowId: string | number) =>
      makeKey('alloy', 'workflows', String(workflowId), 'transitions'),
  },
  approvals: {
    list: (filters?: { workflowId?: string | number; status?: string }) =>
      makeKey('alloy', 'approvals', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('alloy', 'approvals', 'detail', String(id)),
  },
  dashboard: () => makeKey('alloy', 'dashboard'),
  auditLog: (filters?: { entityType?: string; entityId?: string | number }) =>
    makeKey('alloy', 'audit-log', filters ?? null),
} as const;

// ── Domain: Terra ─────────────────────────────────────────────────────────────

const terra = {
  all: () => makeKey('terra'),
  properties: (filters?: { limit?: number; offset?: number }) =>
    makeKey('terra', 'properties', filters ?? null),
  listings: (filters?: { status?: string }) => makeKey('terra', 'listings', filters ?? null),
  distressProperties: (filters?: { borough?: string; distressType?: string }) =>
    makeKey('terra', 'distress-properties', filters ?? null),
  deals: {
    list: (filters?: { stage?: string }) => makeKey('terra', 'deals', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('terra', 'deals', 'detail', String(id)),
  },
  leads: (filters?: { stage?: string }) => makeKey('terra', 'leads', filters ?? null),
  actionItems: (filters?: { propertyId?: string; status?: string }) =>
    makeKey('terra', 'action-items', filters ?? null),
} as const;

// ── Domain: Lyte ─────────────────────────────────────────────────────────────

const lyte = {
  all: () => makeKey('lyte'),
  signals: {
    list: (filters?: { severity?: string; status?: string }) =>
      makeKey('lyte', 'signals', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('lyte', 'signals', 'detail', String(id)),
  },
  incidents: {
    list: (filters?: { status?: string; severity?: string; assignee?: string }) =>
      makeKey('lyte', 'incidents', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('lyte', 'incidents', 'detail', String(id)),
  },
  actions: {
    list: (filters?: { state?: string; priority?: string; assignee?: string }) =>
      makeKey('lyte', 'actions', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('lyte', 'actions', 'detail', String(id)),
  },
  queue: (filters?: Record<string, unknown>) => makeKey('lyte', 'queue', filters ?? null),
  summary: () => makeKey('lyte', 'executive-summary'),
  workspaces: () => makeKey('lyte', 'workspaces'),
} as const;

// ── Domain: Platform / Health ────────────────────────────────────────────────

const platform = {
  all: () => makeKey('platform'),
  health: () => makeKey('platform', 'health'),
  healthDetailed: () => makeKey('platform', 'health', 'detailed'),
  readiness: () => makeKey('platform', 'readiness'),
  metrics: () => makeKey('platform', 'metrics'),
  alerts: () => makeKey('platform', 'alerts'),
  aiAccuracy: () => makeKey('platform', 'ai-accuracy'),
} as const;

// ── Domain: Holdings / Dashboard ─────────────────────────────────────────────

const holdings = {
  all: () => makeKey('holdings'),
  dashboard: () => makeKey('holdings', 'dashboard'),
  orgs: (filters?: { limit?: number }) => makeKey('holdings', 'orgs', filters ?? null),
  org: (id: string | number) => makeKey('holdings', 'orgs', String(id)),
  users: (filters?: { orgId?: string | number }) => makeKey('holdings', 'users', filters ?? null),
} as const;

// ── Domain: Aegis / Firestorm ────────────────────────────────────────────────

const aegis = {
  all: () => makeKey('aegis'),
  assessments: {
    list: (filters?: { status?: string }) => makeKey('aegis', 'assessments', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('aegis', 'assessments', 'detail', String(id)),
  },
  findings: {
    list: (assessmentId: string | number) =>
      makeKey('aegis', 'findings', String(assessmentId)),
  },
  incidents: {
    list: (filters?: { severity?: string }) =>
      makeKey('aegis', 'incidents', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('aegis', 'incidents', 'detail', String(id)),
  },
} as const;

// ── Domain: Counsel / Legal ───────────────────────────────────────────────────

const counsel = {
  all: () => makeKey('counsel'),
  matters: {
    list: (filters?: { status?: string; type?: string }) =>
      makeKey('counsel', 'matters', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('counsel', 'matters', 'detail', String(id)),
  },
  clauses: (filters?: Record<string, unknown>) =>
    makeKey('counsel', 'clauses', filters ?? null),
} as const;

// ── Domain: Approvals ────────────────────────────────────────────────────────

const approvals = {
  all: () => makeKey('approvals'),
  list: (filters?: { status?: string; scope?: string }) =>
    makeKey('approvals', 'list', filters ?? null),
  detail: (id: string | number) => makeKey('approvals', 'detail', String(id)),
  inbox: () => makeKey('approvals', 'inbox'),
} as const;

// ── Domain: AI / Traces ──────────────────────────────────────────────────────

const ai = {
  all: () => makeKey('ai'),
  traces: {
    list: (filters?: { domain?: string; status?: string }) =>
      makeKey('ai', 'traces', 'list', filters ?? null),
    detail: (id: string | number) => makeKey('ai', 'traces', 'detail', String(id)),
  },
  quality: (domain?: string) => makeKey('ai', 'quality', domain ?? 'all'),
  budget: () => makeKey('ai', 'budget'),
} as const;

// ── Root factory ──────────────────────────────────────────────────────────────

export const queryKeys = {
  auth,
  vessels,
  alloy,
  terra,
  lyte,
  platform,
  holdings,
  aegis,
  counsel,
  approvals,
  ai,
} as const;

export type QueryKeys = typeof queryKeys;

// ── Invalidation helpers ──────────────────────────────────────────────────────

/**
 * Returns the root key for an entire domain — useful for broad invalidation.
 *
 * Example:
 *   queryClient.invalidateQueries({ queryKey: domainKey('alloy') });
 */
export function domainKey(domain: keyof QueryKeys): QueryKey {
  return queryKeys[domain].all();
}
