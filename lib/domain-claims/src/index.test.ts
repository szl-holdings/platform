import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClaim } from "@szl-holdings/config/public-claims";
import { makeClaimResolver, metricDisplay } from "./index.js";

describe("makeClaimResolver", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("returns the registered claim for a known id", () => {
    const resolveClaim = makeClaimResolver("test/claims");
    const known = getClaim("tagline-governed-decision");
    expect(known).toBeDefined();

    const result = resolveClaim("tagline-governed-decision", "fallback text");

    expect(result.value).toBe(known?.claim);
    expect(result.label).toBe(known?.displayLabel);
    expect(result.truthValue).toBe(known?.truthValue);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("appends the displayLabel when a label is set", () => {
    const resolveClaim = makeClaimResolver("test/claims");
    const labelled = getClaim("lyte-signal-detection-time");
    expect(labelled).toBeDefined();
    expect(labelled?.displayLabel).toBe("[Demo]");

    const result = resolveClaim("lyte-signal-detection-time", "ignored");

    expect(result.label).toBe("[Demo]");
    expect(result.displayWithLabel).toBe(`${labelled?.claim} [Demo]`);
  });

  it("omits the label suffix when displayLabel is null", () => {
    const resolveClaim = makeClaimResolver("test/claims");
    const noLabel = getClaim("tagline-governed-decision");
    expect(noLabel).toBeDefined();
    expect(noLabel?.displayLabel).toBeNull();

    const result = resolveClaim("tagline-governed-decision", "ignored");

    expect(result.displayWithLabel).toBe(noLabel?.claim);
    expect(result.displayWithLabel).not.toContain("null");
  });

  it("falls back to the supplied value with [Demo] label for an unknown id", () => {
    const resolveClaim = makeClaimResolver("test/claims");

    const result = resolveClaim("does-not-exist-xyz", "42 widgets");

    expect(result.value).toBe("42 widgets");
    expect(result.label).toBe("[Demo]");
    expect(result.truthValue).toBe("pending");
    expect(result.displayWithLabel).toBe("42 widgets [Demo]");
  });

  it("warns with the supplied module prefix on an unknown id", () => {
    const resolveClaim = makeClaimResolver("aegis/claims");

    resolveClaim("missing-id", "fallback");

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain("[aegis/claims]");
    expect(message).toContain("missing-id");
    expect(message).toContain("fallback");
  });

  it("scopes the prefix to the resolver instance", () => {
    const resolverA = makeClaimResolver("module-a");
    const resolverB = makeClaimResolver("module-b");

    resolverA("missing", "x");
    resolverB("missing", "x");

    const messages = warnSpy.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(messages.some((m: string) => m.includes("[module-a]"))).toBe(true);
    expect(messages.some((m: string) => m.includes("[module-b]"))).toBe(true);
  });
});

describe("metricDisplay", () => {
  it("returns the displayWithLabel field of a ClaimValue", () => {
    expect(
      metricDisplay({
        value: "10",
        label: "[Demo]",
        truthValue: "demo-data",
        displayWithLabel: "10 [Demo]",
      }),
    ).toBe("10 [Demo]");
  });

  it("returns the bare value when no label is appended", () => {
    expect(
      metricDisplay({
        value: "Verified statement.",
        label: null,
        truthValue: "verified",
        displayWithLabel: "Verified statement.",
      }),
    ).toBe("Verified statement.");
  });

  it("composes with makeClaimResolver to render the formatted string", () => {
    const resolveClaim = makeClaimResolver("test/claims");
    const claim = resolveClaim("lyte-signal-detection-time", "ignored");

    expect(metricDisplay(claim)).toBe(claim.displayWithLabel);
    expect(metricDisplay(claim).endsWith("[Demo]")).toBe(true);
  });
});
