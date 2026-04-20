import { domainEventBus } from '../../domain-events/index.js';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SignalStatus = 'new' | 'acknowledged' | 'resolved' | 'dismissed';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'mitigating' | 'resolved' | 'closed';
export type ActionState =
  | 'new'
  | 'acknowledged'
  | 'assigned'
  | 'escalated'
  | 'resolved'
  | 'dismissed';
export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low';

export const VALID_SIGNAL_SEVERITIES = new Set<SignalSeverity>([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);
export const VALID_SIGNAL_STATUSES = new Set<SignalStatus>([
  'new',
  'acknowledged',
  'resolved',
  'dismissed',
]);
export const VALID_INCIDENT_SEVERITIES = new Set<IncidentSeverity>([
  'critical',
  'high',
  'medium',
  'low',
]);
export const VALID_INCIDENT_STATUSES = new Set<IncidentStatus>([
  'open',
  'investigating',
  'mitigating',
  'resolved',
  'closed',
]);
export const VALID_ACTION_STATES = new Set<ActionState>([
  'new',
  'acknowledged',
  'assigned',
  'escalated',
  'resolved',
  'dismissed',
]);
export const VALID_ACTION_PRIORITIES = new Set<ActionPriority>(['urgent', 'high', 'medium', 'low']);

export const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface LyteStoragePort {
  listWorkspaces(args: { limit: number; offset: number }): Promise<unknown[]>;
  listSignals(args: {
    severity?: string;
    status?: string;
    source?: string;
    limit: number;
    offset: number;
  }): Promise<unknown[]>;
  getSignal(id: number): Promise<unknown | null>;
  updateSignal(id: number, data: Record<string, unknown>): Promise<unknown>;
  listActions(args: {
    state?: string;
    priority?: string;
    assignee?: string;
    limit: number;
    offset: number;
  }): Promise<unknown[]>;
  getAction(id: number): Promise<unknown | null>;
  updateAction(id: number, data: Record<string, unknown>): Promise<unknown>;
  listIncidents(args: {
    status?: string;
    severity?: string;
    assignee?: string;
    limit: number;
    offset: number;
  }): Promise<unknown[]>;
  getIncident(id: number): Promise<unknown | null>;
  updateIncident(id: number, data: Record<string, unknown>): Promise<unknown>;
  countSignals(filters: { severity?: string; status?: string }): Promise<Record<string, number>>;
  countIncidents(filters: { status?: string }): Promise<Record<string, number>>;
  countActions(filters: { state?: string }): Promise<number>;
}

// ─── Enrichment Functions ─────────────────────────────────────────────────────

export function deriveSignalAssignee(s: Record<string, unknown>): string | null {
  const assignee = s.assignee;
  if (typeof assignee === 'string' && assignee) return assignee;
  const meta = s.metadata as Record<string, unknown> | null;
  if (meta && typeof meta.assignee === 'string' && meta.assignee) return meta.assignee;
  return null;
}

export function deriveEscalationPaths(meta: Record<string, unknown>): Record<string, unknown>[] {
  const escalations = meta.escalations;
  if (!Array.isArray(escalations)) return [];
  return escalations.map((e: unknown, idx: number) => {
    const entry = (e as Record<string, unknown>) ?? {};
    return {
      id: String(idx + 1),
      level: idx + 1,
      label: `Escalation L${idx + 1}`,
      targetRole: typeof entry.targetRole === 'string' ? entry.targetRole : 'unspecified',
      targetUserId: null,
      notifyChannels: [],
      triggeredAt: typeof entry.escalatedAt === 'string' ? entry.escalatedAt : null,
      resolvedAt: null,
      active: true,
    };
  });
}

export function deriveAuditHistory(meta: Record<string, unknown>): Record<string, unknown>[] {
  const history = meta.auditHistory ?? meta.stateHistory;
  if (!Array.isArray(history)) return [];
  return history.map((h: unknown, idx: number) => {
    const entry = (h as Record<string, unknown>) ?? {};
    return {
      id: String(idx + 1),
      action:
        typeof entry.state === 'string'
          ? `state_changed_to_${entry.state}`
          : typeof entry.action === 'string'
            ? entry.action
            : 'updated',
      actor: typeof entry.actor === 'string' ? entry.actor : 'system',
      actorType: 'system',
      previousState: null,
      newState: typeof entry.state === 'string' ? entry.state : null,
      notes:
        typeof entry.rationale === 'string'
          ? entry.rationale
          : typeof entry.reason === 'string'
            ? entry.reason
            : null,
      timestamp:
        typeof entry.changedAt === 'string'
          ? entry.changedAt
          : typeof entry.escalatedAt === 'string'
            ? entry.escalatedAt
            : new Date().toISOString(),
    };
  });
}

export function enrichSignal(s: Record<string, unknown>): Record<string, unknown> {
  const meta = (s.metadata as Record<string, unknown>) ?? {};
  return {
    ...s,
    assignee: deriveSignalAssignee(s),
    rationale: typeof meta.rationale === 'string' ? meta.rationale : null,
    nextAction: typeof meta.nextAction === 'string' ? meta.nextAction : null,
    escalationPaths: deriveEscalationPaths(meta),
    auditHistory: deriveAuditHistory(meta),
  };
}

export function enrichIncident(i: Record<string, unknown>): Record<string, unknown> {
  const meta = (i.metadata as Record<string, unknown>) ?? {};
  return {
    ...i,
    escalationPaths: deriveEscalationPaths(meta),
    auditHistory: deriveAuditHistory(meta),
  };
}

export function enrichAction(a: Record<string, unknown>): Record<string, unknown> {
  const history = (a.stateHistory as unknown[]) ?? [];
  const historyMeta = { stateHistory: history };
  const escalations = history.filter(
    (h: unknown) => (h as Record<string, unknown>).state === 'escalated',
  );
  return {
    ...a,
    escalationPaths: escalations.map((e: unknown, idx: number) => {
      const entry = (e as Record<string, unknown>) ?? {};
      return {
        id: String(idx + 1),
        level: idx + 1,
        label: `Escalation L${idx + 1}`,
        targetRole: typeof entry.targetRole === 'string' ? entry.targetRole : 'unspecified',
        targetUserId: null,
        notifyChannels: [],
        triggeredAt: typeof entry.changedAt === 'string' ? entry.changedAt : null,
        resolvedAt: null,
        active: true,
      };
    }),
    auditHistory: deriveAuditHistory(historyMeta),
  };
}

export function buildSignalQueueItem(s: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `signal-${s.id}`,
    entityType: 'signal',
    entityId: s.id,
    title: s.title ?? `Signal #${s.id}`,
    severity: s.severity ?? null,
    status: s.status ?? null,
    priority: null,
    assignee: deriveSignalAssignee(s),
    createdAt: s.createdAt ?? new Date().toISOString(),
    updatedAt: s.createdAt ?? new Date().toISOString(),
  };
}

