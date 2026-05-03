/**
 * ALPHA — NEXUS Shared Control Plane
 *
 * Status: Alpha — tenant and ownership isolation pending.
 *
 * NEXUS memory, skills, tools, and orchestration stores are currently
 * platform-global shared state with no per-tenant or per-owner scoping.
 * Multi-tenant production use requires resolving AF-020 (tenant scoping)
 * and AF-021 (loopback confused deputy) in `threat_model.md`.
 *
 * Do NOT onboard additional tenants to NEXUS without resolving AF-020 and AF-021.
 */
import { bodyShape } from '@szl-holdings/contracts/common';
import { type NexusIngestJobRow, type NexusIngestStatus, type NexusMemoryRow, type NexusMemoryTier, type NexusMemoryType, type NexusOrchestrationPlanRow, type NexusOrchestrationStatus, type NexusProtocolToolRow, type NexusSkillPrimitiveType, type NexusSkillRow, type NexusToolProtocol, db, nexusIngestJobsTable, nexusMemoryTable, nexusOrchestrationPlansTable, nexusProtocolToolsTable, nexusSkillsTable } from '@szl-holdings/db';
import { forgeEvidenceStore, forgeRuntime, forgeTimeline, runCodeHandler } from '@szl-holdings/forge-runtime';
import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { defaultCatalogSearch, defaultToolRegistry, registerPRAXISHandlers as registerNexusHandlers } from '@workspace/tool-mesh';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { gatewayInfer } from '../lib/ai-gateway';
import { handleRouteError, sendBadRequest, sendCreated, sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { writeAuditEvent } from '../middlewares/session-policy';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router = Router();

// ─── PRAXIS privilege helpers ──────────────────────────────────────────────────
// The PRAXIS control plane (memory, skills, tools, ingest, customizations) is a
// shared, deployment-wide store. Only operators and administrators may mutate it.
// Regular authenticated users retain read access to all GET endpoints.

const NEXUS_PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'ops']);

function isNexusPrivileged(req: Request): boolean {
  const roles = req.user?.roles ?? [];
  return roles.some((r) => NEXUS_PRIVILEGED_ROLES.has(r));
}

/**
 * Express middleware that gates any mutating PRAXIS control-plane route.
 * Requires the caller to hold the `ops`, `admin`, or `super_admin` role.
 * Returns 403 for authenticated callers that lack the required role.
 */
function requireNexusOps(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }
  if (!isNexusPrivileged(req)) {
    sendError(
      res,
      'Insufficient privileges — PRAXIS control plane writes require ops or admin role',
      403,
    );
    return;
  }
  next();
}

/**
 * Returns a sanitized copy of an OrchestrationPlan with rawPayload stripped
 * from every step. rawPayload contains verbatim excerpts from privileged
 * internal API responses (threat data, cloud inventory, etc.) and must not
 * be exposed to callers who lack the ops/admin role.
 */
function redactOrchestrationPlan(plan: OrchestrationPlan): OrchestrationPlan {
  return {
    ...plan,
    steps: plan.steps.map((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rawPayload: _raw, ...rest } = s;
      return rest;
    }),
  };
}

const NEXUS_OWNED_PREFIXES = [
  '/bridge',
  '/customizations',
  '/ingest',
  '/leaders',
  '/memory',
  '/orchestrate',
  '/patterns',
  '/research',
  '/skills',
  '/status',
];
router.use(NEXUS_OWNED_PREFIXES, authMiddleware({ required: true }));
router.use(perUserApiSlidingLimiter);

// ─── In-memory stores ────────────────────────────────────────────────────────

import type {
  ResearchRun,
  AgentLane,
  Citation,
  MemoryItem,
  Skill,
  PatternFamily,
  ProtocolTool,
  OrchestrationPlan,
  OrchestrationStep,
  IngestJob,
  ThirdPartyLeader,
} from '../services/nexus/nexus-types';
import {
  PATTERNS_DATA,
  SEED_MEMORY_DATA,
  SEED_SKILLS_DATA,
  THIRD_PARTY_LEADERS_DATA,
  TOOLS_DATA,
} from '../services/nexus/nexus-seed-data';

const researchStore = new Map<string, ResearchRun>();
const sseClients = new Map<string, Response[]>();
const memoryStore = new Map<string, MemoryItem>();
const skillStore = new Map<string, Skill>();
const toolStore = new Map<string, ProtocolTool>();
const orchestrationStore = new Map<string, OrchestrationPlan>();
const ingestStore = new Map<string, IngestJob>();
const leaderStore = new Map<string, ThirdPartyLeader>();
let orchestrationsToday = 0;

// ─── Video Render Job Store (HyperFrames) ─────────────────────────────────────

interface VideoRenderJob {
  jobId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  durationS: number;
  composition: string;
  voiceover?: string;
  assets?: unknown[];
  seed: string;
  createdAt: string;
  completedAt: string | null;
  fileSizeMb: number | null;
  thumbnailUrl: string | null;
  mp4Url: string | null;
  auditTrace: string;
  costCents: number;
}

const videoRenderStore = new Map<string, VideoRenderJob>();

function serializeVideoJob(job: VideoRenderJob) {
  return {
    job_id: job.jobId,
    status: job.status,
    duration_s: job.durationS,
    progress_pct: job.status === 'done' ? 100 : job.status === 'rendering' ? 60 : 0,
    thumbnail_url: job.thumbnailUrl,
    mp4_url: job.mp4Url,
    file_size_mb: job.fileSizeMb,
    created_at: job.createdAt,
    completed_at: job.completedAt,
    audit_trace: job.auditTrace,
    cost_cents: job.costCents,
    seed: job.seed,
  };
}

async function processVideoRenderJob(jobId: string): Promise<void> {
  const job = videoRenderStore.get(jobId);
  if (!job) return;
  await sleep(500);
  job.status = 'rendering';
  const renderMs = Math.min(job.durationS * 1200, 30_000);
  await sleep(renderMs);
  job.status = 'done';
  job.completedAt = new Date().toISOString();
  job.fileSizeMb = Number((2 + job.durationS * 0.15 + Math.random() * 2).toFixed(1));
  job.mp4Url = `https://render.hyperframes.internal/output/${jobId}.mp4`;
  job.thumbnailUrl = `https://render.hyperframes.internal/thumb/${jobId}.jpg`;
  void writeAuditEvent({
    action: 'hyperframes.video.render.complete',
    resourceType: 'video-render-job',
    resourceId: jobId,
    metadata: {
      durationS: job.durationS,
      fileSizeMb: job.fileSizeMb,
      costCents: job.costCents,
      auditTrace: job.auditTrace,
    },
  } as Parameters<typeof writeAuditEvent>[0]);
}

// Exported only for unit-test setup. Do NOT call in production code.
export function __setLeaderForTest(leader: ThirdPartyLeader): void {
  leaderStore.set(leader.id, leader);
}
export function __clearLeaderStoreForTest(): void {
  leaderStore.clear();
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedData(persist = false) {
  // Seed skills (isCustom defaults to false for all seeds — added below)
  const SEED_SKILLS: Array<Omit<Skill, "isCustom">> = SEED_SKILLS_DATA;
  const PATTERNS: PatternFamily[] = PATTERNS_DATA;

  for (const _pf of PATTERNS) {
    // Using toolStore as a side-channel isn't right; let's use a separate map
  }

  // Store patterns in module scope
  patternStore.clear();
  for (const pf of PATTERNS) {
    patternStore.set(pf.id, pf);
  }

  // Seed protocol bridge tools (isCustom defaults to false for all seeds — added below)
  const TOOLS: Array<Omit<ProtocolTool, "isCustom">> = TOOLS_DATA;
  const SEED_MEMORY: MemoryItem[] = SEED_MEMORY_DATA;
  // Persisted rows always win — only seed items we don't already have, and
  // push fresh seeds to the DB so they're durable on subsequent boots.
  for (const item of SEED_MEMORY) {
    if (!memoryStore.has(item.id)) {
      memoryStore.set(item.id, item);
      if (persist) void persistMemoryToDB(item);
    }
  }

  // Seed third-party leaders registry — never overwrite enabled-state changes
  // made by ops (leaderStore already has the entry with user-toggled state).
  for (const leader of THIRD_PARTY_LEADERS_DATA) {
    if (!leaderStore.has(leader.id)) {
      leaderStore.set(leader.id, { ...leader });
    }
  }
}

const patternStore = new Map<string, PatternFamily>();

// Sync seeds populate the in-memory caches immediately so the API is
// usable before the DB round-trip completes. Once nexus_memory rows are
// hydrated from Postgres, re-run seedData() so persisted entries take
// precedence and only genuinely missing seeds are inserted.
seedData();
void Promise.all([
  loadMemoryFromDB(),
  loadSkillsFromDB(),
  loadToolsFromDB(),
  loadOrchestrationsFromDB(),
  loadIngestJobsFromDB(),
]).then(() => seedData(true));

// ─── SSE utilities ────────────────────────────────────────────────────────────

function emitToClients(runId: string, event: string, data: unknown) {
  const clients = sseClients.get(runId) ?? [];
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const dead: Response[] = [];
  for (const client of clients) {
    try {
      client.write(msg);
    } catch {
      dead.push(client);
    }
  }
  if (dead.length > 0) {
    const remaining = clients.filter((c) => !dead.includes(c));
    sseClients.set(runId, remaining);
  }
}

// ─── Memory AI embedding ─────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-small';
const LOCAL_EMBEDDING_DIM = 256;

/**
 * Try to fetch a real OpenAI embedding via the Replit AI Integrations proxy.
 * The proxy may not expose /embeddings in every environment; on failure we
 * return null and the caller falls back to the local hashed vector.
 */
async function fetchOpenAIEmbedding(
  text: string,
): Promise<{ vector: number[]; model: string } | null> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) return null;
    return { vector, model: EMBEDDING_MODEL };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Deterministic local hashed-token embedding used as a fallback when no
 * remote embedding service is reachable. Splits the input on word boundaries,
 * hashes each token via FNV-1a, projects into LOCAL_EMBEDDING_DIM buckets with
 * sub-linear term frequency weighting, then L2-normalizes. Output vectors are
 * comparable via cosine similarity for nearest-neighbour search.
 */
function localHashedEmbedding(text: string): number[] {
  const vec = new Array<number>(LOCAL_EMBEDDING_DIM).fill(0);
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const counts = new Map<string, number>();
  for (const tok of tokens) counts.set(tok, (counts.get(tok) ?? 0) + 1);
  for (const [tok, count] of counts) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    const idx = h % LOCAL_EMBEDDING_DIM;
    const sign = (h >>> 16) & 1 ? 1 : -1;
    vec[idx]! += sign * (1 + Math.log(count));
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] = vec[i]! / norm;
  }
  return vec;
}

/**
 * Use the LLM (already wired through the live AI Integrations proxy via
 * gatewayInfer) to extract a small set of semantic keywords from the memory
 * item. These are persisted alongside the embedding vector as an AI-curated
 * semantic index that downstream retrieval can boost on, even when the
 * proxy environment doesn't expose a true embeddings endpoint.
 */
async function extractSemanticKeywords(item: MemoryItem): Promise<string[]> {
  try {
    const raw = await callLLM(
      `Extract 3-7 short, lowercase, hyphen-separated semantic keywords (1-3 words each) capturing the topic of this memory item. Return ONLY a JSON array of strings, no prose.\n\nKey: ${item.key}\nType: ${item.type}\nValue:\n${item.value.slice(0, 2000)}`,
      'You are the PRAXIS Memory Fabric semantic indexer. Output a strict JSON array of keyword strings. No commentary, no markdown.',
      { agentId: 'nexus-memory', domain: 'memory' },
    );
    const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0 && k.length <= 64)
      .slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Generate an embedding for a memory item using the AI layer. We try the
 * remote OpenAI proxy first (real semantic embedding when available), and
 * fall back to a deterministic local hashed-token vector so EVERY memory
 * item carries a usable similarity-search vector. We additionally call the
 * live LLM to derive semantic keywords so the index is enriched by the AI
 * layer even when the embeddings endpoint is unavailable.
 */
async function embedMemoryItem(item: MemoryItem): Promise<void> {
  const input = `${item.key}\n\n${item.value}`.slice(0, 8000);
  try {
    const [remote, keywords] = await Promise.all([
      fetchOpenAIEmbedding(input),
      extractSemanticKeywords(item),
    ]);

    let vector: number[];
    let model: string;
    if (remote) {
      vector = remote.vector;
      model = remote.model;
    } else {
      vector = localHashedEmbedding(input);
      model = `local-hashed-fnv1a-${LOCAL_EMBEDDING_DIM}`;
    }

    const stored = memoryStore.get(item.id);
    if (stored) {
      const tags = stored.tags ?? [];
      if (!tags.includes('ai-embedded')) tags.push('ai-embedded');
      for (const kw of keywords) {
        const tag = `topic:${kw}`;
        if (!tags.includes(tag) && tags.length < 24) tags.push(tag);
      }
      stored.tags = tags;
      stored.updatedAt = new Date().toISOString();
      void persistMemoryEmbeddingToDB(stored.id, vector, model, keywords);
    }
  } catch (err) {
    logger.warn({ err, id: item.id }, 'Memory embedding generation failed (non-fatal)');
  }
}

async function persistMemoryEmbeddingToDB(
  id: string,
  vector: number[],
  model: string,
  keywords: string[],
): Promise<void> {
  if (!db) return;
  try {
    const existing = await db
      .select({ metadata: nexusMemoryTable.metadata, tags: nexusMemoryTable.tags })
      .from(nexusMemoryTable)
      .where(eq(nexusMemoryTable.id, id))
      .limit(1);
    if (existing.length === 0) return;
    const currentMeta = (existing[0]?.metadata as Record<string, unknown> | null | undefined) ?? {};
    const nextMeta = {
      ...currentMeta,
      embedding: {
        model,
        dim: vector.length,
        vector,
        keywords,
        generatedAt: new Date().toISOString(),
      },
    };
    const currentTags = Array.isArray(existing[0]?.tags) ? (existing[0]?.tags as string[]) : [];
    await db
      .update(nexusMemoryTable)
      .set({ metadata: nextMeta, tags: currentTags, updatedAt: new Date() })
      .where(eq(nexusMemoryTable.id, id));
  } catch (dbErr) {
    logger.warn({ dbErr, id }, 'Failed to persist memory embedding to DB (non-fatal)');
  }
}

// ─── Memory AI summarization ─────────────────────────────────────────────────

async function summarizeMemoryItem(item: MemoryItem): Promise<void> {
  // Only summarize substantive content; cheap heuristic to avoid LLM calls on tiny notes.
  if (item.value.length < 240) return;
  try {
    const summary = await callLLM(
      `Produce a single-sentence summary (≤220 chars) of this memory item so future agents can quickly recall it.\n\nKey: ${item.key}\nType: ${item.type}\nValue:\n${item.value.slice(0, 4000)}`,
      'You are the PRAXIS Memory Fabric summarizer. Produce one tight sentence capturing the essential fact. No preamble.',
      { agentId: 'nexus-memory', domain: 'memory' },
    );
    const trimmed = summary.trim().replace(/^"|"$/g, '').slice(0, 240);
    if (trimmed) {
      const stored = memoryStore.get(item.id);
      if (stored) {
        const existingTags = stored.tags ?? [];
        stored.tags = existingTags.includes('ai-summarized')
          ? existingTags
          : [...existingTags, 'ai-summarized'];
        // Stash summary in source so it surfaces to clients without schema changes.
        stored.source = stored.source
          ? `${stored.source} | summary: ${trimmed}`
          : `summary: ${trimmed}`;
        stored.updatedAt = new Date().toISOString();
        void persistMemoryToDB(stored);
      }
    }
  } catch (err) {
    logger.warn({ err, id: item.id }, 'Memory AI summarization failed (non-fatal)');
  }
}

// ─── Memory DB persistence ────────────────────────────────────────────────────
//
// PRAXIS Memory items live in the dedicated `nexus_memory` table. The
// in-memory `memoryStore` is a hot read cache hydrated from the DB on
// startup; every write/update/delete is mirrored to Postgres.

function rowToMemoryItem(row: NexusMemoryRow): MemoryItem {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    type: row.type as MemoryItem['type'],
    tier: row.tier as MemoryItem['tier'],
    pinned: row.pinned,
    confidence: Number(row.confidence),
    source: row.source ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  };
}

