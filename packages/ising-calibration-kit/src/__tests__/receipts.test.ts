import { describe, expect, it } from "vitest";
import {
  ISING_RECEIPT_CLASSES,
  canonicalJson,
  digestBody,
  makeRef,
  parseRef,
  verifyRef,
} from "../receipts.js";

describe("canonicalJson", () => {
  it("sorts object keys lexicographically at every depth", () => {
    const a = canonicalJson({ b: 1, a: { y: 2, x: 1 } });
    const b = canonicalJson({ a: { x: 1, y: 2 }, b: 1 });
    expect(a).toBe(b);
  });

  it("refuses to encode non-finite numbers", () => {
    expect(() => canonicalJson({ x: NaN })).toThrow(/non-finite/);
    expect(() => canonicalJson({ x: Infinity })).toThrow(/non-finite/);
    expect(() => canonicalJson({ x: -Infinity })).toThrow(/non-finite/);
  });

  it("encodes arrays positionally (not sorted)", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("digestBody + makeRef + parseRef + verifyRef", () => {
  it("produces 16-hex-char digests", () => {
    expect(digestBody({ a: 1 })).toMatch(/^[0-9a-f]{16}$/);
  });

  it("round-trips through parseRef", () => {
    const ref = makeRef("ising.predecode.input.v1", { x: 1 });
    const parsed = parseRef(ref);
    expect(parsed.cls).toBe("ising.predecode.input.v1");
  });

  it("verifyRef accepts a matching body and rejects a mutated one", () => {
    const body = { a: 1, b: 2 };
    const ref = makeRef("ising.calibration.measurement.v1", body);
    expect(verifyRef(ref, body)).toBe(true);
    expect(verifyRef(ref, { a: 1, b: 3 })).toBe(false);
  });

  it("parseRef rejects unknown class", () => {
    expect(() => parseRef("totally.bogus.v1:0123456789abcdef")).toThrow(
      /unknown class/,
    );
  });

  it("parseRef rejects bad digest length", () => {
    expect(() => parseRef("ising.predecode.input.v1:short")).toThrow(
      /16 hex chars/,
    );
  });

  it("exposes all 13 receipt classes", () => {
    expect(ISING_RECEIPT_CLASSES.length).toBe(13);
    expect(new Set(ISING_RECEIPT_CLASSES).size).toBe(13);
  });
});
