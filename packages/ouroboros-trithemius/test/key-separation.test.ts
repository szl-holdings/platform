import { describe, it, expect } from "vitest";
import { auditKeySeparation } from "../src/key-separation.js";

describe("Primitive 55 — Key separation", () => {
  it("passes when key and carrier are on disjoint channels", () => {
    const r = auditKeySeparation([
      { asset: "key", channelId: "courier-A" },
      { asset: "carrier", channelId: "letter-B" },
    ]);
    expect(r.passes).toBe(true);
    expect(r.overlap).toEqual([]);
  });

  it("fails when key shares channel with carrier", () => {
    const r = auditKeySeparation([
      { asset: "key", channelId: "letter-B" },
      { asset: "carrier", channelId: "letter-B" },
    ]);
    expect(r.passes).toBe(false);
    expect(r.overlap).toEqual(["letter-B"]);
  });

  it("fails when no key channel declared", () => {
    const r = auditKeySeparation([{ asset: "carrier", channelId: "x" }]);
    expect(r.passes).toBe(false);
  });

  it("fails when no carrier declared", () => {
    const r = auditKeySeparation([{ asset: "key", channelId: "x" }]);
    expect(r.passes).toBe(false);
  });

  it("dedups channelIds", () => {
    const r = auditKeySeparation([
      { asset: "key", channelId: "k1" },
      { asset: "key", channelId: "k1" },
      { asset: "carrier", channelId: "c1" },
    ]);
    expect(r.keyChannels).toEqual(["k1"]);
    expect(r.passes).toBe(true);
  });
});