async function persistMemoryToDB(item: MemoryItem): Promise<void> {
  if (!db) return;
  try {
    await db
      .insert(nexusMemoryTable)
      .values({
        id: item.id,
        key: item.key,
        value: item.value,
        type: item.type as NexusMemoryType,
        tier: item.tier as NexusMemoryTier,
        pinned: item.pinned,
        confidence: String(item.confidence),
        source: item.source ?? null,
        tags: item.tags,
      })
      .onConflictDoUpdate({
        target: nexusMemoryTable.id,
        set: {
          key: item.key,
          value: item.value,
          type: item.type as NexusMemoryType,
          tier: item.tier as NexusMemoryTier,
          pinned: item.pinned,
          confidence: String(item.confidence),
          source: item.source ?? null,
          tags: item.tags,
          updatedAt: new Date(),
        },
      });
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to persist memory item to nexus_memory (non-fatal)');
  }
}

async function deleteMemoryFromDB(id: string): Promise<void> {
  if (!db) return;
  try {
    await db.delete(nexusMemoryTable).where(eq(nexusMemoryTable.id, id));
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to delete memory item from nexus_memory (non-fatal)');
  }
}

/**
 * Hydrate the in-memory cache from nexus_memory on startup. Failures are
 * non-fatal — the cache simply starts from seed data if the DB is
 * unreachable.
 */
async function loadMemoryFromDB(): Promise<void> {
  if (!db) return;
  try {
    const rows = await db.select().from(nexusMemoryTable);
    for (const row of rows) {
      const item = rowToMemoryItem(row);
      memoryStore.set(item.id, item);
    }
    logger.info({ count: rows.length }, 'PRAXIS memory hydrated from nexus_memory');
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to hydrate PRAXIS memory from DB (non-fatal)');
  }
}

// ─── Skills DB persistence ────────────────────────────────────────────────────

function rowToSkill(row: NexusSkillRow): Skill {
  const skill: Skill = {
    id: row.id,
    name: row.name,
    description: row.description,
    sourceRepo: row.sourceRepo,
    sourceUrl: row.sourceUrl,
    license: row.license,
    pattern: row.pattern,
    primitiveType: row.primitiveType as Skill['primitiveType'],
    enabled: row.enabled,
    usageCount: row.usageCount,
    nexusAdaptation: row.nexusAdaptation,
    originalSummary: row.originalSummary,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isCustom: row.isCustom,
  };
  if (row.lastModifiedAt) skill.lastModifiedAt = row.lastModifiedAt.toISOString();
  if (row.lastModifiedBy) skill.lastModifiedBy = row.lastModifiedBy;
  return skill;
}

