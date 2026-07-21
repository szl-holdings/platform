import { describe, it, expect } from "vitest";
import { WitnessAnchor, computeMerkleRoot, sha256, anchorVerdict } from "../src/index.ts";

describe("computeMerkleRoot", () => {
  it("returns a deterministic root for empty input", () => {
    expect(computeMerkleRoot([])).toBe(sha256(""));
  });
  it("returns the domain-separated leaf hash for length 1", () => {
    expect(computeMerkleRoot(["a"])).toBe(sha256("\u0000a"));
  });
  it("is order-sensitive", () => {
    expect(computeMerkleRoot(["a", "b"])).not.toBe(computeMerkleRoot(["b", "a"]));
  });
  it("is deterministic across calls", () => {
    expect(computeMerkleRoot(["a", "b", "c", "d"])).toBe(computeMerkleRoot(["a", "b", "c", "d"]));
  });
  it("handles odd count by carrying the tail node up (no duplicate-pad malleability)", () => {
    const odd = computeMerkleRoot(["x", "y", "z"]);
    expect(odd).toBeTypeOf("string");
    expect(odd.length).toBe(64);
  });
  it("root changes when the tail leaf of an odd tree is appended again (regression: append malleability)", () => {
    const leaves = [" ", " ", "t"];
    expect(computeMerkleRoot([...leaves, "t"])).not.toBe(computeMerkleRoot(leaves));
  });
});

describe("WitnessAnchor", () => {
  it("anchors LOCAL and verifies", async () => {
    const a = new WitnessAnchor({ driver: "LOCAL" });
    const leaves = ["e1", "e2", "e3"];
    const entry = await a.anchor("chain-1", leaves);
    expect(entry.driver).toBe("LOCAL");
    expect(entry.receipt).toMatch(/^local:/);
    expect(a.verify(entry, leaves)).toBe(true);
  });
  it("rejects tampered leaves on verify", async () => {
    const a = new WitnessAnchor({ driver: "LOCAL" });
    const entry = await a.anchor("chain-2", ["x", "y"]);
    expect(a.verify(entry, ["x", "z"])).toBe(false);
  });
  it("REKOR driver returns rekor receipt", async () => {
    const a = new WitnessAnchor({ driver: "REKOR", rekorUrl: "https://rekor.sigstore.dev" });
    const entry = await a.anchor("c", ["a"]);
    expect(entry.receipt).toContain("rekor:");
  });
  it("INTERNAL_HSM requires hsmKeyId", async () => {
    const a = new WitnessAnchor({ driver: "INTERNAL_HSM" });
    await expect(a.anchor("c", ["a"])).rejects.toThrow();
  });
  it("INTERNAL_HSM with key returns hsm receipt", async () => {
    const a = new WitnessAnchor({ driver: "INTERNAL_HSM", hsmKeyId: "key-42" });
    const entry = await a.anchor("c", ["a"]);
    expect(entry.receipt).toMatch(/^hsm:key-42:/);
  });
});

describe("anchorVerdict", () => {
  it("OK for fresh entry", async () => {
    const a = new WitnessAnchor({ driver: "LOCAL" });
    const entry = await a.anchor("c", ["a"]);
    expect(anchorVerdict(entry, 60_000)).toBe("OK");
  });
  it("STALE for old entry", async () => {
    const a = new WitnessAnchor({ driver: "LOCAL" });
    const entry = await a.anchor("c", ["a"]);
    const old = { ...entry, timestamp: Date.now() - 120_000 };
    expect(anchorVerdict(old, 60_000)).toBe("STALE");
  });
  it("MISSING for null root", () => {
    expect(anchorVerdict({ rootHash: "" } as any, 60_000)).toBe("MISSING");
  });
});
