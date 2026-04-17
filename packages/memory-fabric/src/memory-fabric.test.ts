import { describe, it, expect, beforeEach } from "vitest";
import { MemoryEntrySchema, MemoryTierSchema } from "./types.js";
import { InMemoryStore } from "./store.js";
import { applyRetentionDefaults, isExpired, checkSensitivity } from "./retention.js";
import type { MemoryEntry } from "./types.js";

function makeEntry(id: string, tier: MemoryEntry["tier"], key: string, overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  const now = new Date().toISOString();
  return MemoryEntrySchema.parse({
    id,
    tier,
    key,
    value: "test-value",
    provenance: { source: "test", createdAt: now },
    freshness: { lastUpdatedAt: now },
    ...overrides,
  });
}

describe("MemoryTierSchema", () => {
  it("has 8 tiers", () => {
    expect(MemoryTierSchema.options).toHaveLength(8);
  });
});

describe("MemoryEntrySchema", () => {
  it("parses a valid entry with defaults", () => {
    const entry = makeEntry("e1", "session", "user-intent");
    expect(entry.confidence).toBe(1);
    expect(entry.sensitivity).toBe("internal");
    expect(entry.linkedTraces).toEqual([]);
    expect(entry.retention.policy).toBe("persistent");
  });
});

describe("InMemoryStore", () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it("puts and retrieves entries", () => {
    const entry = makeEntry("e1", "session", "k1");
    store.put(entry);
    expect(store.get("e1")).toBeDefined();
    expect(store.count()).toBe(1);
  });

  it("getByKey retrieves by tier+key", () => {
    store.put(makeEntry("e1", "session", "intent", { scopeId: "s-001" } as Partial<MemoryEntry>));
    expect(store.getByKey("session", "intent", "s-001")).toBeDefined();
    expect(store.getByKey("session", "intent", "s-999")).toBeUndefined();
  });

  it("lists by tier", () => {
    store.put(makeEntry("e1", "session", "k1"));
    store.put(makeEntry("e2", "workflow", "k2"));
    expect(store.list({ tier: "session" })).toHaveLength(1);
  });

  it("evictExpired removes expired entries", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const entry = makeEntry("e1", "session", "k1", {
      retention: { policy: "session-scoped", expiresAt: past },
    } as Partial<MemoryEntry>);
    store.put(entry);
    const evicted = store.evictExpired();
    expect(evicted).toBe(1);
    expect(store.count()).toBe(0);
  });

  it("clears by tier", () => {
    store.put(makeEntry("e1", "session", "k1"));
    store.put(makeEntry("e2", "workflow", "k2"));
    store.clear("session");
    expect(store.count("session")).toBe(0);
    expect(store.count("workflow")).toBe(1);
  });
});

describe("Retention helpers", () => {
  it("applyRetentionDefaults sets expiresAt for session tier", () => {
    const entry = makeEntry("e1", "session", "k1");
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeDefined();
  });

  it("applyRetentionDefaults leaves long-term tier without expiry", () => {
    const entry = makeEntry("e1", "long-term", "k1");
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeUndefined();
  });

  it("isExpired returns true for past expiresAt", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const entry = makeEntry("e1", "session", "k1", {
      retention: { policy: "session-scoped", expiresAt: past },
    } as Partial<MemoryEntry>);
    expect(isExpired(entry)).toBe(true);
  });

  it("checkSensitivity enforces access levels", () => {
    const restricted = makeEntry("e1", "session", "k1", { sensitivity: "restricted" } as Partial<MemoryEntry>);
    expect(checkSensitivity(restricted, "public")).toBe(false);
    expect(checkSensitivity(restricted, "restricted")).toBe(true);
    const pub = makeEntry("e2", "session", "k2", { sensitivity: "public" } as Partial<MemoryEntry>);
    expect(checkSensitivity(pub, "internal")).toBe(true);
  });
});