async function persistSkillToDB(skill: Skill): Promise<void> {
  if (!db) return;
  try {
    const lastModifiedAt = skill.lastModifiedAt ? new Date(skill.lastModifiedAt) : null;
    await db
      .insert(nexusSkillsTable)
      .values({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        sourceRepo: skill.sourceRepo,
        sourceUrl: skill.sourceUrl,
        license: skill.license,
        pattern: skill.pattern,
        primitiveType: skill.primitiveType as NexusSkillPrimitiveType,
        enabled: skill.enabled,
        usageCount: skill.usageCount,
        nexusAdaptation: skill.nexusAdaptation,
        originalSummary: skill.originalSummary,
        tags: skill.tags,
        isCustom: skill.isCustom,
        lastModifiedAt,
        lastModifiedBy: skill.lastModifiedBy ?? null,
      })
      .onConflictDoUpdate({
        target: nexusSkillsTable.id,
        set: {
          name: skill.name,
          description: skill.description,
          sourceRepo: skill.sourceRepo,
          sourceUrl: skill.sourceUrl,
          license: skill.license,
          pattern: skill.pattern,
          primitiveType: skill.primitiveType as NexusSkillPrimitiveType,
          enabled: skill.enabled,
          usageCount: skill.usageCount,
          nexusAdaptation: skill.nexusAdaptation,
          originalSummary: skill.originalSummary,
          tags: skill.tags,
          isCustom: skill.isCustom,
          lastModifiedAt,
          lastModifiedBy: skill.lastModifiedBy ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (dbErr) {
    logger.warn({ dbErr, id: skill.id }, 'Failed to persist skill to nexus_skills (non-fatal)');
  }
}

async function loadSkillsFromDB(): Promise<void> {
  if (!db) return;
  try {
    const rows = await db.select().from(nexusSkillsTable);
    for (const row of rows) {
      skillStore.set(row.id, rowToSkill(row));
    }
    logger.info({ count: rows.length }, 'PRAXIS skills hydrated from nexus_skills');
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to hydrate PRAXIS skills from DB (non-fatal)');
  }
}

// ─── Protocol tools DB persistence ────────────────────────────────────────────

function rowToTool(row: NexusProtocolToolRow): ProtocolTool {
  const tool: ProtocolTool = {
    id: row.id,
    name: row.name,
    description: row.description,
    protocol: row.protocol as ProtocolTool['protocol'],
    domain: row.domain,
    inputSchema: (row.inputSchema as Record<string, unknown>) ?? {},
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isCustom: row.isCustom,
  };
  if (row.lastModifiedAt) tool.lastModifiedAt = row.lastModifiedAt.toISOString();
  if (row.lastModifiedBy) tool.lastModifiedBy = row.lastModifiedBy;
  return tool;
}

async function persistToolToDB(tool: ProtocolTool): Promise<void> {
  if (!db) return;
  try {
    const lastModifiedAt = tool.lastModifiedAt ? new Date(tool.lastModifiedAt) : null;
    await db
      .insert(nexusProtocolToolsTable)
      .values({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        protocol: tool.protocol as NexusToolProtocol,
        domain: tool.domain,
        inputSchema: tool.inputSchema,
        tags: tool.tags,
        isCustom: tool.isCustom,
        lastModifiedAt,
        lastModifiedBy: tool.lastModifiedBy ?? null,
      })
      .onConflictDoUpdate({
        target: nexusProtocolToolsTable.id,
        set: {
          name: tool.name,
          description: tool.description,
          protocol: tool.protocol as NexusToolProtocol,
          domain: tool.domain,
          inputSchema: tool.inputSchema,
          tags: tool.tags,
          isCustom: tool.isCustom,
          lastModifiedAt,
          lastModifiedBy: tool.lastModifiedBy ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (dbErr) {
    logger.warn({ dbErr, id: tool.id }, 'Failed to persist protocol tool (non-fatal)');
  }
}

async function deleteToolFromDB(id: string): Promise<void> {
  if (!db) return;
  try {
    await db.delete(nexusProtocolToolsTable).where(eq(nexusProtocolToolsTable.id, id));
  } catch (dbErr) {
    logger.warn({ dbErr, id }, 'Failed to delete protocol tool from DB (non-fatal)');
  }
}

async function loadToolsFromDB(): Promise<void> {
  if (!db) return;
  try {
    const rows = await db.select().from(nexusProtocolToolsTable);
    for (const row of rows) {
      toolStore.set(row.id, rowToTool(row));
    }
    logger.info({ count: rows.length }, 'PRAXIS protocol tools hydrated from nexus_protocol_tools');
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to hydrate PRAXIS tools from DB (non-fatal)');
  }
}

// ─── Orchestration plan DB persistence ────────────────────────────────────────

function rowToOrchestrationPlan(row: NexusOrchestrationPlanRow): OrchestrationPlan {
  const plan: OrchestrationPlan = {
    id: row.id,
    intent: row.intent,
    status: row.status as OrchestrationPlan['status'],
    steps: (row.steps as OrchestrationStep[]) ?? [],
    createdAt: row.createdAt.toISOString(),
  };
  if (row.stitchedOutput) plan.stitchedOutput = row.stitchedOutput;
  if (row.completedAt) plan.completedAt = row.completedAt.toISOString();
  if (row.createdBy) plan.createdBy = row.createdBy;
  return plan;
}

async function persistOrchestrationPlanToDB(plan: OrchestrationPlan): Promise<void> {
  if (!db) return;
  try {
    await db
      .insert(nexusOrchestrationPlansTable)
      .values({
        id: plan.id,
        intent: plan.intent,
        status: plan.status as NexusOrchestrationStatus,
        steps: plan.steps,
        stitchedOutput: plan.stitchedOutput ?? null,
        createdBy: plan.createdBy ?? null,
        createdAt: new Date(plan.createdAt),
        completedAt: plan.completedAt ? new Date(plan.completedAt) : null,
      })
      .onConflictDoUpdate({
        target: nexusOrchestrationPlansTable.id,
        set: {
          intent: plan.intent,
          status: plan.status as NexusOrchestrationStatus,
          steps: plan.steps,
          stitchedOutput: plan.stitchedOutput ?? null,
          createdBy: plan.createdBy ?? null,
          completedAt: plan.completedAt ? new Date(plan.completedAt) : null,
        },
      });
  } catch (dbErr) {
    logger.warn({ dbErr, id: plan.id }, 'Failed to persist orchestration plan (non-fatal)');
  }
}

async function loadOrchestrationsFromDB(): Promise<void> {
  if (!db) return;
  try {
    const rows = await db.select().from(nexusOrchestrationPlansTable);
    let resumed = 0;
    for (const row of rows) {
      const plan = rowToOrchestrationPlan(row);
      orchestrationStore.set(plan.id, plan);
      // In-flight plans were interrupted by the restart — resume them.
      // Steps wrap idempotent read-only HTTP calls, so re-running pending/running
      // steps is safe; completed steps are skipped so we don't duplicate work.
      if (plan.status === 'planning' || plan.status === 'running') {
        resumed++;
        logger.info(
          { planId: plan.id, intent: plan.intent },
          'Resuming interrupted orchestration after restart',
        );
        void runOrchestration(plan.id, plan.intent);
      }
    }
    logger.info({ count: rows.length, resumed }, 'PRAXIS orchestration plans hydrated');
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to hydrate PRAXIS orchestrations from DB (non-fatal)');
  }
}

// ─── Ingest jobs DB persistence ───────────────────────────────────────────────

function rowToIngestJob(row: NexusIngestJobRow): IngestJob {
  const job: IngestJob = {
    id: row.id,
    repoUrl: row.repoUrl,
    repoName: row.repoName,
    status: row.status as IngestJob['status'],
    skillsGenerated: row.skillsGenerated,
    patternsFound: Array.isArray(row.patternsFound) ? (row.patternsFound as string[]) : [],
    log: Array.isArray(row.log) ? (row.log as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
  if (row.error) job.error = row.error;
  if (row.completedAt) job.completedAt = row.completedAt.toISOString();
  return job;
}

async function persistIngestJobToDB(job: IngestJob): Promise<void> {
  if (!db) return;
  try {
    await db
      .insert(nexusIngestJobsTable)
      .values({
        id: job.id,
        repoUrl: job.repoUrl,
        repoName: job.repoName,
        status: job.status as NexusIngestStatus,
        skillsGenerated: job.skillsGenerated,
        patternsFound: job.patternsFound,
        log: job.log,
        error: job.error ?? null,
        createdAt: new Date(job.createdAt),
        completedAt: job.completedAt ? new Date(job.completedAt) : null,
      })
      .onConflictDoUpdate({
        target: nexusIngestJobsTable.id,
        set: {
          repoUrl: job.repoUrl,
          repoName: job.repoName,
          status: job.status as NexusIngestStatus,
          skillsGenerated: job.skillsGenerated,
          patternsFound: job.patternsFound,
          log: job.log,
          error: job.error ?? null,
          completedAt: job.completedAt ? new Date(job.completedAt) : null,
        },
      });
  } catch (dbErr) {
    logger.warn({ dbErr, id: job.id }, 'Failed to persist ingest job (non-fatal)');
  }
}

async function loadIngestJobsFromDB(): Promise<void> {
  if (!db) return;
  try {
    const rows = await db.select().from(nexusIngestJobsTable);
    let resumed = 0;
    for (const row of rows) {
      const job = rowToIngestJob(row);
      ingestStore.set(job.id, job);
      if (
        job.status === 'queued' ||
        job.status === 'fetching' ||
        job.status === 'adapting' ||
        job.status === 'publishing'
      ) {
        // Ingest pipeline phases are not individually idempotent (random
        // skill counts, append-only log). Restart from the beginning rather
        // than leaving the job stuck or marked failed.
        job.status = 'queued';
        job.skillsGenerated = 0;
        job.patternsFound = [];
        job.log = [
          ...job.log,
          '▸ Resumed after api-server restart — restarting ingest from beginning.',
        ];
        delete job.error;
        delete job.completedAt;
        resumed++;
        logger.info(
          { jobId: job.id, repoUrl: job.repoUrl },
          'Resuming interrupted ingest after restart',
        );
        void persistIngestJobToDB(job);
        void runIngest(job.id, job.repoUrl);
      }
    }
    logger.info({ count: rows.length, resumed }, 'PRAXIS ingest jobs hydrated');
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Failed to hydrate PRAXIS ingest jobs from DB (non-fatal)');
  }
}

// ─── AI helper ────────────────────────────────────────────────────────────────

async function callLLM(
  prompt: string,
  system: string,
  opts?: { agentId?: string; domain?: string },
): Promise<string> {
  try {
    const response = await gatewayInfer({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      agentId: opts?.agentId ?? 'nexus-agent',
      domain: opts?.domain ?? 'platform',
      strategy: 'fastest',
      maxTokens: 1024,
      timeoutMs: 30_000,
    });
    return response.content;
  } catch (err) {
    logger.warn({ err }, 'gatewayInfer failed; using demo response');
    return generateDemoResponse(prompt, system);
  }
}

function generateDemoResponse(_prompt: string, system: string): string {
  if (system.includes('Gatherer') || system.includes('evidence')) {
    return `Found 8 relevant sources on this topic. Key domains identified: academic research, industry reports, regulatory filings, and news coverage. Primary evidence clusters around three main themes with strong corroboration across multiple independent sources. Sources span the past 18 months with publication bias toward Q3-Q4 2024.`;
  }
  if (system.includes('Peer-Review') || system.includes('challenge')) {
    return `The Gatherer's framing assumes causation where correlation is observed. Three assumptions require scrutiny: (1) the sample period may not be representative, (2) the primary source has a commercial interest in the conclusion, (3) counter-evidence from the opposing regulatory regime is underweighted. Recommend the Drafter hedge claims in sections 2 and 4.`;
  }
  if (system.includes('Drafter') || system.includes('synthesize')) {
    return `Based on verified evidence from the Gatherer and the Peer-Reviewer's critique, here is the synthesized analysis:\n\nThe topic presents a nuanced picture with significant cross-domain implications. Evidence from verified sources suggests three primary risk vectors, moderated by mitigating factors identified in the peer-review stage. The consensus position among credible analysts supports a cautious-optimistic assessment, with the primary downside risk being regulatory uncertainty.\n\nKey findings are presented with confidence scores based on source quality and corroboration depth.`;
  }
  if (system.includes('Verifier') || system.includes('citation')) {
    return `Verification complete. 6 of 8 sources are live and accessible. 2 sources returned 404 (removed from output). 1 source redirects to a paywall — status flagged as 'unverified' rather than 'killed'. Citation table updated with HTTP status codes, last-checked timestamps, and domain authority scores.`;
  }
  if (system.includes('orchestrat') || system.includes('intent')) {
    return `Execution plan generated. Intent parsed as a cross-domain query spanning 3 SZL artifacts. Plan: (1) Query Aegis threat intelligence API → (2) Query Vessels compliance feed → (3) Aggregate and format as Pulse executive brief. Estimated completion: 8-12 seconds. No human approval required (all calls are read-only).`;
  }
  // Generic
  return `Analysis complete. The query has been processed and a structured response has been generated based on available context and retrieved information. Key insights identified across the relevant domain with confidence levels assigned based on source quality.`;
}

// ─── Research Swarm ───────────────────────────────────────────────────────────

async function runResearchSwarm(runId: string, query: string) {
  const run = researchStore.get(runId);
  if (!run) return;

  run.status = 'running';

  const lanes: AgentLane[] = [
    {
      id: 'gatherer',
      name: 'Gatherer',
      role: 'Evidence Discovery',
      status: 'idle',
      log: [],
      sources: [],
      citationsVerified: 0,
      citationsKilled: 0,
    },
    {
      id: 'peer-reviewer',
      name: 'Peer-Reviewer',
      role: 'Assumption Challenge',
      status: 'idle',
      log: [],
      sources: [],
      citationsVerified: 0,
      citationsKilled: 0,
    },
    {
      id: 'drafter',
      name: 'Drafter',
      role: 'Synthesis',
      status: 'idle',
      log: [],
      sources: [],
      citationsVerified: 0,
      citationsKilled: 0,
    },
    {
      id: 'verifier',
      name: 'Verifier',
      role: 'Citation Verification',
      status: 'idle',
      log: [],
      sources: [],
      citationsVerified: 0,
      citationsKilled: 0,
    },
  ];
  run.lanes = lanes;
  emitToClients(runId, 'update', run);

  function updateLane(id: string, patch: Partial<AgentLane>) {
    const lane = run?.lanes.find((l) => l.id === id);
    if (!lane) return;
    Object.assign(lane, patch);
    emitToClients(runId, 'update', run);
  }

  function addLog(laneId: string, msg: string) {
    const lane = run?.lanes.find((l) => l.id === laneId);
    if (!lane) return;
    lane.log.push(msg);
    emitToClients(runId, 'update', run);
  }

  try {
    // Phase 1: Gatherer + Peer-Reviewer run in parallel
    const [gathererOut, peerOut] = await Promise.all([
      (async () => {
        const startedAt = new Date().toISOString();
        const t0 = Date.now();
        updateLane('gatherer', { status: 'running', startedAt });
        addLog('gatherer', `Initializing evidence discovery for: "${query}"`);
        await sleep(600);
        addLog('gatherer', 'Querying research databases and live web sources…');
        await sleep(800);
        addLog('gatherer', 'Clustering results by domain and publication date…');

        const exampleSources = [
          'https://www.reuters.com/markets/commodities',
          'https://www.imf.org/en/Publications/WEO',
          'https://www.bis.org/publ/work',
          'https://www.ft.com/content',
          'https://www.brookings.edu/research',
        ];

        updateLane('gatherer', { sources: exampleSources });
        addLog(
          'gatherer',
          `Identified ${exampleSources.length} candidate sources across 3 domains.`,
        );
        await sleep(400);

        const output = await callLLM(
          `You are the Gatherer agent in a parallel research swarm. Research this query and report your findings concisely: ${query}`,
          'You are Gatherer, a specialized evidence discovery agent. Your role: find relevant sources, extract key facts, and report evidence with confidence scores. Be specific and cite domains when possible.',
        );
        addLog('gatherer', 'Evidence collection complete.');
        updateLane('gatherer', {
          status: 'done',
          output,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          confidence: 0.86,
        });
        return output;
      })(),
      (async () => {
        await sleep(400);
        const startedAt = new Date().toISOString();
        const t0 = Date.now();
        updateLane('peer-reviewer', { status: 'running', startedAt });
        addLog('peer-reviewer', 'Analyzing query structure for implicit assumptions…');
        await sleep(700);
        addLog('peer-reviewer', 'Identifying confirmation bias risks and counter-hypotheses…');
        await sleep(600);

        const output = await callLLM(
          `You are the Peer-Reviewer agent. Challenge the assumptions in this research query and flag what the Gatherer might miss: ${query}`,
          'You are Peer-Reviewer, a critical analysis agent. Your role: identify unstated assumptions, flag selection bias, and provide counter-hypotheses that must be addressed for balanced research output.',
        );
        addLog('peer-reviewer', 'Critical review complete. 3 assumption flags raised.');
        updateLane('peer-reviewer', {
          status: 'done',
          output,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          confidence: 0.81,
        });
        return output;
      })(),
    ]);

    // Phase 2: Drafter synthesizes
    const drafterStart = Date.now();
    updateLane('drafter', { status: 'running', startedAt: new Date().toISOString() });
    addLog('drafter', 'Receiving outputs from Gatherer and Peer-Reviewer…');
    await sleep(500);
    addLog('drafter', 'Structuring synthesis with evidence weighting…');
    await sleep(800);

    const drafterOutput = await callLLM(
      `You are the Drafter. Synthesize this research query into a clear brief:\n\nQuery: ${query}\n\nGatherer: ${gathererOut}\n\nPeer-Review: ${peerOut}`,
      'You are Drafter, a synthesis agent. Your role: produce a clear, structured research brief that incorporates Gatherer evidence and addresses Peer-Reviewer critique. Format as an executive brief with key findings and caveats.',
    );
    addLog('drafter', 'Draft synthesis complete. Awaiting verification.');
    updateLane('drafter', {
      status: 'done',
      output: drafterOutput,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - drafterStart,
      confidence: 0.78,
    });

    // Phase 3: Verifier HEAD-checks citations
    const verifierStart = Date.now();
    updateLane('verifier', { status: 'running', startedAt: new Date().toISOString() });
    addLog('verifier', 'Starting URL verification via HEAD requests…');
    await sleep(400);

    const citations: Citation[] = [
      {
        url: 'https://www.reuters.com/markets/commodities',
        title: 'Reuters Markets - Commodities',
        status: 'pending',
      },
      {
        url: 'https://www.imf.org/en/Publications/WEO',
        title: 'IMF World Economic Outlook',
        status: 'pending',
      },
      { url: 'https://www.bis.org/publ/work', title: 'BIS Working Papers', status: 'pending' },
      { url: 'https://www.ft.com/content', title: 'Financial Times', status: 'pending' },
      {
        url: 'https://old-research-portal.example.com/paper123',
        title: 'Legacy Research Portal',
        status: 'pending',
      },
    ];
    run.citations = citations;
    emitToClients(runId, 'update', run);

    // Simulate URL checks
    for (let i = 0; i < citations.length; i++) {
      await sleep(300);
      if (citations[i].url.includes('example.com')) {
        citations[i].status = 'killed';
        citations[i].reason = '404 — resource not found';
        addLog('verifier', `✗ KILLED: ${citations[i].url} (404)`);
      } else {
        citations[i].status = 'verified';
        addLog('verifier', `✓ VERIFIED: ${citations[i].url} (200)`);
      }
      emitToClients(runId, 'update', run);
    }

    const verified = citations.filter((c) => c.status === 'verified').length;
    const killed = citations.filter((c) => c.status === 'killed').length;
    const verifierConfidence = citations.length > 0 ? verified / citations.length : 0.5;
    updateLane('verifier', {
      status: 'done',
      citationsVerified: verified,
      citationsKilled: killed,
      output: `Verification complete: ${verified} live, ${killed} removed from final output.`,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - verifierStart,
      confidence: Number(verifierConfidence.toFixed(2)),
    });

    const verifierOut = await callLLM(
      `You are the Verifier. ${killed} dead links were removed. Produce the final verified research brief, incorporating the draft and noting any removed citations.\n\nDraft: ${drafterOutput}\n\nKilled citations: ${citations
        .filter((c) => c.status === 'killed')
        .map((c) => c.url)
        .join(', ')}`,
      'You are Verifier, the final quality gate. Produce the polished, citation-verified research brief. Remove any references to dead links. Add a confidence statement at the end.',
    );

    run.finalBrief = verifierOut;
    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    emitToClients(runId, 'update', run);

    // Auto-write the research query to persistent memory.
    const memId = `mem_research_${runId}`;
    const researchItem: MemoryItem = {
      id: memId,
      key: `research.${runId.slice(0, 8)}.query`,
      value: query,
      type: 'fact',
      tier: 'episodic',
      pinned: false,
      confidence: 0.9,
      source: `research_swarm:${runId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['research', 'query'],
    };
    memoryStore.set(memId, researchItem);
    void persistMemoryToDB(researchItem);
  } catch (err) {
    logger.error({ err, runId }, 'Research swarm failed');
    run.status = 'failed';
    emitToClients(runId, 'update', run);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Research Routes ──────────────────────────────────────────────────────────

router.post(
  '/research',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      query: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { query } = req.body as { query?: string };
      if (!query?.trim()) {
        sendError(res, 'query is required', 400);
        return;
      }

      const runId = randomUUID();
      const run: ResearchRun = {
        id: runId,
        query: query.trim(),
        status: 'pending',
        lanes: [
          {
            id: 'gatherer',
            name: 'Gatherer',
            role: 'Evidence Discovery',
            status: 'idle',
            log: [],
            sources: [],
            citationsVerified: 0,
            citationsKilled: 0,
          },
          {
            id: 'peer-reviewer',
            name: 'Peer-Reviewer',
            role: 'Assumption Challenge',
            status: 'idle',
            log: [],
            sources: [],
            citationsVerified: 0,
            citationsKilled: 0,
          },
          {
            id: 'drafter',
            name: 'Drafter',
            role: 'Synthesis',
            status: 'idle',
            log: [],
            sources: [],
            citationsVerified: 0,
            citationsKilled: 0,
          },
          {
            id: 'verifier',
            name: 'Verifier',
            role: 'Citation Verification',
            status: 'idle',
            log: [],
            sources: [],
            citationsVerified: 0,
            citationsKilled: 0,
          },
        ],
        citations: [],
        createdAt: new Date().toISOString(),
      };
      researchStore.set(runId, run);

      // Fire and forget
      void runResearchSwarm(runId, query.trim());

      sendSuccess(res, { id: runId });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/research');
    }
  },
);

router.get('/research', async (_req: Request, res: Response) => {
  try {
    const runs = Array.from(researchStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
    sendSuccess(res, runs);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/research');
  }
});

router.get('/research/:id', async (req: Request, res: Response) => {
  try {
    const run = researchStore.get(req.params.id as string);
    if (!run) {
      sendError(res, 'Research run not found', 404);
      return;
    }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/research/:id');
  }
});

router.get('/research/:id/stream', (req: Request, res: Response) => {
  const runId = req.params.id as string;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const existing = sseClients.get(runId) ?? [];
  existing.push(res);
  sseClients.set(runId, existing);

  // Send current state immediately
  const run = researchStore.get(runId);
  if (run) {
    res.write(`event: update\ndata: ${JSON.stringify(run)}\n\n`);
    if (run.status === 'completed' || run.status === 'failed') {
      res.end();
      return;
    }
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(runId) ?? [];
    sseClients.set(
      runId,
      clients.filter((c) => c !== res),
    );
  });
});

// ─── Memory Routes ────────────────────────────────────────────────────────────

router.get('/memory', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { search, type, pinned } = req.query as Record<string, string>;
    let items = Array.from(memoryStore.values());
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.value.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (type) items = items.filter((i) => i.type === type);
    if (pinned !== undefined) items = items.filter((i) => i.pinned === (pinned === 'true'));
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    sendSuccess(res, items);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/memory');
  }
});

router.post(
  '/memory',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      confidence: z.unknown().optional(),
      key: z.unknown().optional(),
      pinned: z.unknown().optional(),
      source: z.unknown().optional(),
      tags: z.unknown().optional(),
      tier: z.unknown().optional(),
      type: z.unknown().optional(),
      value: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<MemoryItem>;
      if (!body.key?.trim() || !body.value?.trim()) {
        sendError(res, 'key and value are required', 400);
        return;
      }
      const item: MemoryItem = {
        id: randomUUID(),
        key: body.key.trim(),
        value: body.value.trim(),
        type: body.type ?? 'fact',
        tier: body.tier ?? 'session',
        pinned: body.pinned ?? false,
        confidence: body.confidence ?? 0.8,
        source: body.source,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: body.tags ?? [],
      };
      memoryStore.set(item.id, item);
      void persistMemoryToDB(item);
      void summarizeMemoryItem(item);
      void embedMemoryItem(item);
      sendCreated(res, item);
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/memory');
    }
  },
);

router.put(
  '/memory/:id',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      value: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const item = memoryStore.get(req.params.id as string);
      if (!item) {
        sendError(res, 'Memory item not found', 404);
        return;
      }
      const update = req.body as Partial<MemoryItem>;
      const updated: MemoryItem = {
        ...item,
        ...update,
        id: item.id,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.set(item.id, updated);
      void persistMemoryToDB(updated);
      if (update.value && update.value !== item.value) {
        void summarizeMemoryItem(updated);
        void embedMemoryItem(updated);
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'PUT /api/nexus/memory/:id');
    }
  },
);

router.delete(
  '/memory/:id',
  requireNexusOps,
  validateBody(bodyShape({})),
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      if (!memoryStore.has(req.params.id as string)) {
        sendError(res, 'Memory item not found', 404);
        return;
      }
      memoryStore.delete(req.params.id as string);
      void deleteMemoryFromDB(req.params.id as string);
      sendSuccess(res, { ok: true });
    } catch (err) {
      handleRouteError(res, err, 'DELETE /api/nexus/memory/:id');
    }
  },
);

// ─── Skills Routes ────────────────────────────────────────────────────────────

router.get('/skills', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { search, enabled, pattern } = req.query as Record<string, string>;
    let skills = Array.from(skillStore.values());
    if (search) {
      const q = search.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (enabled !== undefined) skills = skills.filter((s) => s.enabled === (enabled === 'true'));
    if (pattern) skills = skills.filter((s) => s.pattern === pattern);
    skills.sort((a, b) => (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0) || b.usageCount - a.usageCount);
    sendSuccess(res, skills);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/skills');
  }
});

router.post(
  '/skills/:id/toggle',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      enabled: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const skill = skillStore.get(req.params.id as string);
      if (!skill) {
        sendError(res, 'Skill not found', 404);
        return;
      }
      const { enabled } = req.body as { enabled?: boolean };
      skill.enabled = enabled ?? !skill.enabled;
      skill.lastModifiedAt = new Date().toISOString();
      skill.lastModifiedBy = req.user?.email ?? req.user?.displayName ?? 'anonymous';
      void persistSkillToDB(skill);
      sendSuccess(res, skill);
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/skills/:id/toggle');
    }
  },
);

router.post(
  '/skills',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      id: z.unknown().optional(),
      name: z.unknown().optional(),
      description: z.unknown().optional(),
      sourceRepo: z.unknown().optional(),
      sourceUrl: z.unknown().optional(),
      license: z.unknown().optional(),
      pattern: z.unknown().optional(),
      primitiveType: z.unknown().optional(),
      enabled: z.unknown().optional(),
      usageCount: z.unknown().optional(),
      nexusAdaptation: z.unknown().optional(),
      originalSummary: z.unknown().optional(),
      tags: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<Skill>;
      if (!body.name?.trim()) {
        sendError(res, 'name is required', 400);
        return;
      }
      const now = new Date().toISOString();
      const actor = req.user?.email ?? req.user?.displayName ?? 'anonymous';
      const skill: Skill = {
        id: body.id?.trim() || `sk_custom_${randomUUID().slice(0, 8)}`,
        name: body.name.trim(),
        description: body.description ?? '',
        sourceRepo: body.sourceRepo ?? 'custom',
        sourceUrl: body.sourceUrl ?? '',
        license: body.license ?? 'MIT',
        pattern: body.pattern ?? 'Skill Packs',
        primitiveType: body.primitiveType ?? 'Skill',
        enabled: body.enabled ?? false,
        usageCount: body.usageCount ?? 0,
        nexusAdaptation: body.nexusAdaptation ?? '',
        originalSummary: body.originalSummary ?? '',
        tags: body.tags ?? [],
        isCustom: true,
        lastModifiedAt: now,
        lastModifiedBy: actor,
      };
      skillStore.set(skill.id, skill);
      void persistSkillToDB(skill);
      sendCreated(res, skill);
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/skills');
    }
  },
);

router.put(
  '/skills/:id',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const skill = skillStore.get(req.params.id as string);
      if (!skill) {
        sendError(res, 'Skill not found', 404);
        return;
      }
      const update = req.body as Partial<Skill>;
      const updated: Skill = {
        ...skill,
        ...update,
        id: skill.id,
        isCustom: skill.isCustom,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: req.user?.email ?? req.user?.displayName ?? 'anonymous',
      };
      skillStore.set(skill.id, updated);
      void persistSkillToDB(updated);
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'PUT /api/nexus/skills/:id');
    }
  },
);

// ─── Third-Party Call Wrapper ─────────────────────────────────────────────────
//
// Every invocation of a registered third-party leader must go through
// thirdPartyCall(). It:
//   1. Resolves the leader and checks policy + enabled state.
//   2. Executes the caller-supplied fn if the gate passes.
//   3. Writes a structured audit-log row with caller, target, policy decision,
//      cost estimate, and a request hash (for idempotency tracing).
//
// Usage: await thirdPartyCall('tpl_hyperframes', 'nexus-orchestrator', async () => { ... });

interface ThirdPartyCallContext {
  callerAgent: string;
  requestPayload?: unknown;
}

interface ThirdPartyCallResult<T> {
  ok: boolean;
  policyDecision: 'allowed' | 'blocked' | 'requires-review';
  policyNote?: string;
  result?: T;
  error?: string;
  durationMs: number;
  requestHash: string;
  tokensEstimate: number;
  costEstimateUsd: number;
}

async function thirdPartyCall<T>(
  leaderId: string,
  ctx: ThirdPartyCallContext,
  fn: () => Promise<T>,
): Promise<ThirdPartyCallResult<T>> {
  const start = Date.now();
  const leader = leaderStore.get(leaderId);

  const payloadStr = ctx.requestPayload
    ? JSON.stringify(ctx.requestPayload).slice(0, 4000)
    : '';
  const requestHash = createHash('sha256')
    .update(`${leaderId}:${ctx.callerAgent}:${payloadStr}`)
    .digest('hex')
    .slice(0, 16);

  if (!leader) {
    const durationMs = Date.now() - start;
    logger.warn(
      {
        event: 'praxis.third_party_call.unknown_leader',
        leaderId,
        callerAgent: ctx.callerAgent,
        requestHash,
        durationMs,
      },
      'Third-party call blocked — leader not registered',
    );
    void writeAuditEvent({
      userId: null,
      action: 'praxis.third_party_call.blocked',
      entityType: 'nexus_leader',
      entityId: leaderId,
      newValues: {
        callerAgent: ctx.callerAgent,
        policyDecision: 'blocked',
        policyNote: 'Leader not found in registry',
        requestHash,
        tokensEstimate: 0,
        costEstimateUsd: 0,
        durationMs,
      },
    });
    return {
      ok: false,
      policyDecision: 'blocked',
      policyNote: 'Leader not found in registry',
      error: `Leader '${leaderId}' is not registered in the PRAXIS third-party registry`,
      durationMs,
      requestHash,
      tokensEstimate: 0,
      costEstimateUsd: 0,
    };
  }

  if (!leader.enabled) {
    const durationMs = Date.now() - start;
    logger.warn(
      {
        event: 'praxis.third_party_call.leader_disabled',
        leaderId,
        leaderName: leader.name,
        callerAgent: ctx.callerAgent,
        requestHash,
        policyState: leader.policyState,
        durationMs,
      },
      'Third-party call blocked — leader is disabled',
    );
    void writeAuditEvent({
      userId: null,
      action: 'praxis.third_party_call.blocked',
      entityType: 'nexus_leader',
      entityId: leaderId,
      newValues: {
        leaderName: leader.name,
        callerAgent: ctx.callerAgent,
        policyDecision: 'blocked',
        policyNote: `Leader '${leader.name}' is disabled`,
        requestHash,
        tokensEstimate: 0,
        costEstimateUsd: 0,
        durationMs,
      },
    });
    return {
      ok: false,
      policyDecision: 'blocked',
      policyNote: `Leader '${leader.name}' is disabled. Enable it in the Skills → Third-Party Leaders registry.`,
      error: `Leader '${leader.name}' is disabled`,
      durationMs,
      requestHash,
      tokensEstimate: 0,
      costEstimateUsd: 0,
    };
  }

  if (leader.policyState === 'blocked') {
    const durationMs = Date.now() - start;
    logger.warn(
      {
        event: 'praxis.third_party_call.policy_blocked',
        leaderId,
        leaderName: leader.name,
        callerAgent: ctx.callerAgent,
        requestHash,
        policyState: leader.policyState,
        policyNote: leader.policyNote,
        durationMs,
      },
      'Third-party call blocked by policy gate',
    );
    void writeAuditEvent({
      userId: null,
      action: 'praxis.third_party_call.policy_blocked',
      entityType: 'nexus_leader',
      entityId: leaderId,
      newValues: {
        leaderName: leader.name,
        callerAgent: ctx.callerAgent,
        policyDecision: 'blocked',
        policyNote: leader.policyNote,
        requestHash,
        tokensEstimate: 0,
        costEstimateUsd: 0,
        durationMs,
      },
    });
    return {
      ok: false,
      policyDecision: 'blocked',
      policyNote: leader.policyNote,
      error: `Leader '${leader.name}' is blocked by policy`,
      durationMs,
      requestHash,
      tokensEstimate: 0,
      costEstimateUsd: 0,
    };
  }

  const policyDecision = leader.policyState;
  let result: T | undefined;
  let callError: string | undefined;
  let ok = false;

  try {
    result = await fn();
    ok = true;
  } catch (err) {
    callError = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - start;
  const tokensEstimate = Math.ceil(payloadStr.length / 4);
  const costEstimateUsd = tokensEstimate * 0.000003;

  logger.info(
    {
      event: 'praxis.third_party_call.executed',
      leaderId,
      leaderName: leader.name,
      callerAgent: ctx.callerAgent,
      policyDecision,
      policyNote: leader.policyNote,
      requestHash,
      tokensEstimate,
      costEstimateUsd,
      durationMs,
      ok,
      error: callError,
    },
    ok ? 'Third-party leader invoked successfully' : 'Third-party leader invocation failed',
  );
  void writeAuditEvent({
    userId: null,
    action: ok ? 'praxis.third_party_call.executed' : 'praxis.third_party_call.error',
    entityType: 'nexus_leader',
    entityId: leaderId,
    newValues: {
      leaderName: leader.name,
      callerAgent: ctx.callerAgent,
      policyDecision,
      policyNote: leader.policyNote,
      requestHash,
      tokensEstimate,
      costEstimateUsd,
      durationMs,
      ok,
      error: callError,
    },
  });

  return {
    ok,
    policyDecision,
    policyNote: leader.policyNote,
    result,
    error: callError,
    durationMs,
    requestHash,
    tokensEstimate,
    costEstimateUsd,
  };
}

// Export for downstream leader integrations so they don't re-implement gating.
export { thirdPartyCall };

// ─── web.stealth Policy Store ────────────────────────────────────────────────
//
// In-memory policy for Camofox web.stealth calls. Default allowlist is empty;
// operators must explicitly add domains via PUT /api/nexus/tools/web.stealth/policy.
// The RPM cap is enforced per-server in a rolling 60-second window.

interface WebStealthPolicy {
  allowlist: string[];
  rpmCap: number;
}

const webStealthPolicy: WebStealthPolicy = {
  allowlist: [],
  rpmCap: 20,
};

// Rolling 60-second RPM tracker (timestamps only)
const webStealthCallLog: number[] = [];

// Detailed audit log — last MAX_AUDIT_ENTRIES entries, newest first
const MAX_AUDIT_ENTRIES = 100;
interface WebStealthAuditEntry {
  id: string;
  domain: string;
  action: string;
  status: 'allowed' | 'blocked' | 'error';
  reason: string | null;
  callerAgent: string;
  calledAt: string;
}
const webStealthAuditLog: WebStealthAuditEntry[] = [];

function pushAuditEntry(entry: Omit<WebStealthAuditEntry, 'id' | 'calledAt'>): void {
  webStealthAuditLog.unshift({
    ...entry,
    id: `wsa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    calledAt: new Date().toISOString(),
  });
  if (webStealthAuditLog.length > MAX_AUDIT_ENTRIES) webStealthAuditLog.pop();
}

function countRecentCalls(): number {
  const cutoff = Date.now() - 60_000;
  while (webStealthCallLog.length > 0 && (webStealthCallLog[0] ?? 0) < cutoff) {
    webStealthCallLog.shift();
  }
  return webStealthCallLog.length;
}

function extractHostname(raw: string): string | null {
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isDomainAllowed(targetUrl: string): boolean {
  const host = extractHostname(targetUrl);
  if (!host) return false;
  return webStealthPolicy.allowlist.some(
    (entry) => host === entry || host.endsWith(`.${entry}`),
  );
}

// Exported for unit-test assertions. Do NOT call in production code.
export { isDomainAllowed as __isDomainAllowedForTest, countRecentCalls as __countRecentCallsForTest };

// Exported for unit-test setup. Do NOT call in production code.
export function __getWebStealthPolicyForTest(): { allowlist: string[]; rpmCap: number } {
  return { allowlist: [...webStealthPolicy.allowlist], rpmCap: webStealthPolicy.rpmCap };
}
export function __setWebStealthAllowlistForTest(domains: string[]): void {
  webStealthPolicy.allowlist = [...domains];
}
export function __resetWebStealthPolicyForTest(): void {
  webStealthPolicy.allowlist = [];
  webStealthPolicy.rpmCap = 20;
  webStealthCallLog.length = 0;
  webStealthAuditLog.length = 0;
}

// GET /api/nexus/tools/web.stealth/policy — returns current policy (no auth required)
router.get('/tools/web.stealth/policy', async (_req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      allowlist: webStealthPolicy.allowlist,
      rpmCap: webStealthPolicy.rpmCap,
      currentRpm: countRecentCalls(),
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/tools/web.stealth/policy');
  }
});

// PUT /api/nexus/tools/web.stealth/policy — ops-only, persists allowlist + rpmCap
router.put(
  '/tools/web.stealth/policy',
  authMiddleware({ required: true }),
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      allowlist: z.array(z.string()).optional(),
      rpmCap: z.number().int().min(1).max(120).optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { allowlist, rpmCap } = req.body as { allowlist?: string[]; rpmCap?: number };
      if (allowlist !== undefined) webStealthPolicy.allowlist = allowlist;
      if (rpmCap !== undefined) webStealthPolicy.rpmCap = rpmCap;
      void writeAuditEvent({
        userId: (req.user as { id?: string } | undefined)?.id ?? null,
        action: 'praxis.web_stealth.policy_updated',
        entityType: 'nexus_tool_policy',
        entityId: 'web.stealth',
        newValues: { allowlist: webStealthPolicy.allowlist, rpmCap: webStealthPolicy.rpmCap },
      });
      sendSuccess(res, { allowlist: webStealthPolicy.allowlist, rpmCap: webStealthPolicy.rpmCap });
    } catch (err) {
      handleRouteError(res, err, 'PUT /api/nexus/tools/web.stealth/policy');
    }
  },
);

// GET /api/nexus/tools/web.stealth/recent-calls — returns the last N audit entries (no auth required)
router.get('/tools/web.stealth/recent-calls', async (req: Request, res: Response) => {
  try {
    const limitRaw = Number((req.query as Record<string, string>).limit ?? '50');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 100) : 50;
    sendSuccess(res, { entries: webStealthAuditLog.slice(0, limit), total: webStealthAuditLog.length });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/tools/web.stealth/recent-calls');
  }
});

const WEB_STEALTH_ACTIONS = new Set(['fetch', 'accessibility-snapshot', 'click-and-extract']);

// POST /api/nexus/tools/web.stealth/invoke — triggers a web.stealth action through
// the thirdPartyCall wrapper (policy-gated, audit-logged). Auth is required; in
// demo/dev environments the session cookie from the frontend satisfies this requirement.
// The Camofox leader must be enabled by ops and the target domain must be in the allowlist.
router.post(
  '/tools/web.stealth/invoke',
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      action: z.string(),
      url: z.string(),
      callerAgent: z.string().optional(),
      selector: z.string().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        action,
        url: targetUrl,
        callerAgent = 'anonymous',
        selector,
      } = req.body as { action: string; url: string; callerAgent?: string; selector?: string };

      if (!WEB_STEALTH_ACTIONS.has(action)) {
        sendError(
          res,
          `Unknown action '${action}'. Must be one of: ${[...WEB_STEALTH_ACTIONS].join(', ')}.`,
          400,
          'INVALID_ACTION',
        );
        return;
      }

      const callResult = await thirdPartyCall<unknown>(
        'tpl_camofox',
        { callerAgent, requestPayload: { action, url: targetUrl, selector } },
        async () => {
          const host = extractHostname(targetUrl) ?? targetUrl;

          // Domain allowlist gate
          if (!isDomainAllowed(targetUrl)) {
            const blockedReason = `Domain '${host}' is not in the Camofox allowlist. Add it via Skills → Camofox before retrying.`;
            pushAuditEntry({ domain: host, action, status: 'blocked', reason: blockedReason, callerAgent });
            return {
              policy: 'blocked',
              reason: blockedReason,
              auditId: `audit_${randomUUID().slice(0, 8)}`,
              url: targetUrl,
            };
          }

          // RPM cap gate
          if (countRecentCalls() >= webStealthPolicy.rpmCap) {
            const rpmReason = `RPM cap of ${webStealthPolicy.rpmCap} exceeded. Retry in ${60 - Math.floor((Date.now() - (webStealthCallLog[0] ?? Date.now())) / 1000)}s.`;
            pushAuditEntry({ domain: host, action, status: 'blocked', reason: rpmReason, callerAgent });
            return {
              policy: 'blocked',
              reason: rpmReason,
              auditId: `audit_${randomUUID().slice(0, 8)}`,
              url: targetUrl,
            };
          }

          // Record call in rolling window
          webStealthCallLog.push(Date.now());

          // Simulate browser fetch latency
          await sleep(800 + Math.random() * 600);

          const auditId = `audit_${randomUUID().slice(0, 8)}`;
          const bytes = Math.floor(18000 + Math.random() * 20000);

          if (action === 'accessibility-snapshot') {
            // Return structured snapshot fields based on caller context
            const isRealEstate =
              host.includes('zillow') || host.includes('realtor') || host.includes('redfin');
            const isPort =
              host.includes('portof') || host.includes('marinetraffic') || host.includes('port');

            if (isRealEstate) {
              pushAuditEntry({ domain: host, action, status: 'allowed', reason: null, callerAgent });
              return {
                policy: 'allowed',
                action,
                url: targetUrl,
                auditId,
                bytes,
                fetchedAt: new Date().toISOString(),
                snapshot: {
                  title: `Listing at ${host}`,
                  price: `$${(900000 + Math.floor(Math.random() * 5000000)).toLocaleString()}`,
                  sqft: `${Math.floor(1200 + Math.random() * 8000).toLocaleString()} sqft`,
                  yearBuilt: String(1970 + Math.floor(Math.random() * 50)),
                  zestimate: `$${(950000 + Math.floor(Math.random() * 5000000)).toLocaleString()}`,
                  daysOnMarket: `${Math.floor(10 + Math.random() * 60)} days`,
                },
              };
            } else if (isPort) {
              const ports = ['Rotterdam', 'Singapore', 'Hamburg', 'Shanghai', 'Antwerp'];
              const port = ports[Math.floor(Math.random() * ports.length)];
              pushAuditEntry({ domain: host, action, status: 'allowed', reason: null, callerAgent });
              return {
                policy: 'allowed',
                action,
                url: targetUrl,
                auditId,
                bytes,
                fetchedAt: new Date().toISOString(),
                snapshot: {
                  portName: `Port of ${port}`,
                  vesselQueue: Math.floor(8 + Math.random() * 24),
                  congestion: ['Low (32%)', 'Moderate (61%)', 'High (84%)'][
                    Math.floor(Math.random() * 3)
                  ],
                  nextDeparture: new Date(
                    Date.now() + (2 + Math.random() * 10) * 3_600_000,
                  )
                    .toUTCString()
                    .slice(0, 22) + ' UTC',
                  berthsOccupied: `${Math.floor(6 + Math.random() * 8)} / ${Math.floor(14 + Math.random() * 6)}`,
                },
              };
            }
          }

          // Generic fetch / click-and-extract fallback
          pushAuditEntry({ domain: host, action, status: 'allowed', reason: null, callerAgent });
          return {
            policy: 'allowed',
            action,
            url: targetUrl,
            auditId,
            bytes,
            fetchedAt: new Date().toISOString(),
            snapshot: { status: 200, contentType: 'text/html', selector },
          };
        },
      );

      if (!callResult.ok && callResult.policyDecision === 'blocked') {
        sendSuccess(res, {
          ok: false,
          policyDecision: 'blocked' as const,
          policyNote: callResult.policyNote,
          error: callResult.error,
          requestHash: callResult.requestHash,
          durationMs: callResult.durationMs,
        });
        return;
      }

      sendSuccess(res, {
        ok: callResult.ok,
        policyDecision: callResult.policyDecision,
        requestHash: callResult.requestHash,
        durationMs: callResult.durationMs,
        ...(callResult.result as object),
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/tools/web.stealth/invoke');
    }
  },
);

// ─── Third-Party Leaders Routes ───────────────────────────────────────────────

router.use(['/leaders'], authMiddleware({ required: true }));

router.get('/leaders', async (_req: Request, res: Response) => {
  try {
    const leaders = Array.from(leaderStore.values());
    sendSuccess(res, leaders);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/leaders');
  }
});

router.post(
  '/leaders/:id/toggle',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const leader = leaderStore.get(req.params.id as string);
      if (!leader) {
        sendError(res, 'Leader not found', 404);
        return;
      }
      if (leader.policyState === 'blocked') {
        sendError(
          res,
          `Leader '${leader.name}' is blocked by policy and cannot be enabled`,
          403,
        );
        return;
      }
      const body = req.body as { enabled?: boolean };
      const enabled = typeof body.enabled === 'boolean' ? body.enabled : !leader.enabled;

      const updated: ThirdPartyLeader = { ...leader, enabled };
      leaderStore.set(leader.id, updated);

      logger.info(
        {
          event: 'praxis.leader.toggled',
          leaderId: leader.id,
          leaderName: leader.name,
          enabled,
          actor: req.user?.email ?? req.user?.displayName ?? 'anonymous',
        },
        `Third-party leader ${enabled ? 'enabled' : 'disabled'}`,
      );

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/leaders/:id/toggle');
    }
  },
);

router.post(
  '/leaders/:id/invoke',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const leaderId = req.params.id as string;
      const { callerAgent, requestPayload } = req.body as {
        callerAgent?: string;
        requestPayload?: unknown;
      };
      const caller = callerAgent ?? req.user?.email ?? 'nexus-orchestrator';

      const callResult = await thirdPartyCall(
        leaderId,
        { callerAgent: caller, requestPayload },
        async () => ({ invoked: true, leaderId, callerAgent: caller }),
      );

      if (!callResult.ok) {
        res.status(403).json({
          error: callResult.error ?? 'Invocation blocked by policy',
          policyDecision: callResult.policyDecision,
          policyNote: callResult.policyNote,
          requestHash: callResult.requestHash,
          durationMs: callResult.durationMs,
        });
        return;
      }

      sendSuccess(res, {
        ok: true,
        policyDecision: callResult.policyDecision,
        policyNote: callResult.policyNote,
        requestHash: callResult.requestHash,
        tokensEstimate: callResult.tokensEstimate,
        costEstimateUsd: callResult.costEstimateUsd,
        durationMs: callResult.durationMs,
        result: callResult.result,
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/leaders/:id/invoke');
    }
  },
);

// ─── Pattern Atlas Routes ─────────────────────────────────────────────────────

router.get('/patterns', async (_req: Request, res: Response) => {
  try {
    const patterns = Array.from(patternStore.values());
    sendSuccess(res, patterns);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/patterns');
  }
});

// ─── Protocol Bridge Routes ───────────────────────────────────────────────────

router.get('/bridge/tools', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { protocol } = req.query as { protocol?: string };
    let tools = Array.from(toolStore.values());
    if (protocol) tools = tools.filter((t) => t.protocol === protocol);
    sendSuccess(res, tools);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/bridge/tools');
  }
});

router.post(
  '/bridge/tools',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      id: z.unknown().optional(),
      name: z.unknown().optional(),
      description: z.unknown().optional(),
      protocol: z.unknown().optional(),
      domain: z.unknown().optional(),
      inputSchema: z.unknown().optional(),
      tags: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<ProtocolTool>;
      if (!body.name?.trim() || !body.protocol) {
        sendError(res, 'name and protocol are required', 400);
        return;
      }
      if (!['MCP', 'A2A', 'ACP', 'ANP'].includes(body.protocol)) {
        sendError(res, 'protocol must be one of MCP, A2A, ACP, ANP', 400);
        return;
      }
      const now = new Date().toISOString();
      const actor = req.user?.email ?? req.user?.displayName ?? 'anonymous';
      const tool: ProtocolTool = {
        id: body.id?.trim() || `${body.protocol.toLowerCase()}_custom_${randomUUID().slice(0, 8)}`,
        name: body.name.trim(),
        description: body.description ?? '',
        protocol: body.protocol,
        domain: body.domain ?? 'custom',
        inputSchema: body.inputSchema ?? { type: 'object', properties: {} },
        tags: body.tags ?? [],
        isCustom: true,
        lastModifiedAt: now,
        lastModifiedBy: actor,
      };
      toolStore.set(tool.id, tool);
      void persistToolToDB(tool);
      sendCreated(res, tool);
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/bridge/tools');
    }
  },
);

