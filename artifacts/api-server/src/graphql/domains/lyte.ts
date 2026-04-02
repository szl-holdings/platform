import { parseIntId } from "../utils.js";
import { pubsub, LYTE_EVENTS } from "../../lib/pubsub-bridge.js";

// ─── Valid DB enum values (must match drizzle schema exactly) ─────────────────
// lyteSignalsTable.severity:  critical | high | medium | low | info
// lyteSignalsTable.status:    new | acknowledged | resolved | dismissed
// lyteIncidentsTable.severity: critical | high | medium | low
// lyteIncidentsTable.status:  open | investigating | mitigating | resolved | closed
// lyteActionsTable.state:     new | acknowledged | assigned | escalated | resolved | dismissed
// lyteActionsTable.priority:  urgent | high | medium | low

type SignalSeverity = "critical" | "high" | "medium" | "low" | "info";
type SignalStatus = "new" | "acknowledged" | "resolved" | "dismissed";
type IncidentSeverity = "critical" | "high" | "medium" | "low";
type IncidentStatus = "open" | "investigating" | "mitigating" | "resolved" | "closed";
type ActionState = "new" | "acknowledged" | "assigned" | "escalated" | "resolved" | "dismissed";
type ActionPriority = "urgent" | "high" | "medium" | "low";

const VALID_SIGNAL_SEVERITIES = new Set<SignalSeverity>(["critical", "high", "medium", "low", "info"]);
const VALID_SIGNAL_STATUSES = new Set<SignalStatus>(["new", "acknowledged", "resolved", "dismissed"]);
const VALID_INCIDENT_SEVERITIES = new Set<IncidentSeverity>(["critical", "high", "medium", "low"]);
const VALID_INCIDENT_STATUSES = new Set<IncidentStatus>(["open", "investigating", "mitigating", "resolved", "closed"]);
const VALID_ACTION_STATES = new Set<ActionState>(["new", "acknowledged", "assigned", "escalated", "resolved", "dismissed"]);

