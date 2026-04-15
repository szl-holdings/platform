/**
 * GraphRAG — Graph-Augmented Retrieval
 *
 * Extends vector-only RAG with multi-hop knowledge graph traversal.
 * CrowdStrike-inspired: identify entities → traverse graph → retrieve chunks → synthesize.
 *
 * Query flow:
 * 1. Entity extraction from query
 * 2. Graph traversal (N hops) from each identified entity
 * 3. Vector retrieval for each connected entity's domain chunks
 * 4. Evidence chain construction showing the reasoning path
 * 5. Synthesized response with grounded evidence
 */

import { ontologyEngine } from "./ontology-engine.js";
import type { OntologyEntity, EvidenceLink, RelationshipType } from "./ontology-engine.js";
import { alloyRetrieval } from "../retrieval/alloy-retrieval.js";
import type { ScoredChunk } from "../retrieval/alloy-retrieval.js";

export interface GraphRAGQuery {
  query: string;
  queryEmbedding?: number[] | null;
  maxHops?: number;
  maxEntitiesPerHop?: number;
  topKChunksPerEntity?: number;
  domains?: string[];
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
}

export interface GraphScoredChunk extends ScoredChunk {
  entityId: string;
  entityName: string;
  domain: string;
  hopDistance: number;
  graphRelevance: number;
  combinedScore: number;
}

export interface CrossDomainInsight {
  fromDomain: string;
  toDomain: string;
  connectionSummary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  entities: string[];
}

export interface ReasoningStep {
  stepNumber: number;
  type: "entity_identified" | "graph_traversal" | "chunk_retrieved" | "cross_domain_link" | "synthesis";
  description: string;
  entities?: string[];
  domain?: string;
  hopsFromOrigin?: number;
}

const ENTITY_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /\b(vessel|ship|tanker|freighter|MV\s+\w+|SS\s+\w+)\b/gi, type: "vessel" },
  { pattern: /\b(property|building|parcel|address|portfolio)\b/gi, type: "property" },
  { pattern: /\b(LLC|Corp|Inc|Ltd|Company|Holdings|Fund|Trust)\b/gi, type: "organization" },
  { pattern: /\b(case|litigation|lawsuit|dispute|filing)\b/gi, type: "case" },
  { pattern: /\b(threat|APT|malware|ransomware|CVE-\d+|vulnerability)\b/gi, type: "threat" },
  { pattern: /\b(alert|signal|anomaly|indicator)\b/gi, type: "signal" },
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

function computeGraphRelevance(hopDistance: number, relationshipStrength: string, significance: string): number {
  const hopDecay = Math.pow(0.7, hopDistance - 1);
  const strengthMultiplier = relationshipStrength === "strong" ? 1.2 : relationshipStrength === "moderate" ? 1.0 : 0.7;
  const significanceMultiplier = significance === "critical" ? 1.4 : significance === "high" ? 1.2 : significance === "medium" ? 1.0 : 0.8;
  return Math.min(1, hopDecay * strengthMultiplier * significanceMultiplier);
}