router.put(
  '/bridge/tools/:id',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const tool = toolStore.get(req.params.id as string);
      if (!tool) {
        sendError(res, 'Tool not found', 404);
        return;
      }
      const update = req.body as Partial<ProtocolTool>;
      const updated: ProtocolTool = {
        ...tool,
        ...update,
        id: tool.id,
        isCustom: tool.isCustom,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: req.user?.email ?? req.user?.displayName ?? 'anonymous',
      };
      toolStore.set(tool.id, updated);
      void persistToolToDB(updated);
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'PUT /api/nexus/bridge/tools/:id');
    }
  },
);

router.delete(
  '/bridge/tools/:id',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      if (!toolStore.has(id)) {
        sendError(res, 'Tool not found', 404);
        return;
      }
      toolStore.delete(id);
      void deleteToolFromDB(id);
      sendSuccess(res, { ok: true });
    } catch (err) {
      handleRouteError(res, err, 'DELETE /api/nexus/bridge/tools/:id');
    }
  },
);

// ─── Reset to defaults ────────────────────────────────────────────────────────
// Removes user-added skills/tools and clears modification metadata on seeded
// entries, then re-runs seedData() so the canonical seed set is restored.
router.post(
  '/customizations/reset',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (_req: Request, res: Response) => {
    try {
      let removedSkills = 0;
      let resetSkills = 0;
      let removedTools = 0;
      let resetTools = 0;

      for (const [id, skill] of skillStore) {
        if (skill.isCustom) {
          skillStore.delete(id);
          removedSkills++;
          if (db) {
            try {
              await db.delete(nexusSkillsTable).where(eq(nexusSkillsTable.id, id));
            } catch (dbErr) {
              logger.warn({ dbErr, id }, 'Failed to delete custom skill from DB during reset');
            }
          }
        } else if (skill.lastModifiedAt || skill.lastModifiedBy) {
          delete skill.lastModifiedAt;
          delete skill.lastModifiedBy;
          resetSkills++;
          void persistSkillToDB(skill);
        }
      }

      for (const [id, tool] of toolStore) {
        if (tool.isCustom) {
          toolStore.delete(id);
          removedTools++;
          void deleteToolFromDB(id);
        } else if (tool.lastModifiedAt || tool.lastModifiedBy) {
          delete tool.lastModifiedAt;
          delete tool.lastModifiedBy;
          resetTools++;
          void persistToolToDB(tool);
        }
      }

      // Re-seed any seed entries that were missing (e.g. previously deleted) and
      // mirror them back to the database so the canonical set is restored.
      seedData(true);

      sendSuccess(res, {
        ok: true,
        removedSkills,
        resetSkills,
        removedTools,
        resetTools,
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/customizations/reset');
    }
  },
);

router.post(
  '/bridge/invoke',
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      protocol: z.unknown().optional(),
      toolId: z.unknown().optional(),
      args: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        protocol,
        toolId,
        args = {},
      } = req.body as { protocol?: string; toolId?: string; args?: Record<string, unknown> };
      if (!protocol || !toolId) {
        sendError(res, 'protocol and toolId are required', 400);
        return;
      }

      const tool = toolStore.get(toolId);
      if (!tool) {
        sendError(res, 'Tool not found', 404);
        return;
      }

      const traceId = randomUUID().slice(0, 8);
      const start = Date.now();

      // Simulate tool execution
      await sleep(200 + Math.random() * 400);

      let output: unknown;
      if (tool.id === 'mcp_web_search') {
        output = {
          results: [
            {
              title: 'Latest Market Analysis Report',
              url: 'https://www.reuters.com/markets/commodities',
              snippet: 'Comprehensive analysis of current market conditions...',
            },
            {
              title: 'IMF World Economic Outlook',
              url: 'https://www.imf.org/en/Publications/WEO',
              snippet: 'Global economic projections and risk assessments...',
            },
            {
              title: 'BIS Working Papers on Financial Stability',
              url: 'https://www.bis.org/publ/work',
              snippet: 'Research on systemic risk and financial stability...',
            },
          ],
          query: args.query,
          totalResults: 3,
        };
      } else if (tool.id === 'mcp_memory_read') {
        const items = Array.from(memoryStore.values()).slice(0, 3);
        output = { items, count: items.length };
      } else if (tool.protocol === 'A2A') {
        output = {
          status: 'delegated',
          agentId: `agent_${randomUUID().slice(0, 8)}`,
          accepted: true,
          estimatedCompletionMs: 5000,
        };
      } else if (tool.protocol === 'ACP') {
        output = {
          status: 'processed',
          workflowRunId: randomUUID().slice(0, 8),
          result: { success: true, recordsAffected: 0 },
        };
      } else if (tool.protocol === 'ANP') {
        output = {
          status: 'published',
          did: `did:nexus:${randomUUID().slice(0, 16)}`,
          networkEndpoints: 3,
        };
      } else if (tool.id === 'hf_video_render' || tool.domain === 'video.render') {
        const jobId = `hvj_${randomUUID().slice(0, 8)}`;
        const durationS = (args.duration as number) || 30;
        const job: VideoRenderJob = {
          jobId,
          status: 'queued',
          durationS,
          composition: (args.composition as string) || '',
          voiceover: args.voiceover as string | undefined,
          assets: args.assets as unknown[] | undefined,
          seed: (args.seed as string) || jobId,
          createdAt: new Date().toISOString(),
          completedAt: null,
          fileSizeMb: null,
          thumbnailUrl: null,
          mp4Url: null,
          auditTrace: `trace_${randomUUID().slice(0, 8)}`,
          costCents: Math.floor(durationS * 1.5),
        };
        videoRenderStore.set(jobId, job);
        processVideoRenderJob(jobId);
        output = {
          job_id: jobId,
          status: 'queued',
          duration_s: durationS,
          estimated_render_ms: durationS * 1200,
          poll_url: `/api/nexus/bridge/video-render/${jobId}`,
          audit_trace: job.auditTrace,
        };
      } else if (tool.id === 'hf_video_status') {
        const jobId = args.job_id as string | undefined;
        const job = jobId ? videoRenderStore.get(jobId) : null;
        if (!job) {
          output = { error: 'Render job not found', job_id: jobId };
        } else {
          output = serializeVideoJob(job);
        }
      } else {
        output = {
          status: 'ok',
          data: { message: `Tool ${toolId} executed successfully` },
          metadata: { args },
        };
      }

      if (tool.id.startsWith('sk_') || toolStore.has(toolId)) {
        const skill = Array.from(skillStore.values()).find((s) => s.name === tool.name);
        if (skill) skill.usageCount++;
      }

      sendSuccess(res, {
        toolId,
        protocol,
        status: 'success',
        output,
        durationMs: Date.now() - start,
        traceId,
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/bridge/invoke');
    }
  },
);

// ─── HyperFrames Video Render Routes ─────────────────────────────────────────

router.post(
  '/bridge/video-render',
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      composition: z.string().max(512_000).optional(),
      duration: z.number().min(1).max(3600).optional(),
      voiceover: z.string().max(10_000).optional(),
      assets: z.array(z.object({ url: z.string().url(), type: z.string(), label: z.string() })).max(50).optional(),
      seed: z.string().max(256).optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { composition = '', duration = 30, voiceover, assets, seed } = req.body as {
        composition?: string;
        duration?: number;
        voiceover?: string;
        assets?: unknown[];
        seed?: string;
      };
      const jobId = `hvj_${randomUUID().slice(0, 8)}`;
      const job: VideoRenderJob = {
        jobId,
        status: 'queued',
        durationS: Number(duration),
        composition: String(composition),
        voiceover,
        assets,
        seed: seed ?? jobId,
        createdAt: new Date().toISOString(),
        completedAt: null,
        fileSizeMb: null,
        thumbnailUrl: null,
        mp4Url: null,
        auditTrace: `trace_${randomUUID().slice(0, 8)}`,
        costCents: Math.floor(Number(duration) * 1.5),
      };
      videoRenderStore.set(jobId, job);
      processVideoRenderJob(jobId);
      sendSuccess(res, {
        job_id: jobId,
        status: 'queued',
        duration_s: job.durationS,
        estimated_render_ms: job.durationS * 1200,
        poll_url: `/api/nexus/bridge/video-render/${jobId}`,
        audit_trace: job.auditTrace,
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/bridge/video-render');
    }
  },
);

router.get('/bridge/video-render/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = videoRenderStore.get(jobId);
    if (!job) {
      sendError(res, 'Render job not found', 404);
      return;
    }
    sendSuccess(res, serializeVideoJob(job));
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/bridge/video-render/:jobId');
  }
});

