import { describe, it, expect } from "vitest";
import {
  OpenAIAdapter,
  PerplexityAdapter,
  fleetCompletion,
  dualWitnessVerdict,
  type Transport,
} from "../src/index.ts";

const okTransport: Transport = async (req) => ({
  completion: `echo:${req.prompt}`,
  latencyMs: 12,
});

const slowTransport: Transport = async (req) => ({
  completion: `slow:${req.prompt}`,
  latencyMs: 250,
});

describe("OpenAIAdapter", () => {
  it("emits internal + external witnesses", async () => {
    const a = new OpenAIAdapter(okTransport, { capacityBits: 8192 });
    const r = await a.complete({ model: "gpt-x", prompt: "hi" });
    expect(r.internalWitness).toMatch(/^[0-9a-f]{64}$/);
    expect(r.externalWitness).toMatch(/^[0-9a-f]{64}$/);
    expect(r.bytesOut).toBeGreaterThan(0);
  });
  it("flags clean=true when within capacity", async () => {
    const a = new OpenAIAdapter(okTransport, { capacityBits: 8192 });
    const r = await a.complete({ model: "gpt-x", prompt: "hi" });
    expect(r.clean).toBe(true);
  });
  it("flags clean=false when over capacity", async () => {
    const a = new OpenAIAdapter(okTransport, { capacityBits: 8 });
    const r = await a.complete({ model: "gpt-x", prompt: "hi" });
    expect(r.clean).toBe(false);
  });
  it("honors hashSalt for witness uniqueness", async () => {
    const a1 = new OpenAIAdapter(okTransport, { capacityBits: 8192, hashSalt: "s1" });
    const a2 = new OpenAIAdapter(okTransport, { capacityBits: 8192, hashSalt: "s2" });
    const r1 = await a1.complete({ model: "m", prompt: "hi" });
    const r2 = await a2.complete({ model: "m", prompt: "hi" });
    expect(r1.internalWitness).not.toBe(r2.internalWitness);
  });
});

describe("PerplexityAdapter", () => {
  it("chat completes through transport", async () => {
    const a = new PerplexityAdapter(slowTransport, { capacityBits: 8192 });
    const r = await a.chat({ model: "sonar", prompt: "research this" });
    expect(r.completion).toBe("slow:research this");
    expect(r.latencyMs).toBe(250);
  });
});

describe("fleetCompletion", () => {
  it("runs multiple adapters in parallel", async () => {
    const fleet = [
      { id: "a", adapter: new OpenAIAdapter(okTransport, { capacityBits: 8192 }) },
      { id: "b", adapter: new PerplexityAdapter(slowTransport, { capacityBits: 8192 }) },
    ];
    const results = await fleetCompletion(fleet, { model: "ignored", prompt: "x" });
    expect(results).toHaveLength(2);
    expect(results[0].completion).toContain("echo");
    expect(results[1].completion).toContain("slow");
  });
});

describe("dualWitnessVerdict", () => {
  it("DIVERGE when witnesses differ", async () => {
    const a = new OpenAIAdapter(okTransport, { capacityBits: 8192 });
    const r = await a.complete({ model: "m", prompt: "hi" });
    expect(dualWitnessVerdict(r)).toBe("DIVERGE");
  });
  it("MATCH when witnesses are intentionally equal", () => {
    const r = {
      model: "m", completion: "x", bytesIn: 1, bytesOut: 1, latencyMs: 1,
      internalWitness: "abc", externalWitness: "abc", clean: true,
    };
    expect(dualWitnessVerdict(r as any)).toBe("MATCH");
  });
});
