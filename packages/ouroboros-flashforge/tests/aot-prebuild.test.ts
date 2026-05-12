import { describe, it, expect } from "vitest";
import { buildMatrix } from "../src/capability-matrix.js";
import { makeCache, compileOrLoad } from "../src/jit-cache.js";
import { declareManifest, verifyCoverage } from "../src/aot-prebuild.js";

describe("primitive 64 — aot prebuild", () => {
  const cap = buildMatrix([
    { op: "attn", target: "SM90", admits: true, rationale: "" },
    { op: "attn", target: "SM100", admits: true, rationale: "" },
    { op: "fp4", target: "SM90", admits: false, rationale: "no FP4" },
    { op: "fp4", target: "SM100", admits: true, rationale: "" },
  ]);

  it("declares a manifest", () => {
    const m = declareManifest([
      { op: "attn", target: "SM90", artifactHash: "a1" },
      { op: "attn", target: "SM100", artifactHash: "a2" },
      { op: "fp4", target: "SM100", artifactHash: "a3" },
    ]);
    expect(m.entries.length).toBe(3);
  });

  it("rejects empty manifest", () => {
    expect(() => declareManifest([])).toThrow(/at least 1/);
  });

  it("rejects duplicate entries", () => {
    expect(() =>
      declareManifest([
        { op: "x", target: "T", artifactHash: "a" },
        { op: "x", target: "T", artifactHash: "b" },
      ])
    ).toThrow(/duplicate/);
  });

  it("rejects empty artifactHash", () => {
    expect(() =>
      declareManifest([{ op: "x", target: "T", artifactHash: "" }])
    ).toThrow(/empty artifactHash/);
  });

  it("verifies full coverage of admitted cells", () => {
    const m = declareManifest([
      { op: "attn", target: "SM90", artifactHash: "a1" },
      { op: "attn", target: "SM100", artifactHash: "a2" },
      { op: "fp4", target: "SM100", artifactHash: "a3" },
    ]);
    const v = verifyCoverage(m, cap);
    expect(v.ok).toBe(true);
    expect(v.missing).toEqual([]);
    expect(v.extra).toEqual([]);
  });

  it("flags missing and would-be JIT fallthroughs", () => {
    const m = declareManifest([
      { op: "attn", target: "SM90", artifactHash: "a1" },
      // missing attn::SM100 and fp4::SM100
    ]);
    const cache = makeCache();
    compileOrLoad(cache, "attn::SM100", () => ({
      artifactHash: "h",
      compileReceipt: "r",
    }));
    const v = verifyCoverage(m, cap, cache);
    expect(v.ok).toBe(false);
    expect(v.missing.length).toBe(2);
    // attn::SM100 is in cache → not a fallthrough; fp4::SM100 is
    expect(v.jitFallthroughs.length).toBe(1);
    expect(v.jitFallthroughs[0]).toEqual({ op: "fp4", target: "SM100" });
  });

  it("flags extra entries not in capability matrix", () => {
    const m = declareManifest([
      { op: "attn", target: "SM90", artifactHash: "a1" },
      { op: "attn", target: "SM100", artifactHash: "a2" },
      { op: "fp4", target: "SM100", artifactHash: "a3" },
      { op: "ghost-op", target: "SM90", artifactHash: "z" },
    ]);
    const v = verifyCoverage(m, cap);
    expect(v.ok).toBe(false);
    expect(v.extra).toEqual([{ op: "ghost-op", target: "SM90" }]);
  });
});