function buildSynthesisContext(
  result: Omit<GraphRAGResult, "synthesisContext" | "queryDurationMs">,
): string {
  const lines: string[] = [];

  if (result.identifiedEntities.length > 0) {
    lines.push("## Entities Identified in Query");
    for (const entity of result.identifiedEntities) {
      lines.push(`- **${entity.name}** (${entity.type}, domain: ${entity.domain})`);
    }
    lines.push("");
  }

  if (result.evidenceChain.length > 0) {
    lines.push("## Knowledge Graph Evidence Chain");
    const highSignificance = result.evidenceChain.filter(e => e.significance === "high" || e.significance === "critical");
    const toShow = highSignificance.length > 0 ? highSignificance : result.evidenceChain.slice(0, 5);
    for (const link of toShow) {
      lines.push(`- ${link.description} [${link.significance.toUpperCase()} — ${link.domain}]`);
    }
    lines.push("");
  }

  if (result.crossDomainInsights.length > 0) {
    lines.push("## Cross-Domain Intelligence");
    for (const insight of result.crossDomainInsights) {
      lines.push(`- **${insight.fromDomain} ↔ ${insight.toDomain}**: ${insight.connectionSummary} [Risk: ${insight.riskLevel.toUpperCase()}]`);
    }
    lines.push("");
  }

  if (result.retrievedChunks.length > 0) {
    lines.push("## Retrieved Knowledge Chunks");
    const topChunks = result.retrievedChunks.slice(0, 8);
    for (const chunk of topChunks) {
      const header = `[${chunk.domain} | ${chunk.entityName} | hop:${chunk.hopDistance}]`;
      lines.push(`${header}\n${chunk.content.slice(0, 400)}`);
      lines.push("");
    }
  }

  if (result.reasoningPath.length > 0) {
    lines.push("## Reasoning Path");
    for (const step of result.reasoningPath.slice(0, 6)) {
      lines.push(`${step.stepNumber}. ${step.description}`);
    }
  }

  return lines.join("\n");
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
    } = params;

    const reasoningPath: ReasoningStep[] = [];
    const identifiedEntities: OntologyEntity[] = [];
    const allChunks: GraphScoredChunk[] = [];
    const allEvidenceLinks: EvidenceLink[] = [];
    const crossDomainInsightMap = new Map<string, CrossDomainInsight>();

    reasoningPath.push({
      stepNumber: 1,
      type: "entity_identified",
      description: `Analyzing query for entity mentions: "${query.slice(0, 100)}"`,
    });

    const mentions = extractEntityMentions(query);
    const searchTerms = query.split(/\s+/).filter(w => w.length > 3).slice(0, 5);

    for (const term of searchTerms) {
      try {
        const found = await ontologyEngine.searchEntities(term, undefined, 3);
        for (const entity of found) {
          if (!identifiedEntities.find(e => e.id === entity.id)) {
            identifiedEntities.push(entity);
          }
        }
      } catch {
        // Graph search unavailable — continue with vector-only retrieval
      }
    }

    if (identifiedEntities.length > 0) {
      reasoningPath.push({
        stepNumber: 2,
        type: "entity_identified",
        description: `Identified ${identifiedEntities.length} entities in knowledge graph: ${identifiedEntities.map(e => e.name).join(", ")}`,
        entities: identifiedEntities.map(e => e.name),
      });
    }

    for (const originEntity of identifiedEntities.slice(0, 3)) {
      try {
        const traversal = await ontologyEngine.traverseGraph(originEntity.id, maxHops, maxEntitiesPerHop);

        reasoningPath.push({
          stepNumber: reasoningPath.length + 1,
          type: "graph_traversal",
          description: `Traversed ${traversal.totalNodes} nodes from "${originEntity.name}" across ${maxHops} hops`,
          entities: traversal.nodes.map(n => n.entity.name).slice(0, 5),
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
              riskLevel: xConn.riskImplications.length > 0 ? "high" : "medium",
              entities: [xConn.entityA, xConn.entityB],
            });
          }
        }

        for (const node of traversal.nodes) {
          if (domains && !domains.includes(node.entity.domain)) continue;

          try {
            const domainQuery = `${query} ${node.entity.name} ${node.entity.tags.join(" ")}`;
            const retrieved = alloyRetrieval.retrieveHybrid(domainQuery, queryEmbedding, topKChunksPerEntity);

            const graphRelevance = computeGraphRelevance(
              node.hopDistance,
              node.relationships[0]?.strength ?? "moderate",
              node.relationships[0] ? "medium" : "low",
            );

            for (const chunk of retrieved.chunks) {
              allChunks.push({
                ...chunk,
                entityId: node.entity.id,
                entityName: node.entity.name,
                domain: node.entity.domain,
                hopDistance: node.hopDistance,
                graphRelevance,
                combinedScore: chunk.score * 0.6 + graphRelevance * 0.4,
              });
            }

            if (retrieved.chunks.length > 0) {
              reasoningPath.push({
                stepNumber: reasoningPath.length + 1,
                type: "chunk_retrieved",
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
        const fallback = alloyRetrieval.retrieveHybrid(query, queryEmbedding, 10);
        for (const chunk of fallback.chunks) {
          allChunks.push({
            ...chunk,
            entityId: "direct",
            entityName: "Direct retrieval",
            domain: chunk.source,
            hopDistance: 0,
            graphRelevance: 1.0,
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
        type: "cross_domain_link",
        description: `Detected ${crossDomainInsights.length} cross-domain connections: ${crossDomainInsights.map(i => `${i.fromDomain}↔${i.toDomain}`).join(", ")}`,
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
    };

    reasoningPath.push({
      stepNumber: reasoningPath.length + 1,
      type: "synthesis",
      description: `Synthesizing response from ${deduped.length} knowledge chunks across ${new Set(deduped.map(c => c.domain)).size} domains`,
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
  return links.filter(link => {
    const key = `${link.fromEntity}:${link.relationshipType}:${link.toEntity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const graphRAGEngine = new GraphRAGEngine();
