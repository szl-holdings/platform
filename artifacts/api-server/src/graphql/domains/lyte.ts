import {
  type ActionPriority,
  type ActionState,
  assignLyteActionOwner,
  assignLyteIncidentOwner,
  assignLyteSignalOwner,
  buildActionQueueItem,
  buildIncidentQueueItem,
  buildSignalQueueItem,
  enrichAction,
  enrichIncident,
  enrichSignal,
  escalateLyteAction,
  escalateLyteIncident,
  escalateLyteSignal,
  getLyteAction,
  getLyteIncident,
  getLyteSignal,
  type IncidentSeverity,
  type IncidentStatus,
  type LyteStoragePort,
  listLyteActions,
  listLyteIncidents,
  listLyteSignals,
  listLyteWorkspaces,
  resolveLyteIncident,
  SEVERITY_RANK,
  type SignalSeverity,
  type SignalStatus,
  triageLyteSignal,
  updateLyteActionState,
  updateLyteIncident,
  VALID_ACTION_PRIORITIES,
  VALID_ACTION_STATES,
  VALID_INCIDENT_SEVERITIES,
  VALID_INCIDENT_STATUSES,
  VALID_SIGNAL_SEVERITIES,
  VALID_SIGNAL_STATUSES,
} from '../../lib/domain-services/lyte/index.js';
import { LYTE_EVENTS, pubsub } from '../../lib/pubsub-bridge.js';
import { parseIntId } from '../utils.js';

export const lyteTypeDefs = `#graphql
  type OperationalOwner {
    userId: ID
    name: String
    email: String
    role: String
    assignedAt: String
  }

  type EvidenceItem {
    id: ID!
    label: String!
    value: String!
    source: String
    confidence: Float
    timestamp: String
  }

  type AuditHistoryEntry {
    id: ID!
    action: String!
    actor: String!
    actorType: String!
    previousState: String
    newState: String
    notes: String
    timestamp: String!
  }

  type EscalationPath {
    id: ID!
    level: Int!
    label: String!
    targetRole: String!
    targetUserId: ID
    notifyChannels: [String!]!
    triggeredAt: String
    resolvedAt: String
    active: Boolean!
  }

  type LyteWorkspace {
    id: ID!
    name: String!
    ownerId: ID
    createdAt: String
  }

  type LyteSignal {
    id: ID!
    source: String
    sourceType: String
    severity: String
    title: String
    description: String
    status: String
    assignee: String
    rationale: String
    nextAction: String
    escalationPaths: [EscalationPath!]
    auditHistory: [AuditHistoryEntry!]
    createdAt: String
    updatedAt: String
  }

  type LyteAction {
    id: ID!
    title: String
    description: String
    state: String
    priority: String
    valueAtRisk: String
    assignedTo: String
    owner: String
    notes: String
    dueAt: String
    resolvedAt: String
    escalationPaths: [EscalationPath!]
    auditHistory: [AuditHistoryEntry!]
    createdAt: String
    updatedAt: String
  }

  type LyteIncident {
    id: ID!
    title: String
    severity: String
    status: String
    impactArea: String
    rootCause: String
    resolution: String
    assignee: String
    resolvedAt: String
    escalationPaths: [EscalationPath!]
    auditHistory: [AuditHistoryEntry!]
    createdAt: String
    updatedAt: String
  }

  type LyteQueueItem {
    id: ID!
    entityType: String!
    entityId: ID!
    title: String!
    severity: String
    status: String
    priority: String
    assignee: String
    createdAt: String!
    updatedAt: String!
  }

  input LyteQueueFilter {
    entityType: String
    severity: String
    status: String
    priority: String
    assignee: String
    domain: String
  }

  type LyteExecutiveSummary {
    generatedAt: String!
    totalSignals: Int!
    criticalSignals: Int!
    highSignals: Int!
    openIncidents: Int!
    criticalIncidents: Int!
    pendingActions: Int!
    pendingApprovals: Int!
    signalTrend: String!
    incidentTrend: String!
    topRisks: [LyteRiskItem!]!
  }

  type LyteRiskItem {
    entityType: String!
    entityId: ID!
    title: String!
    severity: String!
    assignee: String
  }

  extend type Query {
    lyteWorkspaces(limit: Int, offset: Int): [LyteWorkspace!]!

    lyteSignals(severity: String, status: String, domain: String, limit: Int, offset: Int): [LyteSignal!]!
    lyteSignal(id: ID!): LyteSignal

    lyteActions(state: String, priority: String, assignee: String, limit: Int, offset: Int): [LyteAction!]!
    lyteAction(id: ID!): LyteAction

    lyteIncidents(status: String, severity: String, assignee: String, limit: Int, offset: Int): [LyteIncident!]!
    lyteIncident(id: ID!): LyteIncident

    lyteQueue(filter: LyteQueueFilter, sortBy: String, sortDir: String, limit: Int, offset: Int): [LyteQueueItem!]!
    lyteExecutiveSummary: LyteExecutiveSummary!
  }

  extend type Mutation {
    triageLyteSignal(id: ID!, status: String!, rationale: String, nextAction: String): LyteSignal!
    assignLyteSignalOwner(id: ID!, assignee: String!): LyteSignal!
    escalateLyteSignal(id: ID!, reason: String, targetRole: String!): LyteSignal!

    updateLyteIncident(id: ID!, status: String!): LyteIncident!
    assignLyteIncidentOwner(id: ID!, assignee: String!): LyteIncident!
    escalateLyteIncident(id: ID!, reason: String, targetRole: String!): LyteIncident!
    resolveLyteIncident(id: ID!, resolution: String!, rootCause: String): LyteIncident!

    updateLyteActionState(id: ID!, state: String!, rationale: String): LyteAction!
    assignLyteActionOwner(id: ID!, assignedTo: String!): LyteAction!
    escalateLyteAction(id: ID!, reason: String, targetRole: String!): LyteAction!
  }

  extend type Subscription {
    lyteIncidentUpdated: LyteIncident!
    lyteSignalUpdated: LyteSignal!
    lyteQueueChanged: LyteQueueItem!
  }
`;

