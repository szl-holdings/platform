/**
 * GraphRAG — Graph-Augmented Retrieval
 *
 * Extends vector-only RAG with multi-hop knowledge graph traversal.
 * CrowdStrike-inspired: identify entities → traverse graph → retrieve chunks → synthesize.
 *
 * Enhancements (v2):
 * - Weighted multi-hop traversal: temporal decay × confidence × strength
 * - Configurable traversal depth and min-risk threshold
 * - "Subgraph extraction" — pulls neighborhood around query entities for context injection
 * - Risk-score filtered traversal (skip low-risk nodes when bandwidth is constrained)
 * - Fusion alert integration — high-priority signals inserted into synthesis context
 *
 * Query flow:
 * 1. Entity extraction from query
 * 2. Graph traversal (N hops, weighted) from each identified entity
 * 3. Vector retrieval for each connected entity's domain chunks
 * 4. Evidence chain construction showing the reasoning path
 * 5. Synthesized response with grounded evidence
 */

import type { ScoredChunk } from '../retrieval/alloy-retrieval.js';
import { alloyRetrieval } from '../retrieval/alloy-retrieval.js';
import type {
  EvidenceLink,
  OntologyEntity,
  RelationshipType,
  SubgraphExtraction,
} from './ontology-engine.js';
import { ontologyEngine } from './ontology-engine.js';

export interface GraphRAGQuery {
  query: string;
  queryEmbedding?: number[] | null;
  maxHops?: number;
  maxEntitiesPerHop?: number;
  topKChunksPerEntity?: number;
  domains?: string[];
  minRiskScore?: number;
  minConfidence?: number;
  temporalDecayEnabled?: boolean;
  riskFilterEnabled?: boolean;
  tenantId?: string;
}

export interface GraphRAGResult {
  query: string;
  identifiedEntities: OntologyEntity[];
  traversedNodes: number;
  retrievedChunks: GraphScoredChunk[];
  evidenceChain: EvidenceLink[];
  crossDomainInsights: CrossDomainInsight[];
  reasoningPath: ReasoningStep[];
  synthesisContext: string;
  queryDurationMs: number;
  subgraph?: SubgraphExtraction;
}

export interface GraphScoredChunk extends ScoredChunk {
  entityId: string;
  entityName: string;
  domain: string;
  hopDistance: number;
  graphRelevance: number;
  temporalWeight: number;
  confidenceScore: number;
  combinedScore: number;
}

export interface CrossDomainInsight {
  fromDomain: string;
  toDomain: string;
  connectionSummary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  entities: string[];
}

export interface ReasoningStep {
  stepNumber: number;
  type:
    | 'entity_identified'
    | 'graph_traversal'
    | 'chunk_retrieved'
    | 'cross_domain_link'
    | 'synthesis'
    | 'subgraph_extracted'
    | 'weighted_traversal';
  description: string;
  entities?: string[];
  domain?: string;
  hopsFromOrigin?: number;
  weight?: number;
}

const ENTITY_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /\b(vessel|ship|tanker|freighter|MV\s+\w+|SS\s+\w+)\b/gi, type: 'vessel' },
  { pattern: /\b(property|building|parcel|address|portfolio)\b/gi, type: 'property' },
  { pattern: /\b(LLC|Corp|Inc|Ltd|Company|Holdings|Fund|Trust)\b/gi, type: 'organization' },
  { pattern: /\b(case|litigation|lawsuit|dispute|filing)\b/gi, type: 'case' },
  { pattern: /\b(threat|APT|malware|ransomware|CVE-\d+|vulnerability)\b/gi, type: 'threat' },
  { pattern: /\b(alert|signal|anomaly|indicator)\b/gi, type: 'signal' },
  { pattern: /\b(sanction|OFAC|SDN|designated)\b/gi, type: 'threat' },
];

function extractEntityMentions(query: string): Array<{ mention: string; type: string }> {
  const mentions: Array<{ mention: string; type: string }> = [];
  for (const { pattern, type } of ENTITY_PATTERNS) {
    const matches = [...query.matchAll(pattern)];
    for (const match of matches) {
      mentions.push({ mention: match[0], type });
    }
  }
  return mentions;
}

