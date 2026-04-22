/**
 * A2A Agent Registry — Agent Card persistence and discovery service.
 *
 * Each agent publishes an "Agent Card" describing its capabilities,
 * I/O schemas, availability, and cost. The registry supports capability-based
 * discovery queries ranked by relevance, enabling agents to find peers
 * without centralized routing logic.
 */

import { a2aAgentCards, a2aAgentHeartbeats, a2aDiscoveryQueries, db } from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { AGENT_REGISTRY, DOMAIN_ROUTING_RULES } from './nuro-mesh.js';
import type { AgentDefinition } from './types.js';

export interface AgentCard {
  agentId: string;
  name: string;
  domain: string;
  version: string;
  description: string;
  capabilities: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  preferredModel: string;
  preferredProvider: string;
  collaboratesWith: string[];
  costPerCallUsd: number;
  avgLatencyMs: number;
  successRate: number;
  status: 'online' | 'offline' | 'degraded' | 'busy';
  lastHeartbeatAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryQuery {
  requestingAgentId?: string;
  capability?: string;
  domain?: string;
  queryText?: string;
  maxResults?: number;
  requireOnline?: boolean;
}

export interface DiscoveryResult {
  agentId: string;
  name: string;
  domain: string;
  capabilities: string[];
  status: string;
  relevanceScore: number;
  costPerCallUsd: number;
  avgLatencyMs: number;
  successRate: number;
  collaboratesWith: string[];
}

const HEARTBEAT_STALE_THRESHOLD_MS = 60_000;

function agentDefinitionToCard(agent: AgentDefinition): Omit<AgentCard, 'lastHeartbeatAt'> {
  const domainKeywords = DOMAIN_ROUTING_RULES[agent.domain] ?? [];
  const capabilities = [...(agent.semanticIntents ?? []), ...domainKeywords.slice(0, 5)]
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 20);

  return {
    agentId: agent.id,
    name: agent.name,
    domain: agent.domain,
    version: '1.0.0',
    description: agent.systemPrompt.split('.')[0]?.trim() ?? agent.name,
    capabilities,
    preferredModel: agent.preferredModel,
    preferredProvider: agent.preferredProvider,
    collaboratesWith: agent.collaboratesWith ?? [],
    costPerCallUsd: 0.002,
    avgLatencyMs: 2500,
    successRate: 0.95,
    status: 'online',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, context: { type: 'string' } },
    },
    outputSchema: {
      type: 'object',
      properties: { response: { type: 'string' }, confidence: { type: 'number' } },
    },
  };
}

function computeRelevanceScore(query: DiscoveryQuery, card: AgentCard): number {
  let score = 0;
  const lower = (query.queryText ?? '').toLowerCase();

  if (query.domain && card.domain === query.domain) {
    score += 0.5;
  }

  if (query.capability) {
    const capLower = query.capability.toLowerCase();
    for (const cap of card.capabilities) {
      if (cap.toLowerCase().includes(capLower) || capLower.includes(cap.toLowerCase())) {
        score += 0.3;
        break;
      }
    }
  }

  if (lower) {
    const queryWords = lower.split(/\s+/).filter((w) => w.length > 2);
    let capMatches = 0;
    for (const cap of card.capabilities) {
      const capLower = cap.toLowerCase();
      if (lower.includes(capLower)) {
        capMatches += capLower.split(' ').length > 1 ? 0.06 : 0.03;
      } else {
        const capWords = capLower.split(/\s+/);
        const overlap = capWords.filter((cw) =>
          queryWords.some((qw) => qw.includes(cw) || cw.includes(qw)),
        ).length;
        if (overlap > 0) capMatches += (overlap / capWords.length) * 0.02;
      }
    }
    score += Math.min(0.5, capMatches);

    if (card.domain && lower.includes(card.domain.replace('_', ' '))) {
      score += 0.1;
    }
  }

  score *= card.successRate;

  return Math.min(1, score);
}

