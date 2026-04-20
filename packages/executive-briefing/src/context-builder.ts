import type {
  BriefGenerationContext,
  WorldModelEntity,
  WorldModelEdge,
  MemoryEntry,
  RecentReflection,
} from "./types.js";

export function buildBriefContext(
  domain: string,
  entities: WorldModelEntity[],
  memories: MemoryEntry[],
  reflections: RecentReflection[],
  crossDomainEdgeCount = 0,
  edges: WorldModelEdge[] = [],
): BriefGenerationContext {
  return {
    domain,
    entities,
    memories,
    reflections,
    crossDomainEdgeCount,
    edges,
    generatedAt: new Date().toISOString(),
  };
}

export function summarizeContext(ctx: BriefGenerationContext): string {
  const activeEntities = ctx.entities.filter((e) => e.isActive);
  const avgConfidence =
    activeEntities.length > 0
      ? activeEntities.reduce((s, e) => s + e.confidence, 0) / activeEntities.length
      : 0;

  const entityTypeCounts: Record<string, number> = {};
  for (const e of activeEntities) {
    entityTypeCounts[e.entityType] = (entityTypeCounts[e.entityType] ?? 0) + 1;
  }
  const typeList = Object.entries(entityTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, c]) => `${c} ${t}`)
    .join(", ");

  const recentMemories = ctx.memories
    .slice(0, 5)
    .map((m) => `[${m.memoryType}] ${m.content.slice(0, 120)}`)
    .join("\n");

  const lessonSummary = ctx.reflections
    .filter((r) => r.lesson)
    .slice(0, 3)
    .map((r) => r.lesson!)
    .join(" | ");

  const edges = ctx.edges ?? [];
  const crossDomainEdgeSamples = edges
    .filter((e) => e.crossDomain)
    .slice(0, 5)
    .map(
      (e) =>
        `${e.fromDomain ?? "?"}:${e.fromNodeId.slice(0, 8)} —[${e.relationshipType}]→ ${e.toDomain ?? "?"}:${e.toNodeId.slice(0, 8)}`,
    )
    .join("\n");

  const neighborhoodSummary = edges.length > 0
    ? `Constellation traversal: ${edges.length} edges connecting ${activeEntities.length} entities${ctx.crossDomainEdgeCount ? ` (${ctx.crossDomainEdgeCount} cross-domain)` : ""}.`
    : ctx.crossDomainEdgeCount
      ? `Cross-domain edges: ${ctx.crossDomainEdgeCount}`
      : "";

  return [
    `Domain: ${ctx.domain} | Generated: ${ctx.generatedAt}`,
    `Entities: ${activeEntities.length} active (${typeList}); avg confidence ${(avgConfidence * 100).toFixed(1)}%`,
    neighborhoodSummary,
    crossDomainEdgeSamples ? `Cross-domain edge samples:\n${crossDomainEdgeSamples}` : "",
    recentMemories ? `Recent memory entries:\n${recentMemories}` : "No recent memory entries.",
    lessonSummary ? `Reflection lessons: ${lessonSummary}` : "No recent reflections.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function extractEntityProvenance(entities: WorldModelEntity[]) {
  return entities.slice(0, 50).map((e) => ({
    entityId: e.id,
    entityType: e.entityType,
    domain: e.domain,
    confidence: e.confidence,
    lastSeen: e.freshness?.toISOString(),
  }));
}

export function buildCitations(ctx: BriefGenerationContext) {
  const citations: Array<{
    id: string;
    sourceType: "entity" | "memory" | "reflection";
    sourceId: string;
    domain?: string;
    confidence?: number;
    freshness?: string;
    quote?: string;
    verified: boolean;
  }> = [];

  for (const e of ctx.entities.slice(0, 20)) {
    // sourceId is the constellation node UUID — clients resolve it back to a
    // Constellation node via /graph/entities/:id, so the citation chain is live.
    citations.push({
      id: `cit-ent-${e.id}`,
      sourceType: "entity",
      sourceId: e.id,
      domain: e.domain,
      confidence: e.confidence,
      freshness: e.freshness?.toISOString(),
      quote: e.name ? `${e.entityType}: ${e.name}` : undefined,
      verified: true,
    });
  }

  for (const m of ctx.memories.slice(0, 10)) {
    citations.push({
      id: `cit-mem-${m.id}`,
      sourceType: "memory",
      sourceId: m.id,
      confidence: m.confidence,
      freshness: m.createdAt?.toISOString(),
      quote: m.content ? m.content.slice(0, 160) : undefined,
      verified: false,
    });
  }

  for (const r of ctx.reflections.slice(0, 5)) {
    citations.push({
      id: `cit-ref-${r.id}`,
      sourceType: "reflection",
      sourceId: r.id,
      domain: r.domain,
      confidence: r.qualityScore,
      freshness: r.createdAt?.toISOString(),
      quote: r.lesson ?? undefined,
      verified: false,
    });
  }

  return citations;
}