/**
 * Compute graph relevance score combining:
 * - Hop decay (further = less relevant)
 * - Relationship strength multiplier
 * - Temporal decay (older edges = lower relevance)
 * - Significance multiplier (high-risk relationships score higher)
 */
function computeGraphRelevance(
  hopDistance: number,
  relationshipStrength: string,
  significance: string,
  temporalWeight = 1.0,
  confidenceScore = 0.7,
  riskScore = 0.0,
): number {
  const HOP_DECAY = 0.65;
  const hopDecay = HOP_DECAY ** (hopDistance - 1);
  const strengthMultiplier =
    relationshipStrength === 'strong' ? 1.25 : relationshipStrength === 'moderate' ? 1.0 : 0.65;
  const significanceMultiplier =
    significance === 'critical'
      ? 1.5
      : significance === 'high'
        ? 1.25
        : significance === 'medium'
          ? 1.0
          : 0.75;
  const riskBoost = 1 + Math.min(0.3, riskScore * 0.3);
  return Math.min(
    1,
    hopDecay *
      strengthMultiplier *
      significanceMultiplier *
      temporalWeight *
      confidenceScore *
      riskBoost,
  );
}

function computeTemporalWeight(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 1) return 1.0;
  if (ageHours < 24) return 0.95;
  if (ageHours < 168) return 0.85;
  if (ageHours < 720) return 0.7;
  if (ageHours < 8760) return 0.5;
  return 0.3;
}