async function buildLyteStorage(): Promise<LyteStoragePort> {
  const { db } = await import('@szl-holdings/db');
  const { lyteWorkspacesTable, lyteSignalsTable, lyteActionsTable, lyteIncidentsTable } =
    await import('@szl-holdings/db/schema');
  const { desc, eq, and } = await import('drizzle-orm');

  return {
    async listWorkspaces(args) {
      try {
        return await db
          .select()
          .from(lyteWorkspacesTable)
          .orderBy(desc(lyteWorkspacesTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
      } catch {
        return [];
      }
    },
    async listSignals(args) {
      try {
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.severity && VALID_SIGNAL_SEVERITIES.has(args.severity as SignalSeverity))
          conditions.push(eq(lyteSignalsTable.severity, args.severity as SignalSeverity));
        if (args.status && VALID_SIGNAL_STATUSES.has(args.status as SignalStatus))
          conditions.push(eq(lyteSignalsTable.status, args.status as SignalStatus));
        if (args.source) conditions.push(eq(lyteSignalsTable.source, args.source));
        const q = db
          .select()
          .from(lyteSignalsTable)
          .orderBy(desc(lyteSignalsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },
    async getSignal(id) {
      try {
        const rows = await db
          .select()
          .from(lyteSignalsTable)
          .where(eq(lyteSignalsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateSignal(id, data) {
      const rows = await db
        .update(lyteSignalsTable)
        .set(data)
        .where(eq(lyteSignalsTable.id, id))
        .returning();
      return rows[0];
    },
    async listActions(args) {
      try {
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.state && VALID_ACTION_STATES.has(args.state as ActionState))
          conditions.push(eq(lyteActionsTable.state, args.state as ActionState));
        if (args.priority && VALID_ACTION_PRIORITIES.has(args.priority as ActionPriority))
          conditions.push(eq(lyteActionsTable.priority, args.priority as ActionPriority));
        if (args.assignee) conditions.push(eq(lyteActionsTable.assignedTo, args.assignee));
        const q = db
          .select()
          .from(lyteActionsTable)
          .orderBy(desc(lyteActionsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },
    async getAction(id) {
      try {
        const rows = await db
          .select()
          .from(lyteActionsTable)
          .where(eq(lyteActionsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateAction(id, data) {
      const rows = await db
        .update(lyteActionsTable)
        .set(data)
        .where(eq(lyteActionsTable.id, id))
        .returning();
      return rows[0];
    },
    async listIncidents(args) {
      try {
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.status && VALID_INCIDENT_STATUSES.has(args.status as IncidentStatus))
          conditions.push(eq(lyteIncidentsTable.status, args.status as IncidentStatus));
        if (args.severity && VALID_INCIDENT_SEVERITIES.has(args.severity as IncidentSeverity))
          conditions.push(eq(lyteIncidentsTable.severity, args.severity as IncidentSeverity));
        if (args.assignee) conditions.push(eq(lyteIncidentsTable.assignee, args.assignee));
        const q = db
          .select()
          .from(lyteIncidentsTable)
          .orderBy(desc(lyteIncidentsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },
    async getIncident(id) {
      try {
        const rows = await db
          .select()
          .from(lyteIncidentsTable)
          .where(eq(lyteIncidentsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateIncident(id, data) {
      const rows = await db
        .update(lyteIncidentsTable)
        .set(data)
        .where(eq(lyteIncidentsTable.id, id))
        .returning();
      return rows[0];
    },
    async countSignals() {
      return {};
    },
    async countIncidents() {
      return {};
    },
    async countActions() {
      return 0;
    },
  };
}

export const lyteResolvers = {
  Query: {
    lyteWorkspaces: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listLyteWorkspaces(await buildLyteStorage(), args);
    },
    lyteSignals: async (
      _: unknown,
      args: {
        severity?: string;
        status?: string;
        domain?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      return listLyteSignals(await buildLyteStorage(), args);
    },
    lyteSignal: async (_: unknown, args: { id: string }) => {
      return getLyteSignal(await buildLyteStorage(), parseIntId(args.id));
    },
    lyteActions: async (
      _: unknown,
      args: {
        state?: string;
        priority?: string;
        assignee?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      return listLyteActions(await buildLyteStorage(), args);
    },
    lyteAction: async (_: unknown, args: { id: string }) => {
      return getLyteAction(await buildLyteStorage(), parseIntId(args.id));
    },
    lyteIncidents: async (
      _: unknown,
      args: {
        status?: string;
        severity?: string;
        assignee?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      return listLyteIncidents(await buildLyteStorage(), args);
    },
    lyteIncident: async (_: unknown, args: { id: string }) => {
      return getLyteIncident(await buildLyteStorage(), parseIntId(args.id));
    },

    lyteQueue: async (
      _: unknown,
      args: {
        filter?: {
          entityType?: string;
          severity?: string;
          status?: string;
          priority?: string;
          assignee?: string;
          domain?: string;
        };
        sortBy?: string;
        sortDir?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { lyteSignalsTable, lyteActionsTable, lyteIncidentsTable } = await import(
          '@szl-holdings/db/schema'
        );
        const { desc, eq, and } = await import('drizzle-orm');
        const filter = args.filter ?? {};
        const limit = args.limit ?? 50;
        const offset = args.offset ?? 0;
        const sortDir = args.sortDir === 'asc' ? 'asc' : 'desc';
        const items: Record<string, unknown>[] = [];

        if (!filter.entityType || filter.entityType === 'signal') {
          const sigConditions: ReturnType<typeof eq>[] = [];
          if (filter.severity && VALID_SIGNAL_SEVERITIES.has(filter.severity as SignalSeverity))
            sigConditions.push(eq(lyteSignalsTable.severity, filter.severity as SignalSeverity));
          if (filter.status && VALID_SIGNAL_STATUSES.has(filter.status as SignalStatus))
            sigConditions.push(eq(lyteSignalsTable.status, filter.status as SignalStatus));
          if (filter.domain) sigConditions.push(eq(lyteSignalsTable.source, filter.domain));
          const sigQ = db
            .select()
            .from(lyteSignalsTable)
            .orderBy(desc(lyteSignalsTable.createdAt))
            .limit(limit + offset);
          const signals =
            sigConditions.length > 0 ? await sigQ.where(and(...sigConditions)) : await sigQ;
          items.push(
            ...signals.map((s) => buildSignalQueueItem(s as unknown as Record<string, unknown>)),
          );
        }

        if (!filter.entityType || filter.entityType === 'incident') {
          const incConditions: ReturnType<typeof eq>[] = [];
          if (filter.severity && VALID_INCIDENT_SEVERITIES.has(filter.severity as IncidentSeverity))
            incConditions.push(
              eq(lyteIncidentsTable.severity, filter.severity as IncidentSeverity),
            );
          if (filter.status && VALID_INCIDENT_STATUSES.has(filter.status as IncidentStatus))
            incConditions.push(eq(lyteIncidentsTable.status, filter.status as IncidentStatus));
          if (filter.assignee) incConditions.push(eq(lyteIncidentsTable.assignee, filter.assignee));
          if (filter.domain) incConditions.push(eq(lyteIncidentsTable.impactArea, filter.domain));
          const incQ = db
            .select()
            .from(lyteIncidentsTable)
            .orderBy(desc(lyteIncidentsTable.createdAt))
            .limit(limit + offset);
          const incidents =
            incConditions.length > 0 ? await incQ.where(and(...incConditions)) : await incQ;
          items.push(
            ...incidents.map((i) =>
              buildIncidentQueueItem(i as unknown as Record<string, unknown>),
            ),
          );
        }

        if (!filter.entityType || filter.entityType === 'action') {
          const actConditions: ReturnType<typeof eq>[] = [];
          if (filter.status && VALID_ACTION_STATES.has(filter.status as ActionState))
            actConditions.push(eq(lyteActionsTable.state, filter.status as ActionState));
          if (filter.priority && VALID_ACTION_PRIORITIES.has(filter.priority as ActionPriority))
            actConditions.push(eq(lyteActionsTable.priority, filter.priority as ActionPriority));
          if (filter.assignee) actConditions.push(eq(lyteActionsTable.assignedTo, filter.assignee));
          const actQ = db
            .select()
            .from(lyteActionsTable)
            .orderBy(desc(lyteActionsTable.createdAt))
            .limit(limit + offset);
          const actions =
            actConditions.length > 0 ? await actQ.where(and(...actConditions)) : await actQ;
          items.push(
            ...actions.map((a) => buildActionQueueItem(a as unknown as Record<string, unknown>)),
          );
        }

        items.sort((a, b) => {
          if (args.sortBy === 'createdAt') {
            const aTime = new Date(String(a.createdAt ?? 0)).getTime();
            const bTime = new Date(String(b.createdAt ?? 0)).getTime();
            return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
          }
          const aRank = SEVERITY_RANK[String(a.severity ?? 'info')] ?? 0;
          const bRank = SEVERITY_RANK[String(b.severity ?? 'info')] ?? 0;
          if (bRank !== aRank) return sortDir === 'asc' ? aRank - bRank : bRank - aRank;
          return (
            new Date(String(b.createdAt ?? 0)).getTime() -
            new Date(String(a.createdAt ?? 0)).getTime()
          );
        });

        return items.slice(offset, offset + limit);
      } catch {
        return [];
      }
    },

    lyteExecutiveSummary: async () => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { lyteSignalsTable, lyteActionsTable, lyteIncidentsTable, alloyApprovals } =
          await import('@szl-holdings/db/schema');
        const { desc, eq } = await import('drizzle-orm');

        const [signals, incidents, actions, pendingApprovals] = await Promise.all([
          db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.createdAt)).limit(500),
          db
            .select()
            .from(lyteIncidentsTable)
            .orderBy(desc(lyteIncidentsTable.createdAt))
            .limit(200),
          db.select().from(lyteActionsTable).orderBy(desc(lyteActionsTable.createdAt)).limit(200),
          db.select().from(alloyApprovals).where(eq(alloyApprovals.status, 'pending')).limit(50),
        ]);

        const criticalSignals = signals.filter((s) => s.severity === 'critical').length;
        const highSignals = signals.filter((s) => s.severity === 'high').length;
        const openIncidents = incidents.filter(
          (i) => i.status === 'open' || i.status === 'investigating',
        ).length;
        const criticalIncidents = incidents.filter((i) => i.severity === 'critical').length;
        const pendingActions = actions.filter(
          (a) => a.state === 'new' || a.state === 'acknowledged',
        ).length;

        const topRisks = [
          ...incidents
            .filter((i) => i.severity === 'critical' || i.severity === 'high')
            .slice(0, 3)
            .map((i) => ({
              entityType: 'incident',
              entityId: i.id,
              title: i.title ?? i.impactArea ?? `Incident #${i.id}`,
              severity: i.severity,
              assignee: i.assignee ?? null,
            })),
          ...signals
            .filter((s) => s.severity === 'critical')
            .slice(0, 2)
            .map((s) => ({
              entityType: 'signal',
              entityId: s.id,
              title: s.title ?? `Signal #${s.id}`,
              severity: s.severity,
              assignee: null,
            })),
        ];

        return {
          generatedAt: new Date().toISOString(),
          totalSignals: signals.length,
          criticalSignals,
          highSignals,
          openIncidents,
          criticalIncidents,
          pendingActions,
          pendingApprovals: pendingApprovals.length,
          signalTrend: criticalSignals > 3 ? 'rising' : 'stable',
          incidentTrend: criticalIncidents > 2 ? 'rising' : 'stable',
          topRisks,
        };
      } catch {
        return {
          generatedAt: new Date().toISOString(),
          totalSignals: 0,
          criticalSignals: 0,
          highSignals: 0,
          openIncidents: 0,
          criticalIncidents: 0,
          pendingActions: 0,
          pendingApprovals: 0,
          signalTrend: 'stable',
          incidentTrend: 'stable',
          topRisks: [],
        };
      }
    },
  },

  Mutation: {
    triageLyteSignal: async (
      _: unknown,
      args: { id: string; status: string; rationale?: string; nextAction?: string },
    ) => {
      try {
        const result = await triageLyteSignal(await buildLyteStorage(), parseIntId(args.id), args);
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildSignalQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to triage signal: ${err}`);
      }
    },

    assignLyteSignalOwner: async (_: unknown, args: { id: string; assignee: string }) => {
      try {
        const result = await assignLyteSignalOwner(
          await buildLyteStorage(),
          parseIntId(args.id),
          args.assignee,
        );
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildSignalQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to assign signal owner: ${err}`);
      }
    },

    escalateLyteSignal: async (
      _: unknown,
      args: { id: string; reason?: string; targetRole: string },
    ) => {
      try {
        const result = await escalateLyteSignal(
          await buildLyteStorage(),
          parseIntId(args.id),
          args,
        );
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildSignalQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to escalate signal: ${err}`);
      }
    },

    updateLyteIncident: async (_: unknown, args: { id: string; status: string }) => {
      try {
        const result = await updateLyteIncident(
          await buildLyteStorage(),
          parseIntId(args.id),
          args.status,
        );
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildIncidentQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to update incident: ${err}`);
      }
    },

    assignLyteIncidentOwner: async (_: unknown, args: { id: string; assignee: string }) => {
      try {
        const result = await assignLyteIncidentOwner(
          await buildLyteStorage(),
          parseIntId(args.id),
          args.assignee,
        );
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildIncidentQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to assign incident owner: ${err}`);
      }
    },

    escalateLyteIncident: async (
      _: unknown,
      args: { id: string; reason?: string; targetRole: string },
    ) => {
      try {
        const result = await escalateLyteIncident(
          await buildLyteStorage(),
          parseIntId(args.id),
          args,
        );
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildIncidentQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to escalate incident: ${err}`);
      }
    },

    resolveLyteIncident: async (
      _: unknown,
      args: { id: string; resolution: string; rootCause?: string },
    ) => {
      try {
        const result = await resolveLyteIncident(
          await buildLyteStorage(),
          parseIntId(args.id),
          args,
        );
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: result });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildIncidentQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to resolve incident: ${err}`);
      }
    },

    updateLyteActionState: async (
      _: unknown,
      args: { id: string; state: string; rationale?: string },
    ) => {
      try {
        const result = await updateLyteActionState(
          await buildLyteStorage(),
          parseIntId(args.id),
          args,
        );
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildActionQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to update action state: ${err}`);
      }
    },

    assignLyteActionOwner: async (_: unknown, args: { id: string; assignedTo: string }) => {
      try {
        const result = await assignLyteActionOwner(
          await buildLyteStorage(),
          parseIntId(args.id),
          args.assignedTo,
        );
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildActionQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to assign action owner: ${err}`);
      }
    },

    escalateLyteAction: async (
      _: unknown,
      args: { id: string; reason?: string; targetRole: string },
    ) => {
      try {
        const result = await escalateLyteAction(
          await buildLyteStorage(),
          parseIntId(args.id),
          args,
        );
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, {
          lyteQueueChanged: buildActionQueueItem(result as Record<string, unknown>),
        });
        return result;
      } catch (err) {
        throw new Error(`Failed to escalate action: ${err}`);
      }
    },
  },

  Subscription: {
    lyteIncidentUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(LYTE_EVENTS.INCIDENT_UPDATED),
    },
    lyteSignalUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(LYTE_EVENTS.SIGNAL_UPDATED),
    },
    lyteQueueChanged: {
      subscribe: () => pubsub.asyncIterableIterator(LYTE_EVENTS.QUEUE_CHANGED),
    },
  },
};