export function buildIncidentQueueItem(i: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `incident-${i.id}`,
    entityType: 'incident',
    entityId: i.id,
    title: i.title ?? i.impactArea ?? `Incident #${i.id}`,
    severity: i.severity ?? null,
    status: i.status ?? null,
    priority: null,
    assignee: i.assignee ?? null,
    createdAt: i.createdAt ?? new Date().toISOString(),
    updatedAt: i.updatedAt ?? new Date().toISOString(),
  };
}

export function buildActionQueueItem(a: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `action-${a.id}`,
    entityType: 'action',
    entityId: a.id,
    title: a.title ?? `Action #${a.id}`,
    severity: null,
    status: a.state ?? null,
    priority: a.priority ?? null,
    assignee: a.assignedTo ?? a.owner ?? null,
    createdAt: a.createdAt ?? new Date().toISOString(),
    updatedAt: a.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listLyteWorkspaces(
  storage: LyteStoragePort,
  args: { limit?: number; offset?: number },
) {
  return storage.listWorkspaces({ limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listLyteSignals(
  storage: LyteStoragePort,
  args: { severity?: string; status?: string; domain?: string; limit?: number; offset?: number },
) {
  const severityFilter =
    args.severity && VALID_SIGNAL_SEVERITIES.has(args.severity as SignalSeverity)
      ? args.severity
      : undefined;
  const statusFilter =
    args.status && VALID_SIGNAL_STATUSES.has(args.status as SignalStatus) ? args.status : undefined;
  const signals = await storage.listSignals({
    severity: severityFilter,
    status: statusFilter,
    source: args.domain,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
  return signals.map((s) => enrichSignal(s as Record<string, unknown>));
}

export async function getLyteSignal(storage: LyteStoragePort, id: number) {
  const signal = await storage.getSignal(id);
  if (!signal) return null;
  return enrichSignal(signal as Record<string, unknown>);
}

export async function listLyteActions(
  storage: LyteStoragePort,
  args: { state?: string; priority?: string; assignee?: string; limit?: number; offset?: number },
) {
  const stateFilter =
    args.state && VALID_ACTION_STATES.has(args.state as ActionState) ? args.state : undefined;
  const priorityFilter =
    args.priority && VALID_ACTION_PRIORITIES.has(args.priority as ActionPriority)
      ? args.priority
      : undefined;
  const rows = await storage.listActions({
    state: stateFilter,
    priority: priorityFilter,
    assignee: args.assignee,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
  return rows.map((a) => enrichAction(a as Record<string, unknown>));
}

export async function getLyteAction(storage: LyteStoragePort, id: number) {
  const action = await storage.getAction(id);
  if (!action) return null;
  return enrichAction(action as Record<string, unknown>);
}

export async function listLyteIncidents(
  storage: LyteStoragePort,
  args: { status?: string; severity?: string; assignee?: string; limit?: number; offset?: number },
) {
  const statusFilter =
    args.status && VALID_INCIDENT_STATUSES.has(args.status as IncidentStatus)
      ? args.status
      : undefined;
  const severityFilter =
    args.severity && VALID_INCIDENT_SEVERITIES.has(args.severity as IncidentSeverity)
      ? args.severity
      : undefined;
  const rows = await storage.listIncidents({
    status: statusFilter,
    severity: severityFilter,
    assignee: args.assignee,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
  return rows.map((i) => enrichIncident(i as Record<string, unknown>));
}

export async function getLyteIncident(storage: LyteStoragePort, id: number) {
  const incident = await storage.getIncident(id);
  if (!incident) return null;
  return enrichIncident(incident as Record<string, unknown>);
}

export async function triageLyteSignal(
  storage: LyteStoragePort,
  id: number,
  args: { status: string; rationale?: string; nextAction?: string },
) {
  const signal = (await storage.getSignal(id)) as Record<string, unknown> | null;
  if (!signal) throw new Error(`Signal not found: ${id}`);

  const meta = (signal.metadata as Record<string, unknown>) ?? {};
  const auditEntry = {
    state: args.status,
    actor: 'system',
    changedAt: new Date().toISOString(),
    rationale: args.rationale ?? null,
  };

  const updatedMeta = {
    ...meta,
    rationale: args.rationale ?? meta.rationale,
    nextAction: args.nextAction ?? meta.nextAction,
    auditHistory: [...(Array.isArray(meta.auditHistory) ? meta.auditHistory : []), auditEntry],
  };

  if (!VALID_SIGNAL_STATUSES.has(args.status as SignalStatus)) {
    throw new Error(`Invalid signal status: ${args.status}`);
  }

  const updated = await storage.updateSignal(id, {
    status: args.status,
    metadata: updatedMeta,
    updatedAt: new Date(),
  });

  domainEventBus.publish('lyte.signal-triaged', {
    signalId: id,
    status: args.status,
    severity: signal.severity as string | null,
    source: signal.source as string | null,
  });

  return enrichSignal(updated as Record<string, unknown>);
}

export async function assignLyteSignalOwner(
  storage: LyteStoragePort,
  id: number,
  assignee: string,
) {
  const signal = (await storage.getSignal(id)) as Record<string, unknown> | null;
  if (!signal) throw new Error(`Signal not found: ${id}`);

  const meta = (signal.metadata as Record<string, unknown>) ?? {};
  const updated = await storage.updateSignal(id, {
    assignee,
    metadata: { ...meta, assignee },
    updatedAt: new Date(),
  });

  return enrichSignal(updated as Record<string, unknown>);
}

export async function escalateLyteSignal(
  storage: LyteStoragePort,
  id: number,
  args: { reason?: string; targetRole: string },
) {
  const signal = (await storage.getSignal(id)) as Record<string, unknown> | null;
  if (!signal) throw new Error(`Signal not found: ${id}`);

  const meta = (signal.metadata as Record<string, unknown>) ?? {};
  const escalations = Array.isArray(meta.escalations) ? meta.escalations : [];

  const updated = await storage.updateSignal(id, {
    status: 'acknowledged',
    metadata: {
      ...meta,
      escalations: [
        ...escalations,
        { targetRole: args.targetRole, reason: args.reason, escalatedAt: new Date().toISOString() },
      ],
    },
    updatedAt: new Date(),
  });

  return enrichSignal(updated as Record<string, unknown>);
}

export async function updateLyteIncident(storage: LyteStoragePort, id: number, status: string) {
  if (!VALID_INCIDENT_STATUSES.has(status as IncidentStatus)) {
    throw new Error(`Invalid incident status: ${status}`);
  }
  const updated = await storage.updateIncident(id, { status, updatedAt: new Date() });
  return enrichIncident(updated as Record<string, unknown>);
}

export async function resolveLyteIncident(
  storage: LyteStoragePort,
  id: number,
  args: { resolution: string; rootCause?: string },
) {
  const incident = (await storage.getIncident(id)) as Record<string, unknown> | null;
  if (!incident) throw new Error(`Incident not found: ${id}`);

  const updated = await storage.updateIncident(id, {
    status: 'resolved',
    resolution: args.resolution,
    rootCause: args.rootCause ?? null,
    resolvedAt: new Date(),
    updatedAt: new Date(),
  });

  domainEventBus.publish('lyte.incident-resolved', {
    incidentId: id,
    resolution: args.resolution,
    rootCause: args.rootCause ?? null,
  });

  return enrichIncident(updated as Record<string, unknown>);
}

export async function escalateLyteIncident(
  storage: LyteStoragePort,
  id: number,
  args: { reason?: string; targetRole: string },
) {
  const incident = (await storage.getIncident(id)) as Record<string, unknown> | null;
  if (!incident) throw new Error(`Incident not found: ${id}`);

  const meta = (incident.metadata as Record<string, unknown>) ?? {};
  const escalations = Array.isArray(meta.escalations) ? meta.escalations : [];

  const updated = await storage.updateIncident(id, {
    status: 'investigating',
    metadata: {
      ...meta,
      escalations: [
        ...escalations,
        { targetRole: args.targetRole, reason: args.reason, escalatedAt: new Date().toISOString() },
      ],
    },
    updatedAt: new Date(),
  });

  domainEventBus.publish('lyte.incident-escalated', {
    incidentId: id,
    severity: incident.severity as string | null,
    targetRole: args.targetRole,
    reason: args.reason ?? null,
  });

  return enrichIncident(updated as Record<string, unknown>);
}

export async function assignLyteIncidentOwner(
  storage: LyteStoragePort,
  id: number,
  assignee: string,
) {
  const incident = (await storage.getIncident(id)) as Record<string, unknown> | null;
  if (!incident) throw new Error(`Incident not found: ${id}`);
  const updated = await storage.updateIncident(id, { assignee, updatedAt: new Date() });
  return enrichIncident(updated as Record<string, unknown>);
}

export async function updateLyteActionState(
  storage: LyteStoragePort,
  id: number,
  args: { state: string; rationale?: string },
) {
  if (!VALID_ACTION_STATES.has(args.state as ActionState)) {
    throw new Error(`Invalid action state: ${args.state}`);
  }
  const action = (await storage.getAction(id)) as Record<string, unknown> | null;
  if (!action) throw new Error(`Action not found: ${id}`);

  const history = Array.isArray(action.stateHistory) ? action.stateHistory : [];
  const updated = await storage.updateAction(id, {
    state: args.state,
    stateHistory: [
      ...history,
      { state: args.state, changedAt: new Date().toISOString(), rationale: args.rationale },
    ],
    updatedAt: new Date(),
  });

  return enrichAction(updated as Record<string, unknown>);
}

export async function assignLyteActionOwner(
  storage: LyteStoragePort,
  id: number,
  assignedTo: string,
) {
  const action = (await storage.getAction(id)) as Record<string, unknown> | null;
  if (!action) throw new Error(`Action not found: ${id}`);
  const updated = await storage.updateAction(id, { assignedTo, updatedAt: new Date() });
  return enrichAction(updated as Record<string, unknown>);
}

export async function escalateLyteAction(
  storage: LyteStoragePort,
  id: number,
  args: { reason?: string; targetRole: string },
) {
  const action = (await storage.getAction(id)) as Record<string, unknown> | null;
  if (!action) throw new Error(`Action not found: ${id}`);

  const history = Array.isArray(action.stateHistory) ? action.stateHistory : [];
  const updated = await storage.updateAction(id, {
    state: 'escalated',
    stateHistory: [
      ...history,
      {
        state: 'escalated',
        changedAt: new Date().toISOString(),
        targetRole: args.targetRole,
        reason: args.reason,
      },
    ],
    updatedAt: new Date(),
  });

  return enrichAction(updated as Record<string, unknown>);
}
