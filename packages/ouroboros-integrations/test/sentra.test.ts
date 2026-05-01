import { describe, it, expect } from "vitest";
import { SentraHSMAnchor, verifyHSMTrace, SHIFT_ADD_PRIME } from "../src/sentra.ts";

describe("SentraHSMAnchor", () => {
  it("starts with empty state", () => {
    const a = new SentraHSMAnchor();
    const s = a.snapshot();
    expect(s.accumulator).toBe(0n);
    expect(s.eventCount).toBe(0);
  });

  it("appends a single event using only shift-and-add", () => {
    const a = new SentraHSMAnchor();
    const r = a.append({ eventId: "e1", leafHash: 5n, timestamp: 1 });
    expect(r.state.accumulator).toBe(10n);
    expect(r.state.eventCount).toBe(1);
    expect(verifyHSMTrace(r.trace)).toBe(true);
  });

  it("accumulator = sum(2·leaf) mod prime after multiple appends", () => {
    const a = new SentraHSMAnchor();
    a.append({ eventId: "1", leafHash: 1n, timestamp: 1 });
    a.append({ eventId: "2", leafHash: 2n, timestamp: 2 });
    a.append({ eventId: "3", leafHash: 3n, timestamp: 3 });
    expect(a.snapshot().accumulator).toBe(12n); // 2·(1+2+3)
    expect(a.snapshot().eventCount).toBe(3);
  });

  it("appendBatch matches per-event append", () => {
    const a = new SentraHSMAnchor();
    const b = new SentraHSMAnchor();
    const events = [
      { eventId: "1", leafHash: 7n, timestamp: 1 },
      { eventId: "2", leafHash: 11n, timestamp: 2 },
      { eventId: "3", leafHash: 13n, timestamp: 3 },
    ];
    for (const e of events) a.append(e);
    b.appendBatch(events);
    expect(a.snapshot().accumulator).toBe(b.snapshot().accumulator);
  });

  it("static reDerive matches the on-line accumulator", () => {
    const a = new SentraHSMAnchor();
    const events = [
      { eventId: "1", leafHash: 100n, timestamp: 1 },
      { eventId: "2", leafHash: 200n, timestamp: 2 },
    ];
    a.appendBatch(events);
    const reDerived = SentraHSMAnchor.reDerive(events);
    expect(reDerived).toBe(a.snapshot().accumulator);
  });

  it("uses the secp256k1 prime by default", () => {
    const a = new SentraHSMAnchor();
    expect(a.snapshot().prime).toBe(SHIFT_ADD_PRIME);
  });

  it("supports custom primes for testing", () => {
    const a = new SentraHSMAnchor(13n);
    a.append({ eventId: "1", leafHash: 5n, timestamp: 1 });
    a.append({ eventId: "2", leafHash: 7n, timestamp: 2 });
    // (10 + 14) mod 13 = 24 mod 13 = 11
    expect(a.snapshot().accumulator).toBe(11n);
  });
});

describe("verifyHSMTrace", () => {
  it("verifies traces produced by the anchor", () => {
    const a = new SentraHSMAnchor();
    const r = a.append({ eventId: "x", leafHash: 42n, timestamp: 1 });
    expect(verifyHSMTrace(r.trace)).toBe(true);
  });
});
