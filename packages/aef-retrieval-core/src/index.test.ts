import { describe, it, expect } from "vitest";
import {
  normalizeQuery,
  applyProfilePromptTransform,
  registerProfileTransform,
} from "./query-normalizer.js";
import { reciprocalRankFusion } from "./fusion.js";
import { applyExactMatchBoosts } from "./boost.js";
import { applyMetadataFilter, applyTenantFilter } from "./filter.js";
import { normalizeScores } from "./normalize.js";
import { assembleCitations } from "./citations.js";
import type { DenseHit, KeywordHit } from "./adapters.js";

describe("normalizeQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeQuery("  hello   world  ")).toBe("hello world");
  });

  it("lowercases by default", () => {
    expect(normalizeQuery("IMO 9123456")).toBe("imo 9123456");
  });

  it("strips punctuation when requested", () => {
    const result = normalizeQuery("hello, world!", { stripPunctuation: true });
    expect(result).toBe("hello world");
  });

  it("preserves case when lowercase is false", () => {
    const result = normalizeQuery("IMO 9123456", { lowercase: false });
    expect(result).toBe("IMO 9123456");
  });

  it("truncates at maxLength", () => {
    const long = "a".repeat(100);
    const result = normalizeQuery(long, { maxLength: 10 });
    expect(result.length).toBe(10);
  });
});

describe("applyProfilePromptTransform", () => {
  it("returns original query when no profileId given", () => {
    const result = applyProfilePromptTransform("test query", undefined);
    expect(result).toBe("test query");
  });

  it("returns original query when no hook registered", () => {
    const result = applyProfilePromptTransform("test query", "unregistered-profile");
    expect(result).toBe("test query");
  });

  it("applies registered hook", () => {
    registerProfileTransform("maritime-v1", (q) => `[Maritime context] ${q}`);
    const result = applyProfilePromptTransform("vessel sanctions", "maritime-v1");
    expect(result).toBe("[Maritime context] vessel sanctions");
  });
});

describe("reciprocalRankFusion", () => {
  const dense: DenseHit[] = [
    { chunkId: "c1", sourceId: "s1", score: 0.95, metadata: {} },
    { chunkId: "c2", sourceId: "s2", score: 0.80, metadata: {} },
    { chunkId: "c3", sourceId: "s3", score: 0.70, metadata: {} },
  ];

  const keyword: KeywordHit[] = [
    { chunkId: "c2", sourceId: "s2", score: 0.90, metadata: {} },
    { chunkId: "c3", sourceId: "s3", score: 0.75, metadata: {} },
    { chunkId: "c4", sourceId: "s4", score: 0.60, metadata: {} },
  ];

  it("returns results for all unique chunkIds", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const ids = new Set(result.map((h) => h.chunkId));
    expect(ids).toContain("c1");
    expect(ids).toContain("c2");
    expect(ids).toContain("c3");
    expect(ids).toContain("c4");
    expect(result).toHaveLength(4);
  });

  it("assigns ascending ranks starting from 1", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const ranks = result.map((h) => h.rank);
    expect(ranks[0]).toBe(1);
    expect(ranks[1]).toBe(2);
    expect(ranks[ranks.length - 1]).toBe(result.length);
  });

  it("scores c2 higher than c1 because c2 appears in both lists", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const c1 = result.find((h) => h.chunkId === "c1")!;
    const c2 = result.find((h) => h.chunkId === "c2")!;
    expect(c2.fusedScore).toBeGreaterThan(c1.fusedScore);
  });

  it("scores c4 lowest since it only appears in keyword results at rank 3", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const c4 = result.find((h) => h.chunkId === "c4")!;
    const c1 = result.find((h) => h.chunkId === "c1")!;
    expect(c4.fusedScore).toBeLessThan(c1.fusedScore);
  });

  it("handles empty dense hits", () => {
    const result = reciprocalRankFusion([], keyword);
    expect(result).toHaveLength(keyword.length);
  });

  it("handles empty keyword hits", () => {
    const result = reciprocalRankFusion(dense, []);
    expect(result).toHaveLength(dense.length);
  });

  it("returns empty array for both empty inputs", () => {
    const result = reciprocalRankFusion([], []);
    expect(result).toHaveLength(0);
  });

  it("respects custom k and weight parameters", () => {
    const highK = reciprocalRankFusion(dense, keyword, { k: 1000 });
    const lowK = reciprocalRankFusion(dense, keyword, { k: 1 });
    const highKTop = highK[0]!;
    const lowKTop = lowK[0]!;
    expect(highKTop.chunkId).toBe(lowKTop.chunkId);
  });

  it("preserves denseScore on hits that appeared in dense results", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const c1 = result.find((h) => h.chunkId === "c1")!;
    expect(c1.denseScore).toBe(0.95);
  });

  it("c4 has no denseScore since it only appeared in keyword results", () => {
    const result = reciprocalRankFusion(dense, keyword);
    const c4 = result.find((h) => h.chunkId === "c4")!;
    expect(c4.denseScore).toBeUndefined();
  });
});

