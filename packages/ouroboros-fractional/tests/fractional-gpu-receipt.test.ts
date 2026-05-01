import { describe, it, expect } from "vitest";
import { FractionalAllocator } from "../src/fractional-gpu-receipt.js";

describe("fractional GPU allocator", () => {
  it("allocates a 1/2 slice", () => {
    const a = new FractionalAllocator();
    const r = a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.5, startedAt: "t0" });
    expect(r.fraction).toBe(0.5);
  });

  it("rejects fraction > 1", () => {
    const a = new FractionalAllocator();
    expect(() => a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 1.5, startedAt: "t0" })).toThrow();
  });

  it("rejects fraction <= 0", () => {
    const a = new FractionalAllocator();
    expect(() => a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0, startedAt: "t0" })).toThrow();
  });

  it("rejects oversubscription", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.75, startedAt: "t0" });
    expect(() => a.allocate({ tenantId: "t2", deviceId: "gpu-0", fraction: 0.5, startedAt: "t0" })).toThrow(/oversubscribed/);
  });

  it("permits exactly 1.0 in total", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.5, startedAt: "t0" });
    a.allocate({ tenantId: "t2", deviceId: "gpu-0", fraction: 0.25, startedAt: "t0" });
    a.allocate({ tenantId: "t3", deviceId: "gpu-0", fraction: 0.25, startedAt: "t0" });
    expect(a.utilization("gpu-0")).toBeCloseTo(1.0);
  });

  it("release frees capacity", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.75, startedAt: "t0" });
    expect(a.release("gpu-0", "t1", "t1")).toBe(true);
    a.allocate({ tenantId: "t2", deviceId: "gpu-0", fraction: 0.75, startedAt: "t2" });
    expect(a.utilization("gpu-0")).toBeCloseTo(0.75);
  });

  it("release returns false if no match", () => {
    const a = new FractionalAllocator();
    expect(a.release("gpu-0", "ghost", "t")).toBe(false);
  });

  it("ledger preserves released receipts", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.5, startedAt: "t0" });
    a.release("gpu-0", "t1", "t1");
    expect(a.ledger()).toHaveLength(1);
    expect(a.ledger()[0].releasedAt).toBe("t1");
  });

  it("active excludes released", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 0.5, startedAt: "t0" });
    a.release("gpu-0", "t1", "t1");
    expect(a.active()).toHaveLength(0);
  });

  it("multi-device isolation", () => {
    const a = new FractionalAllocator();
    a.allocate({ tenantId: "t1", deviceId: "gpu-0", fraction: 1.0, startedAt: "t0" });
    a.allocate({ tenantId: "t2", deviceId: "gpu-1", fraction: 1.0, startedAt: "t0" });
    expect(a.utilization("gpu-0")).toBeCloseTo(1.0);
    expect(a.utilization("gpu-1")).toBeCloseTo(1.0);
  });
});