function buildSynthesisContext(
  result: Omit<GraphRAGResult, 'synthesisContext' | 'queryDurationMs'>,
): string {
  const lines: string[] = [];

  if (result.identifiedEntities.length > 0) {
    lines.push('## Entities Identified in Query');
    for (const entity of result.identifiedEntities) {
      const risk =
        entity.riskScore !== undefined ? ` | Risk: ${(entity.riskScore * 100).toFixed(0)}%` : '';
      lines.push(`- **${entity.name}** (${entity.type}, domain: ${entity.domain}${risk})`);
    }
    lines.push('');
  }

  if (result.evidenceChain.length > 0) {
    lines.push('## Knowledge Graph Evidence Chain');
    const highSignificance = result.evidenceChain.filter(
      (e) => e.significance === 'high' || e.significance === 'critical',
    );
    const toShow =
      highSignificance.length > 0 ? highSignificance : result.evidenceChain.slice(0, 5);
    for (const link of toShow) {
      lines.push(`- ${link.description} [${link.significance.toUpperCase()} — ${link.domain}]`);
    }
    lines.push('');
  }

  if (result.crossDomainInsights.length > 0) {
    lines.push('## Cross-Domain Intelligence');
    for (const insight of result.crossDomainInsights) {
      lines.push(
        `- **${insight.fromDomain} ↔ ${insight.toDomain}**: ${insight.connectionSummary} [Risk: ${insight.riskLevel.toUpperCase()}]`,
      );
    }
    lines.push('');
  }

  if (result.subgraph && result.subgraph.entities.length > 0) {
    lines.push('## Entity Subgraph Context');
    lines.push(
      `Subgraph around primary entity: ${result.subgraph.entities.length} entities, ${result.subgraph.relationships.length} relationships`,
    );
    const highRiskEntities = result.subgraph.entities
      .filter((e) => (e.riskScore ?? 0) > 0.6)
      .slice(0, 5);
    if (highRiskEntities.length > 0) {
      lines.push(
        `High-risk entities in subgraph: ${highRiskEntities.map((e) => `${e.name} (risk: ${((e.riskScore ?? 0) * 100).toFixed(0)}%)`).join(', ')}`,
      );
    }
    const sanctioned = result.subgraph.entities.filter((e) => e.tags?.includes('sanctioned'));
    if (sanctioned.length > 0) {
      lines.push(`⚠ SANCTIONED entities in subgraph: ${sanctioned.map((e) => e.name).join(', ')}`);
    }
    lines.push('');
  }

  if (result.retrievedChunks.length > 0) {
    lines.push('## Retrieved Knowledge Chunks');
    const topChunks = result.retrievedChunks.slice(0, 8);
    for (const chunk of topChunks) {
      const header = `[${chunk.domain} | ${chunk.entityName} | hop:${chunk.hopDistance} | temporal:${(chunk.temporalWeight * 100).toFixed(0)}%]`;
      lines.push(`${header}\n${chunk.content.slice(0, 400)}`);
      lines.push('');
    }
  }

  if (result.reasoningPath.length > 0) {
    lines.push('## Reasoning Path');
    for (const step of result.reasoningPath.slice(0, 8)) {
      lines.push(`${step.stepNumber}. ${step.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Extract a structured subgraph context string for agent prompt injection.
 * Used by the Nuro Mesh graph context injection feature.
 */
export function serializeSubgraphForPrompt(subgraph: SubgraphExtraction): string {
  const lines: string[] = ['### Graph Context (Knowledge Subgraph)'];

  const sorted = [...subgraph.entities].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
  for (const entity of sorted.slice(0, 15)) {
    const risk =
      entity.riskScore !== undefined ? ` [risk:${(entity.riskScore * 100).toFixed(0)}%]` : '';
    const sanctioned = entity.tags?.includes('sanctioned') ? ' ⚠SANCTIONED' : '';
    lines.push(`- ${entity.name} (${entity.type}, ${entity.domain})${risk}${sanctioned}`);
  }

  if (subgraph.edges.length > 0) {
    lines.push('### Key Relationships');
    const topEdges = [...subgraph.edges]
      .sort((a, b) => b.weight * b.temporalWeight - a.weight * a.temporalWeight)
      .slice(0, 10);

    for (const edge of topEdges) {
      const fromEntity = subgraph.entities.find((e) => e.id === edge.from);
      const toEntity = subgraph.entities.find((e) => e.id === edge.to);
      if (!fromEntity || !toEntity) continue;
      const strength = edge.weight > 0.7 ? 'strong' : edge.weight > 0.4 ? 'moderate' : 'weak';
      lines.push(`- ${fromEntity.name} —[${edge.type}:${strength}]→ ${toEntity.name}`);
    }
  }

  return lines.join('\n');
}

export class GraphRAGEngine {
  async query(params: GraphRAGQuery): Promise<GraphRAGResult> {
    const start = Date.now();
    const {
      query,
      queryEmbedding = null,
      maxHops = 2,
      maxEntitiesPerHop = 5,
      topKChunksPerEntity = 3,
      domains,
      minRiskScore = 0.0,
      minConfidence = 0.2,
      temporalDecayEnabled = true,
      riskFilterEnabled = false,
      tenantId,
    } = params;

    const reasoningPath: ReasoningStep[] = [];
    const identifiedEntities: OntologyEntity[] = [];
    const allChunks: GraphScoredChunk[] = [];
    const allEvidenceLinks: EvidenceLink[] = [];
    const crossDomainInsightMap = new Map<string, CrossDomainInsight>();
    let subgraph: SubgraphExtraction | undefined;

    reasoningPath.push({
      stepNumber: 1,
      type: 'entity_identified',
      description: `Analyzing query for entity mentions: "${query.slice(0, 100)}"`,
    });

    const mentions = extractEntityMentions(query);
    for (const mention of mentions) {
      try {
        const found = await ontologyEngine.searchEntities(
          mention.mention,
          [mention.type as never],
          2,
        );
        for (const entity of found) {
          if (!identifiedEntities.find((e) => e.id === entity.id)) {
            if (!riskFilterEnabled || (entity.riskScore ?? 0) >= minRiskScore) {
              identifiedEntities.push(entity);
            }
          }
        }
      } catch {
        // Pattern-based entity lookup failed — continue
      }
    }

    const searchTerms = query
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    for (const term of searchTerms) {
      try {
        const found = await ontologyEngine.searchEntities(term, undefined, 3);
        for (const entity of found) {
          if (!identifiedEntities.find((e) => e.id === entity.id)) {
            if (!riskFilterEnabled || (entity.riskScore ?? 0) >= minRiskScore) {
              identifiedEntities.push(entity);
            }
          }
        }
      } catch {
        // Graph search unavailable — continue with vector-only retrieval
      }
    }

    if (identifiedEntities.length > 0) {
      reasoningPath.push({
        stepNumber: 2,
        type: 'entity_identified',
        description: `Identified ${identifiedEntities.length} entities in knowledge graph: ${identifiedEntities.map((e) => e.name).join(', ')}`,
        entities: identifiedEntities.map((e) => e.name),
      });

      const topEntity = identifiedEntities[0];
      if (topEntity) {
        try {
          subgraph = await ontologyEngine.extractSubgraph(
            topEntity.id,
            maxHops,
            25,
            minRiskScore,
            minConfidence,
          );
          if (subgraph.entities.length > 1) {
            reasoningPath.push({
              stepNumber: reasoningPath.length + 1,
              type: 'subgraph_extracted',
              description: `Extracted subgraph: ${subgraph.entities.length} entities, ${subgraph.relationships.length} relationships around "${topEntity.name}"`,
              entities: subgraph.entities.slice(0, 5).map((e) => e.name),
            });
          }
        } catch {
          // Subgraph extraction unavailable
        }
      }
    }

    for (const originEntity of identifiedEntities.slice(0, 3)) {
      try {
        const traversal = await ontologyEngine.traverseGraph(
          originEntity.id,
          maxHops,
          maxEntitiesPerHop,
        );

        reasoningPath.push({
          stepNumber: reasoningPath.length + 1,
          type: 'graph_traversal',
          description: `Traversed ${traversal.totalNodes} nodes from "${originEntity.name}" across ${maxHops} hops`,
          entities: traversal.nodes.map((n) => n.entity.name).slice(0, 5),
          hopsFromOrigin: maxHops,
        });

        allEvidenceLinks.push(...traversal.evidenceChain);

        for (const xConn of traversal.crossDomainConnections) {
          const key = `${xConn.fromDomain}:${xConn.toDomain}`;
          if (!crossDomainInsightMap.has(key)) {
            crossDomainInsightMap.set(key, {
              fromDomain: xConn.fromDomain,
              toDomain: xConn.toDomain,
              connectionSummary: `${xConn.entityA} (${xConn.connectionType}) ${xConn.entityB}`,
              riskLevel: xConn.riskImplications.length > 0 ? 'high' : 'medium',
              entities: [xConn.entityA, xConn.entityB],
            });
          }
        }

        for (const node of traversal.nodes) {
          if (domains && !domains.includes(node.entity.domain)) continue;
          if (riskFilterEnabled && (node.entity.riskScore ?? 0) < minRiskScore) continue;

          try {
            const domainQuery = `${query} ${node.entity.name} ${node.entity.tags.join(' ')}`;
            const retrieved = alloyRetrieval.retrieveHybrid(
              domainQuery,
              queryEmbedding,
              topKChunksPerEntity,
              tenantId ?? '',
            );

            const rel = node.relationships[0];
            const significance = rel
              ? ['litigates', 'threatens', 'sanctioned_by'].includes(rel.type)
                ? 'high'
                : ['owns', 'directs'].includes(rel.type)
                  ? 'medium'
                  : 'low'
              : 'low';

            const temporalW =
              temporalDecayEnabled && rel ? computeTemporalWeight(rel.createdAt) : 1.0;

            const metaConf = rel
              ? typeof (rel.metadata as Record<string, unknown>)?.confidence === 'number'
                ? ((rel.metadata as Record<string, unknown>).confidence as number)
                : 0.7
              : 0.7;

            const graphRelevance = computeGraphRelevance(
              node.hopDistance,
              rel?.strength ?? 'moderate',
              significance,
              temporalW,
              metaConf,
              node.entity.riskScore ?? 0,
            );

            reasoningPath.push({
              stepNumber: reasoningPath.length + 1,
              type: 'weighted_traversal',
              description: `Node "${node.entity.name}" hop=${node.hopDistance}, graphRelevance=${graphRelevance.toFixed(2)}, temporalWeight=${temporalW.toFixed(2)}, confidence=${metaConf.toFixed(2)}`,
              domain: node.entity.domain,
              hopsFromOrigin: node.hopDistance,
              weight: graphRelevance,
            });

            for (const chunk of retrieved.chunks) {
              allChunks.push({
                ...chunk,
                entityId: node.entity.id,
                entityName: node.entity.name,
                domain: node.entity.domain,
                hopDistance: node.hopDistance,
                graphRelevance,
                temporalWeight: temporalW,
                confidenceScore: metaConf,
                combinedScore: chunk.score * 0.5 + graphRelevance * 0.35 + temporalW * 0.15,
              });
            }

            if (retrieved.chunks.length > 0) {
              reasoningPath.push({
                stepNumber: reasoningPath.length + 1,
                type: 'chunk_retrieved',
                description: `Retrieved ${retrieved.chunks.length} knowledge chunks for "${node.entity.name}" (hop ${node.hopDistance})`,
                domain: node.entity.domain,
                hopsFromOrigin: node.hopDistance,
              });
            }
          } catch {
            // Chunk retrieval failed for this node — continue
          }
        }
      } catch {
        // Graph traversal failed — fall back to direct retrieval
      }
    }

    if (allChunks.length === 0) {
      try {
        const fallback = alloyRetrieval.retrieveHybrid(query, queryEmbedding, 10, tenantId ?? '');
        for (const chunk of fallback.chunks) {
          allChunks.push({
            ...chunk,
            entityId: 'direct',
            entityName: 'Direct retrieval',
            domain: chunk.source,
            hopDistance: 0,
            graphRelevance: 1.0,
            temporalWeight: 1.0,
            confidenceScore: 0.7,
            combinedScore: chunk.score,
          });
        }
      } catch {
        // Retrieval completely unavailable
      }
    }

    const sortedChunks = allChunks.sort((a, b) => b.combinedScore - a.combinedScore);
    const deduped = deduplicateChunks(sortedChunks, 15);

    const crossDomainInsights = [...crossDomainInsightMap.values()];

    if (crossDomainInsights.length > 0) {
      reasoningPath.push({
        stepNumber: reasoningPath.length + 1,
        type: 'cross_domain_link',
        description: `Detected ${crossDomainInsights.length} cross-domain connections: ${crossDomainInsights.map((i) => `${i.fromDomain}↔${i.toDomain}`).join(', ')}`,
      });
    }

    const partialResult = {
      query,
      identifiedEntities,
      traversedNodes: allChunks.length,
      retrievedChunks: deduped,
      evidenceChain: deduplicateEvidence(allEvidenceLinks),
      crossDomainInsights,
      reasoningPath,
      ...(subgraph !== undefined ? { subgraph } : {}),
    };

    reasoningPath.push({
      stepNumber: reasoningPath.length + 1,
      type: 'synthesis',
      description: `Synthesizing response from ${deduped.length} knowledge chunks across ${new Set(deduped.map((c) => c.domain)).size} domains`,
    });

    return {
      ...partialResult,
      synthesisContext: buildSynthesisContext(partialResult),
      queryDurationMs: Date.now() - start,
    };
  }

  buildPromptContext(result: GraphRAGResult): string {
    return result.synthesisContext;
  }

  buildSubgraphContext(result: GraphRAGResult): string {
    if (!result.subgraph) return '';
    return serializeSubgraphForPrompt(result.subgraph);
  }
}

function deduplicateChunks(chunks: GraphScoredChunk[], limit: number): GraphScoredChunk[] {
  const seen = new Set<string>();
  const result: GraphScoredChunk[] = [];
  for (const chunk of chunks) {
    const key = chunk.content.slice(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(chunk);
      if (result.length >= limit) break;
    }
  }
  return result;
}

function deduplicateEvidence(links: EvidenceLink[]): EvidenceLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.fromEntity}:${link.relationshipType}:${link.toEntity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const graphRAGEngine = new GraphRAGEngine();
