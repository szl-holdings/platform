import { db, activityLogTable, auditEventsTable, auditLogsTable } from "@szl-holdings/db";
import { desc, eq, and, like } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { hashIp } from "./ip-hash.js";
export { hashIp };

export { activityLogTable, auditEventsTable, auditLogsTable };
export {
  writeEnrichedAudit,
  writeExportAudit,
  enrichAuditFromRequest,
  type EnrichedAuditParams,
  type ExportAuditParams,
  type AdminActionClass,
} from "./enriched.js";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "read"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "execute"
  | "configure"
  | "approve"
  | "reject";

export type AuditEntityType =
  | "user"
  | "organization"
  | "connector"
  | "feature_flag"
  | "job"
  | "report"
  | "workflow"
  | "agent"
  | "knowledge_entry"
  | "conversation"
  | "message"
  | "audit_log";

export interface LogActivityParams {
  userId?: number | null;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: unknown;
  ipAddress?: string | null;
}

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "api_key", "apikey",
  "authorization", "auth", "credential", "credentials", "access_token",
  "refresh_token", "session", "cookie", "ssn", "credit_card", "cvv",
  "card_number", "private_key", "client_secret",
]);

// Reject prototype-polluting keys arriving from external/audit payloads
// (CodeQL js/remote-property-injection).
const _AUDIT_FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(v => redactSensitive(v, depth + 1));
  const out: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof k !== "string" || _AUDIT_FORBIDDEN_KEYS.has(k)) continue;
    out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : redactSensitive(v, depth + 1);
  }
  return out;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLogTable).values({
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata ?? null,
      ipAddress: hashIp(params.ipAddress),
    });
  } catch {
  }
}

export async function logActivityFromRequest(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  description?: string,
  metadata?: unknown,
): Promise<void> {
  const user = (req as any).user;
  return logActivity({
    userId: user?.id ?? null,
    action,
    resource,
    ...(resourceId !== undefined ? { resourceId } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
    ipAddress: req.ip ?? null,
  });
}

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

const MUTATION_METHODS: MutationMethod[] = ["POST", "PUT", "PATCH", "DELETE"];

export function createAuditMiddleware(options: {
  ignorePaths?: string[];
} = {}) {
  const ignorePaths = options.ignorePaths ?? ["/api/health", "/api/admin/system-health"];

  return (req: Request, _res: Response, next: NextFunction) => {
    if (
      MUTATION_METHODS.includes(req.method as MutationMethod) &&
      !ignorePaths.some(p => req.path.startsWith(p))
    ) {
      const action = req.method.toLowerCase();
      const resource = req.path.split("/").filter(Boolean).slice(0, 2).join("/");
      const mwUser = (req as any).user;
      const _mwResourceId = typeof req.params.id === "string" ? req.params.id : undefined;
      logActivity({
        userId: mwUser?.id ?? null,
        action,
        resource,
        ...(_mwResourceId !== undefined ? { resourceId: _mwResourceId } : {}),
        description: `${req.method} ${req.path}`,
        metadata: {
          body: redactSensitive(req.body),
          query: redactSensitive(req.query),
        },
        ipAddress: req.ip ?? null,
      }).catch(() => {});
    }
    next();
  };
}

export interface AuditTrailQuery {
  limit?: number;
  userId?: number;
  resource?: string;
  action?: string;
}

export async function queryAuditTrail(params: AuditTrailQuery = {}) {
  const limit = Math.min(params.limit ?? 100, 500);

  const conditions = [];
  if (params.userId != null) conditions.push(eq(activityLogTable.userId, params.userId));
  if (params.action) conditions.push(eq(activityLogTable.action, params.action));
  if (params.resource) conditions.push(like(activityLogTable.resource, `%${params.resource}%`));

  const query = db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export interface AuditEventQuery {
  limit?: number;
  userId?: number;
  action?: string;
  entityType?: string;
}

export async function queryAuditEvents(params: AuditEventQuery = {}) {
  const limit = Math.min(params.limit ?? 100, 500);

  const conditions = [];
  if (params.userId != null) conditions.push(eq(auditEventsTable.userId, params.userId));
  if (params.action) conditions.push(eq(auditEventsTable.action, params.action));
  if (params.entityType) conditions.push(eq(auditEventsTable.entityType, params.entityType));

  const query = db
    .select()
    .from(auditEventsTable)
    .orderBy(desc(auditEventsTable.createdAt))
    .limit(limit);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}