describe("applyExactMatchBoosts", () => {
  const makeHit = (chunkId: string, fusedScore: number, metadata: Record<string, unknown> = {}) => ({
    chunkId,
    sourceId: "s1",
    fusedScore,
    rank: 1,
    metadata,
  });

  it("boosts only hits whose metadata contains the matched IMO number", () => {
    const hits = [
      makeHit("c1", 0.5, { imo: "IMO 9123456" }),
      makeHit("c2", 0.5, { imo: "IMO 9999999" }),
      makeHit("c3", 0.5, {}),
    ];
    const result = applyExactMatchBoosts(hits, "IMO 9123456");
    const c1 = result.find((h) => h.chunkId === "c1")!;
    const c2 = result.find((h) => h.chunkId === "c2")!;
    const c3 = result.find((h) => h.chunkId === "c3")!;
    expect(c1.boostApplied).toBe(true);
    expect(c1.boostRuleId).toBe("imo-number");
    expect(c1.boostedScore).toBeGreaterThan(0.5);
    expect(c2.boostApplied).toBe(false);
    expect(c2.boostedScore).toBe(0.5);
    expect(c3.boostApplied).toBe(false);
    expect(c3.boostedScore).toBe(0.5);
  });

  it("boosts only hits whose metadata contains the matched CVE ID", () => {
    const hits = [
      makeHit("c1", 0.4, { cveId: "CVE-2024-12345" }),
      makeHit("c2", 0.4, {}),
    ];
    const result = applyExactMatchBoosts(hits, "CVE-2024-12345");
    expect(result.find((h) => h.chunkId === "c1")!.boostApplied).toBe(true);
    expect(result.find((h) => h.chunkId === "c1")!.boostRuleId).toBe("cve-id");
    expect(result.find((h) => h.chunkId === "c2")!.boostApplied).toBe(false);
  });

  it("does not boost any hits when query has no recognized patterns", () => {
    const hits = [
      makeHit("c1", 0.5, { imo: "IMO 9123456" }),
      makeHit("c2", 0.5, {}),
    ];
    const result = applyExactMatchBoosts(hits, "what is the weather today");
    expect(result.every((h) => !h.boostApplied)).toBe(true);
    expect(result.every((h) => h.boostedScore === 0.5)).toBe(true);
  });

  it("does not boost hits even when query matches but hit has no matching metadata", () => {
    const hits = [makeHit("c1", 0.5, {})];
    const result = applyExactMatchBoosts(hits, "IMO 9123456");
    expect(result[0]!.boostApplied).toBe(false);
    expect(result[0]!.boostedScore).toBe(0.5);
  });

  it("applies custom boost rules to hits with matching metadata", () => {
    const customRule = {
      ruleId: "custom-entity",
      kind: "entity-id" as const,
      pattern: /\bentity-xyz\b/i,
      scoreMultiplier: 3.0,
      metadataField: "entityRef",
    };
    const hits = [
      makeHit("c1", 0.3, { entityRef: "entity-xyz" }),
      makeHit("c2", 0.3, { entityRef: "entity-abc" }),
    ];
    const result = applyExactMatchBoosts(hits, "entity-xyz related documents", [customRule]);
    expect(result.find((h) => h.chunkId === "c1")!.boostApplied).toBe(true);
    expect(result.find((h) => h.chunkId === "c1")!.boostRuleId).toBe("custom-entity");
    expect(result.find((h) => h.chunkId === "c1")!.boostedScore).toBeCloseTo(0.9, 5);
    expect(result.find((h) => h.chunkId === "c2")!.boostApplied).toBe(false);
  });

  it("selects the highest-multiplier rule when multiple query patterns match a hit", () => {
    const hits = [
      makeHit("c1", 0.5, { imo: "IMO 9123456", cveId: "CVE-2024-11111" }),
    ];
    const result = applyExactMatchBoosts(hits, "IMO 9123456 CVE-2024-11111");
    expect(result[0]!.boostApplied).toBe(true);
    const expectedMultiplier = Math.max(2.0, 2.0);
    expect(result[0]!.boostedScore).toBeCloseTo(0.5 * expectedMultiplier, 5);
  });

  it("boosts correctly when hit has metadata in a string field checked by fallback scan", () => {
    const customRule = {
      ruleId: "sanctions-scan",
      kind: "sanctions-name" as const,
      pattern: /\bMukhtar\s+Khan\b/i,
      scoreMultiplier: 2.5,
    };
    const hits = [
      makeHit("c1", 0.4, { content: "Mukhtar Khan sanctioned entity" }),
      makeHit("c2", 0.4, { content: "Unrelated maritime trade route" }),
    ];
    const result = applyExactMatchBoosts(hits, "Mukhtar Khan", [customRule]);
    expect(result.find((h) => h.chunkId === "c1")!.boostApplied).toBe(true);
    expect(result.find((h) => h.chunkId === "c2")!.boostApplied).toBe(false);
  });
});

