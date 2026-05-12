import { describe, it, expect } from "vitest";
import { EntityDataMesh } from "../src/entity-data-mesh.js";

describe("entity data mesh", () => {
  it("applies first claim", () => {
    const m = new EntityDataMesh();
    const r = m.apply({ entityId: "track-1", field: "lat", value: 40.7, producerId: "sensor-A", timestamp: "t1" });
    expect(r.applied).toBe(true);
  });

  it("rejects empty entityId", () => {
    const m = new EntityDataMesh();
    expect(m.apply({ entityId: "", field: "x", value: 1, producerId: "p", timestamp: "t" }).applied).toBe(false);
  });

  it("rejects missing producerId", () => {
    const m = new EntityDataMesh();
    expect(m.apply({ entityId: "e", field: "x", value: 1, producerId: "", timestamp: "t" }).applied).toBe(false);
  });

  it("later timestamp wins", () => {
    const m = new EntityDataMesh();
    m.apply({ entityId: "e", field: "x", value: 1, producerId: "A", timestamp: "t1" });
    const r = m.apply({ entityId: "e", field: "x", value: 2, producerId: "B", timestamp: "t2" });
    expect(r.applied).toBe(true);
    expect(m.read("e")?.fields.x.value).toBe(2);
  });

  it("stale claim is recorded but not applied", () => {
    const m = new EntityDataMesh();
    m.apply({ entityId: "e", field: "x", value: 1, producerId: "A", timestamp: "t2" });
    const r = m.apply({ entityId: "e", field: "x", value: 99, producerId: "B", timestamp: "t1" });
    expect(r.applied).toBe(false);
    expect(r.reason).toMatch(/stale/);
    expect(m.lineageOf("e")).toHaveLength(2);
  });

  it("ties broken by precedence", () => {
    const m = new EntityDataMesh((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    m.apply({ entityId: "e", field: "x", value: 1, producerId: "B", timestamp: "t1" });
    const r = m.apply({ entityId: "e", field: "x", value: 2, producerId: "A", timestamp: "t1" });
    // A < B in ascending order, so A wins (cmp returns -1, < 0)
    expect(r.applied).toBe(true);
  });

  it("lineage records every claim", () => {
    const m = new EntityDataMesh();
    m.apply({ entityId: "e", field: "x", value: 1, producerId: "A", timestamp: "t1" });
    m.apply({ entityId: "e", field: "x", value: 2, producerId: "B", timestamp: "t2" });
    m.apply({ entityId: "e", field: "y", value: 3, producerId: "C", timestamp: "t3" });
    expect(m.lineageOf("e")).toHaveLength(3);
  });

  it("size reflects unique entities", () => {
    const m = new EntityDataMesh();
    m.apply({ entityId: "e1", field: "x", value: 1, producerId: "A", timestamp: "t" });
    m.apply({ entityId: "e2", field: "x", value: 1, producerId: "A", timestamp: "t" });
    m.apply({ entityId: "e1", field: "y", value: 1, producerId: "A", timestamp: "t" });
    expect(m.size()).toBe(2);
  });

  it("read returns undefined for unknown entity", () => {
    const m = new EntityDataMesh();
    expect(m.read("ghost")).toBeUndefined();
  });

  it("preserves multi-field state", () => {
    const m = new EntityDataMesh();
    m.apply({ entityId: "e", field: "lat", value: 40, producerId: "A", timestamp: "t" });
    m.apply({ entityId: "e", field: "lon", value: -74, producerId: "B", timestamp: "t" });
    const rec = m.read("e");
    expect(rec?.fields.lat.value).toBe(40);
    expect(rec?.fields.lon.value).toBe(-74);
  });
});
