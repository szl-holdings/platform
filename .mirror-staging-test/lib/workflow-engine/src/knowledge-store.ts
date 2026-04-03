import { logger } from "./logger.js";
import { db, agentKnowledgeTable, agentRunsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

export type KnowledgeEntryType =
  | "observation"
  | "alert"
  | "insight"
  | "metric"
  | "correlation"
  | "recommendation"
  | "anomaly"
  | "trend";

export type KnowledgeDomain =
  | "vessels"
  | "firestorm"
  | "lyte"
  | "inca"
  | "dreamscape"
  | "terra"
  | "msp"
  | "readiness-report"
  | "global";

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeEntryType;
  domain: KnowledgeDomain;
  sourceAgent: string;
  title: string;
  summary: string;
  data?: Record<string, unknown>;
  confidence: number;
  tags: string[];
  relatedEntryIds: string[];
  timestamp: number;
  expiresAt?: number;
}

export interface KnowledgeQuery {
  domain?: KnowledgeDomain | KnowledgeDomain[];
  type?: KnowledgeEntryType | KnowledgeEntryType[];
  sourceAgent?: string;
  tags?: string[];
  since?: number;
  limit?: number;
  minConfidence?: number;
}

const MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class KnowledgeStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private entryOrder: string[] = [];
  private loaded = false;

  async loadFromDb(): Promise<void> {
    if (this.loaded) return;
    try {
      const now = Date.now();
      const rows = await db
        .select()
        .from(agentKnowledgeTable)
        .where(
          sql`(${agentKnowledgeTable.expiresAt} IS NULL OR ${agentKnowledgeTable.expiresAt} > ${now})`
        )
        .orderBy(desc(agentKnowledgeTable.timestamp))
        .limit(MAX_ENTRIES);

      for (const row of [...rows].reverse()) {
        const entry: KnowledgeEntry = {
          id: row.entryId,
          type: row.type as KnowledgeEntryType,
          domain: row.domain as KnowledgeDomain,
          sourceAgent: row.sourceAgent,
          title: row.title,
          summary: row.summary,
          confidence: row.confidence,
          tags: row.tags ?? [],
          relatedEntryIds: row.relatedEntryIds ?? [],
          data: (row.data as Record<string, unknown>) ?? undefined,
          timestamp: row.timestamp,
          expiresAt: row.expiresAt ?? undefined,
        };
        this.entries.set(entry.id, entry);
        this.entryOrder.push(entry.id);
      }
      this.loaded = true;
      logger.info({ count: rows.length }, "Knowledge store loaded from DB");
    } catch (err) {
      logger.error({ err }, "Failed to load knowledge store from DB, starting empty");
      this.loaded = true;
    }
  }

  write(entry: Omit<KnowledgeEntry, "id" | "timestamp"> & { id?: string; timestamp?: number }): KnowledgeEntry {
    const id = entry.id ?? `ke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = entry.timestamp ?? Date.now();
    const full: KnowledgeEntry = {
      ...entry,
      id,
      timestamp,
      relatedEntryIds: entry.relatedEntryIds ?? [],
      tags: entry.tags ?? [],
    };

    this.entries.set(id, full);
    this.entryOrder.push(id);

    if (this.entryOrder.length > MAX_ENTRIES) {
      const oldest = this.entryOrder.shift();
      if (oldest) this.entries.delete(oldest);
    }

    this.pruneExpired();

    db.insert(agentKnowledgeTable).values({
      entryId: full.id,
      type: full.type,
      domain: full.domain,
      sourceAgent: full.sourceAgent,
      title: full.title,
      summary: full.summary,
      confidence: full.confidence,
      tags: full.tags,
      relatedEntryIds: full.relatedEntryIds,
      data: full.data ?? null,
      timestamp: full.timestamp,
      expiresAt: full.expiresAt ?? null,
    }).onConflictDoUpdate({
      target: agentKnowledgeTable.entryId,
      set: {
        title: full.title,
        summary: full.summary,
        confidence: full.confidence,
        tags: full.tags,
        data: full.data ?? null,
        expiresAt: full.expiresAt ?? null,
      },
    }).catch(err => {
      logger.error({ err, entryId: full.id }, "Failed to persist knowledge entry to DB");
    });

    logger.debug({ id, domain: full.domain, type: full.type, sourceAgent: full.sourceAgent }, "Knowledge entry written");
    return full;
  }

  query(q: KnowledgeQuery = {}): KnowledgeEntry[] {
    this.pruneExpired();

    const domains = q.domain ? (Array.isArray(q.domain) ? q.domain : [q.domain]) : null;
    const types = q.type ? (Array.isArray(q.type) ? q.type : [q.type]) : null;
    const since = q.since ?? 0;
    const minConf = q.minConfidence ?? 0;

    const results: KnowledgeEntry[] = [];
    for (const id of [...this.entryOrder].reverse()) {
      const e = this.entries.get(id);
      if (!e) continue;
      if (domains && !domains.includes(e.domain)) continue;
      if (types && !types.includes(e.type)) continue;
      if (q.sourceAgent && e.sourceAgent !== q.sourceAgent) continue;
      if (e.timestamp < since) continue;
      if (e.confidence < minConf) continue;
      if (q.tags && q.tags.length > 0 && !q.tags.some(t => e.tags.includes(t))) continue;
      results.push(e);
      if (q.limit && results.length >= q.limit) break;
    }
    return results;
  }

  getById(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  getStats() {
    this.pruneExpired();
    const domains: Record<string, number> = {};
    const types: Record<string, number> = {};
    for (const e of this.entries.values()) {
      domains[e.domain] = (domains[e.domain] ?? 0) + 1;
      types[e.type] = (types[e.type] ?? 0) + 1;
    }
    return {
      totalEntries: this.entries.size,
      byDomain: domains,
      byType: types,
      oldestEntry: this.entryOrder[0] ? this.entries.get(this.entryOrder[0])?.timestamp : undefined,
      newestEntry: this.entryOrder.length > 0
        ? this.entries.get(this.entryOrder[this.entryOrder.length - 1])?.timestamp
        : undefined,
    };
  }

  private pruneExpired() {
    const now = Date.now();
    const toRemove: string[] = [];
    for (const [id, e] of this.entries) {
      if (e.expiresAt && e.expiresAt < now) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.entries.delete(id);
      const idx = this.entryOrder.indexOf(id);
      if (idx !== -1) this.entryOrder.splice(idx, 1);
    }
  }

  findCorrelations(entry: KnowledgeEntry, windowMs = 3600000): KnowledgeEntry[] {
    const windowStart = entry.timestamp - windowMs;
    const candidates = this.query({ since: windowStart, minConfidence: 0.5 });
    return candidates.filter(e => {
      if (e.id === entry.id || e.domain === entry.domain) return false;
      const sharedTags = e.tags.filter(t => entry.tags.includes(t));
      return sharedTags.length > 0;
    });
  }
}

export const knowledgeStore = new KnowledgeStore();

export function createKnowledgeEntry(
  params: {
    type: KnowledgeEntryType;
    domain: KnowledgeDomain;
    sourceAgent: string;
    title: string;
    summary: string;
    confidence?: number;
    tags?: string[];
    data?: Record<string, unknown>;
    ttlMs?: number;
  }
): KnowledgeEntry {
  return knowledgeStore.write({
    type: params.type,
    domain: params.domain,
    sourceAgent: params.sourceAgent,
    title: params.title,
    summary: params.summary,
    confidence: params.confidence ?? 0.8,
    tags: params.tags ?? [],
    data: params.data,
    relatedEntryIds: [],
    expiresAt: params.ttlMs ? Date.now() + params.ttlMs : Date.now() + DEFAULT_TTL_MS,
  });
}

export async function persistAgentRun(record: {
  runId: string;
  agentId: string;
  domain: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  summary?: string;
  error?: string;
  knowledgeEntryIds: string[];
  eventsPublished: string[];
}): Promise<void> {
  try {
    await db.insert(agentRunsTable).values({
      runId: record.runId,
      agentId: record.agentId,
      domain: record.domain,
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt ?? null,
      durationMs: record.durationMs ?? null,
      summary: record.summary ?? null,
      error: record.error ?? null,
      knowledgeEntryIds: record.knowledgeEntryIds,
      eventsPublished: record.eventsPublished,
    }).onConflictDoUpdate({
      target: agentRunsTable.runId,
      set: {
        status: record.status,
        completedAt: record.completedAt ?? null,
        durationMs: record.durationMs ?? null,
        summary: record.summary ?? null,
        error: record.error ?? null,
        knowledgeEntryIds: record.knowledgeEntryIds,
        eventsPublished: record.eventsPublished,
      },
    });
  } catch (err) {
    logger.error({ err, runId: record.runId }, "Failed to persist agent run to DB");
  }
}