const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export const lyteTypeDefs = `#graphql
  # ── Lyte Operational Shell ────────────────────────────────────────────────────
  # Queue view · Detail pane · Evidence/rationale · Ownership · Escalation · Audit

  # ── Shared Operational Primitives ─────────────────────────────────────────────

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

  # ── Lyte Domain Types ──────────────────────────────────────────────────────────

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
    # Operational fields — derived from metadata jsonb
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
    # Operational fields — derived from stateHistory jsonb
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
    # Operational fields — derived from metadata jsonb
    escalationPaths: [EscalationPath!]
    auditHistory: [AuditHistoryEntry!]
    createdAt: String
    updatedAt: String
  }

  # ── Unified Queue Item ─────────────────────────────────────────────────────────

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

  # ── Executive Summary ─────────────────────────────────────────────────────────

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

  # ── Queries ───────────────────────────────────────────────────────────────────

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

  # ── Mutations ─────────────────────────────────────────────────────────────────

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

  # ── Subscriptions ─────────────────────────────────────────────────────────────

  extend type Subscription {
    lyteIncidentUpdated: LyteIncident!
    lyteSignalUpdated: LyteSignal!
    lyteQueueChanged: LyteQueueItem!
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveSignalAssignee(s: Record<string, unknown>): string | null {
  const assignee = s.assignee;
  if (typeof assignee === "string" && assignee) return assignee;
  const meta = s.metadata as Record<string, unknown> | null;
  if (meta && typeof meta.assignee === "string" && meta.assignee) return meta.assignee;
  return null;
}

function deriveEscalationPaths(meta: Record<string, unknown>): Record<string, unknown>[] {
  const escalations = meta.escalations;
  if (!Array.isArray(escalations)) return [];
  return escalations.map((e: unknown, idx: number) => {
    const entry = (e as Record<string, unknown>) ?? {};
    return {
      id: String(idx + 1),
      level: idx + 1,
      label: `Escalation L${idx + 1}`,
      targetRole: typeof entry.targetRole === "string" ? entry.targetRole : "unspecified",
      targetUserId: null,
      notifyChannels: [],
      triggeredAt: typeof entry.escalatedAt === "string" ? entry.escalatedAt : null,
      resolvedAt: null,
      active: true,
    };
  });
}

function deriveAuditHistory(meta: Record<string, unknown>): Record<string, unknown>[] {
  const history = meta.auditHistory ?? meta.stateHistory;
  if (!Array.isArray(history)) return [];
  return history.map((h: unknown, idx: number) => {
    const entry = (h as Record<string, unknown>) ?? {};
    return {
      id: String(idx + 1),
      action: typeof entry.state === "string" ? `state_changed_to_${entry.state}` : typeof entry.action === "string" ? entry.action : "updated",
      actor: typeof entry.actor === "string" ? entry.actor : "system",
      actorType: "system",
      previousState: null,
      newState: typeof entry.state === "string" ? entry.state : null,
      notes: typeof entry.rationale === "string" ? entry.rationale : typeof entry.reason === "string" ? entry.reason : null,
      timestamp: typeof entry.changedAt === "string" ? entry.changedAt : typeof entry.escalatedAt === "string" ? entry.escalatedAt : new Date().toISOString(),
    };
  });
}

function enrichSignal(s: Record<string, unknown>): Record<string, unknown> {
  const meta = (s.metadata as Record<string, unknown>) ?? {};
  return {
    ...s,
    assignee: deriveSignalAssignee(s),
    rationale: typeof meta.rationale === "string" ? meta.rationale : null,
    nextAction: typeof meta.nextAction === "string" ? meta.nextAction : null,
    escalationPaths: deriveEscalationPaths(meta),
    auditHistory: deriveAuditHistory(meta),
  };
}

function enrichIncident(i: Record<string, unknown>): Record<string, unknown> {
  const meta = (i.metadata as Record<string, unknown>) ?? {};
  return {
    ...i,
    escalationPaths: deriveEscalationPaths(meta),
    auditHistory: deriveAuditHistory(meta),
  };
}

function enrichAction(a: Record<string, unknown>): Record<string, unknown> {
  const history = (a.stateHistory as unknown[]) ?? [];
  const historyMeta = { stateHistory: history };
  const escalations = history.filter((h: unknown) => (h as Record<string, unknown>).state === "escalated");
  return {
    ...a,
    escalationPaths: escalations.map((e: unknown, idx: number) => {
      const entry = (e as Record<string, unknown>) ?? {};
      return {
        id: String(idx + 1),
        level: idx + 1,
        label: `Escalation L${idx + 1}`,
        targetRole: typeof entry.targetRole === "string" ? entry.targetRole : "unspecified",
        targetUserId: null,
        notifyChannels: [],
        triggeredAt: typeof entry.changedAt === "string" ? entry.changedAt : null,
        resolvedAt: null,
        active: true,
      };
    }),
    auditHistory: deriveAuditHistory(historyMeta),
  };
}

function buildSignalQueueItem(s: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `signal-${s.id}`,
    entityType: "signal",
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

function buildIncidentQueueItem(i: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `incident-${i.id}`,
    entityType: "incident",
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

function buildActionQueueItem(a: Record<string, unknown>): Record<string, unknown> {
  return {
    id: `action-${a.id}`,
    entityType: "action",
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

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const lyteResolvers = {
  Query: {
    lyteWorkspaces: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteWorkspacesTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(lyteWorkspacesTable)
          .orderBy(desc(lyteWorkspacesTable.createdAt))
          .limit(args.limit ?? 50).offset(args.offset ?? 0);
      } catch { return []; }
    },

    lyteSignals: async (_: unknown, args: { severity?: string; status?: string; domain?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.severity && VALID_SIGNAL_SEVERITIES.has(args.severity as SignalSeverity)) {
          conditions.push(eq(lyteSignalsTable.severity, args.severity as SignalSeverity));
        }
        if (args.status && VALID_SIGNAL_STATUSES.has(args.status as SignalStatus)) {
          conditions.push(eq(lyteSignalsTable.status, args.status as SignalStatus));
        }
        // lyteSignalsTable has no domain column; filter by source if domain provided
        if (args.domain) conditions.push(eq(lyteSignalsTable.source, args.domain));
        const q = db.select().from(lyteSignalsTable)
          .orderBy(desc(lyteSignalsTable.createdAt))
          .limit(args.limit ?? 50).offset(args.offset ?? 0);
        const signals = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
        return signals.map(s => enrichSignal(s as unknown as Record<string, unknown>));
      } catch { return []; }
    },

    lyteSignal: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, parseIntId(args.id))).limit(1);
        const signal = rows[0];
        if (!signal) return null;
        return enrichSignal(signal as unknown as Record<string, unknown>);
      } catch { return null; }
    },

    lyteActions: async (_: unknown, args: { state?: string; priority?: string; assignee?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const VALID_ACTION_PRIORITIES = new Set<ActionPriority>(["urgent", "high", "medium", "low"]);
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.state && VALID_ACTION_STATES.has(args.state as ActionState)) {
          conditions.push(eq(lyteActionsTable.state, args.state as ActionState));
        }
        if (args.priority && VALID_ACTION_PRIORITIES.has(args.priority as ActionPriority)) {
          conditions.push(eq(lyteActionsTable.priority, args.priority as ActionPriority));
        }
        if (args.assignee) conditions.push(eq(lyteActionsTable.assignedTo, args.assignee));
        const q = db.select().from(lyteActionsTable)
          .orderBy(desc(lyteActionsTable.createdAt))
          .limit(args.limit ?? 50).offset(args.offset ?? 0);
        const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
        return rows.map(a => enrichAction(a as unknown as Record<string, unknown>));
      } catch { return []; }
    },

    lyteAction: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(lyteActionsTable).where(eq(lyteActionsTable.id, parseIntId(args.id))).limit(1);
        if (!rows[0]) return null;
        return enrichAction(rows[0] as unknown as Record<string, unknown>);
      } catch { return null; }
    },

    lyteIncidents: async (_: unknown, args: { status?: string; severity?: string; assignee?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.status && VALID_INCIDENT_STATUSES.has(args.status as IncidentStatus)) {
          conditions.push(eq(lyteIncidentsTable.status, args.status as IncidentStatus));
        }
        if (args.severity && VALID_INCIDENT_SEVERITIES.has(args.severity as IncidentSeverity)) {
          conditions.push(eq(lyteIncidentsTable.severity, args.severity as IncidentSeverity));
        }
        if (args.assignee) conditions.push(eq(lyteIncidentsTable.assignee, args.assignee));
        const q = db.select().from(lyteIncidentsTable)
          .orderBy(desc(lyteIncidentsTable.createdAt))
          .limit(args.limit ?? 50).offset(args.offset ?? 0);
        const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
        return rows.map(i => enrichIncident(i as unknown as Record<string, unknown>));
      } catch { return []; }
    },

    lyteIncident: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(lyteIncidentsTable).where(eq(lyteIncidentsTable.id, parseIntId(args.id))).limit(1);
        if (!rows[0]) return null;
        return enrichIncident(rows[0] as unknown as Record<string, unknown>);
      } catch { return null; }
    },

    lyteQueue: async (_: unknown, args: {
      filter?: { entityType?: string; severity?: string; status?: string; priority?: string; assignee?: string; domain?: string };
      sortBy?: string;
      sortDir?: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable, lyteActionsTable, lyteIncidentsTable } = await import("@workspace/db/schema");
        const { desc, asc, eq, and } = await import("drizzle-orm");
        const filter = args.filter ?? {};
        const limit = args.limit ?? 50;
        const offset = args.offset ?? 0;
        const sortDir = args.sortDir === "asc" ? "asc" : "desc";

        const items: Record<string, unknown>[] = [];

        const VALID_ACTION_PRIORITIES_Q = new Set<ActionPriority>(["urgent", "high", "medium", "low"]);

        if (!filter.entityType || filter.entityType === "signal") {
          const sigConditions: ReturnType<typeof eq>[] = [];
          if (filter.severity && VALID_SIGNAL_SEVERITIES.has(filter.severity as SignalSeverity)) {
            sigConditions.push(eq(lyteSignalsTable.severity, filter.severity as SignalSeverity));
          }
          if (filter.status && VALID_SIGNAL_STATUSES.has(filter.status as SignalStatus)) {
            sigConditions.push(eq(lyteSignalsTable.status, filter.status as SignalStatus));
          }
          // domain filter: signals have a `source` column
          if (filter.domain) sigConditions.push(eq(lyteSignalsTable.source, filter.domain));
          const sigQ = db.select().from(lyteSignalsTable)
            .orderBy(desc(lyteSignalsTable.createdAt)).limit(limit + offset);
          const signals = sigConditions.length > 0 ? await sigQ.where(and(...sigConditions)) : await sigQ;
          items.push(...signals.map(s => buildSignalQueueItem(s as unknown as Record<string, unknown>)));
        }

        if (!filter.entityType || filter.entityType === "incident") {
          const incConditions: ReturnType<typeof eq>[] = [];
          if (filter.severity && VALID_INCIDENT_SEVERITIES.has(filter.severity as IncidentSeverity)) {
            incConditions.push(eq(lyteIncidentsTable.severity, filter.severity as IncidentSeverity));
          }
          if (filter.status && VALID_INCIDENT_STATUSES.has(filter.status as IncidentStatus)) {
            incConditions.push(eq(lyteIncidentsTable.status, filter.status as IncidentStatus));
          }
          if (filter.assignee) incConditions.push(eq(lyteIncidentsTable.assignee, filter.assignee));
          // domain filter: incidents use impactArea as domain proxy
          if (filter.domain) incConditions.push(eq(lyteIncidentsTable.impactArea, filter.domain));
          const incQ = db.select().from(lyteIncidentsTable)
            .orderBy(desc(lyteIncidentsTable.createdAt)).limit(limit + offset);
          const incidents = incConditions.length > 0 ? await incQ.where(and(...incConditions)) : await incQ;
          items.push(...incidents.map(i => buildIncidentQueueItem(i as unknown as Record<string, unknown>)));
        }

        if (!filter.entityType || filter.entityType === "action") {
          const actConditions: ReturnType<typeof eq>[] = [];
          if (filter.status && VALID_ACTION_STATES.has(filter.status as ActionState)) {
            actConditions.push(eq(lyteActionsTable.state, filter.status as ActionState));
          }
          // priority filter: actions have a `priority` column
          if (filter.priority && VALID_ACTION_PRIORITIES_Q.has(filter.priority as ActionPriority)) {
            actConditions.push(eq(lyteActionsTable.priority, filter.priority as ActionPriority));
          }
          if (filter.assignee) actConditions.push(eq(lyteActionsTable.assignedTo, filter.assignee));
          const actQ = db.select().from(lyteActionsTable)
            .orderBy(desc(lyteActionsTable.createdAt)).limit(limit + offset);
          const actions = actConditions.length > 0 ? await actQ.where(and(...actConditions)) : await actQ;
          items.push(...actions.map(a => buildActionQueueItem(a as unknown as Record<string, unknown>)));
        }

        // Sort with full sortDir support
        items.sort((a, b) => {
          if (args.sortBy === "createdAt") {
            const aTime = new Date(String(a.createdAt ?? 0)).getTime();
            const bTime = new Date(String(b.createdAt ?? 0)).getTime();
            return sortDir === "asc" ? aTime - bTime : bTime - aTime;
          }
          // Default: severity rank — sortDir controls direction
          const aRank = SEVERITY_RANK[String(a.severity ?? "info")] ?? 0;
          const bRank = SEVERITY_RANK[String(b.severity ?? "info")] ?? 0;
          if (bRank !== aRank) return sortDir === "asc" ? aRank - bRank : bRank - aRank;
          // Tie-break: createdAt desc
          return new Date(String(b.createdAt ?? 0)).getTime() - new Date(String(a.createdAt ?? 0)).getTime();
        });

        return items.slice(offset, offset + limit);
      } catch { return []; }
    },

    lyteExecutiveSummary: async () => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable, lyteActionsTable, lyteIncidentsTable, alloyApprovals } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");

        const [signals, incidents, actions, pendingApprovals] = await Promise.all([
          db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.createdAt)).limit(500),
          db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt)).limit(200),
          db.select().from(lyteActionsTable).orderBy(desc(lyteActionsTable.createdAt)).limit(200),
          db.select().from(alloyApprovals).where(eq(alloyApprovals.status, "pending")).limit(50),
        ]);

        const criticalSignals = signals.filter(s => s.severity === "critical").length;
        const highSignals = signals.filter(s => s.severity === "high").length;
        const openIncidents = incidents.filter(i => i.status === "open" || i.status === "investigating").length;
        const criticalIncidents = incidents.filter(i => i.severity === "critical").length;
        const pendingActions = actions.filter(a => a.state === "new" || a.state === "acknowledged").length;

        const topRisks = [
          ...incidents.filter(i => i.severity === "critical" || i.severity === "high").slice(0, 3).map(i => ({
            entityType: "incident", entityId: i.id,
            title: i.title ?? i.impactArea ?? `Incident #${i.id}`,
            severity: i.severity, assignee: i.assignee ?? null,
          })),
          ...signals.filter(s => s.severity === "critical").slice(0, 2).map(s => ({
            entityType: "signal", entityId: s.id,
            title: s.title ?? `Signal #${s.id}`,
            severity: s.severity, assignee: null,
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
          signalTrend: criticalSignals > 3 ? "rising" : "stable",
          incidentTrend: criticalIncidents > 2 ? "rising" : "stable",
          topRisks,
        };
      } catch {
        return {
          generatedAt: new Date().toISOString(),
          totalSignals: 0, criticalSignals: 0, highSignals: 0,
          openIncidents: 0, criticalIncidents: 0, pendingActions: 0, pendingApprovals: 0,
          signalTrend: "stable", incidentTrend: "stable", topRisks: [],
        };
      }
    },
  },

  Mutation: {
    triageLyteSignal: async (_: unknown, args: { id: string; status: string; rationale?: string; nextAction?: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        if (!VALID_SIGNAL_STATUSES.has(args.status as SignalStatus)) {
          throw new Error(`Invalid signal status '${args.status}' — must be one of: ${[...VALID_SIGNAL_STATUSES].join(", ")}`);
        }
        const id = parseIntId(args.id);
        const [existing] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id)).limit(1);
        if (!existing) throw new Error("Signal not found");
        const currentMeta = (existing.metadata as Record<string, unknown>) ?? {};
        const rows = await db.update(lyteSignalsTable)
          .set({
            status: args.status as SignalStatus,
            metadata: {
              ...currentMeta,
              ...(args.rationale !== undefined ? { rationale: args.rationale } : {}),
              ...(args.nextAction !== undefined ? { nextAction: args.nextAction } : {}),
            },
          })
          .where(eq(lyteSignalsTable.id, id)).returning();
        const signal = rows[0];
        const enrichedSig = enrichSignal(signal as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: enrichedSig });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildSignalQueueItem(signal as unknown as Record<string, unknown>) });
        return enrichedSig;
      } catch (err) { throw new Error(`Failed to triage signal: ${err}`); }
    },

    assignLyteSignalOwner: async (_: unknown, args: { id: string; assignee: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        // lyteSignalsTable has no assignee column — store in metadata jsonb
        const id = parseIntId(args.id);
        const [existing] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id)).limit(1);
        if (!existing) throw new Error("Signal not found");
        const currentMeta = (existing.metadata as Record<string, unknown>) ?? {};
        const rows = await db.update(lyteSignalsTable)
          .set({ metadata: { ...currentMeta, assignee: args.assignee, assignedAt: new Date().toISOString() } })
          .where(eq(lyteSignalsTable.id, id)).returning();
        const signal = rows[0];
        const enrichedSig = enrichSignal(signal as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: enrichedSig });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildSignalQueueItem({ ...signal as unknown as Record<string, unknown>, assignee: args.assignee }) });
        return enrichedSig;
      } catch (err) { throw new Error(`Failed to assign signal owner: ${err}`); }
    },

    escalateLyteSignal: async (_: unknown, args: { id: string; reason?: string; targetRole: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        const [existing] = await db.select().from(lyteSignalsTable).where(eq(lyteSignalsTable.id, id)).limit(1);
        if (!existing) throw new Error("Signal not found");
        const currentMeta = (existing.metadata as Record<string, unknown>) ?? {};
        const escalations = Array.isArray(currentMeta.escalations) ? currentMeta.escalations : [];
        escalations.push({ targetRole: args.targetRole, reason: args.reason, escalatedAt: new Date().toISOString() });
        const rows = await db.update(lyteSignalsTable)
          .set({ metadata: { ...currentMeta, escalations } })
          .where(eq(lyteSignalsTable.id, id)).returning();
        const signal = rows[0];
        const enrichedSig = enrichSignal(signal as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.SIGNAL_UPDATED, { lyteSignalUpdated: enrichedSig });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildSignalQueueItem(signal as unknown as Record<string, unknown>) });
        return enrichedSig;
      } catch (err) { throw new Error(`Failed to escalate signal: ${err}`); }
    },

    updateLyteIncident: async (_: unknown, args: { id: string; status: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        if (!VALID_INCIDENT_STATUSES.has(args.status as IncidentStatus)) {
          throw new Error(`Invalid incident status '${args.status}' — must be one of: ${[...VALID_INCIDENT_STATUSES].join(", ")}`);
        }
        const id = parseIntId(args.id);
        const rows = await db.update(lyteIncidentsTable)
          .set({ status: args.status as IncidentStatus, updatedAt: new Date() })
          .where(eq(lyteIncidentsTable.id, id)).returning();
        if (!rows[0]) throw new Error("Incident not found");
        const incident = rows[0];
        const enrichedInc = enrichIncident(incident as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: enrichedInc });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildIncidentQueueItem(incident as unknown as Record<string, unknown>) });
        return enrichedInc;
      } catch (err) { throw new Error(`Failed to update incident: ${err}`); }
    },

    assignLyteIncidentOwner: async (_: unknown, args: { id: string; assignee: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        const rows = await db.update(lyteIncidentsTable)
          .set({ assignee: args.assignee, updatedAt: new Date() })
          .where(eq(lyteIncidentsTable.id, id)).returning();
        if (!rows[0]) throw new Error("Incident not found");
        const incident = rows[0];
        const enrichedInc = enrichIncident(incident as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: enrichedInc });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildIncidentQueueItem(incident as unknown as Record<string, unknown>) });
        return enrichedInc;
      } catch (err) { throw new Error(`Failed to assign incident owner: ${err}`); }
    },

    escalateLyteIncident: async (_: unknown, args: { id: string; reason?: string; targetRole: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        // Fetch existing row to merge metadata and transition status
        const [existing] = await db.select().from(lyteIncidentsTable).where(eq(lyteIncidentsTable.id, id)).limit(1);
        if (!existing) throw new Error("Incident not found");
        const newStatus: IncidentStatus = existing.status === "open" ? "investigating" : existing.status;
        // Append escalation event to metadata.escalations array
        const existingMeta = (existing.metadata as Record<string, unknown>) ?? {};
        const escalations: unknown[] = Array.isArray(existingMeta.escalations) ? existingMeta.escalations : [];
        escalations.push({
          targetRole: args.targetRole,
          reason: args.reason ?? null,
          escalatedAt: new Date().toISOString(),
        });
        const newMeta = { ...existingMeta, escalations };
        const rows = await db.update(lyteIncidentsTable)
          .set({ status: newStatus, metadata: newMeta, updatedAt: new Date() })
          .where(eq(lyteIncidentsTable.id, id)).returning();
        const incident = rows[0];
        const enriched = enrichIncident(incident as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: enriched });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildIncidentQueueItem(incident as unknown as Record<string, unknown>) });
        return enriched;
      } catch (err) { throw new Error(`Failed to escalate incident: ${err}`); }
    },

    resolveLyteIncident: async (_: unknown, args: { id: string; resolution: string; rootCause?: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        const rows = await db.update(lyteIncidentsTable)
          .set({ status: "resolved", resolution: args.resolution, rootCause: args.rootCause ?? null, resolvedAt: new Date(), updatedAt: new Date() })
          .where(eq(lyteIncidentsTable.id, id)).returning();
        if (!rows[0]) throw new Error("Incident not found");
        const incident = rows[0];
        const enriched = enrichIncident(incident as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: enriched });
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildIncidentQueueItem(incident as unknown as Record<string, unknown>) });
        return enriched;
      } catch (err) { throw new Error(`Failed to resolve incident: ${err}`); }
    },

    updateLyteActionState: async (_: unknown, args: { id: string; state: string; rationale?: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        if (!VALID_ACTION_STATES.has(args.state as ActionState)) {
          throw new Error(`Invalid action state '${args.state}' — must be one of: ${[...VALID_ACTION_STATES].join(", ")}`);
        }
        const id = parseIntId(args.id);
        const [existing] = await db.select({ stateHistory: lyteActionsTable.stateHistory }).from(lyteActionsTable).where(eq(lyteActionsTable.id, id)).limit(1);
        if (!existing) throw new Error("Action not found");
        const history = Array.isArray(existing.stateHistory) ? existing.stateHistory : [];
        history.push({ state: args.state, rationale: args.rationale, changedAt: new Date().toISOString() });
        const rows = await db.update(lyteActionsTable)
          .set({ state: args.state as ActionState, stateHistory: history, updatedAt: new Date() })
          .where(eq(lyteActionsTable.id, id)).returning();
        const action = rows[0];
        const enriched = enrichAction(action as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildActionQueueItem(action as unknown as Record<string, unknown>) });
        return enriched;
      } catch (err) { throw new Error(`Failed to update action state: ${err}`); }
    },

    assignLyteActionOwner: async (_: unknown, args: { id: string; assignedTo: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        const rows = await db.update(lyteActionsTable)
          .set({ assignedTo: args.assignedTo, state: "assigned", updatedAt: new Date() })
          .where(eq(lyteActionsTable.id, id)).returning();
        if (!rows[0]) throw new Error("Action not found");
        const action = rows[0];
        const enriched = enrichAction(action as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildActionQueueItem(action as unknown as Record<string, unknown>) });
        return enriched;
      } catch (err) { throw new Error(`Failed to assign action owner: ${err}`); }
    },

    escalateLyteAction: async (_: unknown, args: { id: string; reason?: string; targetRole: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const id = parseIntId(args.id);
        const [existing] = await db.select({ stateHistory: lyteActionsTable.stateHistory }).from(lyteActionsTable).where(eq(lyteActionsTable.id, id)).limit(1);
        if (!existing) throw new Error("Action not found");
        const history = Array.isArray(existing.stateHistory) ? existing.stateHistory : [];
        history.push({ state: "escalated", targetRole: args.targetRole, reason: args.reason, changedAt: new Date().toISOString() });
        const rows = await db.update(lyteActionsTable)
          .set({ state: "escalated", stateHistory: history, updatedAt: new Date() })
          .where(eq(lyteActionsTable.id, id)).returning();
        const action = rows[0];
        const enriched = enrichAction(action as unknown as Record<string, unknown>);
        pubsub.publish(LYTE_EVENTS.QUEUE_CHANGED, { lyteQueueChanged: buildActionQueueItem(action as unknown as Record<string, unknown>) });
        return enriched;
      } catch (err) { throw new Error(`Failed to escalate action: ${err}`); }
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
