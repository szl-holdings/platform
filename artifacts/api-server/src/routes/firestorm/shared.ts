import { Router, type IRouter, type RequestHandler } from "express";
import { LRUCache } from "lru-cache";
import rateLimit from "express-rate-limit";
import {
  db,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  firestormIncidentsTable,
  firestormAlertsTable,
  firestormAssetsTable,
  firestormWorkflowActionsTable,
  firestormHardeningControlsTable,
  firestormComplianceControlsTable,
  firestormCasesTable,
  firestormMitreDetectionsTable,
  firestormTradecraftDecisionsTable,
  firestormCaseMemoryTable,
  firestormAnalystNotebookTable,
  firestormTradecraftValidationAuditTable,
  insertFirestormScenarioSchema,
  insertFirestormAssessmentSchema,
  insertFirestormSimulationRunSchema,
  insertFirestormFindingSchema,
  insertFirestormRiskScoreSchema,
  insertFirestormIncidentSchema,
  insertFirestormAlertSchema,
  insertFirestormAssetSchema,
  insertFirestormWorkflowActionSchema,
  insertFirestormCaseSchema,
  insertFirestormTradecraftDecisionSchema,
  insertFirestormAnalystNotebookSchema,
  type InsertFirestormCaseMemory,
  alloyRuntimeAgentsTable,
  alloyRuntimeAgentVersionsTable,
  auditEventsTable,
} from "@szl-holdings/db";
import { REFERENCE_COMPLIANCE_CONTROLS } from "../readiness.js";
import { eq, desc, sql, inArray, and, or } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, handleRouteError } from "../../lib/api-response";
import { authMiddleware, parseIdParam } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { validateIfMatch } from "../../middlewares/optimistic-concurrency";
import { queryEvidenceIndex, ingestDecisionToEvidenceIndex } from "../../lib/tradecraft-evidence-store";
import { validateAndBuildDecision, type DecisionObjectType } from "@szl-holdings/ai-engine";
import { broadcastWs, pubsub, FIRESTORM_EVENTS } from "../../lib/pubsub-bridge.js";
import {
  ingestFirestormFinding,
  ingestFirestormScenario,
  ingestFirestormAlert,
} from "@szl-holdings/ai-engine/domain-embedding-hooks";


export const updateVulnerabilitySchema = z.object({
  status: z.string().min(1).max(50).optional(),
  remediationOwner: z.string().max(200).trim().optional(),
  dueDate: z.string().max(100).optional().nullable(),
  recommendedAction: z.string().max(5000).trim().optional(),
  recommendation: z.string().max(5000).trim().optional(),
}).strict();

export const updateComplianceControlSchema = z.object({
  status: z.string().min(1).max(50).optional(),
  owner: z.string().max(200).trim().optional(),
  dueDate: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).trim().optional(),
}).strict();

export const updateWorkflowActionSchema = z.object({
  status: z.string().min(1).max(50).optional(),
  notes: z.string().max(5000).trim().optional(),
  assignedTo: z.string().max(200).trim().optional(),
  completedAt: z.union([z.string().datetime({ offset: true }), z.date()]).optional(),
}).strict();

export const updateHardeningControlSchema = z.object({
  status: z.string().min(1).max(50).optional(),
  owner: z.string().max(200).trim().optional(),
  recommendedAction: z.string().max(5000).trim().optional(),
  dueDate: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).trim().optional(),
}).strict();

export const pushTokenSchema = z.object({
  token: z.string().min(1, "token is required").max(4096),
  platform: z.string().max(50).trim().optional(),
}).strict();

export const ingestWebhookSchema = z.object({
  source: z.string().max(200).optional(),
  severity: z.string().max(50).optional(),
  level: z.string().max(50).optional(),
  title: z.string().max(2000).optional(),
  message: z.string().max(5000).optional(),
  summary: z.string().max(2000).optional(),
}).passthrough();

export const ingestSyslogSchema = z.object({
  message: z.string().max(10000).optional(),
  raw: z.string().max(10000).optional(),
  host: z.string().max(255).optional(),
  hostname: z.string().max(255).optional(),
}).passthrough();

export const updateCaseSchema = z.object({
  status: z.string().min(1).max(50).optional(),
  priority: z.string().min(1).max(50).optional(),
  assignedAnalyst: z.string().max(200).trim().optional().nullable(),
  note: z.object({
    content: z.string().min(1).max(10000),
    author: z.string().max(200).trim().optional(),
  }).optional(),
  evidenceItem: z.record(z.unknown()).optional(),
  updatedBy: z.string().max(200).trim().optional(),
}).strict();

const createCaseMemorySchema = z.object({
  caseId: z.string().min(1).max(200),
  incidentId: z.string().max(200).optional().nullable(),
}).passthrough();

const CASE_MEMORY_PHASE_ENUM = ["detection", "triage", "investigation", "containment", "eradication", "recovery", "closed"] as const;

export const updateCaseMemorySchema = z.object({
  phase: z.enum(CASE_MEMORY_PHASE_ENUM).optional(),
  phaseHistory: z.array(z.object({
    phase: z.string().max(50),
    enteredAt: z.string().max(100),
    exitedAt: z.string().max(100).nullable(),
  })).optional(),
  analystNotes: z.array(z.object({
    noteId: z.string().max(200),
    content: z.string().max(20000),
    author: z.string().max(200),
    noteType: z.string().max(50),
    createdAt: z.string().max(100),
  })).optional(),
  changeLog: z.array(z.unknown()).optional(),
  summary: z.record(z.unknown()).optional(),
  closedAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export const tradecraftDecisionInputSchema = z.object({
  decisionType: z.string().min(1).max(100),
  summary: z.string().min(10).max(10000),
  recommendedAction: z.string().min(1).max(5000),
  confidence: z.union([z.string(), z.number()]).optional(),
  rawOutput: z.string().max(50000).optional(),
  modelRoute: z.string().max(200).optional(),
  caseId: z.string().max(200).optional().nullable(),
  incidentId: z.string().max(200).optional().nullable(),
  signalId: z.string().max(200).optional().nullable(),
  objectId: z.string().max(200).optional(),
}).passthrough();

export const evidenceIndexQuerySchema = z.object({
  query: z.string().min(1).max(2000),
  caseId: z.string().max(200).optional(),
  incidentId: z.string().max(200).optional(),
  sourceTypes: z.array(z.string().max(100)).max(50).optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  minRelevance: z.number().min(0).max(1).optional(),
}).strict();

export const tradecraftDecisionActionSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  rejectionReason: z.string().max(5000).optional(),
}).passthrough();

export const firestormCrudLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { error: "Firestorm rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

export function getFirestormTenantId(req: import("express").Request): string | undefined {
  const user = (req as unknown as Record<string, unknown>).user as { orgs?: Array<{ orgId?: unknown }> } | undefined;
  return user?.orgs?.[0]?.orgId != null ? String(user.orgs[0].orgId) : undefined;
}

export const firestormLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  message: { error: "Firestorm rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

export const fsCache = new LRUCache<string, { data: unknown; expiry: number }>({ max: 300 });
export function getFsCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = fsCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => { fsCache.set(key, { data, expiry: Date.now() + ttlMs }); return data; })
    .catch(() => { const stale = fsCache.get(key); if (stale) return stale.data as T; throw new Error("Data unavailable"); });
}
export async function fetchFsText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "text/plain,application/json,*/*" } });
    clearTimeout(timer); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text();
  } finally { clearTimeout(timer); }
}
export async function fetchFsJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "application/json" } });
    clearTimeout(timer); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  } finally { clearTimeout(timer); }
}
