/** mesh (T13 + T16) — boots the kernel, then asserts W3C trace propagation. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { newTrace, propagate, parseTraceparent, formatTraceparent } from "./index.ts";

describe("T13/T16 mesh", () => {
  it("kernel registers T13 and T16 over the mesh module", async () => {
    const h = await start();
    expect(h.modules.T13.descriptor.dir).toBe("mesh");
    expect(h.modules.T16.descriptor.needs).toContain("UDS");
  });

  it("round-trips a valid traceparent header", () => {
    const tp = newTrace();
    const header = formatTraceparent(tp);
    expect(parseTraceparent(header)).toEqual(tp);
  });

  it("rejects an all-zero trace id (spec-invalid)", () => {
    expect(parseTraceparent(`00-${"0".repeat(32)}-${"1".repeat(16)}-01`)).toBeNull();
  });

  it("propagation keeps the trace id and changes the span id", () => {
    const parent = newTrace();
    const child = propagate(parent);
    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentId).not.toBe(parent.parentId);
  });
});
