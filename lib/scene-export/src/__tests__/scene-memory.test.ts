import { describe, it, expect } from "vitest";
import { JsonSnapshotAdapter, exportJsonSnapshot } from "../adapters/json-snapshot.js";
import type { SceneSnapshot } from "../types.js";

const baseSnapshot: SceneSnapshot = {
  sceneId: "test-scene-001",
  domain: "security",
  entityType: "incident",
  entityId: "INC-TEST-001",
  capturedAt: new Date().toISOString(),
  state: {
    severity: "critical",
    status: "active",
    affectedSystems: ["DC01", "FS02"],
  },
  driftScore: 0.72,
  proofChainId: null,
  correlationId: "test-correlation-001",
  metadata: { test: true },
};

describe("Scene Memory Router — JsonSnapshotAdapter", () => {
  it("validates a well-formed scene snapshot", () => {
    const adapter = new JsonSnapshotAdapter();
    expect(() => adapter.validate(baseSnapshot)).not.toThrow();
  });

  it("throws on missing sceneId", () => {
    const adapter = new JsonSnapshotAdapter();
    expect(() =>
      adapter.validate({ ...baseSnapshot, sceneId: "" })
    ).toThrow("sceneId is required");
  });

  it("throws on missing domain", () => {
    const adapter = new JsonSnapshotAdapter();
    expect(() =>
      adapter.validate({ ...baseSnapshot, domain: "" })
    ).toThrow("domain is required");
  });

  it("throws when state is not an object", () => {
    const adapter = new JsonSnapshotAdapter();
    expect(() =>
      adapter.validate({ ...baseSnapshot, state: null as unknown as Record<string, unknown> })
    ).toThrow("state must be a non-null object");
  });

  it("serializes a snapshot with the correct schema and format", () => {
    const adapter = new JsonSnapshotAdapter();
    const output = adapter.serialize(baseSnapshot);
    expect(output.$schema).toContain("scene-snapshot");
    expect(output.format).toBe("json_snapshot");
    expect(output.snapshot.sceneId).toBe("test-scene-001");
    expect(output.snapshot.domain).toBe("security");
    expect(output.snapshot.state.severity).toBe("critical");
  });

  it("sets exportedAt to a valid ISO string", () => {
    const adapter = new JsonSnapshotAdapter();
    const output = adapter.serialize(baseSnapshot);
    expect(() => new Date(output.exportedAt)).not.toThrow();
    expect(new Date(output.exportedAt).getTime()).toBeGreaterThan(0);
  });

  it("preserves null proofChainId in serialized output", () => {
    const adapter = new JsonSnapshotAdapter();
    const output = adapter.serialize(baseSnapshot);
    expect(output.snapshot.proofChainId).toBeNull();
  });

  it("returns a valid ExportAdapterResult from toExportResult", () => {
    const result = exportJsonSnapshot(baseSnapshot);
    expect(result.format).toBe("json_snapshot");
    expect(result.adapterVersion).toBe("1.0.0");
    expect(result.generatedAt).toBeTruthy();
    expect(typeof result.sizeEstimateBytes).toBe("number");
    expect(result.sizeEstimateBytes!).toBeGreaterThan(0);
  });

  it("omits metadata defaults to empty object when not provided", () => {
    const adapter = new JsonSnapshotAdapter();
    const { metadata: _, ...withoutMeta } = baseSnapshot;
    const output = adapter.serialize({ ...withoutMeta, metadata: undefined });
    expect(output.snapshot.metadata).toEqual({});
  });

  it("omits correlationId defaults to null when not provided", () => {
    const adapter = new JsonSnapshotAdapter();
    const output = adapter.serialize({ ...baseSnapshot, correlationId: undefined });
    expect(output.snapshot.correlationId).toBeNull();
  });
});
