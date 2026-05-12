import { describe, it, expect } from "vitest";
import { selectFallback, shouldDrain } from "../src/rack-resiliency.js";

describe("rack resiliency / fallback priority", () => {
  it("returns primary when healthy", () => {
    const r = selectFallback([
      { id: "a", priority: 1, healthy: true },
      { id: "b", priority: 2, healthy: true },
    ]);
    expect(r.selectedId).toBe("a");
    expect(r.fellBackFromIds).toEqual([]);
  });

  it("falls back past unhealthy", () => {
    const r = selectFallback([
      { id: "a", priority: 1, healthy: false },
      { id: "b", priority: 2, healthy: true },
    ]);
    expect(r.selectedId).toBe("b");
    expect(r.fellBackFromIds).toEqual(["a"]);
  });

  it("returns null when nothing healthy", () => {
    const r = selectFallback([
      { id: "a", priority: 1, healthy: false },
      { id: "b", priority: 2, healthy: false },
    ]);
    expect(r.selectedId).toBeNull();
  });

  it("respects priority order, not list order", () => {
    const r = selectFallback([
      { id: "low", priority: 5, healthy: true },
      { id: "high", priority: 1, healthy: true },
    ]);
    expect(r.selectedId).toBe("high");
  });

  it("empty target list yields null", () => {
    const r = selectFallback([]);
    expect(r.selectedId).toBeNull();
  });

  it("shouldDrain true on critical fault", () => {
    expect(shouldDrain({ deviceId: "g", scannedAt: "t", faults: ["nvlink-down"] }, ["nvlink-down"])).toBe(true);
  });

  it("shouldDrain false on benign fault", () => {
    expect(shouldDrain({ deviceId: "g", scannedAt: "t", faults: ["temp-warn"] }, ["nvlink-down"])).toBe(false);
  });

  it("shouldDrain false on no faults", () => {
    expect(shouldDrain({ deviceId: "g", scannedAt: "t", faults: [] }, ["nvlink-down"])).toBe(false);
  });
});