export class A2ARegistryService {
  private initialized = false;

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await this.syncFromAgentRegistry();
    this.initialized = true;
  }

  async syncFromAgentRegistry(): Promise<void> {
    const now = new Date();
    for (const agent of AGENT_REGISTRY) {
      const card = agentDefinitionToCard(agent);
      try {
        await db
          .insert(a2aAgentCards)
          .values({
            agentId: card.agentId,
            name: card.name,
            domain: card.domain,
            version: card.version,
            description: card.description,
            capabilities: card.capabilities,
            inputSchema: card.inputSchema as Record<string, unknown>,
            outputSchema: card.outputSchema as Record<string, unknown>,
            preferredModel: card.preferredModel,
            preferredProvider: card.preferredProvider,
            collaboratesWith: card.collaboratesWith,
            costPerCallUsd: card.costPerCallUsd,
            avgLatencyMs: card.avgLatencyMs,
            successRate: card.successRate,
            status: 'online',
            lastHeartbeatAt: now,
            registeredAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: a2aAgentCards.agentId,
            set: {
              name: card.name,
              domain: card.domain,
              version: card.version,
              description: card.description,
              capabilities: card.capabilities,
              preferredModel: card.preferredModel,
              preferredProvider: card.preferredProvider,
              collaboratesWith: card.collaboratesWith,
              status: 'online',
              lastHeartbeatAt: now,
              updatedAt: now,
            },
          });
      } catch (_err) {
      }
    }
  }

  async registerAgent(card: Omit<AgentCard, 'lastHeartbeatAt'>): Promise<AgentCard> {
    const now = new Date();
    await db
      .insert(a2aAgentCards)
      .values({
        agentId: card.agentId,
        name: card.name,
        domain: card.domain,
        version: card.version,
        description: card.description,
        capabilities: card.capabilities,
        inputSchema: card.inputSchema as Record<string, unknown>,
        outputSchema: card.outputSchema as Record<string, unknown>,
        preferredModel: card.preferredModel,
        preferredProvider: card.preferredProvider,
        collaboratesWith: card.collaboratesWith,
        costPerCallUsd: card.costPerCallUsd,
        avgLatencyMs: card.avgLatencyMs,
        successRate: card.successRate,
        status: card.status,
        lastHeartbeatAt: now,
        registeredAt: now,
        updatedAt: now,
        metadata: card.metadata as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: a2aAgentCards.agentId,
        set: {
          name: card.name,
          domain: card.domain,
          version: card.version,
          description: card.description,
          capabilities: card.capabilities,
          inputSchema: card.inputSchema as Record<string, unknown>,
          outputSchema: card.outputSchema as Record<string, unknown>,
          preferredModel: card.preferredModel,
          preferredProvider: card.preferredProvider,
          collaboratesWith: card.collaboratesWith,
          costPerCallUsd: card.costPerCallUsd,
          avgLatencyMs: card.avgLatencyMs,
          successRate: card.successRate,
          status: card.status,
          lastHeartbeatAt: now,
          updatedAt: now,
          metadata: card.metadata as Record<string, unknown>,
        },
      });

    return { ...card, lastHeartbeatAt: now };
  }

  async getAgentCard(agentId: string): Promise<AgentCard | null> {
    const [row] = await db
      .select()
      .from(a2aAgentCards)
      .where(eq(a2aAgentCards.agentId, agentId))
      .limit(1);

    if (!row) return null;
    return this.rowToCard(row);
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveryResult[]> {
    await this.ensureInitialized();

    const staleThreshold = new Date(Date.now() - HEARTBEAT_STALE_THRESHOLD_MS);

    let rows = await db.select().from(a2aAgentCards);

    if (query.requireOnline !== false) {
      rows = rows.filter(
        (r) =>
          (r.status === 'online' || r.status === 'busy') && r.lastHeartbeatAt >= staleThreshold,
      );
    }

    if (query.domain) {
      const domainRows = rows.filter((r) => r.domain === query.domain);
      if (domainRows.length > 0) rows = domainRows;
    }

    const cards = rows.map((r) => this.rowToCard(r));

    const scored = cards
      .map((card) => ({
        card,
        score: computeRelevanceScore(query, card),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, query.maxResults ?? 10);

    if (query.requestingAgentId) {
      const queryId = randomUUID();
      db.insert(a2aDiscoveryQueries)
        .values({
          queryId,
          requestingAgentId: query.requestingAgentId,
          capability: query.capability,
          domain: query.domain,
          queryText: query.queryText,
          resultCount: scored.length,
          topMatchAgentId: scored[0]?.card.agentId,
        })
        .catch(() => {});
    }

    return scored.map(({ card, score }) => ({
      agentId: card.agentId,
      name: card.name,
      domain: card.domain,
      capabilities: card.capabilities,
      status: card.status,
      relevanceScore: score,
      costPerCallUsd: card.costPerCallUsd,
      avgLatencyMs: card.avgLatencyMs,
      successRate: card.successRate,
      collaboratesWith: card.collaboratesWith,
    }));
  }

  async heartbeat(
    agentId: string,
    status: string = 'online',
    load: number = 0,
    activeTasks: number = 0,
  ): Promise<void> {
    const now = new Date();
    await db
      .update(a2aAgentCards)
      .set({ status, lastHeartbeatAt: now, updatedAt: now })
      .where(eq(a2aAgentCards.agentId, agentId));

    await db
      .insert(a2aAgentHeartbeats)
      .values({
        agentId,
        status,
        load,
        activeTasks,
        recordedAt: now,
      })
      .catch(() => {});
  }

  async markAgentsStale(): Promise<void> {
    const staleThreshold = new Date(Date.now() - HEARTBEAT_STALE_THRESHOLD_MS * 2);
    await db
      .update(a2aAgentCards)
      .set({ status: 'offline', updatedAt: new Date() })
      .where(
        and(
          sql`${a2aAgentCards.lastHeartbeatAt} < ${staleThreshold}`,
          sql`${a2aAgentCards.status} != 'offline'`,
        ),
      );
  }

  async getAllCards(): Promise<AgentCard[]> {
    await this.ensureInitialized();
    const rows = await db.select().from(a2aAgentCards).orderBy(desc(a2aAgentCards.updatedAt));
    return rows.map((r) => this.rowToCard(r));
  }

  async updateAgentMetrics(
    agentId: string,
    update: { avgLatencyMs?: number; successRate?: number; costPerCallUsd?: number },
  ): Promise<void> {
    await db
      .update(a2aAgentCards)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(a2aAgentCards.agentId, agentId));
  }

  private rowToCard(row: typeof a2aAgentCards.$inferSelect): AgentCard {
    const _inputSchema = row.inputSchema as Record<string, unknown> | undefined;
    const _outputSchema = row.outputSchema as Record<string, unknown> | undefined;
    const _metadata = row.metadata as Record<string, unknown> | undefined;
    return {
      agentId: row.agentId,
      name: row.name,
      domain: row.domain,
      version: row.version,
      description: row.description,
      capabilities: row.capabilities ?? [],
      ...(_inputSchema !== undefined ? { inputSchema: _inputSchema } : {}),
      ...(_outputSchema !== undefined ? { outputSchema: _outputSchema } : {}),
      preferredModel: row.preferredModel,
      preferredProvider: row.preferredProvider,
      collaboratesWith: row.collaboratesWith ?? [],
      costPerCallUsd: row.costPerCallUsd,
      avgLatencyMs: row.avgLatencyMs,
      successRate: row.successRate,
      status: row.status as AgentCard['status'],
      lastHeartbeatAt: row.lastHeartbeatAt,
      ...(_metadata !== undefined ? { metadata: _metadata } : {}),
    };
  }
}

export const a2aRegistry = new A2ARegistryService();