describe("applyMetadataFilter", () => {
  const makeHit = (chunkId: string, metadata: Record<string, unknown>) => ({
    chunkId,
    sourceId: "s1",
    fusedScore: 0.5,
    rank: 1,
    metadata,
    boostApplied: false,
    boostRuleId: undefined,
    boostedScore: 0.5,
    denseScore: undefined,
    keywordScore: undefined,
  });

  it("returns all hits when filter is undefined", () => {
    const hits = [makeHit("c1", {}), makeHit("c2", {})];
    expect(applyMetadataFilter(hits, undefined)).toHaveLength(2);
  });

  it("returns all hits when filter is empty", () => {
    const hits = [makeHit("c1", {}), makeHit("c2", {})];
    expect(applyMetadataFilter(hits, {})).toHaveLength(2);
  });

  it("filters by exact string match", () => {
    const hits = [
      makeHit("c1", { domain: "maritime" }),
      makeHit("c2", { domain: "legal" }),
    ];
    const result = applyMetadataFilter(hits, { domain: "maritime" });
    expect(result).toHaveLength(1);
    expect(result[0]!.chunkId).toBe("c1");
  });

  it("filters by array membership", () => {
    const hits = [
      makeHit("c1", { jurisdiction: "US" }),
      makeHit("c2", { jurisdiction: "UK" }),
      makeHit("c3", { jurisdiction: "EU" }),
    ];
    const result = applyMetadataFilter(hits, { jurisdiction: ["US", "EU"] });
    expect(result).toHaveLength(2);
  });

  it("rejects hits that fail any filter condition", () => {
    const hits = [
      makeHit("c1", { domain: "maritime", flagState: "Panama" }),
      makeHit("c2", { domain: "maritime", flagState: "Liberia" }),
    ];
    const result = applyMetadataFilter(hits, { domain: "maritime", flagState: "Panama" });
    expect(result).toHaveLength(1);
    expect(result[0]!.chunkId).toBe("c1");
  });
});

