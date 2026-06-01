import { describe, it, expect } from "vitest";
import {
  makeCache,
  compileOrLoad,
  verifyProvenance,
} from "../src/jit-cache.js";

describe("primitive 63 — jit cache", () => {
  it("compiles on first call, caches on second", () => {
    const cache = makeCache();
    let compiles = 0;
    const fn = () => {
      compiles++;
      return { artifactHash: "deadbeef", compileReceipt: "vitest run" };
    };
    const r1 = compileOrLoad(cache, "attn::SM90", fn);
    const r2 = compileOrLoad(cache, "attn::SM90", fn);
    expect(compiles).toBe(1);
    expect(r1.wasHit).toBe(false);
    expect(r2.wasHit).toBe(true);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(1);
  });

  it("rejects empty artifact hash", () => {
    const cache = makeCache();
    expect(() =>
      compileOrLoad(cache, "x", () => ({
        artifactHash: "",
        compileReceipt: "",
      }))
    ).toThrow(/empty artifactHash/);
  });

  it("verifies provenance against recorded hash", () => {
    const cache = makeCache();
    compileOrLoad(cache, "k", () => ({
      artifactHash: "abc123",
      compileReceipt: "ok",
    }));
    const ok = verifyProvenance(cache, "k", "abc123");
    expect(ok.matches).toBe(true);
    const bad = verifyProvenance(cache, "k", "ffffff");
    expect(bad.matches).toBe(false);
    expect(bad.rationale).toMatch(/provenance broken/);
  });

  it("provenance check fails for missing key", () => {
    const cache = makeCache();
    const r = verifyProvenance(cache, "absent", "xx");
    expect(r.matches).toBe(false);
    expect(r.rationale).toMatch(/no cache entry/);
  });

  it("compile receipt is preserved", () => {
    const cache = makeCache();
    compileOrLoad(cache, "k", () => ({
      artifactHash: "h",
      compileReceipt: "compiled by flashforge v0.1.0",
    }));
    expect(cache.entries.get("k")?.compileReceipt).toMatch(/flashforge/);
  });
});
