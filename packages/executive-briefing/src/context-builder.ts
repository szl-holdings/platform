import type { BriefGenerationContext, WorldModelEntity, MemoryEntry, RecentReflection } from "./types.js";

export function buildBriefContext(
  domain: string,
  entities: WorldModelEntity[],
  memories: MemoryEntry[],
  reflections: RecentReflection[],
  crossDomainEdgeCount = 0,
): BriefGenerationContext {
  return {
    domain,
    entities,
    memories,
    reflections,
    crossDomainEdgeCount,
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

  return [
    `Domain: ${ctx.domain} | Generated: ${ctx.generatedAt}`,
    `Entities: ${activeEntities.length} active (${typeList}); avg confidence ${(avgConfidence * 100).toFixed(1)}%`,
    ctx.crossDomainEdgeCount
      ? `Cross-domain edges: ${ctx.crossDomainEdgeCount}`
      : "",
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
    verified: boolean;
  }> = [];

  for (const e of ctx.entities.slice(0, 20)) {
    citations.push({
      id: `cit-ent-${e.id}`,
      sourceType: "entity",
      sourceId: e.id,
      domain: e.domain,
      confidence: e.confidence,
      freshness: e.freshness?.toISOString(),
      verified: true,
    });
  }

  for (const m of ctx.memories.slice(0, 10)) {
    citations.push({
      id: `cit-mem-${m.id}`,
      sourceType: "memory",
      sourceId: m.id,
      confidence: m.confidence,
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
      verified: false,
    });
  }

  return citations;
}