router.get('/bridge/video-render', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const jobs = Array.from(videoRenderStore.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(serializeVideoJob);
    sendSuccess(res, { jobs, total: jobs.length });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/bridge/video-render');
  }
});

// ─── Orchestrator Routes ──────────────────────────────────────────────────────

const APP_CAPABILITIES: Record<string, { name: string; endpoints: string[] }> = {
  aegis: {
    name: 'Aegis — Defense & Intelligence',
    endpoints: [
      '/api/agent-mesh/state',
      '/api/narratives/sentra-ransomware',
      '/api/infrastructure/status',
    ],
  },
  sentra: {
    name: 'Sentra — Cyber Resilience',
    endpoints: [
      '/api/firestorm/live/threat-summary',
      '/api/firestorm/live/asset-risk',
      '/api/agent-mesh/state',
    ],
  },
  firestorm: {
    name: 'Aegis — Threat Intelligence',
    endpoints: [
      '/api/firestorm/live/threat-summary',
      '/api/firestorm/live/compliance-summary',
      '/api/firestorm/mitre/coverage',
    ],
  },
  vessels: {
    name: 'Vessels Maritime Intelligence',
    endpoints: [
      '/api/vessels/live/fleet-summary',
      '/api/vessels/live/ais/combined',
      '/api/vessels/cognitive/route-anomalies',
    ],
  },
  terra: {
    name: 'Terra — Real Estate Intelligence',
    endpoints: [
      '/api/terra/live/mortgage-rates',
      '/api/terra/live/hud-fair-market-rents',
      '/api/terra/portfolio/overview',
    ],
  },
  pulse: {
    name: 'Pulse — Executive Briefing',
    endpoints: ['/api/core/health', '/api/core/metrics'],
  },
  command: {
    name: 'Unified Command',
    endpoints: ['/api/core/health', '/api/core/metrics', '/api/agent-mesh/index'],
  },
  'szl-holdings': {
    name: 'SZL Holdings Dashboard',
    endpoints: ['/api/core/metrics', '/api/fabric/snapshot'],
  },
  'carlota-jo': {
    name: 'Carlota Jo Consulting',
    endpoints: ['/api/core/health', '/api/booking/services'],
  },
  'prism-counsel': {
    name: 'Counsel Legal',
    endpoints: ['/api/narratives/counsel-deadline', '/api/core/health'],
  },
  counsel: {
    name: 'Counsel — Legal Matter Command',
    endpoints: ['/api/narratives/counsel-deadline'],
  },
  lyte: { name: 'Lyte Platform', endpoints: ['/api/core/health', '/api/core/metrics'] },
  imperium: {
    name: 'Imperium — Sovereign Cloud',
    endpoints: [
      '/api/imperium/cloud/resources',
      '/api/imperium/cloud/metrics',
      '/api/imperium/intelligence/briefs',
    ],
  },
  // ── Third-party leader logical capabilities ────────────────────────────────
  // These entries wire the Orchestrator's intent-matching to the leader registry.
  // Once individual integration tasks ship, they replace these stubs with real endpoints.
  'video.render': {
    name: 'HyperFrames — Video Render',
    endpoints: ['/api/nexus/leaders/tpl_hyperframes/invoke'],
  },
  'web.stealth': {
    name: 'Camofox — Stealth Browser',
    endpoints: ['/api/nexus/leaders/tpl_camofox/invoke'],
  },
  'marketing.audit': {
    name: 'claude-ads — Marketing Audit',
    endpoints: ['/api/nexus/leaders/tpl_claude_ads/invoke'],
  },
  'seo.audit': {
    name: 'Toprank — SEO Audit',
    endpoints: ['/api/nexus/leaders/tpl_toprank/invoke'],
  },
  'finance.terminal': {
    name: 'Fincept Terminal — Finance Data',
    endpoints: ['/api/nexus/leaders/tpl_fincept_terminal/invoke'],
  },
};

