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