describe("applyTenantFilter", () => {
  const makeHit = (chunkId: string, tenantId?: string) => ({
    chunkId,
    sourceId: "s1",
    fusedScore: 0.5,
    rank: 1,
    metadata: tenantId !== undefined ? { tenantId } : {},
    boostApplied: false,
    boostRuleId: undefined,
    boostedScore: 0.5,
    denseScore: undefined,
    keywordScore: undefined,
  });

  it("allows hits with matching tenantId", () => {
    const hits = [makeHit("c1", "tenant-a"), makeHit("c2", "tenant-b")];
    const result = applyTenantFilter(hits, "tenant-a");
    expect(result).toHaveLength(1);
    expect(result[0]!.chunkId).toBe("c1");
  });

  it("rejects hits with no tenantId metadata field (fail-closed)", () => {
    const hits = [makeHit("c1"), makeHit("c2", "tenant-a")];
    const result = applyTenantFilter(hits, "tenant-a");
    expect(result).toHaveLength(1);
    expect(result[0]!.chunkId).toBe("c2");
  });

  it("rejects all hits when none have a matching tenantId", () => {
    const hits = [makeHit("c1", "tenant-b"), makeHit("c2", "tenant-c")];
    const result = applyTenantFilter(hits, "tenant-a");
    expect(result).toHaveLength(0);
  });

  it("rejects hits with mismatched tenantId", () => {
    const hits = [makeHit("c1", "tenant-b")];
    const result = applyTenantFilter(hits, "tenant-a");
    expect(result).toHaveLength(0);
  });
});

describe("normalizeScores", () => {
  const makeHit = (chunkId: string, boostedScore: number) => ({
    chunkId,
    sourceId: "s1",
    fusedScore: boostedScore,
    rank: 1,
    metadata: {},
    boostApplied: false,
    boostedScore,
    denseScore: undefined,
    keywordScore: undefined,
  });

  it("returns empty array for empty input", () => {
    expect(normalizeScores([])).toHaveLength(0);
  });

  it("normalizes single hit to 1.0", () => {
    const result = normalizeScores([makeHit("c1", 0.6)]);
    expect(result[0]!.normalizedScore).toBe(1.0);
  });

  it("normalizes min to 0 and max to 1", () => {
    const hits = [makeHit("c1", 0.9), makeHit("c2", 0.5), makeHit("c3", 0.1)];
    const result = normalizeScores(hits);
    const scores = result.map((h) => h.normalizedScore);
    expect(Math.max(...scores)).toBe(1.0);
    expect(Math.min(...scores)).toBe(0.0);
  });

  it("preserves relative ordering after normalization", () => {
    const hits = [makeHit("c1", 0.9), makeHit("c2", 0.6), makeHit("c3", 0.3)];
    const result = normalizeScores(hits);
    expect(result[0]!.normalizedScore).toBeGreaterThan(result[1]!.normalizedScore);
    expect(result[1]!.normalizedScore).toBeGreaterThan(result[2]!.normalizedScore);
  });
});

describe("assembleCitations", () => {
  const makeNormHit = (chunkId: string, score: number, metadata: Record<string, unknown> = {}) => ({
    chunkId,
    sourceId: "src-1",
    fusedScore: score,
    rank: 1,
    metadata,
    boostApplied: false,
    boostedScore: score,
    normalizedScore: score,
    denseScore: undefined,
    keywordScore: undefined,
  });

  it("produces citations with ascending rank", () => {
    const hits = [
      makeNormHit("c1", 0.9),
      makeNormHit("c2", 0.7),
      makeNormHit("c3", 0.5),
    ];
    const citations = assembleCitations(hits);
    expect(citations[0]!.rank).toBe(1);
    expect(citations[1]!.rank).toBe(2);
    expect(citations[2]!.rank).toBe(3);
  });

  it("extracts title, page, section from metadata", () => {
    const hits = [
      makeNormHit("c1", 0.9, {
        title: "MARPOL Convention",
        page: 12,
        section: "Annex IV",
        sourceUri: "https://imo.org/marpol",
      }),
    ];
    const citations = assembleCitations(hits);
    expect(citations[0]!.title).toBe("MARPOL Convention");
    expect(citations[0]!.page).toBe(12);
    expect(citations[0]!.section).toBe("Annex IV");
    expect(citations[0]!.sourceUri).toBe("https://imo.org/marpol");
  });

  it("returns empty array for empty input", () => {
    expect(assembleCitations([])).toHaveLength(0);
  });
});