describe("Memory CRUD with provenance", () => {
  let store: InMemoryStore;
  const now = new Date().toISOString();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it("records full provenance on create", () => {
    const entry = MemoryEntrySchema.parse({
      id: "prov-001",
      tier: "entity",
      key: "customer:c-999",
      value: { name: "Acme Corp" },
      provenance: {
        source: "crm-connector",
        sourceId: "crm-c-999",
        author: "sync-agent",
        method: "import",
        createdAt: now,
      },
      freshness: { lastUpdatedAt: now },
      confidence: 0.95,
      sensitivity: "confidential",
      linkedEntities: ["entity:c-999"],
      linkedTraces: ["trace:t-001"],
      linkedActions: ["action:a-001"],
    });
    store.put(entry);
    const retrieved = store.get("prov-001")!;
    expect(retrieved.provenance.source).toBe("crm-connector");
    expect(retrieved.provenance.sourceId).toBe("crm-c-999");
    expect(retrieved.provenance.author).toBe("sync-agent");
    expect(retrieved.provenance.method).toBe("import");
    expect(retrieved.confidence).toBe(0.95);
    expect(retrieved.sensitivity).toBe("confidential");
    expect(retrieved.linkedEntities).toContain("entity:c-999");
    expect(retrieved.linkedTraces).toContain("trace:t-001");
    expect(retrieved.linkedActions).toContain("action:a-001");
  });

  it("freshness.lastUpdatedAt is updated on put", () => {
    const entry = makeEntry("e1", "workflow", "step-output");
    store.put(entry);
    const before = store.get("e1")!.freshness.lastUpdatedAt;
    store.put({ ...entry, value: "updated" });
    const after = store.get("e1")!.freshness.lastUpdatedAt;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it("freshness.lastAccessedAt is updated on get", () => {
    const entry = makeEntry("e2", "session", "ctx");
    store.put(entry);
    expect(store.get("e2")!.freshness.lastAccessedAt).toBeDefined();
  });

  it("all eight tiers can hold records independently", () => {
    const tiers = [
      "session", "workflow", "entity", "artifact",
      "executive", "domain", "operator-feedback", "long-term",
    ] as const;
    for (const tier of tiers) {
      store.put(makeEntry(`${tier}-id`, tier, `${tier}-key`));
    }
    expect(store.count()).toBe(8);
    for (const tier of tiers) {
      expect(store.count(tier)).toBe(1);
    }
  });

  it("linked entities, traces, and actions are preserved round-trip", () => {
    const entry = makeEntry("link-test", "artifact", "report-v1", {
      linkedEntities: ["ent-1", "ent-2"],
      linkedTraces: ["trace-1"],
      linkedActions: ["act-1", "act-2", "act-3"],
    } as Partial<MemoryEntry>);
    store.put(entry);
    const retrieved = store.get("link-test")!;
    expect(retrieved.linkedEntities).toHaveLength(2);
    expect(retrieved.linkedTraces).toHaveLength(1);
    expect(retrieved.linkedActions).toHaveLength(3);
  });

  it("sensitivity gate blocks access for lower clearance", () => {
    const entry = makeEntry("sec-test", "executive", "exec-summary", {
      sensitivity: "restricted",
    } as Partial<MemoryEntry>);
    expect(checkSensitivity(entry, "public")).toBe(false);
    expect(checkSensitivity(entry, "internal")).toBe(false);
    expect(checkSensitivity(entry, "confidential")).toBe(false);
    expect(checkSensitivity(entry, "restricted")).toBe(true);
  });

  it("domain and long-term tiers have no expiry by default after retention defaults", () => {
    const domainEntry = makeEntry("d1", "domain", "ref-data");
    const ltEntry = makeEntry("lt1", "long-term", "strategic-mem");
    const withDefaults1 = applyRetentionDefaults(domainEntry);
    const withDefaults2 = applyRetentionDefaults(ltEntry);
    expect(withDefaults1.retention.expiresAt).toBeUndefined();
    expect(withDefaults2.retention.expiresAt).toBeUndefined();
  });

  it("stale filter excludes stale entries by default", () => {
    store.put(makeEntry("fresh-1", "session", "k1"));
    store.put(makeEntry("stale-1", "session", "k2", { freshness: { lastUpdatedAt: now, isStale: true } } as Partial<MemoryEntry>));
    const results = store.list({ tier: "session", includeStale: false });
    expect(results.every((e) => !e.freshness.isStale)).toBe(true);
    const allResults = store.list({ tier: "session", includeStale: true });
    expect(allResults).toHaveLength(2);
  });

  it("tag filter works correctly", () => {
    store.put(makeEntry("t1", "entity", "k1", { tags: ["crm", "vip"] } as Partial<MemoryEntry>));
    store.put(makeEntry("t2", "entity", "k2", { tags: ["crm"] } as Partial<MemoryEntry>));
    store.put(makeEntry("t3", "entity", "k3", { tags: ["erp"] } as Partial<MemoryEntry>));
    expect(store.list({ tags: ["crm", "vip"] })).toHaveLength(1);
    expect(store.list({ tags: ["crm"] })).toHaveLength(2);
    expect(store.list({ tags: ["erp"] })).toHaveLength(1);
  });
});
