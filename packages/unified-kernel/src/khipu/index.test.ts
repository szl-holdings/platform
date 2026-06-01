/** khipu (T09) — boots the kernel, then asserts real checksum + Merkle root. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { khipuChecksum, bumpDetected, merkleRoot } from "./index.ts";

describe("T09 khipu", () => {
  it("kernel registers T09 wired", async () => {
    const h = await start();
    expect(h.modules.T09.descriptor.backing).toBe("wired");
  });

  it("checksum is the modular sum of pendant values", () => {
    expect(khipuChecksum([{ label: "a", value: 3 }, { label: "b", value: 4 }])).toBe(7);
  });

  it("any non-zero bump changes the root (C7)", () => {
    const p = [{ label: "a", value: 3 }, { label: "b", value: 4 }];
    expect(bumpDetected(p, 0, 1)).toBe(true);
    expect(bumpDetected(p, 0, 0)).toBe(false);
  });

  it("Merkle root is a stable 64-hex digest", () => {
    const p = [{ label: "a", value: 1 }, { label: "b", value: 2 }];
    expect(merkleRoot(p)).toMatch(/^[0-9a-f]{64}$/);
    expect(merkleRoot(p)).toBe(merkleRoot(p));
  });
});