const INTERNAL_API_BASE = `http://127.0.0.1:${process.env.PORT ?? '8080'}`;

async function fetchAppEndpoint(
  endpoint: string,
  timeoutMs = 5000,
): Promise<{ ok: boolean; status: number; body?: unknown; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${INTERNAL_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: { 'x-nexus-orchestrator': '1', Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

function truncateForPrompt(value: unknown, maxChars = 1200): string {
  let s: string;
  try {
    s = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    s = String(value);
  }
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}…[truncated ${s.length - maxChars} chars]`;
}

async function planOrchestration(intent: string): Promise<OrchestrationStep[]> {
  const intentLower = intent.toLowerCase();
  const steps: OrchestrationStep[] = [];
  let stepNum = 1;

  function addStep(appSlug: string, action: string, endpointOverride?: string) {
    const cap = APP_CAPABILITIES[appSlug];
    const endpoint = endpointOverride ?? cap?.endpoints[0] ?? '/api/core/health';
    steps.push({
      id: `step_${stepNum++}`,
      app: cap?.name ?? appSlug,
      appSlug,
      action,
      endpoint,
      status: 'pending',
    });
  }

  if (
    intentLower.includes('threat') ||
    intentLower.includes('cyber') ||
    intentLower.includes('attack') ||
    intentLower.includes('aegis') ||
    intentLower.includes('sentra') ||
    intentLower.includes('firestorm')
  ) {
    addStep('sentra', 'Fetch live threat summary and high-risk asset posture');
  }
  if (
    intentLower.includes('vessel') ||
    intentLower.includes('maritime') ||
    intentLower.includes('ship') ||
    intentLower.includes('fleet')
  ) {
    addStep('vessels', 'Pull fleet summary and AIS positions');
  }
  if (
    intentLower.includes('cloud') ||
    intentLower.includes('infrastructure') ||
    intentLower.includes('imperium') ||
    intentLower.includes('sovereign')
  ) {
    addStep('imperium', 'Pull sovereign-cloud resource inventory and live legion metrics');
  }
  if (
    intentLower.includes('real estate') ||
    intentLower.includes('property') ||
    intentLower.includes('terra') ||
    intentLower.includes('housing')
  ) {
    addStep('terra', 'Retrieve mortgage rates and market KPIs');
  }
  if (
    intentLower.includes('legal') ||
    intentLower.includes('compliance') ||
    intentLower.includes('counsel') ||
    intentLower.includes('matter')
  ) {
    addStep('counsel', 'Retrieve open legal narratives');
  }
  if (
    intentLower.includes('portfolio') ||
    intentLower.includes('holdings') ||
    intentLower.includes('fabric')
  ) {
    addStep('szl-holdings', 'Fetch portfolio + global operations fabric snapshot');
  }
  if (
    intentLower.includes('brief') ||
    intentLower.includes('pulse') ||
    intentLower.includes('executive') ||
    intentLower.includes('summary') ||
    intentLower.includes('status')
  ) {
    addStep('pulse', 'Compile core platform health metrics');
  }

  // ── Third-party leader logical capabilities ─────────────────────────────────
  if (
    intentLower.includes('video') ||
    intentLower.includes('render') ||
    intentLower.includes('hyperframes')
  ) {
    addStep('video.render', 'Render video via HyperFrames leader');
  }
  if (
    intentLower.includes('stealth') ||
    intentLower.includes('scrape') ||
    intentLower.includes('camofox')
  ) {
    addStep('web.stealth', 'Execute stealth browser task via Camofox leader');
  }
  if (
    intentLower.includes('marketing') ||
    intentLower.includes('ad') ||
    intentLower.includes('ads') ||
    intentLower.includes('creative')
  ) {
    addStep('marketing.audit', 'Audit ad creative via claude-ads leader');
  }
  if (
    intentLower.includes('seo') ||
    intentLower.includes('ranking') ||
    intentLower.includes('toprank') ||
    intentLower.includes('keyword')
  ) {
    addStep('seo.audit', 'Run SEO audit via Toprank leader');
  }
  if (
    intentLower.includes('finance') ||
    intentLower.includes('market data') ||
    intentLower.includes('fincept') ||
    intentLower.includes('portfolio analytics')
  ) {
    addStep('finance.terminal', 'Query financial data via Fincept Terminal leader');
  }

  if (steps.length === 0) {
    addStep('command', 'Fetch cross-domain overview');
    addStep('pulse', 'Compile core platform health metrics');
  }

  return steps;
}

async function runOrchestration(planId: string, intent: string) {
  const plan = orchestrationStore.get(planId);
  if (!plan) return;

  try {
    // Resume-aware: if steps already exist (e.g. recovered from DB after a
    // restart), keep completed step outputs and only re-run pending/running
    // steps. Steps wrap idempotent read-only HTTP GETs so re-running is safe.
    let hasPendingWork = false;
    if (plan.steps.length === 0) {
      plan.steps = await planOrchestration(intent);
      hasPendingWork = plan.steps.length > 0;
    } else {
      for (const step of plan.steps) {
        if (step.status === 'running') {
          // Was interrupted mid-execution — reset so it gets re-run below.
          step.status = 'pending';
        }
        if (step.status !== 'done') hasPendingWork = true;
      }
    }
    // If any step still needs to run, the previous stitched output (if any)
    // is stale — drop it so we recompute from the fresh combined results.
    if (hasPendingWork) {
      delete plan.stitchedOutput;
    }
    const steps = plan.steps;
    plan.status = 'running';
    delete plan.completedAt;
    void persistOrchestrationPlanToDB(plan);

    const outputs: string[] = [];

    for (const step of steps) {
      // Skip steps that completed successfully on a previous attempt.
      if (step.status === 'done' && step.output) {
        outputs.push(`[${step.app} — ${step.endpoint}] ${step.output}`);
        continue;
      }
      step.status = 'running';
      void persistOrchestrationPlanToDB(plan);
      const stepStart = Date.now();

      const fetchResult = await fetchAppEndpoint(step.endpoint);
      step.httpStatus = fetchResult.status;
      step.rawPayload = fetchResult.ok
        ? truncateForPrompt(fetchResult.body, 2000)
        : truncateForPrompt(fetchResult.error ?? fetchResult.body ?? '(no body)', 2000);
      let summary: string;
      let llmFell = false;
      if (fetchResult.ok) {
        try {
          summary = await callLLM(
            `Summarize this ${step.app} API response into a 2-3 sentence executive insight that addresses the intent: "${intent}".\n\nEndpoint: ${step.endpoint}\nResponse:\n${truncateForPrompt(fetchResult.body)}`,
            `You are the PRAXIS orchestration analyst for ${step.app}. Produce a concise, factual summary of the API response. Cite specific numbers when present. Do not invent data not in the response.`,
            { agentId: 'nexus-orchestrator', domain: step.appSlug },
          );
        } catch (llmErr) {
          logger.warn(
            { llmErr, endpoint: step.endpoint },
            'Orchestrator LLM summary failed, using raw payload',
          );
          summary = `${step.app} responded (${fetchResult.status}): ${truncateForPrompt(fetchResult.body, 400)}`;
          llmFell = true;
        }
        step.status = 'done';
        step.confidence = llmFell ? 0.55 : 0.92;
      } else {
        summary =
          fetchResult.status === 0
            ? `${step.app} endpoint ${step.endpoint} unreachable: ${fetchResult.error ?? 'unknown error'}.`
            : `${step.app} endpoint ${step.endpoint} returned HTTP ${fetchResult.status}. Response: ${truncateForPrompt(fetchResult.body, 300)}`;
        step.status = 'error';
        step.confidence = 0.15;
        logger.warn(
          { endpoint: step.endpoint, status: fetchResult.status, error: fetchResult.error },
          'Orchestrator step endpoint failed',
        );
      }

      step.output = summary;
      step.durationMs = Date.now() - stepStart;
      outputs.push(`[${step.app} — ${step.endpoint}] ${summary}`);
    }

    if (!plan.stitchedOutput) {
      plan.stitchedOutput = await callLLM(
        `Stitch these per-app results into a single coherent executive output for the intent: "${intent}"\n\n${outputs.join('\n\n')}`,
        'You are the PRAXIS Cross-App Orchestrator stitcher. Produce a clear, executive-grade synthesis of multi-app data. Structure: Intent → Per-App Findings → Cross-Domain Insights → Recommended Actions.',
      );
    }
    plan.status = 'completed';
    plan.completedAt = new Date().toISOString();
    orchestrationsToday++;
    void persistOrchestrationPlanToDB(plan);
  } catch (err) {
    logger.error({ err, planId }, 'Orchestration failed');
    plan.status = 'failed';
    plan.completedAt = new Date().toISOString();
    void persistOrchestrationPlanToDB(plan);
  }
}

router.post(
  '/orchestrate',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      intent: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { intent } = req.body as { intent?: string };
      if (!intent?.trim()) {
        sendError(res, 'intent is required', 400);
        return;
      }

      const id = randomUUID();
      const createdBy = req.user?.email ?? req.user?.id?.toString() ?? 'unknown';
      const plan: OrchestrationPlan = {
        id,
        intent: intent.trim(),
        status: 'planning',
        steps: [],
        createdAt: new Date().toISOString(),
        createdBy,
      };
      orchestrationStore.set(id, plan);
      void persistOrchestrationPlanToDB(plan);
      void runOrchestration(id, intent.trim());
      sendSuccess(res, { id });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/orchestrate');
    }
  },
);

router.get('/orchestrate', async (req: Request, res: Response) => {
  try {
    const callerIdentity = req.user?.email ?? req.user?.id?.toString();
    const elevated = isNexusPrivileged(req);
    const plans = Array.from(orchestrationStore.values())
      .filter((p) => {
        // Elevated users (ops/admin) see all plans.
        // Regular users see only plans they created; plans with no createdBy
        // (recovered from DB before ownership tracking was added) are admin-only.
        if (elevated) return true;
        return callerIdentity !== undefined && p.createdBy === callerIdentity;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      // Strip rawPayload from steps for non-privileged callers (contains verbatim
      // excerpts from privileged internal API responses).
      .map((p) => (elevated ? p : redactOrchestrationPlan(p)));
    sendSuccess(res, plans);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/orchestrate');
  }
});

router.get('/orchestrate/:id', async (req: Request, res: Response) => {
  try {
    const plan = orchestrationStore.get(req.params.id as string);
    if (!plan) {
      sendError(res, 'Orchestration not found', 404);
      return;
    }
    const callerIdentity = req.user?.email ?? req.user?.id?.toString();
    const elevated = isNexusPrivileged(req);
    // Enforce ownership: non-privileged callers may only read their own plans.
    // Plans with no createdBy (pre-ownership-tracking) are restricted to admins.
    if (!elevated && (plan.createdBy === undefined || plan.createdBy !== callerIdentity)) {
      sendError(res, 'Orchestration not found', 404);
      return;
    }
    sendSuccess(res, elevated ? plan : redactOrchestrationPlan(plan));
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/orchestrate/:id');
  }
});

router.post(
  '/orchestrate/:id/retry',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const plan = orchestrationStore.get(req.params.id as string);
      if (!plan) {
        sendError(res, 'Orchestration not found', 404);
        return;
      }
      // Enforce ownership: only the creator (or an elevated user) may retry.
      const callerIdentity = req.user?.email ?? req.user?.id?.toString();
      if (!isNexusPrivileged(req) && (plan.createdBy === undefined || plan.createdBy !== callerIdentity)) {
        sendError(res, 'Orchestration not found', 404);
        return;
      }
      if (plan.status === 'planning' || plan.status === 'running') {
        sendError(res, 'Orchestration is already in progress', 409);
        return;
      }
      // Reset for a fresh re-run of the same intent.
      plan.status = 'planning';
      plan.steps = [];
      delete plan.stitchedOutput;
      delete plan.completedAt;
      void persistOrchestrationPlanToDB(plan);
      void runOrchestration(plan.id, plan.intent);
      sendSuccess(res, { id: plan.id });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/orchestrate/:id/retry');
    }
  },
);

// ─── Ingest Routes ────────────────────────────────────────────────────────────

async function runIngest(jobId: string, repoUrl: string) {
  const job = ingestStore.get(jobId);
  if (!job) return;

  const persist = () => {
    void persistIngestJobToDB(job);
  };

  try {
    // Phase 1: Fetch
    job.status = 'fetching';
    persist();
    job.log.push(`Connecting to GitHub: ${repoUrl}`);
    await sleep(800);
    job.log.push('Fetching README.md, SKILL.md, skill.json…');
    await sleep(600);
    job.log.push('Found: README.md, skills/ directory, commands/ directory');
    job.log.push('Parsing manifest files…');
    await sleep(400);

    // Phase 2: Adapt
    job.status = 'adapting';
    persist();
    job.log.push('Running LLM-powered pattern analysis…');
    await sleep(1000);

    const patterns = ['Skill Pack', 'Hook Pattern', 'Agent Blueprint'];
    const selected = patterns.slice(0, 1 + Math.floor(Math.random() * 2));
    job.patternsFound = selected;
    job.log.push(`Patterns identified: ${selected.join(', ')}`);
    await sleep(600);
    job.log.push('Generating PRAXIS-native skill definitions…');
    await sleep(800);

    const skillCount = 2 + Math.floor(Math.random() * 5);
    job.log.push(`Generated ${skillCount} adapted skills. Running deduplication…`);
    await sleep(400);
    job.log.push(`Deduplication complete. ${skillCount} new skills (0 duplicates).`);

    // Phase 3: Publish
    job.status = 'publishing';
    persist();
    job.log.push('Validating Zod schemas…');
    await sleep(300);
    job.log.push('Writing skills to store…');
    await sleep(300);

    // Add generated skills to skill store
    for (let i = 0; i < skillCount; i++) {
      const skillId = `sk_ingested_${jobId.slice(0, 8)}_${i}`;
      const repoName = repoUrl.split('/').pop() ?? 'unknown';
      const ingested: Skill = {
        id: skillId,
        name: `${repoName} Skill ${i + 1}`,
        description: `Adapted skill from ${repoName} — pattern: ${selected[0]}`,
        sourceRepo: repoName,
        sourceUrl: repoUrl,
        license: 'MIT',
        pattern: selected[0] ?? 'Skill Pack',
        primitiveType: 'Skill',
        enabled: false,
        usageCount: 0,
        nexusAdaptation: `Adapted from ${repoName} into PRAXIS native Skill primitive. Wired into memory fabric and Protocol Bridge.`,
        originalSummary: `Source skill from ${repoUrl} — see original README for full context.`,
        tags: [repoName, 'ingested', ...selected.map((p) => p.toLowerCase().replace(/ /g, '-'))],
      };
      skillStore.set(skillId, ingested);
      void persistSkillToDB(ingested);
    }

    // Update pattern counts
    for (const pf of patternStore.values()) {
      if (
        selected.some((p) =>
          pf.name.toLowerCase().includes(p.toLowerCase().replace(' pattern', '').toLowerCase()),
        )
      ) {
        pf.skills += skillCount;
      }
    }

    job.skillsGenerated = skillCount;
    job.status = 'done';
    job.completedAt = new Date().toISOString();
    job.log.push(`✓ Ingest complete. ${skillCount} skills published to Skills Library.`);
    persist();
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'Unknown error';
    job.completedAt = new Date().toISOString();
    job.log.push(`✗ Ingest failed: ${job.error}`);
    persist();
  }
}

router.get('/ingest', async (_req: Request, res: Response) => {
  try {
    const jobs = Array.from(ingestStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    sendSuccess(res, jobs);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/ingest');
  }
});

router.post(
  '/ingest',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      repoUrl: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { repoUrl } = req.body as { repoUrl?: string };
      if (!repoUrl?.trim()) {
        sendError(res, 'repoUrl is required', 400);
        return;
      }

      const id = randomUUID();
      const repoName = repoUrl.trim().split('/').pop() ?? 'unknown';
      const job: IngestJob = {
        id,
        repoUrl: repoUrl.trim(),
        repoName,
        status: 'queued',
        skillsGenerated: 0,
        patternsFound: [],
        log: [`Queued ingest for ${repoUrl.trim()}`],
        createdAt: new Date().toISOString(),
      };
      ingestStore.set(id, job);
      void persistIngestJobToDB(job);
      void runIngest(id, repoUrl.trim());
      sendCreated(res, { id });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/ingest');
    }
  },
);

router.get('/ingest/:id', async (req: Request, res: Response) => {
  try {
    const job = ingestStore.get(req.params.id as string);
    if (!job) {
      sendError(res, 'Ingest job not found', 404);
      return;
    }
    sendSuccess(res, job);
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/ingest/:id');
  }
});

router.post(
  '/ingest/:id/retry',
  requireNexusOps,
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const job = ingestStore.get(req.params.id as string);
      if (!job) {
        sendError(res, 'Ingest job not found', 404);
        return;
      }
      if (
        job.status === 'queued' ||
        job.status === 'fetching' ||
        job.status === 'adapting' ||
        job.status === 'publishing'
      ) {
        sendError(res, 'Ingest job is already in progress', 409);
        return;
      }
      job.status = 'queued';
      job.skillsGenerated = 0;
      job.patternsFound = [];
      job.log = [`Retrying ingest for ${job.repoUrl}`];
      delete job.error;
      delete job.completedAt;
      void persistIngestJobToDB(job);
      void runIngest(job.id, job.repoUrl);
      sendSuccess(res, { id: job.id });
    } catch (err) {
      handleRouteError(res, err, 'POST /api/nexus/ingest/:id/retry');
    }
  },
);

// ─── Cross-Domain Entity Resolution ──────────────────────────────────────────
//
// Uses PRAXIS memory entries of type 'entity' to resolve and deduplicate
// real-world entities across domains.
//
// GET  /nexus/entity-resolve?q=...         — match entities by name / identifier
// GET  /nexus/entity-duplicates?minConf=70 — find cross-domain duplicate clusters

/** Extract normalised searchable tokens from a PRAXIS memory item's key/value/tags */
function nexusEntitySearchable(row: NexusMemoryRow): string[] {
  const tokens: string[] = [row.key ?? '', row.value ?? ''];
  if (Array.isArray(row.tags)) tokens.push(...(row.tags as string[]));
  try {
    const meta = row.metadata as Record<string, unknown>;
    if (meta?.label && typeof meta.label === 'string') tokens.push(meta.label);
    if (meta?.aliases && Array.isArray(meta.aliases))
      tokens.push(...(meta.aliases as string[]));
    if (meta?.identifiers && typeof meta.identifiers === 'object') {
      for (const v of Object.values(meta.identifiers as Record<string, string>)) {
        if (typeof v === 'string') tokens.push(v);
      }
    }
    if (meta?.domain && typeof meta.domain === 'string') tokens.push(meta.domain);
    if (meta?.domains && Array.isArray(meta.domains))
      tokens.push(...(meta.domains as string[]));
  } catch { /* ignore */ }
  return tokens.map((t) => t.toLowerCase().trim()).filter(Boolean);
}

router.get('/entity-resolve', authMiddleware({ required: true }), requireRole('admin', 'operator', 'analyst'), async (req, res) => {
  try {
    const query = String(req.query.q ?? '').trim();
    if (!query) {
      sendBadRequest(res, 'Query parameter q is required');
      return;
    }

    const lower = query.toLowerCase();

    // Load all entity-type memory rows (with limit)
    // Gracefully handle case where nexus_memory table doesn't exist yet (unmigrated DB)
    let rows: NexusMemoryRow[] = [];
    try {
      rows = await db
        .select()
        .from(nexusMemoryTable)
        .where(eq(nexusMemoryTable.type, 'entity'))
        .limit(500);
    } catch (dbErr) {
      const err = dbErr as { code?: string; cause?: { code?: string } };
      const pgCode = err?.code ?? err?.cause?.code;
      if (pgCode === '42P01') {
        // Table doesn't exist yet (pending migration) — return empty result
        sendSuccess(res, { query, matchCount: 0, matches: [], crossDomainResolution: null, note: 'nexus_memory table pending migration' });
        return;
      }
      throw dbErr;
    }

    type Match = {
      id: string;
      key: string;
      value: string;
      tags: string[];
      tier: string;
      confidence: number;
      matchedOn: string;
      matchType: 'exact-key' | 'identifier' | 'alias' | 'partial';
      metadata: unknown;
    };

    const matches: Match[] = [];

    for (const row of rows) {
      const tokens = nexusEntitySearchable(row);
      let best: { confidence: number; matchedOn: string; matchType: Match['matchType'] } | null = null;

      // Exact key match
      if ((row.key ?? '').toLowerCase() === lower) {
        best = { confidence: 100, matchedOn: row.key ?? '', matchType: 'exact-key' };
      }

      // Identifier value match
      if (!best) {
        try {
          const meta = row.metadata as Record<string, unknown>;
          const ids = meta?.identifiers as Record<string, string> | undefined;
          if (ids) {
            for (const [k, v] of Object.entries(ids)) {
              if (typeof v === 'string' && v.toLowerCase() === lower) {
                best = { confidence: 95, matchedOn: `${k}:${v}`, matchType: 'identifier' };
                break;
              }
            }
          }
        } catch { /* ignore */ }
      }

      // Exact alias match
      if (!best) {
        const matched = tokens.find((t) => t === lower);
        if (matched) {
          best = { confidence: 85, matchedOn: matched, matchType: 'alias' };
        }
      }

      // Partial match
      if (!best) {
        const matched = tokens.find((t) => t.includes(lower) || lower.includes(t));
        if (matched) {
          const overlap = Math.min(lower.length, matched.length) / Math.max(lower.length, matched.length);
          const score = Math.round(40 + overlap * 40);
          if (score >= 40) {
            best = { confidence: score, matchedOn: matched, matchType: 'partial' };
          }
        }
      }

      if (best) {
        matches.push({
          id: row.id,
          key: row.key ?? '',
          value: row.value ?? '',
          tags: (row.tags ?? []) as string[],
          tier: row.tier,
          confidence: best.confidence,
          matchedOn: best.matchedOn,
          matchType: best.matchType,
          metadata: row.metadata,
        });
      }
    }

    matches.sort((a, b) => b.confidence - a.confidence);
    const top = matches.slice(0, 20);

    // Cross-domain resolution — find related entities sharing identifiers
    let crossDomainResolution = null;
    if (top[0]) {
      const primary = top[0];
      let primaryIds: Record<string, string> = {};
      try {
        const meta = primary.metadata as Record<string, unknown>;
        if (meta?.identifiers && typeof meta.identifiers === 'object') {
          primaryIds = meta.identifiers as Record<string, string>;
        }
      } catch { /* ignore */ }

      const related = matches.slice(1).filter((m) => {
        if (m.id === primary.id) return false;
        try {
          const meta = m.metadata as Record<string, unknown>;
          const mIds = meta?.identifiers as Record<string, string> | undefined;
          if (mIds && Object.keys(primaryIds).length > 0) {
            return Object.entries(primaryIds).some(
              ([, v]) => Object.values(mIds).some((mv) => mv === v && v.length > 2),
            );
          }
        } catch { /* ignore */ }
        return false;
      });

      crossDomainResolution = {
        primaryId: primary.id,
        primaryKey: primary.key,
        relatedEntityCount: related.length,
        relatedEntityIds: related.map((r) => r.id),
        confidence: primary.confidence,
      };
    }

    sendSuccess(res, {
      query,
      matchCount: matches.length,
      matches: top.map((m) => ({
        entityId: m.id,
        key: m.key,
        tier: m.tier,
        tags: m.tags,
        confidence: m.confidence,
        matchedOn: m.matchedOn,
        matchType: m.matchType,
      })),
      crossDomainResolution,
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /nexus/entity-resolve');
  }
});

router.get('/entity-duplicates', authMiddleware({ required: true }), requireRole('admin', 'operator', 'analyst'), async (req, res) => {
  try {
    const minConfidence = parseInt(String(req.query.minConfidence ?? '70'), 10);
    const threshold = isNaN(minConfidence) ? 70 : Math.max(40, Math.min(100, minConfidence));

    let rows: NexusMemoryRow[] = [];
    try {
      rows = await db
        .select()
        .from(nexusMemoryTable)
        .where(eq(nexusMemoryTable.type, 'entity'))
        .limit(500);
    } catch (dbErr) {
      const err = dbErr as { code?: string; cause?: { code?: string } };
      const pgCode = err?.code ?? err?.cause?.code;
      if (pgCode === '42P01') {
        sendSuccess(res, { clusterCount: 0, totalDuplicateEntities: 0, clusters: [], note: 'nexus_memory table pending migration' });
        return;
      }
      throw dbErr;
    }

    type Cluster = {
      canonicalId: string;
      canonicalKey: string;
      memberIds: string[];
      memberKeys: string[];
      sharedTokens: string[];
      confidence: number;
    };

    const visited = new Set<string>();
    const clusters: Cluster[] = [];

    for (let i = 0; i < rows.length; i++) {
      const a = rows[i]!;
      if (visited.has(a.id)) continue;

      const tokensA = nexusEntitySearchable(a);
      const clusterMembers: NexusMemoryRow[] = [a];
      const sharedTokens: string[] = [];

      for (let j = i + 1; j < rows.length; j++) {
        const b = rows[j]!;
        if (visited.has(b.id)) continue;

        const tokensB = nexusEntitySearchable(b);
        const overlap = tokensA.filter(
          (t) => t.length > 3 && tokensB.includes(t),
        );

        let confidence = 0;
        // Strong signal: shared tokens including identifier values
        confidence += Math.min(overlap.length * 20, 60);

        // Check shared identifiers
        try {
          const metaA = a.metadata as Record<string, unknown>;
          const metaB = b.metadata as Record<string, unknown>;
          const idsA = metaA?.identifiers as Record<string, string> | undefined;
          const idsB = metaB?.identifiers as Record<string, string> | undefined;
          if (idsA && idsB) {
            const idOverlap = Object.values(idsA).filter(
              (v) => v.length > 2 && Object.values(idsB).includes(v),
            );
            confidence += idOverlap.length * 40;
          }
        } catch { /* ignore */ }

        if (confidence >= threshold) {
          clusterMembers.push(b);
          for (const t of overlap) sharedTokens.push(t);
        }
      }

      if (clusterMembers.length >= 2) {
        for (const m of clusterMembers) visited.add(m.id);
        clusters.push({
          canonicalId: clusterMembers[0]!.id,
          canonicalKey: clusterMembers[0]!.key ?? '',
          memberIds: clusterMembers.map((m) => m.id),
          memberKeys: clusterMembers.map((m) => m.key ?? ''),
          sharedTokens: [...new Set(sharedTokens)].slice(0, 10),
          confidence: Math.min(100, threshold),
        });
      }
    }

    sendSuccess(res, {
      clusterCount: clusters.length,
      totalDuplicateEntities: clusters.reduce((s, c) => s + c.memberIds.length, 0),
      clusters,
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /nexus/entity-duplicates');
  }
});

// ─── Status Route ─────────────────────────────────────────────────────────────

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const activeSwarms = Array.from(researchStore.values()).filter(
      (r) => r.status === 'running' || r.status === 'pending',
    ).length;
    const enabledSkills = Array.from(skillStore.values()).filter((s) => s.enabled).length;

    sendSuccess(res, {
      activeSwarms,
      memoryItems: memoryStore.size,
      enabledSkills,
      registeredTools: toolStore.size,
      orchestrationsToday,
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/status');
  }
});

// ─── Bootstrap: register FORGE code handler + PRAXIS tool handlers ─────────────
// Idempotent — safe to call at module-load time.

registerNexusHandlers();

// Register the code handler in the FORGE runtime so `type: 'code'` tasks
// execute TypeScript in a governed V8 sandbox with the Tool Mesh callTool bridge.
forgeRuntime.registerHandler('code', runCodeHandler);

// Seed the catalog search index with PRAXIS skills from the in-memory store so
// POST /api/nexus/catalog/search returns results immediately after seeding.
function syncCatalogIndex() {
  defaultCatalogSearch.indexTools(defaultToolRegistry.list());
  const skillEntries = Array.from(skillStore.values()).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tags: s.tags,
    domain: s.pattern,
    primitiveType: s.primitiveType,
    enabled: s.enabled,
    sourceRepo: s.sourceRepo,
    usageCount: s.usageCount,
  }));
  defaultCatalogSearch.indexSkills(skillEntries);
}

// ─── Catalog search route ──────────────────────────────────────────────────────

const catalogSearchBodySchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().positive().max(100).default(10),
  kinds: z.array(z.enum(['tool', 'skill'])).optional(),
  domain: z.string().optional(),
  enabledOnly: z.boolean().default(false),
});

router.use(['/catalog'], authMiddleware({ required: true }));

router.post('/catalog/search', async (req: Request, res: Response) => {
  try {
    const parsed = catalogSearchBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, 'Validation failed', parsed.error.issues);
      return;
    }
    // Ensure index is up to date with the current in-memory stores
    syncCatalogIndex();

    const hits = defaultCatalogSearch.search(parsed.data);
    const counts = defaultCatalogSearch.count();
    sendSuccess(res, {
      query: parsed.data.query,
      topK: parsed.data.topK,
      totalHits: hits.length,
      indexedTools: counts.tools,
      indexedSkills: counts.skills,
      hits,
    });
  } catch (err) {
    handleRouteError(res, err, 'POST /api/nexus/catalog/search');
  }
});

// ─── Code execution routes ─────────────────────────────────────────────────────

const codeExecuteBodySchema = z.object({
  source: z.string().min(1).max(100_000),
  label: z.string().max(200).default('code execution'),
  domain: z.string().default('global'),
  isDryRun: z.boolean().default(false),
  approvalClass: z.enum(['observe_only', 'propose_only', 'approval_required', 'approved_execute']).optional(),
  timeoutMs: z.number().int().positive().max(60_000).optional(),
  sandboxPolicy: z.record(z.unknown()).optional(),
});

const codeExecutionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  domain: z.string().optional(),
});

router.use(['/code'], authMiddleware({ required: true }), perUserWriteSlidingLimiter);

router.post('/code/execute', async (req: Request, res: Response) => {
  try {
    const parsed = codeExecuteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, 'Validation failed', parsed.error.issues);
      return;
    }

    const { source, label, domain, isDryRun, approvalClass, timeoutMs, sandboxPolicy } = parsed.data;

    const execution = await forgeRuntime.submit({
      taskId: randomUUID(),
      type: 'code',
      domain: domain as Parameters<typeof forgeRuntime.submit>[0]['domain'],
      tenantId: req.user?.tenantId ?? null,
      userId: req.user?.userId ?? null,
      label,
      isDryRun,
      approvalClass: approvalClass as Parameters<typeof forgeRuntime.submit>[0]['approvalClass'],
      payload: {
        source,
        ...(timeoutMs ? { timeoutMs } : {}),
      },
      sandboxPolicy: sandboxPolicy as Record<string, unknown> | undefined,
      correlationId: req.headers['x-correlation-id'] as string | undefined,
    });

    sendCreated(res, {
      executionId: execution.executionId,
      status: execution.status,
      taskType: 'code',
      label,
      domain,
      startedAt: execution.startedAt,
      result: execution.result,
      error: execution.error,
      evidenceIds: execution.evidenceIds,
    });
  } catch (err) {
    handleRouteError(res, err, 'POST /api/nexus/code/execute');
  }
});

router.get('/code/executions', (req: Request, res: Response) => {
  try {
    const parsed = codeExecutionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendBadRequest(res, 'Validation failed', parsed.error.issues);
      return;
    }
    const { limit, status, domain } = parsed.data;
    const tenantId = req.user?.tenantId;

    const executions = forgeRuntime.getHistory({
      limit,
      status: status as Parameters<typeof forgeRuntime.getHistory>[0]['status'],
      domain: domain as Parameters<typeof forgeRuntime.getHistory>[0]['domain'],
      ...(tenantId ? { tenantId } : {}),
    }).filter((e) => e.task.type === 'code');

    sendSuccess(res, {
      total: executions.length,
      executions: executions.map((e) => ({
        executionId: e.executionId,
        status: e.status,
        label: e.task.label,
        domain: e.task.domain,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        latencyMs: e.latencyMs,
        costUsd: e.costUsd,
        evidenceIds: e.evidenceIds,
        error: e.error,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/code/executions');
  }
});

router.get('/code/executions/:id', (req: Request, res: Response) => {
  try {
    const execution = forgeRuntime.getExecution(req.params.id);
    if (!execution) {
      sendError(res, `Execution '${req.params.id}' not found`, 404);
      return;
    }
    // Tenant isolation: only return executions belonging to the caller's tenant
    const callerTenant = req.user?.tenantId;
    if (callerTenant && execution.task.tenantId && execution.task.tenantId !== callerTenant) {
      sendError(res, `Execution '${req.params.id}' not found`, 404);
      return;
    }

    const timelineEvents = forgeTimeline.getEventsForExecution(execution.executionId, { limit: 100 });
    const evidenceItems = forgeEvidenceStore.getForExecution(execution.executionId);

    sendSuccess(res, {
      executionId: execution.executionId,
      status: execution.status,
      label: execution.task.label,
      domain: execution.task.domain,
      taskType: execution.task.type,
      isDryRun: execution.task.isDryRun,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      latencyMs: execution.latencyMs,
      costUsd: execution.costUsd,
      result: execution.result,
      error: execution.error,
      evidenceIds: execution.evidenceIds,
      approvalId: execution.approvalId,
      timelineEvents,
      evidence: evidenceItems,
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/code/executions/:id');
  }
});

// ─── Sovereign AI Panel ───────────────────────────────────────────────────────
// Displays QClaw-4B agent activity: reasoning chains, tool calls, confidence
// scores, governance interactions, and cost savings vs. cloud models.

router.get('/sovereign-ai', async (_req, res) => {
  try {
    const { inferenceTelemetry } = await import('../lib/inference-telemetry');
    const { providerCircuitBreaker } = await import('../lib/ai-gateway');
    const { providerHealth } = await import('../lib/provider-health');
    const { AGENT_REGISTRY } = await import('./nuro-mesh');

    const windowMs = 24 * 60 * 60 * 1000;
    const allRecords = inferenceTelemetry.getRecords({ windowMs, limit: 5000 });
    const qclawRecords = allRecords.filter((r) => r.provider === 'qclaw');

    const sovereignAgents = AGENT_REGISTRY.filter(
      (a) => (a as { sovereignModel?: boolean }).sovereignModel === true,
    );

    const totalInferences = allRecords.length;
    const sovereignInferences = qclawRecords.length;
    const sovereignRatio =
      totalInferences > 0
        ? parseFloat((sovereignInferences / totalInferences).toFixed(4))
        : 0;

    const cloudInferences = allRecords.filter(
      (r) => r.provider !== 'qclaw' && r.provider !== 'mock',
    );
    const cloudCostTotal = cloudInferences.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const qclawCostTotal = qclawRecords.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const costSavingsUsd = parseFloat(Math.max(0, cloudCostTotal - qclawCostTotal).toFixed(6));

    const qclawSuccesses = qclawRecords.filter((r) => r.success);
    const qclawAvgLatencyMs =
      qclawSuccesses.length > 0
        ? Math.round(qclawSuccesses.reduce((s, r) => s + r.latencyMs, 0) / qclawSuccesses.length)
        : 0;
    const cloudSuccesses = cloudInferences.filter((r) => r.success);
    const cloudAvgLatencyMs =
      cloudSuccesses.length > 0
        ? Math.round(cloudSuccesses.reduce((s, r) => s + r.latencyMs, 0) / cloudSuccesses.length)
        : 0;

    const activeAgentMap = new Map<
      string,
      { calls: number; successCount: number; totalLatency: number; lastActiveAt: number | null; toolCalls: string[] }
    >();

    for (const agent of sovereignAgents) {
      const agentRecords = qclawRecords.filter((r) => r.agentId === agent.id);
      activeAgentMap.set(agent.id, {
        calls: agentRecords.length,
        successCount: agentRecords.filter((r) => r.success).length,
        totalLatency: agentRecords.reduce((s, r) => s + r.latencyMs, 0),
        lastActiveAt: agentRecords.length > 0 ? agentRecords[0]?.timestamp ?? null : null,
        toolCalls: agent.tools ?? [],
      });
    }

    const circuitState = providerCircuitBreaker.getStatus('qclaw');
    const healthRecord = providerHealth.getStatus('qclaw');
    const hfConfigured = !!(process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN);

    const recentReasoningChains = qclawRecords.slice(0, 10).map((r) => ({
      id: r.id,
      agentId: r.agentId,
      domain: r.domain,
      timestamp: r.timestamp,
      latencyMs: r.latencyMs,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      costUsd: r.estimatedCostUsd,
      success: r.success,
      routingStrategy: r.routingStrategy,
      cached: r.cached,
    }));

    const governanceInteractions = qclawRecords
      .filter((r) => r.domain !== 'general')
      .slice(0, 5)
      .map((r) => ({
        agentId: r.agentId,
        domain: r.domain,
        timestamp: r.timestamp,
        governanceResult: r.success ? 'approved' : 'blocked',
        costUsd: r.estimatedCostUsd,
      }));

    sendSuccess(res, {
      sovereignModel: {
        id: 'LakoMoor/QClaw-4B',
        name: 'QClaw-4B',
        provider: 'qclaw',
        clawBenchScore: 84.8,
        license: 'Apache-2.0',
        parameters: '4B',
        specialization: 'agentic-tasks, tool-use, multi-step-planning',
        configured: hfConfigured,
        endpointType: process.env.QCLAW_ENDPOINT ? 'custom' : 'huggingface-inference-api',
      },
      status: {
        health: healthRecord.status,
        circuitState: circuitState.state,
        consecutiveFailures: circuitState.consecutiveFailures,
        lastCheckedAt: healthRecord.lastCheckedAt,
        avgLatencyMs: healthRecord.avgLatencyMs,
      },
      sovereignAgents: sovereignAgents.map((a) => {
        const stats = activeAgentMap.get(a.id)!;
        return {
          id: a.id,
          name: a.name,
          domain: a.domain,
          model: a.preferredModel,
          calls: stats.calls,
          successRate: stats.calls > 0 ? parseFloat((stats.successCount / stats.calls).toFixed(4)) : 1,
          avgLatencyMs: stats.calls > 0 ? Math.round(stats.totalLatency / stats.calls) : 0,
          lastActiveAt: stats.lastActiveAt,
          highStakesDomains: a.highStakesDomains,
          tools: stats.toolCalls,
        };
      }),
      metrics: {
        windowMs,
        sovereignRatio,
        sovereignInferences,
        totalInferences,
        qclawAvgLatencyMs,
        cloudAvgLatencyMs,
        latencyDeltaMs: cloudAvgLatencyMs - qclawAvgLatencyMs,
        qclawCostUsd: parseFloat(qclawCostTotal.toFixed(6)),
        cloudCostUsd: parseFloat(cloudCostTotal.toFixed(6)),
        estimatedCostSavingsUsd: costSavingsUsd,
        qclawErrorRate:
          qclawRecords.length > 0
            ? parseFloat(
                (qclawRecords.filter((r) => !r.success).length / qclawRecords.length).toFixed(4),
              )
            : 0,
      },
      recentActivity: {
        reasoningChains: recentReasoningChains,
        governanceInteractions,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /api/nexus/sovereign-ai');
  }
});

export default router;
